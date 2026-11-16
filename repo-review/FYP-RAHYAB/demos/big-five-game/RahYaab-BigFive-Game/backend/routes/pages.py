"""Server-rendered dashboard pages (data is loaded by the page JS from the JSON API)."""
from __future__ import annotations

from flask import Blueprint, abort, current_app, render_template, request

bp = Blueprint("pages", __name__)


def repo():
    return current_app.config["REPO"]


@bp.get("/")
def index():
    return render_template("index.html", page="dashboard")


@bp.get("/players/<int:player_id>")
def player(player_id):
    p = repo().get_player(player_id)
    if p is None:
        abort(404)
    sessions = repo().list_sessions(player_id=player_id)
    sid = request.args.get("session") or (sessions[0]["session_id"] if sessions else None)
    return render_template("player.html", page="players", player=p, sessions=sessions, sid=sid)


@bp.get("/telemetry")
def telemetry():
    sid = request.args.get("session")
    sessions = repo().list_sessions(limit=200)
    if sid is None and sessions:
        sid = sessions[0]["session_id"]
    return render_template("telemetry.html", page="telemetry", sessions=sessions, sid=sid)


@bp.get("/sessions/<sid>/events")
def events(sid):
    s = repo().get_session(sid)
    if s is None:
        abort(404)
    return render_template("events.html", page="telemetry", session=s)
