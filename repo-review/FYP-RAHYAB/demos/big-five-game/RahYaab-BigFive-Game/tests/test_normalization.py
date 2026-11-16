import pytest

from analytics.normalization import Standardizer, classify, clip01, min_max, to_score


def test_min_max_and_inversion():
    assert min_max(5, 0, 10) == 0.5
    assert min_max(-3, 0, 10) == 0.0 and min_max(99, 0, 10) == 1.0
    assert min_max(2, 0, 10, invert=True) == pytest.approx(0.8)
    with pytest.raises(ValueError):
        min_max(1, 3, 3)


def test_to_score_range():
    assert to_score(0) == 0 and to_score(1) == 100 and to_score(0.456) == 45.6 and to_score(7) == 100 and to_score(-1) == 0


def test_clip01_handles_nan():
    assert clip01(float("nan")) == 0.0


@pytest.mark.parametrize("score,label", [(0, "Low"), (39, "Low"), (39.4, "Low"), (40, "Moderate"), (69, "Moderate"),
                                         (69.6, "High"), (70, "High"), (100, "High")])
def test_classification_bands(score, label):
    assert classify(score) == label


def test_classify_rejects_out_of_range():
    with pytest.raises(ValueError):
        classify(101)


def test_standardizer():
    s = Standardizer().fit([[1, 2, 3], [10, 10, 10]])
    z = s.transform_row([2, 10])
    assert z[0] == pytest.approx(0.0) and z[1] == pytest.approx(0.0)
