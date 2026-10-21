"""Repository: the only place that contains SQL.

Both the game (writing telemetry) and the Flask backend (reading for the dashboard,
ingesting from remote clients) go through this class.
"""
from __future__ import annotations

import json
import uuid
from contextlib import closing
from datetime import datetime
from typing import Any, Iterable, Optional

from backend.database.db import connect, init_db, resolve_db_path

TRAITS = ("openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism")


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


class Repository:
    def __init__(self, db_path=None, auto_init: bool = True):
        self.db_path = resolve_db_path(db_path)
        if auto_init:
            init_db(self.db_path)

    # ------------------------------------------------------------------ helpers
    def _conn(self):
        return closing(connect(self.db_path))

    @staticmethod
    def _row(row) -> Optional[dict]:
        return dict(row) if row is not None else None

    # ------------------------------------------------------------------ players
    def create_player(self, name: str, is_demo: bool = False) -> int:
        name = (name or "").strip() or "Anonymous"
        with self._conn() as c:
            cur = c.execute(
                "INSERT INTO players (name, created_at, is_demo) VALUES (?, ?, ?)",
                (name[:40], _now_iso(), 1 if is_demo else 0),
            )
            c.commit()
            return int(cur.lastrowid)

    def get_player(self, player_id: int) -> Optional[dict]:
        with self._conn() as c:
            return self._row(c.execute("SELECT * FROM players WHERE player_id = ?", (player_id,)).fetchone())

    def list_players(self) -> list[dict]:
        sql = """
            SELECT p.*,
                   COUNT(s.session_id)                                  AS n_sessions,
                   SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS n_completed
            FROM players p LEFT JOIN sessions s ON s.player_id = p.player_id
            GROUP BY p.player_id ORDER BY p.player_id DESC
        """
        with self._conn() as c:
            return [dict(r) for r in c.execute(sql).fetchall()]

    # ----------------------------------------------------------------- sessions
    def create_session(self, player_id: int, seed: int | None = None, game_version: str = "0.1.0",
                       session_id: str | None = None, started_at: str | None = None) -> str:
        sid = session_id or f"S{datetime.now():%Y%m%d-%H%M%S}-{uuid.uuid4().hex[:4]}"
        with self._conn() as c:
            c.execute(
                "INSERT INTO sessions (session_id, player_id, started_at, status, game_version, seed) "
                "VALUES (?, ?, ?, 'in_progress', ?, ?)",
                (sid, player_id, started_at or _now_iso(), game_version, seed),
            )
            c.commit()
        return sid

    def end_session(self, session_id: str, status: str, duration_ms: int | None = None,
                    ended_at: str | None = None) -> None:
        if status not in ("completed", "abandoned", "in_progress"):
            raise ValueError(f"invalid session status {status!r}")
        with self._conn() as c:
            c.execute(
                "UPDATE sessions SET status = ?, ended_at = ?, duration_ms = ? WHERE session_id = ?",
                (status, ended_at or _now_iso(), duration_ms, session_id),
            )
            c.commit()

    def get_session(self, session_id: str) -> Optional[dict]:
        sql = """SELECT s.*, p.name AS player_name, p.is_demo AS is_demo
                 FROM sessions s JOIN players p ON p.player_id = s.player_id WHERE s.session_id = ?"""
        with self._conn() as c:
            return self._row(c.execute(sql, (session_id,)).fetchone())

    def list_sessions(self, player_id: int | None = None, status: str | None = None,
                      limit: int | None = None) -> list[dict]:
        sql = """SELECT s.*, p.name AS player_name, p.is_demo AS is_demo,
                        (SELECT COUNT(*) FROM game_events e WHERE e.session_id = s.session_id) AS n_events,
                        (SELECT 1 FROM personality_results r WHERE r.session_id = s.session_id) AS has_result
                 FROM sessions s JOIN players p ON p.player_id = s.player_id WHERE 1=1"""
        params: list[Any] = []
        if player_id is not None:
            sql += " AND s.player_id = ?"
            params.append(player_id)
        if status:
            sql += " AND s.status = ?"
            params.append(status)
        sql += " ORDER BY s.started_at DESC, s.session_id DESC"
        if limit:
            sql += " LIMIT ?"
            params.append(limit)
        with self._conn() as c:
            return [dict(r) for r in c.execute(sql, params).fetchall()]

    # ------------------------------------------------------------------- events
    def insert_events(self, session_id: str, player_id: int, events: Iterable[dict]) -> int:
        rows = []
        for e in events:
            rows.append((
                session_id, player_id, e.get("level_id"), e["timestamp"], int(e["t_ms"]),
                e["event_type"], e.get("action"), e.get("decision_time_ms"), e.get("risk_level"),
                json.dumps(e.get("metadata") or {}, separators=(",", ":"), default=str),
            ))
        if not rows:
            return 0
        with self._conn() as c:
            c.executemany(
                "INSERT INTO game_events (session_id, player_id, level_id, timestamp, t_ms, event_type, "
                "action, decision_time_ms, risk_level, metadata) VALUES (?,?,?,?,?,?,?,?,?,?)", rows)
            c.commit()
        return len(rows)

    def get_events(self, session_id: str, event_types: list[str] | None = None, level_id: int | None = None,
                   limit: int | None = None, offset: int = 0) -> list[dict]:
        sql = "SELECT * FROM game_events WHERE session_id = ?"
        params: list[Any] = [session_id]
        if event_types:
            sql += f" AND event_type IN ({','.join('?' * len(event_types))})"
            params += list(event_types)
        if level_id is not None:
            sql += " AND level_id = ?"
            params.append(level_id)
        sql += " ORDER BY t_ms, event_id"
        if limit is not None:
            sql += " LIMIT ? OFFSET ?"
            params += [limit, offset]
        with self._conn() as c:
            rows = c.execute(sql, params).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            try:
                d["metadata"] = json.loads(d.get("metadata") or "{}")
            except json.JSONDecodeError:
                d["metadata"] = {}
            out.append(d)
        return out

    def count_events(self, session_id: str | None = None) -> int:
        with self._conn() as c:
            if session_id:
                row = c.execute("SELECT COUNT(*) AS n FROM game_events WHERE session_id = ?", (session_id,)).fetchone()
            else:
                row = c.execute("SELECT COUNT(*) AS n FROM game_events").fetchone()
        return int(row["n"])

    def event_type_counts(self, session_id: str | None = None) -> dict[str, int]:
        sql = "SELECT event_type, COUNT(*) AS n FROM game_events"
        params: tuple = ()
        if session_id:
            sql += " WHERE session_id = ?"
            params = (session_id,)
        sql += " GROUP BY event_type ORDER BY n DESC"
        with self._conn() as c:
            return {r["event_type"]: int(r["n"]) for r in c.execute(sql, params).fetchall()}

    # ----------------------------------------------------------------- features
    def replace_features(self, session_id: str, player_id: int, features: dict[str, tuple[str, float]]) -> int:
        """features: {name: (group, value)}"""
        now = _now_iso()
        rows = [(session_id, player_id, name, grp, float(val), now) for name, (grp, val) in features.items()]
        with self._conn() as c:
            c.execute("DELETE FROM behavioral_features WHERE session_id = ?", (session_id,))
            c.executemany(
                "INSERT INTO behavioral_features (session_id, player_id, feature_name, feature_group, "
                "feature_value, computed_at) VALUES (?,?,?,?,?,?)", rows)
            c.commit()
        return len(rows)

    def get_features(self, session_id: str) -> list[dict]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT feature_name, feature_group, feature_value, computed_at FROM behavioral_features "
                "WHERE session_id = ? ORDER BY feature_group, feature_name", (session_id,)).fetchall()
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------ results
    def save_result(self, session_id: str, player_id: int, result: dict) -> None:
        scores = result["scores"]
        with self._conn() as c:
            c.execute("DELETE FROM personality_results WHERE session_id = ?", (session_id,))
            c.execute(
                "INSERT INTO personality_results (session_id, player_id, openness, conscientiousness, "
                "extraversion, agreeableness, neuroticism, labels_json, coverage_json, evidence_json, "
                "model_name, model_version, is_validated, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (session_id, player_id, *[float(scores[t]) for t in TRAITS],
                 json.dumps(result["labels"]), json.dumps(result.get("coverage", {})),
                 json.dumps(result.get("evidence", {})), result["model_name"], result["model_version"],
                 1 if result.get("is_validated") else 0, _now_iso()))
            c.commit()

    def get_result(self, session_id: str) -> Optional[dict]:
        with self._conn() as c:
            row = c.execute("SELECT * FROM personality_results WHERE session_id = ?", (session_id,)).fetchone()
        if row is None:
            return None
        d = dict(row)
        return {
            "session_id": d["session_id"], "player_id": d["player_id"],
            "scores": {t: d[t] for t in TRAITS},
            "labels": json.loads(d["labels_json"]), "coverage": json.loads(d["coverage_json"]),
            "evidence": json.loads(d["evidence_json"]),
            "model_name": d["model_name"], "model_version": d["model_version"],
            "is_validated": bool(d["is_validated"]), "created_at": d["created_at"],
        }

    def latest_result_session(self, player_id: int) -> Optional[str]:
        with self._conn() as c:
            row = c.execute("SELECT session_id FROM personality_results WHERE player_id = ? "
                            "ORDER BY created_at DESC, result_id DESC LIMIT 1", (player_id,)).fetchone()
        return row["session_id"] if row else None

    # -------------------------------------------------------------------- stats
    def overview_stats(self, include_demo: bool = True) -> dict:
        demo_clause = "" if include_demo else " AND p.is_demo = 0"
        with self._conn() as c:
            n_players = c.execute(
                f"SELECT COUNT(*) AS n FROM players p WHERE 1=1{demo_clause}").fetchone()["n"]
            row = c.execute(
                f"""SELECT COUNT(*) AS n_sessions,
                           SUM(CASE WHEN s.status='completed' THEN 1 ELSE 0 END) AS n_completed,
                           SUM(CASE WHEN s.status='abandoned' THEN 1 ELSE 0 END) AS n_abandoned,
                           AVG(CASE WHEN s.status='completed' THEN s.duration_ms END) AS avg_duration_ms
                    FROM sessions s JOIN players p ON p.player_id = s.player_id WHERE 1=1{demo_clause}""").fetchone()
            n_events = c.execute(
                f"""SELECT COUNT(*) AS n FROM game_events e JOIN players p ON p.player_id = e.player_id
                    WHERE 1=1{demo_clause}""").fetchone()["n"]
            avg = c.execute(
                f"""SELECT AVG(r.openness) o, AVG(r.conscientiousness) c, AVG(r.extraversion) e,
                           AVG(r.agreeableness) a, AVG(r.neuroticism) n
                    FROM personality_results r JOIN players p ON p.player_id = r.player_id
                    WHERE 1=1{demo_clause}""").fetchone()
        avg_scores = None
        if avg["o"] is not None:
            avg_scores = dict(zip(TRAITS, [avg["o"], avg["c"], avg["e"], avg["a"], avg["n"]]))
        return {
            "players": int(n_players),
            "sessions": int(row["n_sessions"] or 0),
            "completed_assessments": int(row["n_completed"] or 0),
            "abandoned_sessions": int(row["n_abandoned"] or 0),
            "avg_session_duration_ms": float(row["avg_duration_ms"]) if row["avg_duration_ms"] is not None else None,
            "total_events": int(n_events),
            "average_scores": avg_scores,
        }

    def delete_session(self, session_id: str) -> None:
        with self._conn() as c:
            c.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            c.commit()

    def list_levels(self) -> list[dict]:
        with self._conn() as c:
            return [dict(r) for r in c.execute("SELECT * FROM levels ORDER BY level_id").fetchall()]
