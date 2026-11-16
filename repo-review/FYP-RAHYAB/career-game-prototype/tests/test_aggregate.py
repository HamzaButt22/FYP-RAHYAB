import csv
import json
import math
import random
import shutil
import uuid

import pytest

from engine import aggregate, glyph_sequence, power_grid
from engine.aggregate import aggregate_participant, build_pilot_table, collect_logs, write_pilot_csv
from engine.session_log import (
    GAME_POWER_SECTOR,
    GAME_RESEARCH_SECTOR,
    SessionLogConfig,
    SessionLogger,
    load_session,
)
from engine.stream_transformation_engine import FEATURE_ORDER, STREAMS, StreamTransformationEngine
from engine.telemetry_schema import SCHEMA_VERSION, TelemetrySession

BASELINE = {"median_inter_input_ms": 400.0, "samples": 7, "input_type": "touch", "measured": True}
DEVICE = {"platform": "Windows", "screen_w": 1024, "screen_h": 768}
GLYPH_ONLY = set(glyph_sequence.MEASURED_FEATURES) - set(power_grid.MEASURED_FEATURES)
NEVER_MEASURED = set(FEATURE_ORDER) - set(glyph_sequence.MEASURED_FEATURES) - set(power_grid.MEASURED_FEATURES)


def config(tmp_path, pid="P001"):
    return SessionLogConfig(pid, True, "PCF-1.0", tmp_path / "logs", tmp_path / "fallback")


def event(session, kind, ms, data, input_type="touch"):
    return session.register_event({"event_id": str(uuid.uuid4()), "schema_version": SCHEMA_VERSION,
                                   "event_type": kind, "monotonic_ms": ms, "input_type": input_type, "data": data})


def power_events(seed=3, clicks=((0, 0), (0, 0), (1, 0), (2, 1), (2, 1), (3, 3))):
    grid = power_grid.PowerGrid.generate(4, random.Random(seed))
    session = TelemetrySession(str(uuid.uuid4()), BASELINE)
    events = [event(session, power_grid.START_EVENT, 0.0, {"grid_size": 4, "tiles": [list(c) for c in grid.tiles]})]
    ms = 0.0
    for x, y in clicks:
        ms += 700.0 + 50 * x
        events.append(event(session, power_grid.ROTATION_EVENT, ms, {"grid_x": x, "grid_y": y}))
    replay = {"tiles": [list(c) for c in grid.tiles], "source": list(grid.source), "source_side": grid.source_side,
              "sink": list(grid.sink), "sink_side": grid.sink_side}
    return session, replay, events, power_grid


def glyph_events(seed=5, rounds=2):
    """A flawless run: every round cleared, so trial_and_error is *measured* as 0.0."""
    game = glyph_sequence.GlyphSequenceGame(seed)
    session = TelemetrySession(str(uuid.uuid4()), BASELINE)
    events = [event(session, glyph_sequence.START_EVENT, 0.0, {"seed": seed})]
    ms = 0.0
    for _ in range(rounds):
        ms += 3000.0
        events.append(event(session, glyph_sequence.PLAYBACK_END_EVENT, ms, {}))
        game.finish_playback()
        ms += 1200.0
        for node in list(game.sequence):
            events.append(event(session, glyph_sequence.NODE_CLICK_EVENT, ms, {"selected_node_index": node}))
            game.press(node)
            ms += 600.0
    return session, {"seed": seed}, events, glyph_sequence


def log_session(cfg, game, built, close=True):
    session, replay, events, module = built
    logger = SessionLogger(cfg, game=game, session_id=session.session_id,
                           calibration_baseline=session.calibration_baseline, replay_inputs=replay, device=DEVICE)
    for e in events:
        logger.append(e)
    if close:
        metrics = (module.summarise_session(power_grid.PowerGrid(replay["tiles"]), events) if module is power_grid
                   else module.summarise_session(replay["seed"], events))
        profile = module.compile_profile(metrics)
        logger.close(metrics, profile, StreamTransformationEngine().recommend(profile))
    return logger


def participant_paths(tmp_path, pid="P001"):
    return collect_logs([tmp_path / "logs", tmp_path / "fallback"])[pid]


# --- Evidence: measured vs. not measured ----------------------------------------

def test_evidence_only_contains_features_the_session_measured():
    session, replay, events, _ = power_events(clicks=())
    metrics = power_grid.summarise_session(power_grid.PowerGrid(replay["tiles"]), events)
    assert power_grid.compile_evidence(metrics) == {}
    assert power_grid.compile_profile(metrics) == {f: 0.0 for f in FEATURE_ORDER}

    session, replay, events, _ = glyph_events()
    evidence = glyph_sequence.compile_evidence(glyph_sequence.summarise_session(5, events))
    assert set(evidence) == set(glyph_sequence.MEASURED_FEATURES)
    assert evidence["trial_and_error"] == 0.0          # measured zero, not missing


def test_compile_profile_is_evidence_zero_filled():
    session, replay, events, _ = glyph_events()
    metrics = glyph_sequence.summarise_session(5, events)
    evidence = glyph_sequence.compile_evidence(metrics)
    assert glyph_sequence.compile_profile(metrics) == {f: evidence.get(f, 0.0) for f in FEATURE_ORDER}


# --- Stream engine with missing features ----------------------------------------

def test_stream_engine_rejects_none_unless_missing_is_allowed():
    profile = {f: None for f in FEATURE_ORDER}
    profile["riasec_investigative"] = 0.8
    engine = StreamTransformationEngine()
    with pytest.raises(ValueError):
        engine.recommend(profile)
    zero_filled = {f: (v if v is not None else 0.0) for f, v in profile.items()}
    assert engine.recommend(profile, allow_missing=True) == engine.recommend(zero_filled)


def test_stream_engine_refuses_a_profile_with_no_evidence():
    with pytest.raises(ValueError):
        StreamTransformationEngine().recommend({f: None for f in FEATURE_ORDER}, allow_missing=True)


# --- Aggregation -----------------------------------------------------------------

def test_two_games_combine_into_one_profile_with_nulls_for_the_unmeasured(tmp_path):
    cfg = config(tmp_path)
    log_session(cfg, GAME_POWER_SECTOR, power_events())
    log_session(cfg, GAME_RESEARCH_SECTOR, glyph_events())

    result = aggregate_participant("P001", participant_paths(tmp_path))

    assert result["excluded"] == []
    assert sorted(s["game"] for s in result["sessions"]) == [GAME_POWER_SECTOR, GAME_RESEARCH_SECTOR]
    assert list(result["profile"]) == FEATURE_ORDER
    for feature in NEVER_MEASURED:
        assert result["profile"][feature] is None
    assert result["profile"]["trial_and_error"] is not None
    for feature in GLYPH_ONLY:
        assert result["measured_by"][feature] == [GAME_RESEARCH_SECTOR]
    assert result["coverage"] == len(result["measured_by"]) / len(FEATURE_ORDER)
    assert math.isclose(sum(result["probabilities"].values()), 1.0)


def test_features_two_games_share_are_averaged_and_kept_per_game(tmp_path):
    cfg = config(tmp_path)
    log_session(cfg, GAME_POWER_SECTOR, power_events())
    log_session(cfg, GAME_RESEARCH_SECTOR, glyph_events())
    result = aggregate_participant("P001", participant_paths(tmp_path))

    for feature, games in result["measured_by"].items():
        values = [result["by_game"][g][feature] for g in games]
        assert math.isclose(result["profile"][feature], sum(values) / len(values))


def test_retest_sessions_are_averaged_within_a_game_and_listed_in_order(tmp_path):
    cfg = config(tmp_path)
    first = log_session(cfg, GAME_RESEARCH_SECTOR, glyph_events(seed=5))
    second = log_session(cfg, GAME_RESEARCH_SECTOR, glyph_events(seed=9, rounds=3))
    result = aggregate_participant("P001", participant_paths(tmp_path))

    assert len(result["sessions"]) == 2
    starts = [s["started_at_utc"] for s in result["sessions"]]
    assert starts == sorted(starts)
    per_session = [s["evidence"]["ddm_boundary_separation"] for s in result["sessions"]]
    assert math.isclose(result["by_game"][GAME_RESEARCH_SECTOR]["ddm_boundary_separation"], sum(per_session) / 2)
    assert {first.path.name, second.path.name} == {s["file"] for s in result["sessions"]}


def test_failover_duplicate_keeps_the_complete_copy(tmp_path):
    cfg = config(tmp_path)
    session, replay, events, module = power_events()
    logger = SessionLogger(cfg, game=GAME_POWER_SECTOR, session_id=session.session_id,
                           calibration_baseline=BASELINE, replay_inputs=replay, device=DEVICE)
    for e in events[:3]:
        logger.append(e)
    logger._handle.close()                         # primary drive drops out mid-session
    for e in events[3:]:
        logger.append(e)
    logger.close({}, {f: 0.0 for f in FEATURE_ORDER}, {s: 0.2 for s in STREAMS})

    result = aggregate_participant("P001", participant_paths(tmp_path))
    assert len(result["sessions"]) == 1 and result["sessions"][0]["complete"] is True
    assert [x["reason"] for x in result["excluded"]] == ["duplicate of a more complete copy"]


def test_crashed_session_is_excluded_by_default_but_can_be_included(tmp_path):
    log_session(config(tmp_path), GAME_RESEARCH_SECTOR, glyph_events(), close=False)
    paths = participant_paths(tmp_path)

    strict = aggregate_participant("P001", paths)
    assert strict["sessions"] == [] and strict["excluded"][0]["reason"] == "incomplete (no footer)"
    assert all(v is None for v in strict["profile"].values()) and strict["probabilities"] is None

    lenient = aggregate_participant("P001", paths, include_incomplete=True)
    assert len(lenient["sessions"]) == 1 and lenient["sessions"][0]["complete"] is False


def test_tampered_and_misfiled_logs_are_excluded_without_sinking_the_rest(tmp_path):
    cfg = config(tmp_path)
    good = log_session(cfg, GAME_POWER_SECTOR, power_events())
    bad = log_session(cfg, GAME_RESEARCH_SECTOR, glyph_events())
    rows = [json.loads(line) for line in bad.path.read_text(encoding="utf-8").splitlines()]
    rows[0]["consent"]["asserted"] = False
    bad.path.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")

    other = log_session(config(tmp_path, "P002"), GAME_POWER_SECTOR, power_events())
    shutil.copy(other.path, good.path.parent / other.path.name)   # P002's log filed under P001

    result = aggregate_participant("P001", participant_paths(tmp_path))
    assert [s["file"] for s in result["sessions"]] == [good.path.name]
    reasons = sorted(x["reason"].split(":")[0] for x in result["excluded"])
    assert reasons == ["participant mismatch", "unreadable"]


def test_aggregate_re_scores_instead_of_trusting_the_cached_footer(tmp_path):
    logger = log_session(config(tmp_path), GAME_RESEARCH_SECTOR, glyph_events())
    rows = [json.loads(line) for line in logger.path.read_text(encoding="utf-8").splitlines()]
    rows[-1]["derived"]["profile"]["riasec_investigative"] = 1.0       # inflate the cached score
    logger.path.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")

    result = aggregate_participant("P001", participant_paths(tmp_path))
    honest = glyph_sequence.compile_evidence(glyph_sequence.summarise_session(5, load_session(logger.path)["events"]))
    assert result["profile"]["riasec_investigative"] == honest["riasec_investigative"] != 1.0


# --- Discovery and pilot export ------------------------------------------------

def test_collect_logs_merges_folders_and_ignores_non_participant_folders(tmp_path):
    log_session(config(tmp_path, "P001"), GAME_POWER_SECTOR, power_events())
    log_session(config(tmp_path, "LHR-P042"), GAME_POWER_SECTOR, power_events())
    (tmp_path / "logs" / "Ahmed Khan").mkdir()
    (tmp_path / "logs" / "Ahmed Khan" / "x.jsonl").write_text("{}", encoding="utf-8")
    (tmp_path / "fallback" / "P001").mkdir(parents=True, exist_ok=True)

    found = collect_logs([tmp_path / "logs", tmp_path / "fallback", tmp_path / "missing"])
    assert sorted(found) == ["LHR-P042", "P001"]
    assert len(found["P001"]) == 1


def test_pilot_table_leaves_unmeasured_cells_blank_and_omits_hand_set_probabilities(tmp_path):
    log_session(config(tmp_path, "P001"), GAME_POWER_SECTOR, power_events())
    log_session(config(tmp_path, "P001"), GAME_RESEARCH_SECTOR, glyph_events())
    log_session(config(tmp_path, "P002"), GAME_RESEARCH_SECTOR, glyph_events(seed=8))

    columns, rows, _ = build_pilot_table([tmp_path / "logs", tmp_path / "fallback"])
    out = tmp_path / "exports" / "features.csv"
    write_pilot_csv(columns, rows, out)

    with open(out, newline="", encoding="utf-8") as handle:
        table = list(csv.DictReader(handle))
    assert [r["participant_id"] for r in table] == ["P001", "P002"]
    assert set(columns) >= set(FEATURE_ORDER)
    assert f"{GAME_POWER_SECTOR}__icar_3d_rotation" in columns
    assert not any(c.startswith("prob") or c in STREAMS for c in columns)

    p2 = table[1]
    assert p2["sessions_used"] == "1" and p2["games"] == GAME_RESEARCH_SECTOR
    for feature in set(power_grid.MEASURED_FEATURES) - set(glyph_sequence.MEASURED_FEATURES):
        assert p2[feature] == ""
    assert p2["trial_and_error"] == "0.0"                              # measured zero survives
    assert p2["calibration_median_ms"] == "400.0" and p2["input_types"] == "touch"


def test_cli_writes_the_pilot_table(tmp_path, capsys):
    log_session(config(tmp_path), GAME_RESEARCH_SECTOR, glyph_events())
    out = tmp_path / "exports" / "features.csv"
    aggregate.main(["--log-dir", str(tmp_path / "logs"), "--fallback-dir", str(tmp_path / "fallback"),
                    "--out", str(out)])
    assert out.exists()
    assert "1 participant" in capsys.readouterr().out
