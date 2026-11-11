"""Check design/game/frameworks/streams.json for honesty rules (run in CI; exits 1 on any problem).

- Every gate and every route entry has `verification` (primary | reported | unverified) and `last_verified`.
- A gate marked primary or reported has a `source_url` and a `source`.
- Every path has an occupation list in path_occupations.json (so its profile can be derived from O*NET).
- Every RIASEC profile has the six letters with values in [0, 1].
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRAMEWORKS = ROOT / "design" / "game" / "frameworks"
LEVELS = {"primary", "reported", "unverified"}


def main() -> int:
    streams = json.loads((FRAMEWORKS / "streams.json").read_text(encoding="utf-8"))
    occupations = json.loads((FRAMEWORKS / "path_occupations.json").read_text(encoding="utf-8"))["paths"]
    problems: list[str] = []

    for gate in streams["gates"]:
        gid = gate.get("id", "?")
        if gate.get("verification") not in LEVELS:
            problems.append(f"gate {gid}: verification must be one of {sorted(LEVELS)}")
        elif gate["verification"] != "unverified" and not (gate.get("source_url") and gate.get("source")):
            problems.append(f"gate {gid}: a {gate['verification']} gate needs source and source_url")
        if "last_verified" not in gate:
            problems.append(f"gate {gid}: last_verified is missing")

    for item in streams["routes"]["items"]:
        entries = list(item.get("by_board", {}).items()) or [(item.get("id", "?"), item)]
        for name, entry in entries:
            if entry.get("verification") not in LEVELS:
                problems.append(f"route {item.get('id')} / {name}: verification is missing or invalid")
            elif entry["verification"] != "unverified" and not (entry.get("source_url") and entry.get("source")):
                problems.append(f"route {item.get('id')} / {name}: a {entry['verification']} rule needs source and source_url")

    for group in streams["by_class"].values():
        for path in group["paths"]:
            pid = path["id"]
            profile = path.get("riasec", {})
            if set(profile) != set("RIASEC") or not all(0.0 <= v <= 1.0 for v in profile.values()):
                problems.append(f"path {pid}: riasec needs R, I, A, S, E, C in [0, 1]")
            if pid not in occupations:
                problems.append(f"path {pid}: no occupation list in path_occupations.json")

    counts = {level: 0 for level in LEVELS}
    for gate in streams["gates"]:
        counts[gate.get("verification", "unverified")] = counts.get(gate.get("verification", "unverified"), 0) + 1
    print(f"gates: {counts}")
    if problems:
        print("\n".join(problems))
        return 1
    print("streams.json: 0 problems")
    return 0


if __name__ == "__main__":
    sys.exit(main())
