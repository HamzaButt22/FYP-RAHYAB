"""Aggregations over raw telemetry used by the dashboard charts (all computed from real stored events)."""
from __future__ import annotations

from collections import Counter, defaultdict

from analytics.cleaning import clean_events
from analytics.event_schema import EventType as E

LEVEL_NAMES = {1: "Whispering Valley", 2: "Workshop", 3: "Harbor Village", 4: "Crumbling Vault"}


def session_telemetry(repo, session_id: str) -> dict:
    rows = repo.get_events(session_id)
    df, report = clean_events(rows)
    if df.empty:
        return {"event_counts": {}, "decision_times": [], "exploration": {}, "risk": {}, "social": {}, "levels": [],
                "cleaning": report}

    counts = df["event_type"].value_counts().to_dict()

    # ---- decisions
    resp = df[df["event_type"] == E.DECISION_RESPONSE]
    decisions = []
    for r in resp.itertuples():
        m = r.meta
        decisions.append({"t_s": round(r.t_ms / 1000, 1), "level": None if r.level_id != r.level_id else int(r.level_id),
                          "decision_time_ms": None if r.decision_time_ms != r.decision_time_ms else round(r.decision_time_ms),
                          "category": m.get("category"), "kind": m.get("chosen_kind"), "action": r.action,
                          "changes": m.get("selection_changes", 0)})
    by_level_dt: dict[str, list] = defaultdict(list)
    for d in decisions:
        if d["decision_time_ms"] is not None and d["level"]:
            by_level_dt[str(d["level"])].append(d["decision_time_ms"])
    avg_dt_by_level = {k: round(sum(v) / len(v)) for k, v in by_level_dt.items()}

    # ---- exploration
    l1 = df[df["level_id"] == 1]
    zones: dict[str, dict] = {}
    for r in l1[l1["event_type"] == E.EXPLORATION].itertuples():
        m = r.meta
        if r.action == "enter_optional_area":
            z = zones.setdefault(m.get("zone_id"), {"name": m.get("zone_name") or m.get("zone_id"), "visits": 0, "dwell_ms": 0})
            z["visits"] += 1
        elif r.action == "leave_area" and m.get("zone_id") in zones:
            zones[m["zone_id"]]["dwell_ms"] += int(m.get("dwell_ms", 0))
    heat = [[0] * 11 for _ in range(7)]
    for r in l1[l1["event_type"] == E.PLAYER_MOVE].itertuples():
        for c in r.meta.get("cells", []):
            cx, cy = int(c[0]), int(c[1])
            if 0 <= cy < 7 and 0 <= cx < 11:
                heat[cy][cx] += 1
    novel = [r.meta.get("object_id") for r in l1[l1["event_type"] == E.PLAYER_INTERACTION].itertuples() if r.meta.get("novel")]
    exploration = {"zones": zones, "heatmap": heat, "novel_objects": novel}

    # ---- risk
    risk_resp = [d for d in decisions if d["category"] in ("risk", "reward", "pressure")]
    kinds = Counter(d["kind"] for d in risk_resp)
    risk_actions = [{"t_s": round(r.t_ms / 1000, 1), "action": r.action, "risk_level": r.risk_level,
                     "success": r.meta.get("success")} for r in df[df["event_type"] == E.RISK_ACTION].itertuples()]
    risk = {"choices_by_kind": dict(kinds), "risk_actions": risk_actions,
            "failures": [{"t_s": round(r.t_ms / 1000, 1), "action": r.action, "level": None if r.level_id != r.level_id else int(r.level_id)}
                         for r in df[df["event_type"] == E.FAILURE].itertuples()],
            "rechecks": int(((df["event_type"] == E.PLAYER_INTERACTION) & (df["action"] == "recheck")).sum()),
            "scans": int(((df["event_type"] == E.PLAYER_INTERACTION) & (df["action"].isin(["scan", "recheck"]))).sum())}

    # ---- social
    enc: dict[str, dict] = {}
    for r in df[df["event_type"] == E.NPC_INTERACTION].itertuples():
        eid = r.meta.get("encounter_id")
        e = enc.setdefault(eid, {"npc": r.meta.get("npc"), "initiated_by": None, "outcome": "talked", "turns": 0})
        if r.action == "initiated_by_player":
            e["initiated_by"] = "player"
        elif r.action == "initiated_by_npc":
            e["initiated_by"] = "npc"
        elif r.action == "dialogue_turn":
            e["turns"] += 1
        elif r.action == "ignored":
            e["outcome"] = "ignored"
    for etype, label in ((E.HELP_ACTION, "helped"), (E.SHARE_ACTION, "shared"), (E.COOPERATION_ACTION, "cooperated"),
                         (E.COMPETITION_ACTION, "competed")):
        for r in df[df["event_type"] == etype].itertuples():
            if r.meta.get("encounter_id") in enc:
                enc[r.meta["encounter_id"]]["outcome"] = label
    social = {"encounters": list(enc.values()),
              "counts": {"help": int((df["event_type"] == E.HELP_ACTION).sum()),
                         "share": int((df["event_type"] == E.SHARE_ACTION).sum()),
                         "cooperate": int((df["event_type"] == E.COOPERATION_ACTION).sum()),
                         "compete": int((df["event_type"] == E.COMPETITION_ACTION).sum())}}

    # ---- levels timeline
    from analytics.feature_engineering import level_attempt_spans
    levels = [{**s, "name": LEVEL_NAMES.get(s["level_id"]), "duration_s": round((s["end_ms"] - s["start_ms"]) / 1000, 1)}
              for s in level_attempt_spans(df)]
    return {"event_counts": counts, "decision_times": decisions, "avg_decision_time_by_level_ms": avg_dt_by_level,
            "exploration": exploration, "risk": risk, "social": social, "levels": levels, "cleaning": report}


def global_telemetry(repo, include_demo: bool = True) -> dict:
    """Event counts and score distributions across all sessions."""
    import sqlite3
    from backend.database.db import connect
    from contextlib import closing
    demo = "" if include_demo else " WHERE p.is_demo = 0"
    with closing(connect(repo.db_path)) as c:
        ev = c.execute(f"SELECT e.event_type, COUNT(*) n FROM game_events e JOIN players p ON p.player_id=e.player_id{demo} "
                       "GROUP BY e.event_type ORDER BY n DESC").fetchall()
        res = c.execute(f"SELECT r.* FROM personality_results r JOIN players p ON p.player_id=r.player_id{demo}").fetchall()
        dt = c.execute(f"SELECT e.level_id, AVG(e.decision_time_ms) a, COUNT(*) n FROM game_events e JOIN players p ON p.player_id=e.player_id "
                       f"WHERE e.event_type='DECISION_RESPONSE' AND e.decision_time_ms IS NOT NULL{' AND p.is_demo=0' if not include_demo else ''} "
                       "GROUP BY e.level_id ORDER BY e.level_id").fetchall()
    traits = ("openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism")
    dist = {t: [round(r[t], 1) for r in res] for t in traits}
    return {"event_counts": {r["event_type"]: r["n"] for r in ev}, "score_distribution": dist,
            "avg_decision_time_by_level_ms": {str(r["level_id"]): round(r["a"]) for r in dt if r["level_id"]}}
