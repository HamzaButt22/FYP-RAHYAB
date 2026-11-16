"""Eligibility rules engine (M3 gates, FR-45): which doors each path keeps open, with sources.

Reads the `doors` and `gates` sections of design/game/frameworks/streams.json. Rules set a door's state
(open / extra_step / closed); they never silently remove a path. Honesty rules from verification_policy:
- a door resting only on unverified gates is never stated as a rule: it becomes extra_step with
  `check_with_board` set, and the app says "Check this with your school or board";
- every door carries the ids, verification and source URLs of its gates, so "Why this?" can show them.

Student facts used so far: the current Matric group (does it include Biology?). Marks thresholds and
board-specific routes (FR-99) come in FYP-2.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, Literal

DoorState = Literal["open", "extra_step", "closed"]

# Matric groups that include Biology. Unknown or missing group: Biology is not assumed either way.
# The matric_* ids are the class-8 paths in streams.json, which the profile stores as a class 9-10
# student's current group (PATCH /me/profile); Matric Technical varies by board, so it stays unknown.
BIOLOGY_GROUPS = frozenset({"matric_science_bio", "science_biology", "biology", "pre_medical", "science"})
NO_BIOLOGY_GROUPS = frozenset(
    {
        "matric_science_cs",
        "matric_humanities",
        "science_computer",
        "computer",
        "arts",
        "humanities",
        "general",
    }
)


@dataclass(frozen=True)
class Door:
    to: str
    label_key: str
    state: DoorState
    gates: tuple[str, ...]
    verification: str  # the weakest verification among its gates
    sources: tuple[str, ...]
    check_with_board: bool = False
    route: str | None = None
    note: str | None = None  # a code, worded by the app

    def as_json(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "to": self.to,
            "label_key": self.label_key,
            "state": self.state,
            "gates": list(self.gates),
            "verification": self.verification,
            "sources": list(self.sources),
            "check_with_board": self.check_with_board,
        }
        if self.route:
            out["route"] = self.route
        if self.note:
            out["note"] = self.note
        return out


@dataclass(frozen=True)
class PathRules:
    path_id: str
    doors: tuple[Door, ...]
    rules_applied: tuple[str, ...] = field(default_factory=tuple)


_ORDER = {"unverified": 0, "reported": 1, "primary": 2}


def has_biology(current_group: str | None) -> bool | None:
    """True / False when the group is known, None when it is not (then nothing is assumed)."""
    if not current_group:
        return None
    g = current_group.strip().lower()
    if g in BIOLOGY_GROUPS:
        return True
    if g in NO_BIOLOGY_GROUPS:
        return False
    return None


def doors_for(path_id: str, streams: Mapping[str, Any], current_group: str | None = None) -> PathRules:
    gates = {g["id"]: g for g in streams["gates"]}
    spec = streams.get("doors", {})
    destinations = spec.get("destinations", {})
    doors: list[Door] = []
    applied: list[str] = []
    for d in spec.get("by_path", {}).get(path_id, []):
        used = [gates[g] for g in d["gates"] if g in gates]
        if not used:
            continue  # a door without a known gate states nothing
        weakest = min((g["verification"] for g in used), key=lambda v: _ORDER.get(v, 0))
        state: DoorState = d["state"]
        check = False
        route = d.get("route")
        note = None
        if all(g["verification"] == "unverified" for g in used):
            state, check = "extra_step", True
        if d.get("needs_biology") and state == "open":
            bio = has_biology(current_group)
            if bio is False:
                state, route, note = "extra_step", "switch_group_window", "needs_biology_at_matric"
            elif bio is None:
                note = "needs_biology_at_matric"
        doors.append(
            Door(
                to=d["to"],
                label_key=destinations.get(d["to"], {}).get("label_key", f"door.{d['to']}"),
                state=state,
                gates=tuple(g["id"] for g in used),
                verification=weakest,
                sources=tuple(g["source_url"] for g in used if g.get("source_url")),
                check_with_board=check,
                route=route,
                note=note,
            )
        )
        applied.extend(g["id"] for g in used)
    return PathRules(path_id, tuple(doors), tuple(dict.fromkeys(applied)))


def all_doors(
    path_ids: Sequence[str], streams: Mapping[str, Any], current_group: str | None = None
) -> dict[str, PathRules]:
    return {pid: doors_for(pid, streams, current_group) for pid in path_ids}
