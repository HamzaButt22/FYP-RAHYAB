import json
import math
import random
import re
import subprocess
import uuid

import pytest

from engine import glyph_sequence, power_grid, session_log
from engine.session_log import (
    APP_VERSION,
    GAME_POWER_SECTOR,
    GAME_RESEARCH_SECTOR,
    SESSION_LOG_VERSION,
    SessionLogConfig,
    SessionLogError,
    SessionLogger,
    current_code_version,
    load_session,
    parse_session_args,
    recompute,
    validate_participant_id,
)
from engine.stream_transformation_engine import FEATURE_ORDER, STREAMS, StreamTransformationEngine
from engine.telemetry_schema import SCHEMA_VERSION, TelemetrySession

BASELINE = {"median_inter_input_ms": 412.0, "samples": 7, "input_type": "touch", "measured": True}
DEVICE = {"platform": "Windows", "screen_w": 1024, "screen_h": 768}
FORM = "PCF-1.0"


def make_config(tmp_path, participant_id="P001", consent=True, form=FORM, fallback=None):
    return SessionLogConfig(participant_id=participant_id, consent=consent, consent_form_version=form,
                            log_dir=tmp_path / "logs", fallback_dir=fallback or tmp_path / "fallback")


def validated(session, event_type, ms, data, input_type="mouse"):
    return session.register_event({
        "event_id": str(uuid.uuid4()),
        "schema_version": SCHEMA_VERSION,
        "event_type": event_type,
        "monotonic_ms": ms,
        "input_type": input_type,
        "data": data,
    })


def power_sector_session():
    """A short, real Game 1 session: generated grid plus rotation telemetry."""
    grid = power_grid.PowerGrid.generate(4, random.Random(3))
    session = TelemetrySession(str(uuid.uuid4()), BASELINE)
    events = [validated(session, power_grid.START_EVENT, 0.0, {"grid_size": 4, "tiles": [list(c) for c in grid.tiles]})]
    ms = 0.0
    for x, y in [(0, 0), (0, 0), (1, 0), (2, 1), (2, 1), (3, 3)]:
        ms += 700.0
        events.append(validated(session, power_grid.ROTATION_EVENT, ms,
                                {"grid_x": x, "grid_y": y, "screen_x": 0, "screen_y": 0, "button": 1}, "touch"))
    metrics = power_grid.summarise_session(grid, events)
    profile = power_grid.compile_profile(metrics)
    replay_inputs = {"tiles": [list(c) for c in grid.tiles], "source": list(grid.source),
                     "source_side": grid.source_side, "sink": list(grid.sink), "sink_side": grid.sink_side}
    return session, replay_inputs, events, metrics, profile


def open_logger(config, session, replay_inputs, game=GAME_POWER_SECTOR, device=DEVICE):
    return SessionLogger(config, game=game, session_id=session.session_id,
                         calibration_baseline=session.calibration_baseline,
                         replay_inputs=replay_inputs, device=device)


def logged_power_session(tmp_path, close=True, config=None):
    session, replay_inputs, events, metrics, profile = power_sector_session()
    logger = open_logger(config or make_config(tmp_path), session, replay_inputs)
    for event in events:
        logger.append(event)
    if close:
        logger.close(metrics, profile, StreamTransformationEngine().recommend(profile))
    return logger, metrics, profile


def lines(path):
    return path.read_text(encoding="utf-8").splitlines()


# --- Participant IDs, consent, code version ------------------------------------

@pytest.mark.parametrize("pid", ["P001", "P0042", "LHR-P001", "ISB-P1234"])
def test_accepts_only_code_sheet_ids(pid):
    assert validate_participant_id(pid) == pid


@pytest.mark.parametrize("pid", [
    "Ahmed1", "AhmedKhan", "Ayesha P001",   # names, with or without a number
    "p001", "P01", "P00001", "LHR-001",     # near-misses of the code-sheet format
    "../P001", "P001\n", "", None, 1001,
])
def test_rejects_anything_a_name_could_fit(pid):
    with pytest.raises(SessionLogError):
        validate_participant_id(pid)


@pytest.mark.parametrize("consent", [False, None, "yes", 1])
def test_config_refuses_without_explicit_consent(tmp_path, consent):
    """Consent must be literally True so a truthy typo can't switch logging on."""
    with pytest.raises(SessionLogError):
        make_config(tmp_path, consent=consent)


@pytest.mark.parametrize("form", [None, "", " PCF", "../PCF-1.0", "x" * 40])
def test_config_requires_a_consent_form_version(tmp_path, form):
    with pytest.raises(SessionLogError):
        make_config(tmp_path, form=form)


def test_code_version_reports_the_scoring_commit():
    current_code_version.cache_clear()
    version = current_code_version()
    assert version["commit"] == "unknown" or re.fullmatch(r"[0-9a-f]{40}", version["commit"])
    assert version["dirty"] in (True, False, None)


def test_code_version_degrades_without_git(monkeypatch):
    def no_git(*args, **kwargs):
        raise FileNotFoundError("git")
    monkeypatch.setattr(subprocess, "run", no_git)
    current_code_version.cache_clear()
    try:
        assert current_code_version() == {"commit": "unknown", "dirty": None}
    finally:
        current_code_version.cache_clear()


# --- Streaming log: crash safety ------------------------------------------------

def test_header_is_on_disk_before_any_event(tmp_path):
    session, replay_inputs, *_ = power_sector_session()
    logger = open_logger(make_config(tmp_path), session, replay_inputs)
    assert logger.path == tmp_path / "logs" / "P001" / f"{GAME_POWER_SECTOR}_{session.session_id}.jsonl"
    [header] = lines(logger.path)
    assert json.loads(header)["kind"] == "header"


def test_unclosed_session_still_loads_every_event(tmp_path):
    """A crash or power cut before close loses nothing that was already appended."""
    logger, metrics, profile = logged_power_session(tmp_path, close=False)
    record = load_session(logger.path)
    assert len(record["events"]) == 7
    assert record["complete"] is False and record["derived"] is None
    assert recompute(record)["metrics"] == metrics


def test_torn_final_line_is_dropped_not_fatal(tmp_path):
    logger, *_ = logged_power_session(tmp_path, close=False)
    with open(logger.path, "a", encoding="utf-8") as handle:
        handle.write('{"kind": "event", "event": {"event_ty')
    record = load_session(logger.path)
    assert len(record["events"]) == 7
    assert record["truncated"] is True and record["complete"] is False


def test_primary_unavailable_at_start_uses_fallback(tmp_path):
    (tmp_path / "logs").write_text("not a folder", encoding="utf-8")
    logger, *_ = logged_power_session(tmp_path)
    assert logger.saved and logger.path.parent == tmp_path / "fallback" / "P001"
    assert load_session(logger.path)["complete"] is True


def test_primary_failing_mid_session_moves_whole_session_to_fallback(tmp_path):
    session, replay_inputs, events, metrics, profile = power_sector_session()
    logger = open_logger(make_config(tmp_path), session, replay_inputs)
    for event in events[:3]:
        logger.append(event)
    logger._handle.close()                      # simulate the drive vanishing
    for event in events[3:]:
        logger.append(event)
    logger.close(metrics, profile, StreamTransformationEngine().recommend(profile))

    assert logger.path.parent == tmp_path / "fallback" / "P001"
    record = load_session(logger.path)
    assert record["complete"] is True and len(record["events"]) == 7


def test_both_locations_failing_never_crashes_the_game(tmp_path):
    (tmp_path / "logs").write_text("x", encoding="utf-8")
    (tmp_path / "fallback").write_text("x", encoding="utf-8")
    logger, *_ = logged_power_session(tmp_path)
    assert logger.saved is False and logger.path is None


def test_existing_session_file_is_never_overwritten(tmp_path):
    session, replay_inputs, *_ = power_sector_session()
    first = open_logger(make_config(tmp_path), session, replay_inputs)
    before = first.path.read_bytes()
    second = open_logger(make_config(tmp_path), session, replay_inputs)
    assert first.path.read_bytes() == before
    assert second.path != first.path


# --- Record contents ------------------------------------------------------------

def test_closed_record_carries_provenance_and_nothing_identifying(tmp_path):
    logger, metrics, profile = logged_power_session(tmp_path)
    record = load_session(logger.path)

    assert record["log_version"] == SESSION_LOG_VERSION
    assert record["app_version"] == APP_VERSION
    assert record["telemetry_schema_version"] == SCHEMA_VERSION
    assert record["code_version"] == current_code_version()
    assert re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}\+00:00", record["started_at_utc"])
    assert record["consent"] == {"asserted": True, "form_version": FORM}
    assert record["participant_id"] == "P001"
    assert record["device"] == {**DEVICE, "input_types": ["mouse", "touch"]}
    assert record["calibration_baseline"] == BASELINE
    assert record["complete"] is True and record["truncated"] is False
    assert record["derived"]["metrics"] == metrics
    assert list(record["derived"]["profile"]) == FEATURE_ORDER
    assert list(record["derived"]["probabilities"]) == STREAMS
    for event in record["events"]:
        assert set(event) == {"event_id", "schema_version", "event_type", "monotonic_ms", "input_type", "data"}
    assert not {"name", "student_name", "grade", "gender", "age", "marks"} & set(record)


def test_logged_events_are_detached_from_caller_state(tmp_path):
    session, replay_inputs, events, *_ = power_sector_session()
    logger = open_logger(make_config(tmp_path), session, replay_inputs)
    logger.append(events[0])
    replay_inputs["tiles"][0][0] = 0
    events[0]["data"]["grid_size"] = 99
    record = load_session(logger.path)
    assert record["events"][0]["data"]["grid_size"] == 4
    assert record["replay_inputs"]["tiles"][0][0] != 0


@pytest.mark.parametrize("kwargs", [
    {"game": "quiz_sector"},
    {"device": {**DEVICE, "hostname": "LAB-PC-07"}},
])
def test_bad_header_fields_fail_before_play(tmp_path, kwargs):
    session, replay_inputs, *_ = power_sector_session()
    with pytest.raises(SessionLogError):
        open_logger(make_config(tmp_path), session, replay_inputs, **kwargs)


def test_unsafe_session_id_fails_before_play(tmp_path):
    session, replay_inputs, *_ = power_sector_session()
    session.session_id = "../escape"
    with pytest.raises(SessionLogError):
        open_logger(make_config(tmp_path), session, replay_inputs)


# --- Loading is adversarial ---------------------------------------------------

def rewrite(path, mutate):
    rows = [json.loads(line) for line in lines(path)]
    mutate(rows)
    path.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")


@pytest.mark.parametrize("mutate", [
    lambda rows: rows[0]["consent"].update(asserted=False),
    lambda rows: rows[0].update(log_version="9.0.0"),
    lambda rows: rows[0].update(game="quiz_sector"),
    lambda rows: rows[0].update(participant_id="Ahmed1"),
    lambda rows: rows.pop(0),                                              # no header
    lambda rows: rows.insert(3, rows[-1]),                                 # footer mid-file
    lambda rows: rows[-1].update(event_count=99),                          # footer disagrees
    lambda rows: rows[3]["event"].update(monotonic_ms=-5.0),               # time travel
    lambda rows: rows[3]["event"].update(input_type="keyboard"),
])
def test_load_rejects_tampered_logs(tmp_path, mutate):
    logger, *_ = logged_power_session(tmp_path)
    rewrite(logger.path, mutate)
    with pytest.raises(SessionLogError):
        load_session(logger.path)


def test_load_rejects_corruption_before_the_last_line(tmp_path):
    logger, *_ = logged_power_session(tmp_path)
    rows = lines(logger.path)
    rows[2] = rows[2][:10]
    logger.path.write_text("\n".join(rows) + "\n", encoding="utf-8")
    with pytest.raises(SessionLogError):
        load_session(logger.path)


# --- Recomputation ----------------------------------------------------------------

def test_power_sector_rescoring_from_disk_matches_live_scoring(tmp_path):
    logger, metrics, profile = logged_power_session(tmp_path)
    rescored = recompute(load_session(logger.path))
    assert rescored["metrics"] == metrics
    assert rescored["profile"] == profile
    assert rescored["code_version"] == current_code_version()
    assert math.isclose(sum(rescored["probabilities"].values()), 1.0)


def test_research_sector_rescoring_from_disk_matches_live_scoring(tmp_path):
    seed = 5
    game = glyph_sequence.GlyphSequenceGame(seed)
    session = TelemetrySession(str(uuid.uuid4()), BASELINE)
    events = [validated(session, glyph_sequence.START_EVENT, 0.0, {"seed": seed})]
    events.append(validated(session, glyph_sequence.PLAYBACK_END_EVENT, 3000.0, {}))
    ms = 3000.0
    for node in game.sequence + [(game.sequence[0] + 1) % glyph_sequence.NODE_COUNT]:
        ms += 900.0
        events.append(validated(session, glyph_sequence.NODE_CLICK_EVENT, ms, {"selected_node_index": node}))
    metrics = glyph_sequence.summarise_session(seed, events)
    profile = glyph_sequence.compile_profile(metrics)

    logger = open_logger(make_config(tmp_path), session, {"seed": seed}, game=GAME_RESEARCH_SECTOR)
    for event in events:
        logger.append(event)
    logger.close(metrics, profile, StreamTransformationEngine().recommend(profile))
    rescored = recompute(load_session(logger.path))
    assert rescored["metrics"] == metrics
    assert rescored["profile"] == profile


# --- Command line ------------------------------------------------------------------

def test_cli_without_participant_runs_unlogged():
    seed, config = parse_session_args([], "test")
    assert seed is None and config is None


def test_cli_with_full_consent_builds_config(tmp_path):
    seed, config = parse_session_args([
        "--participant", "P007", "--consent", "--consent-form", FORM,
        "--log-dir", str(tmp_path / "a"), "--fallback-dir", str(tmp_path / "b"), "--seed", "11",
    ], "test")
    assert seed == 11
    assert config.participant_id == "P007" and config.consent_form_version == FORM
    assert config.log_dir == tmp_path / "a" and config.fallback_dir == tmp_path / "b"


@pytest.mark.parametrize("argv", [
    ["--participant", "P007", "--consent-form", FORM],      # consent never asserted
    ["--participant", "P007", "--consent"],                 # which form?
    ["--consent", "--consent-form", FORM],                  # consent for nobody
    ["--participant", "Ahmed1", "--consent", "--consent-form", FORM],
])
def test_cli_refuses_before_play_starts(argv):
    with pytest.raises(SystemExit):
        parse_session_args(argv, "test")


def test_default_fallback_is_outside_the_primary_folder(tmp_path):
    config = SessionLogConfig("P001", True, FORM, tmp_path / "logs")
    assert tmp_path / "logs" not in config.fallback_dir.parents
    assert config.fallback_dir == session_log.DEFAULT_FALLBACK_DIR
