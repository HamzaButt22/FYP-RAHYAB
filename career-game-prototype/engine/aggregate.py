# -*- coding: utf-8 -*-
"""Session aggregator and pilot export: every logged session of a participant -> one profile.

Run from career-game-prototype/:  python -m engine.aggregate  (writes pilot_exports/features.csv)

Rules:
- Sessions are re-scored from raw events with the current engine; cached footer scores are ignored.
- A feature no session measured is None ("not measured"), never a neutral default, so models
  fitted on the export never train on fake values. A measured 0.0 stays 0.0.
- Retest sessions of one game are averaged per game; games that share a feature are averaged.
  Per-game columns are exported too, because the same key means different behaviour in each game.
- Failover duplicates keep the most complete copy. Crashed, tampered, misfiled or uncalibrated
  logs are excluded with a reason instead of failing the whole run.

The export holds pseudonymous IDs and game features only. Covariates and questionnaire scores live
in the separate pilot sheet and are joined on participant_id at analysis time.
"""
import argparse
import csv
import statistics
from pathlib import Path

from engine.session_log import (
    DEFAULT_FALLBACK_DIR,
    GAME_MODULES,
    PARTICIPANT_ID_PATTERN,
    SessionLogError,
    load_session,
    recompute,
)
from engine.stream_transformation_engine import FEATURE_ORDER, StreamTransformationEngine

SUMMARY_COLUMNS = (
    "participant_id", "sessions_used", "sessions_excluded", "games", "coverage",
    "calibration_median_ms", "input_types", "code_commits", "code_dirty",
)


def collect_logs(log_dirs) -> dict:
    """{participant_id: [paths]} across all folders; folders that aren't code-sheet IDs are ignored."""
    found = {}
    for log_dir in log_dirs:
        log_dir = Path(log_dir)
        if not log_dir.is_dir():
            continue
        for folder in sorted(log_dir.iterdir()):
            if folder.is_dir() and PARTICIPANT_ID_PATTERN.fullmatch(folder.name):
                paths = sorted(folder.glob("*.jsonl"))
                if paths:
                    found.setdefault(folder.name, []).extend(paths)
    return dict(sorted(found.items()))


def _load_candidates(participant_id: str, paths, excluded: list) -> dict:
    candidates = {}
    for path in paths:
        path = Path(path)
        try:
            record = load_session(path)
        except SessionLogError as err:
            excluded.append({"file": path.name, "reason": f"unreadable: {err}"})
            continue
        if record["participant_id"] != participant_id:
            excluded.append({"file": path.name, "reason": f"participant mismatch: logged as {record['participant_id']}"})
            continue
        candidates.setdefault(record["session_id"], []).append((path, record))
    return candidates


def aggregate_participant(participant_id: str, paths, include_incomplete: bool = False) -> dict:
    excluded = []
    sessions = []
    for copies in _load_candidates(participant_id, paths, excluded).values():
        copies.sort(key=lambda pr: (pr[1]["complete"], len(pr[1]["events"])), reverse=True)
        path, record = copies[0]
        excluded.extend({"file": p.name, "reason": "duplicate of a more complete copy"} for p, _ in copies[1:])
        if not record["complete"] and not include_incomplete:
            excluded.append({"file": path.name, "reason": "incomplete (no footer)"})
            continue
        baseline = record["calibration_baseline"]
        if baseline.get("measured") is not True:
            excluded.append({"file": path.name, "reason": "placeholder calibration"})
            continue
        try:
            rescored = recompute(record)
        except (KeyError, TypeError, ValueError) as err:
            excluded.append({"file": path.name, "reason": f"unscorable: {err}"})
            continue
        sessions.append({
            "file": path.name,
            "session_id": record["session_id"],
            "game": record["game"],
            "started_at_utc": record["started_at_utc"],
            "complete": record["complete"],
            "code_version": record["code_version"],
            "calibration_median_ms": baseline["median_inter_input_ms"],
            "input_types": record["device"]["input_types"],
            "evidence": rescored["evidence"],
        })
    sessions.sort(key=lambda s: (s["started_at_utc"] or "", s["session_id"]))

    by_game = {}
    for game in GAME_MODULES:
        game_sessions = [s for s in sessions if s["game"] == game]
        values = {}
        for feature in FEATURE_ORDER:
            measured = [s["evidence"][feature] for s in game_sessions if feature in s["evidence"]]
            if measured:
                values[feature] = statistics.fmean(measured)
        if game_sessions:
            by_game[game] = values

    measured_by = {feature: [game for game in by_game if feature in by_game[game]] for feature in FEATURE_ORDER}
    measured_by = {feature: games for feature, games in measured_by.items() if games}
    profile = {feature: statistics.fmean(by_game[g][feature] for g in measured_by[feature])
               if feature in measured_by else None for feature in FEATURE_ORDER}
    probabilities = (StreamTransformationEngine().recommend(profile, allow_missing=True)
                     if measured_by else None)
    return {
        "participant_id": participant_id,
        "sessions": sessions,
        "excluded": excluded,
        "by_game": by_game,
        "measured_by": measured_by,
        "profile": profile,
        "coverage": len(measured_by) / len(FEATURE_ORDER),
        # Hand-set weights: a hypothesis until the pilot fits real ones. Kept out of the export.
        "probabilities": probabilities,
    }


def _pilot_columns() -> list:
    per_game = [f"{game}__{feature}" for game, module in GAME_MODULES.items() for feature in module.MEASURED_FEATURES]
    return [*SUMMARY_COLUMNS, *FEATURE_ORDER, *per_game]


def _pilot_row(result: dict) -> dict:
    sessions = result["sessions"]
    dirty = [s["code_version"].get("dirty") for s in sessions]
    row = {
        "participant_id": result["participant_id"],
        "sessions_used": len(sessions),
        "sessions_excluded": len(result["excluded"]),
        "games": ";".join(game for game in GAME_MODULES if game in result["by_game"]),
        "coverage": result["coverage"],
        "calibration_median_ms": statistics.median(s["calibration_median_ms"] for s in sessions) if sessions else None,
        "input_types": ";".join(sorted({t for s in sessions for t in s["input_types"]})),
        "code_commits": ";".join(sorted({s["code_version"].get("commit", "unknown") for s in sessions})),
        "code_dirty": True if True in dirty else (False if dirty and all(d is False for d in dirty) else None),
        **result["profile"],
    }
    for game, module in GAME_MODULES.items():
        for feature in module.MEASURED_FEATURES:
            row[f"{game}__{feature}"] = result["by_game"].get(game, {}).get(feature)
    return row


def build_pilot_table(log_dirs, include_incomplete: bool = False) -> tuple:
    """Returns (columns, rows, results): one row per participant, None where nothing was measured."""
    results = [aggregate_participant(pid, paths, include_incomplete) for pid, paths in collect_logs(log_dirs).items()]
    return _pilot_columns(), [_pilot_row(r) for r in results], results


def write_pilot_csv(columns: list, rows: list, out_path) -> Path:
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({c: "" if row.get(c) is None else row[c] for c in columns})
    return out_path


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="Aggregate pilot session logs into one row per participant.")
    parser.add_argument("--log-dir", default="pilot_logs")
    parser.add_argument("--fallback-dir", default=str(DEFAULT_FALLBACK_DIR))
    parser.add_argument("--out", default="pilot_exports/features.csv")
    parser.add_argument("--include-incomplete", action="store_true", help="also score crashed (footer-less) sessions")
    args = parser.parse_args(argv)

    columns, rows, results = build_pilot_table([args.log_dir, args.fallback_dir], args.include_incomplete)
    out = write_pilot_csv(columns, rows, args.out)
    used = sum(len(r["sessions"]) for r in results)
    print(f"{len(results)} participant(s), {used} session(s) used -> {out}")
    for result in results:
        for item in result["excluded"]:
            print(f"  excluded {result['participant_id']}/{item['file']}: {item['reason']}")


if __name__ == "__main__":
    main()
