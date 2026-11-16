import pytest
from engine.telemetry_schema import (
    SCHEMA_VERSION,
    SchemaValidationError,
    TelemetrySession,
)

BASELINE = {"median_inter_input_ms": 412.0, "samples": 12}


def make_session():
    return TelemetrySession(session_id="sess_01", calibration_baseline=BASELINE)


def make_raw_event(**overrides):
    raw = {
        "schema_version": SCHEMA_VERSION,
        "event_type": "input",
        "monotonic_ms": 1520.5,
        "input_type": "touch",
    }
    raw.update(overrides)
    return raw


def test_registered_event_contains_required_fields():
    """Verify that a registered event carries version, device clock, input type and baseline."""
    session = make_session()

    payload = session.register_event(make_raw_event())

    assert payload["schema_version"] == SCHEMA_VERSION
    assert payload["monotonic_ms"] == 1520.5
    assert payload["input_type"] == "touch"
    assert payload["calibration_baseline"] == BASELINE


def test_schema_version_is_strict_semver_string():
    """Verify that the engine's own schema version is a MAJOR.MINOR.PATCH string."""
    assert isinstance(SCHEMA_VERSION, str)
    parts = SCHEMA_VERSION.split(".")
    assert len(parts) == 3 and all(p.isdigit() for p in parts)


@pytest.mark.parametrize("bad_version", [1, 1.0, None, "", "1.0", "v1.0.0", "9.9.9"])
def test_rejects_invalid_or_mismatched_schema_version(bad_version):
    """Verify that non-string, malformed or foreign schema versions are refused."""
    session = make_session()

    with pytest.raises(SchemaValidationError):
        session.register_event(make_raw_event(schema_version=bad_version))


def test_rejects_missing_schema_version():
    session = make_session()
    raw = make_raw_event()
    del raw["schema_version"]

    with pytest.raises(SchemaValidationError):
        session.register_event(raw)


@pytest.mark.parametrize("bad_clock", [-1.0, True, "2026-10-28T10:00:00Z", None, float("nan"), float("inf")])
def test_rejects_invalid_monotonic_timestamp(bad_clock):
    """Verify that the device clock must be a finite, non-negative number (not wall-clock text)."""
    session = make_session()

    with pytest.raises(SchemaValidationError):
        session.register_event(make_raw_event(monotonic_ms=bad_clock))


def test_rejects_monotonic_timestamp_moving_backwards():
    """Verify that a session's device clock can never decrease between events."""
    session = make_session()
    session.register_event(make_raw_event(monotonic_ms=2000.0))

    with pytest.raises(SchemaValidationError):
        session.register_event(make_raw_event(monotonic_ms=1999.9))


@pytest.mark.parametrize("input_type", ["touch", "mouse"])
def test_accepts_supported_input_types(input_type):
    session = make_session()

    payload = session.register_event(make_raw_event(input_type=input_type))

    assert payload["input_type"] == input_type


@pytest.mark.parametrize("bad_input", ["keyboard", "TOUCH", "", None, 1])
def test_rejects_unsupported_input_type(bad_input):
    """Verify that only the touch/mouse flags are accepted, case-sensitively."""
    session = make_session()

    with pytest.raises(SchemaValidationError):
        session.register_event(make_raw_event(input_type=bad_input))


@pytest.mark.parametrize("bad_baseline", [
    None,
    {},
    {"median_inter_input_ms": 0.0, "samples": 12},
    {"median_inter_input_ms": 412.0, "samples": 0},
])
def test_session_requires_valid_calibration_baseline(bad_baseline):
    """Verify that no session can register events without a usable calibration baseline."""
    with pytest.raises(SchemaValidationError):
        TelemetrySession(session_id="sess_01", calibration_baseline=bad_baseline)


def test_client_cannot_override_session_baseline():
    """Verify that a baseline smuggled into the raw event is ignored in favour of the session's."""
    session = make_session()
    forged = {"median_inter_input_ms": 1.0, "samples": 999}

    payload = session.register_event(make_raw_event(calibration_baseline=forged))

    assert payload["calibration_baseline"] == BASELINE
