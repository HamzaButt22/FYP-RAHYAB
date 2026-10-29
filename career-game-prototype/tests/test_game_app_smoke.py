import math
import os

import pytest

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
pygame = pytest.importorskip("pygame")

from engine.game_app import PowerSectorApp
from engine.power_grid import ROTATION_EVENT, START_EVENT, grid_to_screen, rotate_cw
from engine.stream_transformation_engine import FEATURE_ORDER, STREAMS


def tile_centre(app, gx, gy):
    sx, sy = grid_to_screen(gx + 0.5, gy + 0.5, app.tile_w, app.tile_h, app.offset_x, app.offset_y)
    return int(sx), int(sy)


def test_clicks_rotate_tiles_record_telemetry_and_score_on_quit(capsys):
    app = PowerSectorApp(seed=3)
    before = app.grid.tiles[2][1]

    pygame.event.post(pygame.event.Event(pygame.MOUSEBUTTONDOWN, pos=tile_centre(app, 2, 1), button=1))
    pygame.event.post(pygame.event.Event(pygame.MOUSEBUTTONDOWN, pos=(5, 5), button=1))
    pygame.event.post(pygame.event.Event(pygame.QUIT))
    result = app.run()

    assert app.grid.tiles[2][1] == rotate_cw(before)
    types = [e["event_type"] for e in app.events]
    assert types[0] == START_EVENT
    assert types.count(ROTATION_EVENT) == 1
    assert len(types) == 3  # start + rotation + off-grid click: every click is recorded

    rot = next(e for e in app.events if e["event_type"] == ROTATION_EVENT)
    assert (rot["data"]["grid_x"], rot["data"]["grid_y"]) == (2, 1)
    assert rot["monotonic_ms"] >= 0

    assert list(result["profile"]) == FEATURE_ORDER
    assert list(result["probabilities"]) == STREAMS
    assert math.isclose(sum(result["probabilities"].values()), 1.0)
    assert "Pre-Medical" in capsys.readouterr().out


MEASURED = {"median_inter_input_ms": 380.0, "samples": 7, "input_type": "mouse", "measured": True}


def make_log_config(tmp_path, pid="P001"):
    from engine.session_log import SessionLogConfig
    return SessionLogConfig(pid, True, "PCF-1.0", tmp_path / "logs", tmp_path / "fallback")


def test_consented_session_is_streamed_and_rescores_identically(tmp_path):
    from engine.session_log import load_session, recompute

    app = PowerSectorApp(seed=3, log_config=make_log_config(tmp_path), calibration=MEASURED)
    record = load_session(app.logger.path)
    assert [e["event_type"] for e in record["events"]] == [START_EVENT]   # on disk before play
    assert record["complete"] is False

    pygame.event.post(pygame.event.Event(pygame.MOUSEBUTTONDOWN, pos=tile_centre(app, 2, 1), button=1))
    pygame.event.post(pygame.event.Event(pygame.QUIT))
    result = app.run()

    [path] = (tmp_path / "logs" / "P001").glob("power_sector_*.jsonl")
    assert result["log_path"] == path
    record = load_session(path)
    assert record["complete"] is True and len(record["events"]) == 2
    assert record["calibration_baseline"] == MEASURED
    assert recompute(record)["profile"] == result["profile"]


def test_logged_session_refuses_placeholder_calibration(tmp_path):
    with pytest.raises(ValueError):
        PowerSectorApp(seed=3, log_config=make_log_config(tmp_path))
    with pytest.raises(ValueError):
        PowerSectorApp(seed=3, log_config=make_log_config(tmp_path), calibration={"measured": False})


def test_unlogged_session_writes_nothing_and_flags_placeholder(tmp_path):
    app = PowerSectorApp(seed=3)
    assert app.session.calibration_baseline["measured"] is False
    pygame.event.post(pygame.event.Event(pygame.QUIT))
    assert app.run()["log_path"] is None
    assert not list(tmp_path.iterdir())


def test_calibration_screen_measures_taps_and_quits_cleanly():
    from engine.calibration import REQUIRED_INTERVALS
    from engine.calibration_app import CalibrationScreen

    screen = pygame.display.set_mode((1024, 768))
    cal = CalibrationScreen(screen, pygame.time.Clock())
    ms = 0.0
    while not cal.round.done:
        assert cal.handle_click(tuple(int(c) for c in cal.round.target), ms, "touch")
        ms += 450.0
    cal.render()
    assert cal.run()["median_inter_input_ms"] == 450.0

    fresh = CalibrationScreen(screen, pygame.time.Clock())
    pygame.event.post(pygame.event.Event(pygame.QUIT))
    assert fresh.run() is None
