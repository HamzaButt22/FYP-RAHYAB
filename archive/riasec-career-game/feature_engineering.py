"""Extract descriptive, steady-state gameplay features from Arcade Career Explorer JSONL logs.

Timing features are normalized against the optional controls-practice reference. They are
not cognitive-speed measures and are not used to infer occupational interests.
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

GAME_KEYS = ("R", "I", "A", "S", "E", "C")


def load_jsonl(path: str | Path) -> list[dict[str, Any]]:
    """Load both event-per-line JSONL and older request-envelope JSONL files."""
    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON on line {line_number}: {exc}") from exc
        if not isinstance(value, dict):
            raise ValueError(f"Expected a JSON object on line {line_number}.")
        if isinstance(value.get("events"), list):
            session_id = value.get("session_id")
            for event in value["events"]:
                if isinstance(event, dict):
                    rows.append({"session_id": session_id, **event})
        else:
            rows.append(value)
    return rows


def _numbers(events: list[dict[str, Any]], key: str) -> list[float]:
    out = []
    for event in events:
        value = event.get(key)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            out.append(float(value))
    return out


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def compute_session_features(events: Iterable[dict[str, Any]]) -> dict[str, float]:
    """Return one flat, numeric feature vector, with missing measurements set to zero."""
    rows = list(events)
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in rows:
        game = event.get("game")
        if game in GAME_KEYS:
            grouped[str(game)].append(event)

    features: dict[str, float] = {}
    for code in GAME_KEYS:
        game = grouped.get(code, [])
        # Older sample logs called this field "event"; accept it for migration.
        event_type = lambda e: e.get("type", e.get("event"))
        inputs = [e for e in game if event_type(e) == "input"]
        errors = [e for e in game if event_type(e) == "error"]
        hints = [e for e in game if event_type(e) == "hint"]
        paths = [e for e in game if event_type(e) == "kinematic_path"]
        features[f"{code}_input_count"] = float(len(inputs))
        features[f"{code}_error_count"] = float(len(errors))
        features[f"{code}_hint_count"] = float(len(hints))
        features[f"{code}_hint_to_attempt_ratio"] = len(hints) / len(inputs) if inputs else 0.0
        features[f"{code}_relative_first_action_delay"] = _mean(_numbers(inputs, "relative_first_action_delay"))
        features[f"{code}_normalized_inter_input_delay_mean"] = _mean(_numbers(inputs, "normalized_inter_input_delay"))
        features[f"{code}_normalized_recovery_delay_mean"] = _mean(_numbers(inputs, "normalized_recovery_delay"))
        features[f"{code}_kinematic_path_deviation_mean"] = _mean(_numbers(paths, "path_deviation_index"))
        features[f"{code}_path_sample_count"] = float(sum(int(e.get("sample_count", 0)) for e in paths))
        features[f"{code}_completed"] = float(any(event_type(e) == "game_complete" for e in game))
        # Preserve the legacy score summary for older session logs. The current browser
        # game does not emit numeric scores, so current sessions correctly report 0.0.
        features[f"{code}_score_mean"] = _mean(_numbers(game, "score"))
        # Station-level descriptive features. These retain observable choices and normalized
        # timing; they do not convert those signals into occupational or cognitive claims.
        normalized_delays = _numbers(inputs, "normalized_inter_input_delay")
        recoveries = _numbers(inputs, "normalized_recovery_delay")
        features[f"{code}_normalized_processing_cadence"] = _mean(normalized_delays)
        if code == "I":
            features["I_metacognitive_pattern_analysis_speed"] = _mean(normalized_delays)
            features["I_strategy_pivot_latency"] = _mean(recoveries)
            features["I_post_reset_pause_delta"] = _mean(recoveries) - 1.0 if recoveries else 0.0
        elif code == "A":
            features["A_exploration_interaction_variety"] = float(len({e.get("region") for e in inputs if e.get("region")}))
            features["A_dwell_volume_actions"] = float(len(inputs))
        elif code == "S":
            choices = [e for e in inputs if str(e.get("action", "")).startswith("support_")]
            prioritized = [e for e in choices if isinstance(e.get("priority_choice"), bool)]
            counts = [sum(e.get("crew_member") == member for e in choices) for member in range(3)]
            gini = (sum(abs(a - b) for a in counts for b in counts) / (2 * len(counts) * sum(counts))) if sum(counts) else 0.0
            features["S_empathy_prioritization_efficiency"] = (sum(e["priority_choice"] for e in prioritized) / len(prioritized)) if prioritized else 0.0
            features["S_dynamic_information_seeking_threshold"] = len(hints) / len(inputs) if inputs else 0.0
            features["S_allocation_equity"] = 1.0 - gini
        elif code == "E":
            features["E_opportunity_response_velocity_normalized"] = _mean(normalized_delays)
            features["E_max_collection_streak"] = max((float(e.get("streak", 0)) for e in inputs), default=0.0)
            features["E_post_crash_momentum_actions"] = float(sum(1 for i, e in enumerate(game) if event_type(e) == "input" and any(event_type(x) == "error" for x in game[:i])))
            broken_streaks = [float(e.get("streak", 0)) for e in errors if e.get("kind") == "missed_order"]
            features["E_risk_streak_decay"] = _mean(broken_streaks)
        elif code == "C":
            classified = [e for e in inputs if isinstance(e.get("correct"), bool)]
            features["C_classification_accuracy"] = (sum(e["correct"] for e in classified) / len(classified)) if classified else 0.0
            features["C_steady_state_precision_cadence"] = _mean(normalized_delays)
            features["C_system_continuity"] = (sum(e["correct"] for e in classified) / len(classified)) if classified else 0.0
    features["total_events"] = float(len(rows))
    features["steady_state_input_events"] = float(sum(e.get("type", e.get("event")) == "input" for e in rows))
    return features


def build_feature_vector(records: list[dict[str, Any]]) -> dict[str, float]:
    return compute_session_features(records)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract numeric features from session telemetry JSONL.")
    parser.add_argument("log_path", help="Path to example_session_log.jsonl or another JSONL log")
    parser.add_argument("--json", action="store_true", help="Print the feature vector as JSON")
    args = parser.parse_args()
    features = build_feature_vector(load_jsonl(args.log_path))
    if args.json:
        print(json.dumps(features, indent=2, sort_keys=True))
    else:
        for name, value in features.items():
            print(f"{name}: {value:.4f}")


if __name__ == "__main__":
    main()

