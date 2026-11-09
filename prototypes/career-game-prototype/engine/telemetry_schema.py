# -*- coding: utf-8 -*-
import math
import copy

SCHEMA_VERSION = "2.0.0"

class SchemaValidationError(Exception):
    """Raised when an incoming telemetry payload violates structural or type constraints."""
    pass

class TelemetrySession:
    def __init__(self, session_id: str, calibration_baseline: dict):
        if not isinstance(calibration_baseline, dict):
            raise SchemaValidationError("Calibration baseline must be a dictionary.")
        
        median = calibration_baseline.get("median_inter_input_ms")
        samples = calibration_baseline.get("samples")
        
        if isinstance(median, bool) or not isinstance(median, (int, float)) or not math.isfinite(median) or median <= 0:
            raise SchemaValidationError("Invalid median_inter_input_ms in calibration baseline.")
        if isinstance(samples, bool) or not isinstance(samples, int) or samples < 1:
            raise SchemaValidationError("Invalid samples count in calibration baseline.")
            
        self.session_id = session_id
        # Deep copy ensures baseline telemetry profiles cannot be manipulated via shared memory references
        self.calibration_baseline = copy.deepcopy(calibration_baseline)
        self.last_monotonic_ms = -1.0

    def register_event(self, raw_event: dict) -> dict:
        if not isinstance(raw_event, dict):
            raise SchemaValidationError("Event payload must be a dictionary.")

        # 1. Validate Schema Version
        version = raw_event.get("schema_version")
        if not isinstance(version, str) or version != SCHEMA_VERSION:
            raise SchemaValidationError(f"Invalid or mismatched schema version. Expected '{SCHEMA_VERSION}'")

        # 2. Validate Monotonic Device Timestamp (Protects against time-cheating)
        monotonic_ms = raw_event.get("monotonic_ms")
        if isinstance(monotonic_ms, bool) or not isinstance(monotonic_ms, (int, float)) or not math.isfinite(monotonic_ms) or monotonic_ms < 0:
            raise SchemaValidationError("Invalid monotonic_ms timestamp.")
            
        if monotonic_ms < self.last_monotonic_ms:
            raise SchemaValidationError("Monotonic timestamp sequence went backward.")

        # 3. Validate Input Device Type (Touch profiles vs. Mouse speeds)
        input_type = raw_event.get("input_type")
        if input_type not in ["touch", "mouse"]:
            raise SchemaValidationError("Invalid input_type. Must be exactly 'touch' or 'mouse'.")

        # 4. Explicitly validate event classifications to prevent telemetry loss
        event_type = raw_event.get("event_type")
        if not isinstance(event_type, str) or not event_type.strip():
            raise SchemaValidationError("Telemetry event must contain a valid, non-empty event_type identifier.")

        self.last_monotonic_ms = monotonic_ms

        return {
            "event_id": raw_event.get("event_id"),
            "schema_version": SCHEMA_VERSION,
            "event_type": event_type.strip(),
            "monotonic_ms": monotonic_ms,
            "input_type": input_type,
            "calibration_baseline": copy.deepcopy(self.calibration_baseline),
            "data": copy.deepcopy(raw_event.get("data", {}))
        }
