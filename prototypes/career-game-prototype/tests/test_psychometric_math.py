import math

import pytest
from engine.stream_transformation_engine import (
    FEATURE_ORDER,
    STREAMS,
    STREAM_WEIGHTS,
    StreamTransformationEngine,
)

# Oracle copy of the Stream Transformation Matrix in docs/psychometric_specs.md section 5.
# Rows are psychometric vector elements, columns are (pre_med, pre_eng, ics, commerce, arts).
EXPECTED_STREAMS = ("pre_med", "pre_eng", "ics", "commerce", "arts")
EXPECTED_MATRIX = {
    "system_stability":           (0.15, 0.10, -0.05, 0.10, 0.00),
    "trial_and_error":            (-0.10, 0.05, 0.15, 0.00, 0.05),
    "ddm_boundary_separation":    (0.10, 0.10, 0.05, 0.05, 0.00),
    "icar_matrix_reasoning":      (0.10, 0.20, 0.25, 0.05, 0.00),
    "icar_3d_rotation":           (0.15, 0.20, 0.05, 0.00, -0.05),
    "icar_verbal_reasoning":      (0.05, 0.00, 0.05, 0.05, 0.30),
    "icar_letter_number_series":  (0.05, 0.15, 0.25, 0.20, 0.00),
    "ocean_openness":             (-0.05, 0.00, 0.10, 0.00, 0.25),
    "ocean_conscientiousness":    (0.20, 0.10, 0.00, 0.25, -0.05),
    "ocean_neuroticism_inverted": (-0.05, -0.05, 0.00, 0.00, 0.10),
    "riasec_investigative":       (0.20, 0.15, 0.15, 0.00, 0.00),
    "riasec_enterprising":        (0.00, 0.00, 0.00, 0.30, 0.05),
    "riasec_artistic":            (0.00, -0.05, -0.05, -0.05, 0.35),
}

SAMPLE_PROFILE = {
    "system_stability": 0.82,
    "trial_and_error": 0.21,
    "ddm_boundary_separation": 0.64,
    "icar_matrix_reasoning": 0.77,
    "icar_3d_rotation": 0.69,
    "icar_verbal_reasoning": 0.35,
    "icar_letter_number_series": 0.58,
    "ocean_openness": 0.40,
    "ocean_conscientiousness": 0.88,
    "ocean_neuroticism_inverted": 0.73,
    "riasec_investigative": 0.91,
    "riasec_enterprising": 0.12,
    "riasec_artistic": 0.05,
}


def oracle_dot(profile):
    return [
        sum(profile[f] * EXPECTED_MATRIX[f][col] for f in EXPECTED_MATRIX)
        for col in range(len(EXPECTED_STREAMS))
    ]


def oracle_softmax(raw, temperature):
    scaled = [z / temperature for z in raw]
    peak = max(scaled)
    exps = [math.exp(z - peak) for z in scaled]
    total = sum(exps)
    return [e / total for e in exps]


def entropy(probs):
    return -sum(p * math.log(p) for p in probs if p > 0)


# ---------------------------------------------------------------- 1. matrix dot product

def test_stream_order_matches_spec():
    assert tuple(STREAMS) == EXPECTED_STREAMS


def test_feature_order_matches_spec_rows():
    assert tuple(FEATURE_ORDER) == tuple(EXPECTED_MATRIX)


def test_stream_weights_match_spec_coefficients():
    """Verify that every coefficient equals the value published in psychometric_specs.md."""
    for feature, row in EXPECTED_MATRIX.items():
        for col, stream in enumerate(EXPECTED_STREAMS):
            assert STREAM_WEIGHTS[feature][stream] == pytest.approx(row[col], abs=1e-12)


def test_one_hot_profile_returns_that_feature_row():
    """Verify that isolating one vector element yields exactly its row of the matrix."""
    engine = StreamTransformationEngine()
    profile = {f: 0.0 for f in EXPECTED_MATRIX}
    profile["icar_matrix_reasoning"] = 1.0

    raw = engine.raw_suitability(profile)

    assert raw == pytest.approx([0.10, 0.20, 0.25, 0.05, 0.00], abs=1e-12)


def test_all_ones_profile_returns_column_sums():
    """Verify the dot product against hand-summed matrix columns."""
    engine = StreamTransformationEngine()

    raw = engine.raw_suitability({f: 1.0 for f in EXPECTED_MATRIX})

    assert raw == pytest.approx([0.80, 0.95, 0.95, 0.95, 1.00], abs=1e-12)


def test_raw_suitability_matches_oracle_dot_product():
    engine = StreamTransformationEngine()

    raw = engine.raw_suitability(SAMPLE_PROFILE)

    assert raw == pytest.approx(oracle_dot(SAMPLE_PROFILE), abs=1e-12)


def test_rejects_profile_with_missing_feature():
    engine = StreamTransformationEngine()
    profile = dict(SAMPLE_PROFILE)
    del profile["riasec_artistic"]

    with pytest.raises(ValueError):
        engine.raw_suitability(profile)


def test_rejects_profile_with_unknown_feature():
    """Verify that unexpected keys are refused rather than silently ignored."""
    engine = StreamTransformationEngine()
    profile = dict(SAMPLE_PROFILE, riasec_social=0.9)

    with pytest.raises(ValueError):
        engine.raw_suitability(profile)


@pytest.mark.parametrize("bad_value", [float("nan"), float("inf"), None, "0.5", True])
def test_rejects_non_finite_or_non_numeric_features(bad_value):
    engine = StreamTransformationEngine()
    profile = dict(SAMPLE_PROFILE, ocean_openness=bad_value)

    with pytest.raises(ValueError):
        engine.raw_suitability(profile)


# ---------------------------------------------------------------- 2. softmax activation

def test_softmax_at_unit_temperature_matches_standard_softmax():
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    probs = engine.softmax(raw, temperature=1.0)

    assert probs == pytest.approx(oracle_softmax(raw, 1.0), abs=1e-12)


def test_softmax_outputs_valid_probability_distribution():
    engine = StreamTransformationEngine()

    probs = engine.softmax(oracle_dot(SAMPLE_PROFILE), temperature=1.0)

    assert len(probs) == len(EXPECTED_STREAMS)
    assert all(0.0 < p < 1.0 for p in probs)
    assert sum(probs) == pytest.approx(1.0, abs=1e-12)


def test_softmax_preserves_raw_ranking():
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    probs = engine.softmax(raw, temperature=1.0)

    rank = lambda xs: sorted(range(len(xs)), key=lambda i: -xs[i])
    assert rank(probs) == rank(raw)


def test_softmax_is_shift_invariant():
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    shifted = engine.softmax([z + 50.0 for z in raw], temperature=1.0)

    assert shifted == pytest.approx(engine.softmax(raw, temperature=1.0), abs=1e-12)


def test_equal_raw_scores_give_uniform_distribution():
    engine = StreamTransformationEngine()

    probs = engine.softmax([0.4] * 5, temperature=1.0)

    assert probs == pytest.approx([0.2] * 5, abs=1e-12)


# ---------------------------------------------------------------- 3. temperature scaling

def test_temperature_divides_logits_before_softmax():
    """Verify that softmax(z, T) == softmax(z / T, 1)."""
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    for t in (0.05, 0.25, 2.0, 10.0):
        assert engine.softmax(raw, temperature=t) == pytest.approx(oracle_softmax(raw, t), abs=1e-12)


def test_lower_temperature_sharpens_distribution():
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    cold = engine.softmax(raw, temperature=0.1)
    warm = engine.softmax(raw, temperature=1.0)

    assert max(cold) > max(warm)
    assert entropy(cold) < entropy(warm)


def test_higher_temperature_flattens_toward_uniform():
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    hot = engine.softmax(raw, temperature=1000.0)

    assert hot == pytest.approx([0.2] * 5, abs=1e-3)


def test_tiny_temperature_is_numerically_stable():
    """Verify that z / T with T near zero does not overflow math.exp."""
    engine = StreamTransformationEngine()
    raw = oracle_dot(SAMPLE_PROFILE)

    probs = engine.softmax(raw, temperature=1e-4)

    assert all(math.isfinite(p) for p in probs)
    assert sum(probs) == pytest.approx(1.0, abs=1e-12)
    assert probs.index(max(probs)) == raw.index(max(raw))


@pytest.mark.parametrize("bad_temperature", [0.0, -1.0, float("nan"), float("inf"), None, True])
def test_rejects_invalid_temperature(bad_temperature):
    engine = StreamTransformationEngine()

    with pytest.raises(ValueError):
        engine.softmax([0.1, 0.2, 0.3, 0.4, 0.5], temperature=bad_temperature)


# ---------------------------------------------------------------- end-to-end

def test_recommend_maps_streams_to_tempered_probabilities():
    engine = StreamTransformationEngine()

    result = engine.recommend(SAMPLE_PROFILE, temperature=0.5)

    expected = oracle_softmax(oracle_dot(SAMPLE_PROFILE), 0.5)
    assert tuple(result) == EXPECTED_STREAMS
    assert [result[s] for s in EXPECTED_STREAMS] == pytest.approx(expected, abs=1e-12)
