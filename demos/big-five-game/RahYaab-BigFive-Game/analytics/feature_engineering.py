"""Step 2: clean telemetry -> behavioural feature vector.

Every feature is a documented formula over real events (no randomness anywhere).
A feature is simply *omitted* when the player never had the opportunity to show the
behaviour (e.g. no failures -> no failure_recovery_rate); the scoring engine
re-normalises over the features that are present and reports the coverage.

Feature units: rates are 0..1 fractions, *_time / *_time_s are seconds.
"""
from __future__ import annotations

import math
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np
import pandas as pd

from analytics import constants as C
from analytics.event_schema import (CAT_COOPERATION, CAT_HELP, CAT_PRESSURE, CAT_REWARD, CAT_RISK, CAT_SHARE,
                                    KIND_CHECK, KIND_NOVEL, KIND_RISKY, KIND_SAFE, PLAYER_ACTION_TYPES,
                                    EventType as E)

RISK_CATEGORIES = {CAT_RISK, CAT_REWARD, CAT_PRESSURE}

FEATURE_GROUPS = {
    # exploration / novelty
    "exploration_rate": "exploration", "route_diversity": "exploration", "novel_action_rate": "exploration",
    "exploration_time_ratio": "exploration", "strategy_diversity": "exploration", "novel_choice_rate": "exploration",
    # planning / diligence
    "planning_time": "planning", "completion_rate": "planning", "error_rate": "planning",
    "retry_rate": "planning", "resource_efficiency": "planning", "strategy_consistency": "planning",
    "task_persistence": "planning", "persistence_rate": "planning", "failure_recovery_rate": "planning",
    "strategy_change_rate": "planning",
    # social
    "social_interaction_rate": "social", "interaction_initiation_rate": "social",
    "social_engagement_depth": "social", "helping_rate": "social", "cooperation_rate": "social",
    "competition_rate": "social", "sharing_rate": "social",
    # risk / pressure
    "risk_taking_rate": "pressure", "risk_avoidance_rate": "pressure", "pressure_latency_ratio": "pressure",
    "decision_change_rate": "pressure", "repeated_checking_rate": "pressure",
    "mean_recovery_time_s": "pressure", "erratic_movement_rate": "pressure", "post_event_reaction_s": "pressure",
    # decision timing
    "average_decision_time": "decision", "decision_time_variance": "decision", "decision_time_cv": "decision",
}


@dataclass
class FeatureSet:
    features: dict[str, float] = field(default_factory=dict)
    counts: dict[str, float] = field(default_factory=dict)          # raw counts used as evidence
    notes: dict[str, Any] = field(default_factory=dict)             # non numeric evidence (strategy names ...)

    def group_of(self, name: str) -> str:
        return FEATURE_GROUPS.get(name, "raw")

    def as_db_rows(self) -> dict[str, tuple[str, float]]:
        rows = {k: (self.group_of(k), float(v)) for k, v in self.features.items()}
        rows.update({f"n_{k}": ("raw", float(v)) for k, v in self.counts.items()})
        return rows


# ---------------------------------------------------------------------------- helpers
def _ok(x) -> bool:
    return x is not None and not (isinstance(x, float) and math.isnan(x))


def _div(a: float, b: float) -> Optional[float]:
    return None if not b else a / b


def _where_meta(df: pd.DataFrame, pred) -> pd.DataFrame:
    """Rows whose metadata dict satisfies `pred` (safe for empty frames, unlike df[[...]] with a list)."""
    if df.empty:
        return df
    return df[df["meta"].map(pred).astype(bool)]


def _level_events(df: pd.DataFrame, level_id: int) -> pd.DataFrame:
    return df[df["level_id"] == level_id]


def _level_total(df: pd.DataFrame, level_id: int, key: str, default):
    starts = df[(df["event_type"] == E.LEVEL_START) & (df["level_id"] == level_id)]
    for m in starts["meta"]:
        if key in m and _ok(m[key]):
            return m[key]
    return default


def _level_started(df: pd.DataFrame, level_id: int) -> bool:
    return bool(((df["event_type"] == E.LEVEL_START) & (df["level_id"] == level_id)).any())


def level_attempt_spans(df: pd.DataFrame) -> list[dict]:
    """Return [{level_id, start_ms, end_ms, outcome}] for every attempt (LEVEL_START ... end)."""
    spans = []
    starts = df[df["event_type"] == E.LEVEL_START]
    ends = df[df["event_type"].isin([E.LEVEL_COMPLETE, E.LEVEL_FAILED])]
    for _, s in starts.iterrows():
        lid = s["level_id"]
        nxt_starts = starts[(starts["level_id"] == lid) & (starts["t_ms"] > s["t_ms"])]["t_ms"]
        limit = nxt_starts.min() if len(nxt_starts) else float("inf")
        e = ends[(ends["level_id"] == lid) & (ends["t_ms"] >= s["t_ms"]) & (ends["t_ms"] <= limit)]
        if len(e):
            row = e.iloc[0]
            spans.append({"level_id": int(lid), "start_ms": int(s["t_ms"]), "end_ms": int(row["t_ms"]),
                          "outcome": "complete" if row["event_type"] == E.LEVEL_COMPLETE else "failed"})
        else:
            lvl = df[(df["level_id"] == lid) & (df["t_ms"] >= s["t_ms"]) & (df["t_ms"] <= limit)]
            end = int(lvl["t_ms"].max()) if len(lvl) else int(s["t_ms"])
            spans.append({"level_id": int(lid), "start_ms": int(s["t_ms"]), "end_ms": end, "outcome": "unfinished"})
    return spans


# ---------------------------------------------------------------------------- main
def extract_features(df: pd.DataFrame) -> FeatureSet:
    fs = FeatureSet()
    f, n, notes = fs.features, fs.counts, fs.notes

    def put(name: str, value: Optional[float]) -> None:
        if value is not None and _ok(value):
            f[name] = float(value)

    if df.empty:
        return fs

    responses = df[df["event_type"] == E.DECISION_RESPONSE]
    decisions = df[df["event_type"] == E.DECISION]
    n["decisions_made"] = len(responses)

    # ------------------------------------------------------------ exploration (level 1)
    if _level_started(df, C.LEVEL_EXPLORATION):
        l1 = _level_events(df, C.LEVEL_EXPLORATION)
        total_areas = float(_level_total(df, 1, "optional_areas_total", C.OPTIONAL_AREAS_TOTAL))
        explo = l1[l1["event_type"] == E.EXPLORATION]
        visited = {m.get("zone_id") for a, m in zip(explo["action"], explo["meta"])
                   if a == "enter_optional_area" and m.get("zone_id")}
        n["optional_areas_visited"], n["optional_areas_total"] = len(visited), total_areas
        put("exploration_rate", min(1.0, len(visited) / total_areas))
        notes["areas_visited"] = sorted(visited)

        cells: set[tuple[int, int]] = set()
        for m in l1[l1["event_type"] == E.PLAYER_MOVE]["meta"]:
            for c in m.get("cells", []):
                cells.add((int(c[0]), int(c[1])))
        total_cells = float(_level_total(df, 1, "grid_cells_total", C.GRID_TOTAL_CELLS))
        n["grid_cells_visited"], n["grid_cells_total"] = len(cells), total_cells
        put("route_diversity", min(1.0, len(cells) / total_cells))

        inter = l1[l1["event_type"] == E.PLAYER_INTERACTION]
        novel_ids = {m.get("object_id") for m in inter["meta"] if m.get("novel") and m.get("object_id")}
        total_novel = float(_level_total(df, 1, "novel_objects_total", C.NOVEL_OBJECTS_TOTAL))
        n["novel_interactions"], n["novel_objects_total"] = len(novel_ids), total_novel
        put("novel_action_rate", min(1.0, len(novel_ids) / total_novel))

        dwell_ms = sum(float(m.get("dwell_ms", 0)) for a, m in zip(explo["action"], explo["meta"])
                       if a == "leave_area" and m.get("optional"))
        l1_ms = sum(s["end_ms"] - s["start_ms"] for s in level_attempt_spans(df) if s["level_id"] == 1)
        n["optional_dwell_ms"] = dwell_ms
        put("exploration_time_ratio", _div(dwell_ms, l1_ms) if l1_ms else None)
        if f.get("exploration_time_ratio") is not None:
            f["exploration_time_ratio"] = min(1.0, f["exploration_time_ratio"])

    # ---------------------------------------------------------- strategies (levels 2 & 4)
    strat = df[df["event_type"] == E.STRATEGY_CHANGE]
    labels = [m.get("to_strategy") for m in strat["meta"] if m.get("to_strategy")]
    distinct = sorted({s for s in labels if s != "other"})
    n["distinct_strategies"] = len(distinct)
    notes["strategies"] = distinct
    if _level_started(df, C.LEVEL_PLANNING) or _level_started(df, C.LEVEL_PRESSURE) or len(strat):
        put("strategy_diversity", min(1.0, len(distinct) / C.STRATEGY_DIVERSITY_REF))
    changes = sum(1 for m in strat["meta"] if m.get("is_change"))
    n["strategy_changes"] = changes
    put("strategy_change_rate", min(1.0, changes / len(responses)) if len(responses) else None)

    reward_resp = _where_meta(responses, lambda m: m.get("category") == CAT_REWARD)
    if len(reward_resp):
        novel_picks = sum(1 for m in reward_resp["meta"] if m.get("chosen_kind") == KIND_NOVEL)
        n["novel_reward_picks"], n["reward_decisions"] = novel_picks, len(reward_resp)
        put("novel_choice_rate", novel_picks / len(reward_resp))

    # ----------------------------------------------------------- planning (level 2) & general
    if _level_started(df, C.LEVEL_PLANNING):
        l2 = _level_events(df, C.LEVEL_PLANNING)
        first_start = l2[l2["event_type"] == E.LEVEL_START]["t_ms"].min()
        builds = l2[l2["event_type"] == E.RESOURCE_USED]
        if len(builds):
            first_build = builds["t_ms"].min()
            put("planning_time", (first_build - first_start) / 1000.0)
            plan_actions = l2[(l2["event_type"] == E.PLAYER_INTERACTION) & (l2["t_ms"] < first_build) &
                              l2["action"].isin(["inspect_blueprint", "inspect_resources", "use_planner"])]
            n["planning_actions_before_build"] = len(plan_actions)
            best = max(float(m.get("reward_total", 0)) for m in builds["meta"])
            optimal = float(_level_total(df, 2, "optimal_reward", C.L2_OPTIMAL_REWARD))
            n["best_reward"], n["optimal_reward"] = best, optimal
            put("resource_efficiency", min(1.0, best / optimal))
            lab = [m.get("strategy_label") for m in builds["meta"] if m.get("strategy_label")]
            if len(lab) >= 2:
                counted = Counter(x for x in lab if x != "other")
                top = counted.most_common(1)[0][1] if counted else 0
                n["builds"] = len(lab)
                put("strategy_consistency", top / len(lab))
        else:
            put("resource_efficiency", 0.0)

    starts = df[df["event_type"] == E.TASK_START]
    done = df[df["event_type"] == E.TASK_COMPLETE]
    started_tasks = {(r.level_id) for r in starts.itertuples()}
    done_tasks = {(r.level_id) for r in done.itertuples()}
    n["tasks_started"], n["tasks_completed"] = len(started_tasks), len(done_tasks & started_tasks)
    put("completion_rate", _div(len(done_tasks & started_tasks), len(started_tasks)))

    n_errors = int((df["event_type"] == E.ERROR).sum())
    n_actions = int(df["event_type"].isin(PLAYER_ACTION_TYPES).sum())
    n["errors"], n["player_actions"] = n_errors, n_actions
    put("error_rate", _div(n_errors, n_actions))

    retries = df[df["event_type"] == E.RETRY]
    volunteer = sum(1 for m in retries["meta"] if m.get("voluntary"))
    attempts = int((df["event_type"] == E.LEVEL_START).sum()) + volunteer
    n["retries"], n["attempts"] = len(retries), attempts
    put("retry_rate", _div(len(retries), attempts))

    # failures / persistence
    failed = df[df["event_type"] == E.LEVEL_FAILED]
    failed_levels = sorted({int(x) for x in failed["level_id"].dropna()})
    n["levels_failed"] = len(failed_levels)
    if len(failed):
        recovered = 0
        for r in failed.itertuples():
            later = retries[(retries["level_id"] == r.level_id) & (retries["t_ms"] >= r.t_ms)]
            recovered += 1 if len(later) else 0
        put("failure_recovery_rate", recovered / len(failed))
        completed_after = sum(1 for lid in failed_levels
                              if ((df["event_type"] == E.LEVEL_COMPLETE) & (df["level_id"] == lid)).any())
        put("persistence_rate", completed_after / len(failed_levels))
        persisted = 0
        for lid in failed_levels:
            ok = ((df["event_type"] == E.LEVEL_COMPLETE) & (df["level_id"] == lid)).any()
            att = int(((df["event_type"] == E.LEVEL_START) & (df["level_id"] == lid)).sum())
            persisted += 1 if (ok or att >= C.MAX_ATTEMPTS) else 0
        put("task_persistence", persisted / len(failed_levels))
        n["levels_completed_after_failure"] = completed_after

    # recovery time: time from regaining control after a failure to the next player action
    action_times: list[float] = []
    for r in df[df["event_type"].isin([E.PLAYER_MOVE, E.PLAYER_INTERACTION, E.DECISION_RESPONSE])].itertuples():
        action_times.append(float(r.meta.get("first_move_ms", r.t_ms)) if r.event_type == E.PLAYER_MOVE else float(r.t_ms))
    action_times = sorted(action_times)
    rec: list[float] = []
    for r in df[df["event_type"] == E.FAILURE].itertuples():
        control_back = r.t_ms + float(r.meta.get("freeze_ms", 0))
        nxt = next((t for t in action_times if t >= control_back), None)
        if nxt is not None:
            rec.append(max(0.0, nxt - control_back) / 1000.0)
    for m in retries["meta"]:
        if _ok(m.get("latency_ms")) and not m.get("voluntary"):
            rec.append(float(m["latency_ms"]) / 1000.0)
    n["failure_events"] = int((df["event_type"] == E.FAILURE).sum())
    if rec:
        put("mean_recovery_time_s", float(np.mean(rec)))

    # --------------------------------------------------------------- social (level 3)
    if _level_started(df, C.LEVEL_SOCIAL):
        l3 = _level_events(df, C.LEVEL_SOCIAL)
        total_enc = float(_level_total(df, 3, "npc_encounters_total", C.NPC_ENCOUNTERS_TOTAL))
        idle_enc = float(_level_total(df, 3, "idle_encounters_total", C.IDLE_ENCOUNTERS_TOTAL))
        enc: dict[str, dict] = defaultdict(lambda: {"initiator": None, "ignored": False, "turns": 0})
        for r in l3[l3["event_type"] == E.NPC_INTERACTION].itertuples():
            eid = r.meta.get("encounter_id")
            if not eid:
                continue
            e = enc[eid]
            if r.action == "initiated_by_player":
                e["initiator"] = "player"
            elif r.action == "initiated_by_npc":
                e["initiator"] = e["initiator"] or "npc"
            elif r.action == "dialogue_turn":
                e["turns"] += 1
            elif r.action == "ignored":
                e["ignored"] = True
        engaged = {k: v for k, v in enc.items() if v["initiator"] == "player" or (v["initiator"] == "npc" and not v["ignored"])}
        player_started = sum(1 for v in engaged.values() if v["initiator"] == "player")
        n["npc_engaged"], n["npc_encounters_total"] = len(engaged), total_enc
        n["player_initiated"], n["idle_encounters_total"] = player_started, idle_enc
        n["npc_ignored"] = sum(1 for v in enc.values() if v["ignored"])
        put("social_interaction_rate", min(1.0, len(engaged) / total_enc))
        put("interaction_initiation_rate", min(1.0, player_started / idle_enc))
        depth = float(np.mean([1 + v["turns"] for v in engaged.values()])) if engaged else 0.0
        put("social_engagement_depth", depth)

        d3 = decisions[decisions["level_id"] == C.LEVEL_SOCIAL]
        cats = Counter(m.get("category") for m in d3["meta"])
        helps = int((df["event_type"] == E.HELP_ACTION).sum())
        shares = int((df["event_type"] == E.SHARE_ACTION).sum())
        coops = int((df["event_type"] == E.COOPERATION_ACTION).sum())
        comps = int((df["event_type"] == E.COMPETITION_ACTION).sum())
        n.update({"help_opportunities": cats.get(CAT_HELP, 0), "help_actions": helps,
                  "share_opportunities": cats.get(CAT_SHARE, 0), "share_actions": shares,
                  "coop_opportunities": cats.get(CAT_COOPERATION, 0),
                  "cooperation_actions": coops, "competition_actions": comps})
        put("helping_rate", _div(min(helps, cats.get(CAT_HELP, 0)), cats.get(CAT_HELP, 0)))
        put("sharing_rate", _div(min(shares, cats.get(CAT_SHARE, 0)), cats.get(CAT_SHARE, 0)))
        put("cooperation_rate", _div(min(coops, cats.get(CAT_COOPERATION, 0)), cats.get(CAT_COOPERATION, 0)))
        put("competition_rate", _div(min(comps, cats.get(CAT_COOPERATION, 0)), cats.get(CAT_COOPERATION, 0)))

    # --------------------------------------------------------------- risk & decisions
    risk_resp = _where_meta(responses, lambda m: m.get("category") in RISK_CATEGORIES)
    if len(risk_resp):
        kinds = Counter(m.get("chosen_kind") for m in risk_resp["meta"])
        n["risk_decisions"] = len(risk_resp)
        n["risky_choices"], n["safe_choices"], n["check_choices"] = kinds[KIND_RISKY], kinds[KIND_SAFE], kinds[KIND_CHECK]
        put("risk_taking_rate", kinds[KIND_RISKY] / len(risk_resp))
        put("risk_avoidance_rate", kinds[KIND_SAFE] / len(risk_resp))
    n["risk_actions"] = int((df["event_type"] == E.RISK_ACTION).sum())

    dts = responses["decision_time_ms"].dropna().astype(float)
    if len(dts):
        mean_s = float(dts.mean()) / 1000.0
        put("average_decision_time", mean_s)
        var = float(dts.var(ddof=1)) / 1e6 if len(dts) > 1 else 0.0
        put("decision_time_variance", var)
        put("decision_time_cv", (math.sqrt(var) / mean_s) if mean_s > 0 else None)
        in_pressure = responses[responses["level_id"] == C.LEVEL_PRESSURE]["decision_time_ms"].dropna()
        elsewhere = responses[responses["level_id"] != C.LEVEL_PRESSURE]["decision_time_ms"].dropna()
        if len(in_pressure) and len(elsewhere) and float(elsewhere.mean()) > 0:
            put("pressure_latency_ratio", float(in_pressure.mean()) / float(elsewhere.mean()))

    # --------------------------------------------------------------- pressure (level 4)
    if _level_started(df, C.LEVEL_PRESSURE):
        l4 = _level_events(df, C.LEVEL_PRESSURE)
        l4_resp = l4[l4["event_type"] == E.DECISION_RESPONSE]
        gate_resp = _where_meta(l4_resp, lambda m: m.get("category") == CAT_PRESSURE)
        if len(gate_resp):
            put("decision_change_rate", float(np.mean([m.get("selection_changes", 0) for m in gate_resp["meta"]])))
        resolved = {m.get("gate_id") for m in gate_resp["meta"] if m.get("chosen_kind") != KIND_CHECK and m.get("gate_id")}
        rechecks = int(((l4["event_type"] == E.PLAYER_INTERACTION) & (l4["action"] == "recheck")).sum())
        n["rechecks"], n["gates_resolved"] = rechecks, len(resolved)
        if resolved:
            put("repeated_checking_rate", rechecks / len(resolved))
        mv = l4[l4["event_type"] == E.PLAYER_MOVE]
        moving_s = sum(float(m.get("interval_ms", 0)) for m in mv["meta"]) / 1000.0
        if moving_s > 0:
            put("erratic_movement_rate", sum(float(m.get("reversals", 0)) for m in mv["meta"]) / moving_s)
        react = [float(m["reaction_ms"]) / 1000.0 for a, m in zip(l4["action"], l4["meta"])
                 if a == "tremor_reaction" and _ok(m.get("reaction_ms"))]
        if react:
            put("post_event_reaction_s", float(np.mean(react)))
        n["laser_hits"] = int(((l4["event_type"] == E.FAILURE) & (l4["action"] == "laser_hit")).sum())

    return fs
