"""JSON REST API (used by the dashboard, and usable by remote game clients)."""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from analytics.pipeline import analyse_events, process_session
from backend.services import assessment_service as svc
from backend.services.telemetry_service import global_telemetry, session_telemetry

bp = Blueprint("api", __name__, url_prefix="/api")


def repo():
    return current_app.config["REPO"]


def err(msg, code=400):
    return jsonify({"error": msg}), code


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "db": str(repo().db_path)})


@bp.get("/overview")
def overview():
    demo = request.args.get("include_demo", "1") != "0"
    stats = repo().overview_stats(include_demo=demo)
    return jsonify(stats)


# ------------------------------------------------------------------- players
@bp.get("/players")
def players():
    return jsonify(repo().list_players())


@bp.post("/players")
def create_player():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return err("'name' is required")
    pid = repo().create_player(name, is_demo=bool(data.get("is_demo")))
    return jsonify(repo().get_player(pid)), 201


@bp.get("/players/<int:player_id>")
def player_detail(player_id):
    p = repo().get_player(player_id)
    if p is None:
        return err("player not found", 404)
    sessions = repo().list_sessions(player_id=player_id)
    return jsonify({"player": p, "sessions": sessions})


# ------------------------------------------------------------------ sessions
@bp.get("/sessions")
def sessions():
    return jsonify(repo().list_sessions(status=request.args.get("status"), limit=request.args.get("limit", type=int)))


@bp.post("/sessions")
def create_session():
    data = request.get_json(silent=True) or {}
    pid = data.get("player_id")
    if pid is None or repo().get_player(int(pid)) is None:
        return err("valid 'player_id' is required")
    sid = repo().create_session(int(pid), seed=data.get("seed"), game_version=data.get("game_version", "api"))
    return jsonify(repo().get_session(sid)), 201


@bp.get("/sessions/<sid>")
def session_detail(sid):
    s = repo().get_session(sid)
    if s is None:
        return err("session not found", 404)
    s["n_events"] = repo().count_events(sid)
    return jsonify(s)


@bp.post("/sessions/<sid>/events")
def post_events(sid):
    data = request.get_json(silent=True) or {}
    events = data.get("events")
    if not isinstance(events, list) or not events:
        return err("'events' must be a non-empty list")
    try:
        n = svc.ingest_events(repo(), sid, events)
    except KeyError as e:
        return err(str(e), 404)
    except svc.ValidationError as e:
        return err(str(e), 422)
    return jsonify({"inserted": n}), 201


@bp.get("/sessions/<sid>/events")
def get_events(sid):
    if repo().get_session(sid) is None:
        return err("session not found", 404)
    types = request.args.getlist("type") or None
    limit = request.args.get("limit", default=500, type=int)
    offset = request.args.get("offset", default=0, type=int)
    level = request.args.get("level", type=int)
    return jsonify({"total": repo().count_events(sid), "events": repo().get_events(sid, types, level, limit, offset)})


@bp.post("/sessions/<sid>/complete")
def complete(sid):
    try:
        out = svc.complete_session(repo(), sid, (request.get_json(silent=True) or {}).get("duration_ms"))
    except KeyError as e:
        return err(str(e), 404)
    except ValueError as e:
        return err(str(e), 422)
    return jsonify({"session_id": sid, "result": out.result_dict(), "summary": out.summary})


@bp.post("/sessions/<sid>/reprocess")
def reprocess(sid):
    try:
        out = process_session(repo(), sid)
    except KeyError as e:
        return err(str(e), 404)
    except ValueError as e:
        return err(str(e), 422)
    return jsonify({"result": out.result_dict()})


@bp.get("/sessions/<sid>/features")
def features(sid):
    if repo().get_session(sid) is None:
        return err("session not found", 404)
    return jsonify(repo().get_features(sid))


@bp.get("/sessions/<sid>/result")
def result(sid):
    r = repo().get_result(sid)
    if r is None:
        return err("no result for this session yet", 404)
    return jsonify(r)


@bp.get("/sessions/<sid>/telemetry")
def telemetry(sid):
    if repo().get_session(sid) is None:
        return err("session not found", 404)
    return jsonify(session_telemetry(repo(), sid))


@bp.get("/telemetry/overview")
def telemetry_overview():
    return jsonify(global_telemetry(repo(), include_demo=request.args.get("include_demo", "1") != "0"))
