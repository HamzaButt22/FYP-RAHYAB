"""Plays the REAL game headlessly (no window) and checks every stage of the demo flow."""
from dataclasses import replace

import pytest

from analytics.event_schema import ALL_EVENT_TYPES
from game.app import GameApp
from game.input_state import InputState as I
from tools.bots import PRESETS, play_assessment


@pytest.fixture(scope="module")
def runs(tmp_path_factory):
    from backend.database.repository import Repository
    repo = Repository(tmp_path_factory.mktemp("e2e") / "e2e.db")
    out = {}
    for label in ("explorer", "planner", "socialite", "anxious", "reckless"):
        out[label] = play_assessment(replace(PRESETS[label], seed=21), repo)
    return repo, out


def test_every_bot_finishes_and_reaches_results(runs):
    _, apps = runs
    for label, app in apps.items():
        assert app.state == "results", label
        assert app.output is not None and app.output.summary["levels_completed"] >= 3


def test_telemetry_is_stored_and_complete(runs):
    repo, apps = runs
    for label, app in apps.items():
        sid = app.session.session_id
        counts = repo.event_type_counts(sid)
        assert set(counts) <= ALL_EVENT_TYPES
        for must in ("SESSION_START", "SESSION_END", "LEVEL_START", "DECISION", "DECISION_RESPONSE", "PLAYER_MOVE",
                     "EXPLORATION", "PLAYER_INTERACTION", "STRATEGY_CHANGE", "TASK_START", "REWARD_SELECTED"):
            assert counts.get(must, 0) >= 1, (label, must)
        assert counts["SESSION_START"] == counts["SESSION_END"] == 1
        assert counts["LEVEL_START"] >= 4
        assert repo.get_session(sid)["status"] == "completed"


def test_results_saved_and_unvalidated(runs):
    repo, apps = runs
    for app in apps.values():
        res = repo.get_result(app.session.session_id)
        assert res["is_validated"] is False
        assert all(0 <= v <= 100 for v in res["scores"].values())
        assert len(repo.get_features(app.session.session_id)) > 20


def test_different_behaviour_gives_different_profiles(runs):
    _, apps = runs
    s = {k: a.output.prediction.scores for k, a in apps.items()}
    f = {k: a.output.feature_set.features for k, a in apps.items()}
    assert f["explorer"]["exploration_rate"] > f["planner"]["exploration_rate"]
    assert f["socialite"]["social_interaction_rate"] > f["anxious"]["social_interaction_rate"]
    assert f["socialite"]["helping_rate"] >= f["reckless"]["helping_rate"]
    assert s["explorer"]["openness"] > s["planner"]["openness"]
    assert s["socialite"]["extraversion"] > s["anxious"]["extraversion"]
    assert s["socialite"]["agreeableness"] > s["reckless"]["agreeableness"]
    assert s["anxious"]["neuroticism"] > s["reckless"]["neuroticism"]
    assert len({tuple(v.values()) for v in s.values()}) == len(s)


def test_game_state_transitions_and_pause(repo):
    app = GameApp(repo, seed=3)
    step = lambda inp=None, n=1: [app.step(inp or I(), 1 / 30) for _ in range(n)]
    assert app.state == "menu"
    step(I(down=True)); assert app.menu_index == 1
    step(I(up=True)); step(I(confirm=True)); assert app.state == "name"
    for ch in "Sara":
        step(I(text=ch))
    step(I(confirm=True)); assert app.state == "briefing" and app.session.player_name == "Sara"
    step(I(confirm=True)); assert app.state == "intro"
    step(I(confirm=True)); assert app.state == "play" and app.level.level_id == 1
    step(n=30)
    step(I(pause=True)); assert app.state == "paused"
    t = app.session.clock.ms
    step(n=60); assert app.session.clock.ms == t                         # clock frozen while paused
    step(I(pause=True)); assert app.state == "play"
    step(n=5)
    app.abandon()
    sessions = repo.list_sessions()
    assert sessions[0]["status"] == "abandoned"
    counts = repo.event_type_counts(sessions[0]["session_id"])
    assert counts["GAME_PAUSED"] == counts["GAME_RESUMED"] == 1 and counts["SESSION_END"] == 1


def test_retry_after_failure_is_logged(repo):
    """Fail level 2 on purpose (deliver too little), then retry."""
    app = GameApp(repo, seed=4)
    app.new_session("Retry")
    app.level_idx = 1
    app.begin_level()
    lvl = app.level
    lvl.built, lvl.reward_total = ["banner"], 15
    lvl.player.teleport(965, 375)
    app.step(I(interact=True), 1 / 30)
    assert app.state == "outcome" and lvl.fail_reason == "quota_missed"
    assert app._outcome_options() == ["Try again", "Move on to the next level"]
    app.step(I(number=1), 1 / 30)
    assert app.state == "play" and app.attempt == 2
    app.session.logger.flush()
    counts = repo.event_type_counts(app.session.session_id)
    assert counts["LEVEL_FAILED"] == 1 and counts["RETRY"] == 1 and counts["LEVEL_START"] == 2


def test_report_export(runs, tmp_path, monkeypatch):
    import json
    import game.app as game_app
    monkeypatch.setattr(game_app, "REPORT_DIR", tmp_path)
    app = runs[1]["explorer"]
    path = app.export_report()
    data = json.loads(path.read_text())
    assert data["is_validated"] is False and "scores" in data["result"]
