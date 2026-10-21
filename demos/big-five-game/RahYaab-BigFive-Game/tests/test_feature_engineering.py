import pytest

from analytics.cleaning import clean_events
from analytics.feature_engineering import extract_features
from tests.helpers import Stream


def feats(stream):
    df, _ = clean_events(stream.rows)
    return extract_features(df)


def test_empty_telemetry_gives_no_features():
    df, rep = clean_events([])
    assert extract_features(df).features == {} and rep["rows_out"] == 0


def test_exploration_features_exact():
    s = Stream().add("LEVEL_START", 1, optional_areas_total=6, grid_cells_total=77, novel_objects_total=8)
    for z in ("a", "b", "c"):
        s.add("EXPLORATION", 1, "enter_optional_area", zone_id=z)
    s.add("EXPLORATION", 1, "enter_optional_area", zone_id="a")                      # repeat visit must not count twice
    s.add("PLAYER_MOVE", 1, "move", cells=[[0, 0], [1, 0], [2, 0], [3, 0]], interval_ms=500, reversals=0)
    s.add("PLAYER_INTERACTION", 1, "inspect", object_id="o1", novel=True)
    s.add("PLAYER_INTERACTION", 1, "inspect", object_id="o1", novel=False)
    s.add("PLAYER_INTERACTION", 1, "inspect", object_id="o2", novel=True)
    f = feats(s).features
    assert f["exploration_rate"] == pytest.approx(3 / 6)
    assert f["route_diversity"] == pytest.approx(4 / 77)
    assert f["novel_action_rate"] == pytest.approx(2 / 8)


def test_risk_and_decision_time_features():
    s = Stream().add("LEVEL_START", 1)
    s.resp(1, "risk", "risky", dt=1000).resp(1, "risk", "safe", dt=3000).resp(1, "reward", "safe", dt=2000).resp(1, "reward", "risky", dt=2000)
    f = feats(s).features
    assert f["risk_taking_rate"] == 0.5 and f["risk_avoidance_rate"] == 0.5
    assert f["average_decision_time"] == pytest.approx(2.0)
    assert f["decision_time_variance"] == pytest.approx(0.6666, abs=1e-3)       # sample variance of 1,3,2,2 s


def test_social_features_exact():
    s = Stream().add("LEVEL_START", 3, npc_encounters_total=6, idle_encounters_total=3)
    s.add("NPC_INTERACTION", 3, "initiated_by_npc", encounter_id="m")
    s.add("DECISION", 3, "d", category="help", encounter_id="m")
    s.add("HELP_ACTION", 3, "help", encounter_id="m")
    s.add("NPC_INTERACTION", 3, "initiated_by_npc", encounter_id="l")
    s.add("DECISION", 3, "d2", category="cooperation")
    s.add("NPC_INTERACTION", 3, "ignored", encounter_id="l")
    s.add("NPC_INTERACTION", 3, "initiated_by_player", encounter_id="o")
    s.add("DECISION", 3, "d3", category="share")
    s.add("SHARE_ACTION", 3, "share_few", encounter_id="o")
    s.add("NPC_INTERACTION", 3, "dialogue_turn", encounter_id="o")
    f = feats(s).features
    assert f["social_interaction_rate"] == pytest.approx(2 / 6)       # m and o engaged; l ignored
    assert f["interaction_initiation_rate"] == pytest.approx(1 / 3)
    assert f["helping_rate"] == 1.0 and f["sharing_rate"] == 1.0
    assert f["cooperation_rate"] == 0.0
    assert f["social_engagement_depth"] == pytest.approx((1 + 2) / 2)


def test_planning_and_errors_exact():
    s = Stream().add("LEVEL_START", 2, optimal_reward=145)
    s.add("TASK_START", 2)
    s.add("PLAYER_INTERACTION", 2, "inspect_blueprint", advance=5000)
    s.add("PLAYER_INTERACTION", 2, "inspect_resources", advance=5000)
    s.add("RESOURCE_USED", 2, "build_order", advance=5000, reward_total=65, strategy_label="best_value")
    s.add("RESOURCE_USED", 2, "build_order", reward_total=105, strategy_label="best_value")
    s.add("ERROR", 2, "insufficient_resources")
    s.add("TASK_COMPLETE", 2)
    f = feats(s).features
    assert f["planning_time"] == pytest.approx(16.0)                  # 1s + 5 + 5 + 5 from LEVEL_START
    assert f["resource_efficiency"] == pytest.approx(105 / 145)
    assert f["strategy_consistency"] == 1.0
    assert f["completion_rate"] == 1.0
    assert f["error_rate"] == pytest.approx(1 / 5)                  


def test_failure_retry_and_persistence():
    s = Stream().add("LEVEL_START", 2).add("TASK_START", 2)
    s.add("LEVEL_FAILED", 2, reason="quota_missed")
    s.add("RETRY", 2, "retry_level", latency_ms=3000, voluntary=False)
    s.add("LEVEL_START", 2).add("TASK_START", 2)
    s.add("TASK_COMPLETE", 2).add("LEVEL_COMPLETE", 2)
    s.add("LEVEL_START", 4).add("TASK_START", 4)
    s.add("LEVEL_FAILED", 4, reason="timeout")
    s.add("TASK_ABANDON", 4, reason="player_skip")
    f = feats(s).features
    assert f["failure_recovery_rate"] == 0.5          # failure on L2 followed by a retry, L4 failure not
    assert f["persistence_rate"] == 0.5               # L2 eventually completed, L4 did not
    assert f["retry_rate"] == pytest.approx(1 / 3)    # 1 retry / 3 level starts
    assert f["mean_recovery_time_s"] == pytest.approx(3.0)
    assert f["completion_rate"] == 0.5


def test_pressure_features():
    s = Stream().add("LEVEL_START", 4).add("LEVEL_START", 1)
    s.resp(1, "risk", "safe", dt=1000)
    for gate, scans, changes in (("g1", 0, 0), ("g2", 3, 2)):
        for i in range(scans):
            s.add("PLAYER_INTERACTION", 4, "scan" if i == 0 else "recheck", gate=gate)
        s.resp(4, "pressure", "risky", dt=4000, gate_id=gate, changes=changes)
    f = feats(s).features
    assert f["repeated_checking_rate"] == pytest.approx(2 / 2)         # 2 re-checks over 2 gates
    assert f["decision_change_rate"] == pytest.approx(1.0)
    assert f["pressure_latency_ratio"] == pytest.approx(4.0)


def test_cleaning_drops_bad_rows_and_caps_times():
    s = Stream().add("LEVEL_START", 1)
    s.add("DECISION_RESPONSE", 1, "x", dt=999_999_999, category="risk", chosen_kind="safe")
    s.add("DECISION_RESPONSE", 1, "y", dt=-5, category="risk", chosen_kind="safe")
    s.rows.append({**s.rows[0], "event_type": "BOGUS", "t_ms": 99})
    s.rows.append(dict(s.rows[1]))                                       # exact duplicate
    df, rep = clean_events(s.rows)
    assert rep["dropped_unknown_type"] == 1 and rep["dropped_duplicates"] == 1
    assert rep["capped_decision_times"] == 1 and rep["negative_decision_times"] == 1
    assert df["decision_time_ms"].max() <= 120_000


def test_fixture_features_are_sane(dummy):
    for label, events in dummy.items():
        df, _ = clean_events(events)
        f = extract_features(df).features
        for name, v in f.items():
            assert v == v and v >= 0, (label, name, v)               # no NaN / negatives
        for rate in ("exploration_rate", "helping_rate", "risk_taking_rate", "completion_rate", "social_interaction_rate"):
            if rate in f:
                assert 0 <= f[rate] <= 1
