# -*- coding: utf-8 -*-
import math

STREAMS = ["pre_med", "pre_eng", "ics", "commerce", "arts"]

FEATURE_ORDER = [
    "system_stability",
    "trial_and_error",
    "ddm_boundary_separation",
    "icar_matrix_reasoning",
    "icar_3d_rotation",
    "icar_verbal_reasoning",
    "icar_letter_number_series",
    "ocean_openness",
    "ocean_conscientiousness",
    "ocean_neuroticism_inverted",
    "riasec_investigative",
    "riasec_enterprising",
    "riasec_artistic"
]

STREAM_WEIGHTS = {
    "system_stability":            {"pre_med": 0.15,  "pre_eng": 0.10,  "ics": -0.05, "commerce": 0.10,  "arts": 0.00},
    "trial_and_error":            {"pre_med": -0.10, "pre_eng": 0.05,  "ics": 0.15,  "commerce": 0.00,  "arts": 0.05},
    "ddm_boundary_separation":    {"pre_med": 0.10,  "pre_eng": 0.10,  "ics": 0.05,  "commerce": 0.05,  "arts": 0.00},
    "icar_matrix_reasoning":       {"pre_med": 0.10,  "pre_eng": 0.20,  "ics": 0.25,  "commerce": 0.05,  "arts": 0.00},
    "icar_3d_rotation":            {"pre_med": 0.15,  "pre_eng": 0.20,  "ics": 0.05,  "commerce": 0.00,  "arts": -0.05},
    "icar_verbal_reasoning":       {"pre_med": 0.05,  "pre_eng": 0.00,  "ics": 0.05,  "commerce": 0.05,  "arts": 0.30},
    "icar_letter_number_series":   {"pre_med": 0.05,  "pre_eng": 0.15,  "ics": 0.25,  "commerce": 0.20,  "arts": 0.00},
    "ocean_openness":              {"pre_med": -0.05, "pre_eng": 0.00,  "ics": 0.10,  "commerce": 0.00,  "arts": 0.25},
    "ocean_conscientiousness":     {"pre_med": 0.20,  "pre_eng": 0.10,  "ics": 0.00,  "commerce": 0.25,  "arts": -0.05},
    "ocean_neuroticism_inverted":  {"pre_med": -0.05, "pre_eng": -0.05, "ics": 0.00,  "commerce": 0.00,  "arts": 0.10},
    "riasec_investigative":        {"pre_med": 0.20,  "pre_eng": 0.15,  "ics": 0.15,  "commerce": 0.00,  "arts": 0.00},
    "riasec_enterprising":         {"pre_med": 0.00,  "pre_eng": 0.00,  "ics": 0.00,  "commerce": 0.30,  "arts": 0.05},
    "riasec_artistic":             {"pre_med": 0.00,  "pre_eng": -0.05, "ics": -0.05, "commerce": -0.05, "arts": 0.35}
}

class StreamTransformationEngine:
    def _validate_profile(self, profile: dict, allow_missing: bool = False) -> None:
        if not isinstance(profile, dict):
            raise ValueError("Candidate profile must be a dictionary structural matrix.")
        unknown = set(profile) - set(FEATURE_ORDER)
        if unknown:
            raise ValueError(f"Unknown vector coordinates: {sorted(unknown)}")
        for feature in FEATURE_ORDER:
            if feature not in profile:
                raise ValueError(f"Missing mandatory validation vector coordinate: '{feature}'")
            val = profile[feature]
            if val is None and allow_missing:
                continue
            if isinstance(val, bool) or not isinstance(val, (int, float)) or not math.isfinite(val):
                raise ValueError(f"Invalid numeric input metric for coordinate '{feature}': {val}")
        if allow_missing and all(profile[feature] is None for feature in FEATURE_ORDER):
            raise ValueError("Profile has no measured features to recommend from.")

    def _validate_temperature(self, temperature: float) -> None:
        if isinstance(temperature, bool) or not isinstance(temperature, (int, float)):
            raise ValueError("Thermodynamic parameters must be explicit floating point primitives.")
        if not math.isfinite(temperature) or temperature <= 0.0:
            raise ValueError(f"Invalid temperature baseline metrics (Must be finite and > 0): {temperature}")

    def raw_suitability(self, profile: dict, allow_missing: bool = False) -> list:
        """Computes the matrix dot product; returns one raw score per stream, in STREAMS order.
        With allow_missing, None marks an unmeasured feature and is left out of the sum."""
        self._validate_profile(profile, allow_missing)
        return [
            sum(profile[feature] * STREAM_WEIGHTS[feature][stream]
                for feature in FEATURE_ORDER if profile[feature] is not None)
            for stream in STREAMS
        ]

    def softmax(self, raw_scores, temperature: float) -> list:
        """Applies temperature-scaled Softmax; returns probabilities in STREAMS order."""
        self._validate_temperature(temperature)
        if not isinstance(raw_scores, (list, tuple)) or len(raw_scores) != len(STREAMS):
            raise ValueError("Raw score vector must be a list with one value per stream.")
        for z in raw_scores:
            if isinstance(z, bool) or not isinstance(z, (int, float)) or not math.isfinite(z):
                raise ValueError(f"Invalid raw suitability score: {z}")

        # Subtracting the max keeps every exponent <= 0, so math.exp cannot overflow at tiny T.
        scaled = [z / temperature for z in raw_scores]
        peak = max(scaled)
        exps = [math.exp(z - peak) for z in scaled]
        total = sum(exps)
        return [e / total for e in exps]

    def recommend(self, profile: dict, temperature: float = 1.0, allow_missing: bool = False) -> dict:
        """Runs the full pipeline and labels each probability with its stream."""
        probs = self.softmax(self.raw_suitability(profile, allow_missing), temperature)
        return dict(zip(STREAMS, probs))
