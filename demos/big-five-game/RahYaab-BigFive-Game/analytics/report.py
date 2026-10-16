"""Turns a prediction + the observed features into careful, evidence-based wording.

The report never says "you ARE high in X". It says the gameplay "showed patterns
associated with higher X" and lists the behavioural evidence behind each score.
"""
from __future__ import annotations

from analytics.feature_engineering import FeatureSet
from analytics.personality_scoring import TRAIT_LABELS, TRAITS, PersonalityPrediction

HEADLINES = {
    "High": "Your gameplay behavior showed patterns associated with higher {trait}.",
    "Moderate": "Your gameplay behavior showed patterns associated with a moderate level of {trait}.",
    "Low": "Your gameplay behavior showed patterns associated with lower {trait}.",
}

CAVEATS = {
    "openness": "Based mainly on one open-ended level and a few novelty choices.",
    "conscientiousness": "Based mainly on one planning task; playing style on a game can differ from real-life habits.",
    "extraversion": "Based on how you handled six scripted villager encounters.",
    "agreeableness": "Based on a handful of help / share / cooperate choices; these are low-stakes game decisions.",
    "neuroticism": ("Lowest-confidence trait. It is inferred only from behaviour under a game timer "
                    "(hesitation, re-checking, second-guessing) and says nothing about real emotional wellbeing."),
}


def _pct(x: float) -> str:
    return f"{round(100 * x)}%"


def _indicator(feature: str, fs: FeatureSet) -> str | None:
    f, n, notes = fs.features, fs.counts, fs.notes
    v = f.get(feature)
    if v is None:
        return None
    if feature == "exploration_rate":
        return f"Explored {int(n['optional_areas_visited'])} of {int(n['optional_areas_total'])} optional areas ({_pct(v)})"
    if feature == "route_diversity":
        return f"Covered {_pct(v)} of the valley map while moving around"
    if feature == "novel_action_rate":
        return f"Tried {int(n['novel_interactions'])} of {int(n['novel_objects_total'])} unusual objects or hidden interactions"
    if feature == "exploration_time_ratio":
        return f"Spent {_pct(v)} of the valley level inside optional areas"
    if feature == "strategy_diversity":
        names = ", ".join(s.replace("_", " ") for s in notes.get("strategies", [])) or "none recorded"
        return f"Used {int(n.get('distinct_strategies', 0))} different strategies ({names})"
    if feature == "novel_choice_rate":
        return f"Picked the unknown 'mystery' reward in {int(n['novel_reward_picks'])} of {int(n['reward_decisions'])} reward choices"
    if feature == "planning_time":
        return (f"Spent {v:.0f}s inspecting and planning before the first build "
                f"({int(n.get('planning_actions_before_build', 0))} planning actions)")
    if feature == "resource_efficiency":
        return f"Reached {_pct(v)} of the best possible workshop reward with the limited materials"
    if feature == "completion_rate":
        return f"Completed {int(n['tasks_completed'])} of {int(n['tasks_started'])} tasks"
    if feature == "strategy_consistency":
        return f"Applied one consistent build rule in {_pct(v)} of builds"
    if feature == "error_rate":
        return f"Made {int(n['errors'])} mistaken actions ({_pct(v)} of all actions)"
    if feature == "task_persistence":
        return f"Kept trying on {_pct(v)} of levels that were failed at first"
    if feature == "social_interaction_rate":
        return f"Engaged with {int(n['npc_engaged'])} of {int(n['npc_encounters_total'])} villagers"
    if feature == "interaction_initiation_rate":
        return (f"Started {int(n['player_initiated'])} of {int(n['idle_encounters_total'])} conversations "
                f"with villagers who waited for you to speak first")
    if feature == "social_engagement_depth":
        return f"Conversations lasted {v:.1f} dialogue turns on average"
    if feature == "risk_taking_rate":
        return f"Chose the risky option in {int(n.get('risky_choices', 0))} of {int(n.get('risk_decisions', 0))} risk decisions"
    if feature == "risk_avoidance_rate":
        return f"Chose the safe option in {int(n.get('safe_choices', 0))} of {int(n.get('risk_decisions', 0))} risk decisions"
    if feature == "helping_rate":
        return f"Helped in {int(n['help_actions'])} of {int(n['help_opportunities'])} help requests"
    if feature == "sharing_rate":
        return f"Shared in {int(n['share_actions'])} of {int(n['share_opportunities'])} sharing opportunities"
    if feature == "cooperation_rate":
        return f"Chose to cooperate / negotiate in {int(n['cooperation_actions'])} of {int(n['coop_opportunities'])} joint-task situations"
    if feature == "competition_rate":
        return f"Chose to compete in {int(n['competition_actions'])} of {int(n['coop_opportunities'])} joint-task situations"
    if feature == "pressure_latency_ratio":
        return f"Decisions under the vault countdown took {v:.1f}x as long as decisions in the other levels"
    if feature == "decision_change_rate":
        return f"Changed their highlighted option {v:.1f} times per vault decision before confirming"
    if feature == "repeated_checking_rate":
        return f"Re-checked information {int(n.get('rechecks', 0))} extra time(s) across {int(n.get('gates_resolved', 0))} vault gates"
    if feature == "mean_recovery_time_s":
        return f"Took {v:.1f}s on average to resume playing after a setback"
    if feature == "erratic_movement_rate":
        return f"Reversed direction {v:.2f} times per second while moving under pressure"
    if feature == "decision_time_cv":
        return f"Decision speed varied by {_pct(v)} around its average (consistency of decision timing)"
    return None


def build_evidence(prediction: PersonalityPrediction, fs: FeatureSet, max_items: int = 5) -> dict:
    evidence: dict[str, dict] = {}
    for trait in TRAITS:
        contribs = sorted(prediction.contributions[trait], key=lambda c: -abs(c.weight))
        lines, seen = [], set()
        for c in contribs:
            text = _indicator(c.feature, fs)
            if text and text not in seen:
                lines.append(text)
                seen.add(text)
        label = prediction.labels[trait]
        insufficient = prediction.insufficient.get(trait, False)
        headline = ("Not enough relevant gameplay was recorded to estimate this trait reliably."
                    if insufficient else HEADLINES[label].format(trait=TRAIT_LABELS[trait]))
        evidence[trait] = {
            "trait": TRAIT_LABELS[trait], "score": prediction.scores[trait], "label": label,
            "headline": headline, "indicators": lines[:max_items], "caveat": CAVEATS[trait],
            "coverage": prediction.coverage[trait], "confidence": prediction.confidence.get(trait, "low"),
            "insufficient_data": insufficient,
        }
    return evidence
