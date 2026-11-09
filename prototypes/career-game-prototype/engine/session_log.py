# -*- coding: utf-8 -*-
"""Pilot-study session log: one consented, pseudonymous, re-scorable JSON Lines file per game session.

The header (participant, consent form, code version, device, calibration, replay inputs) is written
before play starts and every validated event is appended and fsynced as it happens, so a crash,
full disk or power cut loses at most the event being written. If the primary folder fails, the
whole session so far is rewritten to a fallback folder and logging continues there.

No names or covariates (grade, marks, gender, age) are ever stored here: participant IDs come from
the researcher's code sheet, and covariates live in a separate pilot sheet keyed by that ID.

Pure Python with no pygame dependency, so the format ports 1:1 to a Unity C# serializer.
"""
import argparse
import functools
import json
import os
import re
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from engine import glyph_sequence, power_grid
from engine.stream_transformation_engine import StreamTransformationEngine
from engine.telemetry_schema import SCHEMA_VERSION, SchemaValidationError, TelemetrySession

SESSION_LOG_VERSION = "2.1.0"
APP_VERSION = "0.1.0"

GAME_POWER_SECTOR = "power_sector"
GAME_RESEARCH_SECTOR = "research_sector"
GAME_MODULES = {GAME_POWER_SECTOR: power_grid, GAME_RESEARCH_SECTOR: glyph_sequence}

# Code-sheet format only: P + 3-4 digits, optionally prefixed by a 3-letter site code (LHR-P001).
# Nothing a name could fit; the charset also keeps IDs safe as folder names.
PARTICIPANT_ID_PATTERN = re.compile(r"(?:[A-Z]{3}-)?P[0-9]{3,4}")
CONSENT_FORM_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,31}")
DEFAULT_FALLBACK_DIR = Path.home() / "RahYaab_pilot_fallback"
DEVICE_FIELDS = ("platform", "screen_w", "screen_h")
EVENT_FIELDS = ("event_id", "schema_version", "event_type", "monotonic_ms", "input_type", "data")
HEADER_FIELDS = (
    "log_version", "app_version", "telemetry_schema_version", "code_version", "game", "session_id",
    "participant_id", "consent", "device", "calibration_baseline", "replay_inputs",
)
_ENGINE_DIR = Path(__file__).resolve().parent


class SessionLogError(Exception):
    """Raised when a session log would be unconsented, identifying, unsafe to store, or is unreadable."""


def validate_participant_id(participant_id) -> str:
    if not isinstance(participant_id, str) or not PARTICIPANT_ID_PATTERN.fullmatch(participant_id):
        raise SessionLogError("Participant ID must match the code sheet: P001-P9999, optionally LHR-P001.")
    return participant_id


def _validate_consent_form(form_version) -> str:
    if not isinstance(form_version, str) or not CONSENT_FORM_PATTERN.fullmatch(form_version):
        raise SessionLogError("Consent form version is required, e.g. PCF-1.0.")
    return form_version


def _validate_session_id(session_id) -> str:
    try:
        if str(uuid.UUID(session_id)) == session_id:
            return session_id
    except (TypeError, ValueError, AttributeError):
        pass
    raise SessionLogError("Session ID must be a canonical UUID string.")


def _validate_game(game) -> str:
    if game not in _RESCORERS:
        raise SessionLogError(f"Unknown game {game!r}.")
    return game


def _validate_device(device) -> dict:
    if not isinstance(device, dict) or set(device) - set(DEVICE_FIELDS):
        raise SessionLogError(f"Device info may only contain {DEVICE_FIELDS}.")
    return device


def _json_copy(value):
    """Deep copy through JSON so logged data is detached, serialisable, and equal to what load returns."""
    try:
        return json.loads(json.dumps(value, allow_nan=False))
    except (TypeError, ValueError) as err:
        raise SessionLogError(f"Session data is not JSON-safe: {err}") from err


@functools.lru_cache(maxsize=1)
def current_code_version() -> dict:
    """Git commit of the scoring code, and whether engine/ has uncommitted changes. Read-only git calls."""
    try:
        commit = subprocess.run(["git", "-C", str(_ENGINE_DIR), "rev-parse", "HEAD"],
                                capture_output=True, text=True, timeout=5, check=True).stdout.strip()
        status = subprocess.run(["git", "-C", str(_ENGINE_DIR), "status", "--porcelain", "--", "."],
                                capture_output=True, text=True, timeout=5, check=True).stdout
    except (OSError, subprocess.SubprocessError):
        return {"commit": "unknown", "dirty": None}
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        return {"commit": "unknown", "dirty": None}
    return {"commit": commit, "dirty": bool(status.strip())}


class SessionLogConfig:
    """Checked before play starts, so a missing consent record stops the session rather than losing its data."""

    def __init__(self, participant_id, consent, consent_form_version, log_dir, fallback_dir=None):
        if consent is not True:
            raise SessionLogError("Logging requires recorded consent (consent=True).")
        self.participant_id = validate_participant_id(participant_id)
        self.consent = True
        self.consent_form_version = _validate_consent_form(consent_form_version)
        self.log_dir = Path(log_dir)
        self.fallback_dir = Path(fallback_dir) if fallback_dir is not None else DEFAULT_FALLBACK_DIR


class SessionLogger:
    """Streams one session to <dir>/<participant>/<game>_<session>.jsonl. I/O failures never raise:
    they move the session to the fallback folder, and if that fails too `saved` turns False."""

    def __init__(self, config: SessionLogConfig, *, game: str, session_id: str, calibration_baseline: dict,
                 replay_inputs: dict, device: dict):
        self.header = _json_copy({
            "kind": "header",
            "log_version": SESSION_LOG_VERSION,
            "app_version": APP_VERSION,
            "telemetry_schema_version": SCHEMA_VERSION,
            "code_version": current_code_version(),
            # Wall-clock start (UTC) orders retest sessions; latency features use monotonic_ms only.
            "started_at_utc": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "game": _validate_game(game),
            "session_id": _validate_session_id(session_id),
            "participant_id": validate_participant_id(config.participant_id),
            "consent": {"asserted": config.consent, "form_version": _validate_consent_form(config.consent_form_version)},
            "device": _validate_device(device),
            "calibration_baseline": calibration_baseline,
            "replay_inputs": replay_inputs,
        })
        self._filename = f"{game}_{session_id}.jsonl"
        self._dirs = [Path(config.log_dir), Path(config.fallback_dir)]
        self._rows = []
        self._footer = None
        self._handle = None
        self.path = None
        self._open_next()

    @property
    def saved(self) -> bool:
        return self.path is not None

    def _write(self, row: dict) -> None:
        self._handle.write(json.dumps(row, allow_nan=False) + "\n")
        self._handle.flush()
        os.fsync(self._handle.fileno())

    def _open_next(self) -> None:
        """Opens the next folder that works and replays everything logged so far into it."""
        self.path = None
        while self._dirs:
            folder = self._dirs.pop(0) / self.header["participant_id"]
            path = folder / self._filename
            try:
                folder.mkdir(parents=True, exist_ok=True)
                self._handle = open(path, "x", encoding="utf-8")   # never overwrite an existing session
            except (OSError, ValueError):
                continue
            try:
                for row in [self.header, *self._rows] + ([self._footer] if self._footer else []):
                    self._write(row)
            except (OSError, ValueError):
                self._drop_handle()
                continue
            self.path = path
            return
        self._handle = None
        print("[SESSION LOG] could not write to the log or fallback folder - this session is NOT being saved.",
              file=sys.stderr)

    def _drop_handle(self) -> None:
        try:
            self._handle.close()
        except (OSError, ValueError):
            pass
        self._handle = None

    def _commit(self, row: dict) -> None:
        if self._handle is None:
            return
        try:
            self._write(row)
        except (OSError, ValueError):
            self._drop_handle()
            print(f"[SESSION LOG] write to {self.path} failed - moving session to fallback.", file=sys.stderr)
            self._open_next()

    def append(self, validated_event: dict) -> None:
        row = {"kind": "event", "event": _json_copy({field: validated_event.get(field) for field in EVENT_FIELDS})}
        self._rows.append(row)
        self._commit(row)

    def close(self, metrics: dict, profile: dict, probabilities: dict):
        """Writes the footer (cached play-time scores; recompute() is the source of truth). Returns the path or None."""
        self._footer = {"kind": "footer", "event_count": len(self._rows),
                        "derived": _json_copy({"metrics": metrics, "profile": profile, "probabilities": probabilities})}
        self._commit(self._footer)
        if self._handle is not None:
            self._drop_handle()
        return self.path


def _check_header(header) -> dict:
    if not isinstance(header, dict) or header.get("kind") != "header" or \
            any(field not in header for field in HEADER_FIELDS):
        raise SessionLogError("Session log has no valid header.")
    version = header["log_version"]
    if not isinstance(version, str) or version.split(".")[0] != SESSION_LOG_VERSION.split(".")[0]:
        raise SessionLogError(f"Unsupported session log version {version!r}.")
    consent = header["consent"]
    if not isinstance(consent, dict) or consent.get("asserted") is not True:
        raise SessionLogError("Session log has no recorded consent.")
    _validate_consent_form(consent.get("form_version"))
    validate_participant_id(header["participant_id"])
    _validate_session_id(header["session_id"])
    _validate_game(header["game"])
    _validate_device(header["device"])
    return header


def load_session(path) -> dict:
    """Reads and re-validates a session log. A torn final line (crash mid-write) is dropped and flagged;
    corruption anywhere else, a misplaced footer, or events that fail telemetry validation are rejected."""
    try:
        text = Path(path).read_text(encoding="utf-8")
    except (OSError, ValueError) as err:
        raise SessionLogError(f"Cannot read session log {path}: {err}") from err
    raw_lines = text.split("\n")
    if raw_lines and raw_lines[-1] == "":
        raw_lines.pop()
    rows, truncated = [], False
    for i, line in enumerate(raw_lines):
        try:
            rows.append(json.loads(line))
        except ValueError:
            if i == len(raw_lines) - 1 and i > 0:
                truncated = True
                break
            raise SessionLogError(f"Corrupt line {i + 1} in {path}.")
    if not rows:
        raise SessionLogError(f"Session log {path} is empty.")

    header = _check_header(rows[0])
    try:
        session = TelemetrySession(header["session_id"], header["calibration_baseline"])
    except SchemaValidationError as err:
        raise SessionLogError(f"Invalid calibration baseline: {err}") from err

    events, footer = [], None
    for i, row in enumerate(rows[1:], start=2):
        kind = row.get("kind") if isinstance(row, dict) else None
        if footer is not None:
            raise SessionLogError(f"Line {i} follows the footer in {path}.")
        if kind == "footer":
            footer = row
            continue
        event = row.get("event") if kind == "event" else None
        if not isinstance(event, dict) or set(event) != set(EVENT_FIELDS):
            raise SessionLogError(f"Line {i} is not a session event.")
        try:
            session.register_event(event)
        except SchemaValidationError as err:
            raise SessionLogError(f"Line {i} fails telemetry validation: {err}") from err
        events.append(event)
    if footer is not None and footer.get("event_count") != len(events):
        raise SessionLogError("Footer event count does not match the logged events.")

    record = {key: value for key, value in header.items() if key != "kind"}
    record.setdefault("started_at_utc", None)   # absent before log version 2.1
    record["device"] = {**header["device"], "input_types": sorted({e["input_type"] for e in events})}
    record.update(events=events, complete=footer is not None, truncated=truncated,
                  derived=footer.get("derived") if footer else None)
    return record


def _rescore_power_sector(inputs: dict, events: list) -> dict:
    grid = power_grid.PowerGrid(inputs["tiles"], tuple(inputs["source"]), inputs["source_side"],
                                tuple(inputs["sink"]), inputs["sink_side"])
    return power_grid.summarise_session(grid, events)


def _rescore_research_sector(inputs: dict, events: list) -> dict:
    return glyph_sequence.summarise_session(inputs["seed"], events)


_RESCORERS = {
    GAME_POWER_SECTOR: _rescore_power_sector,
    GAME_RESEARCH_SECTOR: _rescore_research_sector,
}


def recompute(record: dict) -> dict:
    """Re-scores a loaded session (complete or not) with the current engine code, stamped with its version.
    `evidence` holds only the features this session measured; `profile` is the zero-filled 13-key view."""
    game = _validate_game(record["game"])
    metrics = _json_copy(_RESCORERS[game](record["replay_inputs"], record["events"]))
    module = GAME_MODULES[game]
    profile = _json_copy(module.compile_profile(metrics))
    return {"metrics": metrics, "evidence": _json_copy(module.compile_evidence(metrics)), "profile": profile,
            "probabilities": StreamTransformationEngine().recommend(profile),
            "code_version": current_code_version()}


def parse_session_args(argv, description: str) -> tuple:
    """Returns (seed, SessionLogConfig or None). Without --participant the game runs unlogged (dev mode)."""
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--participant", help="code-sheet ID, e.g. P001 or LHR-P001 (never a name)")
    parser.add_argument("--consent", action="store_true", help="researcher confirms signed parental consent + assent")
    parser.add_argument("--consent-form", help="version of the signed consent form, e.g. PCF-1.0")
    parser.add_argument("--log-dir", default="pilot_logs", help="folder for session logs (default: pilot_logs)")
    parser.add_argument("--fallback-dir", help=f"used if the log folder fails (default: {DEFAULT_FALLBACK_DIR})")
    parser.add_argument("--seed", type=int, help="fixed puzzle seed (default: random)")
    args = parser.parse_args(argv)
    if args.participant is None:
        if args.consent or args.consent_form:
            parser.error("--consent/--consent-form need --participant.")
        return args.seed, None
    try:
        config = SessionLogConfig(args.participant, args.consent, args.consent_form, args.log_dir, args.fallback_dir)
    except SessionLogError as err:
        parser.error(str(err))
    if current_code_version()["dirty"] is not False:
        print("WARNING: scoring code is uncommitted or untracked - commit before pilot sessions so "
              "results trace to an exact version.", file=sys.stderr)
    return args.seed, config
