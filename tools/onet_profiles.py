"""Derive each path's RIASEC profile from O*NET occupational interest data (replaces hand-made profiles).

Method (docs/project/SCIENTIFIC_BASIS.md §4.3):
1. Each path lists the occupations it leads to (design/game/frameworks/path_occupations.json), by exact
   O*NET occupation title. The list is reviewed by the counsellor panel (SCIENTIFIC_BASIS V5).
2. For each occupation, O*NET's Occupational Interest scores (scale "OI", 1-7, from the Interests file) are
   rescaled to 0-1: (score - 1) / 6.
3. The path's profile is the mean of its occupations' rescaled profiles, rounded to 2 decimals.
4. The result, the O*NET version and the occupation codes are written into streams.json, so every number
   can be traced back to O*NET.

Data: the O*NET Database text files "Interests.txt" and "Occupation Data.txt" (tab-separated), from
https://www.onetcenter.org/database.html, licensed CC BY 4.0 (attribution: COMPLIANCE.md §2.5). They are
not committed; put them in a folder and pass it with --onet.

    python tools/onet_profiles.py --onet path/to/db_text_folder            # check and show, change nothing
    python tools/onet_profiles.py --onet path/to/db_text_folder --write    # update streams.json

The script stops with a list of problems if any title does not match an O*NET occupation exactly.
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRAMEWORKS = ROOT / "design" / "game" / "frameworks"
RIASEC = {
    "Realistic": "R",
    "Investigative": "I",
    "Artistic": "A",
    "Social": "S",
    "Enterprising": "E",
    "Conventional": "C",
}


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def load_onet(folder: Path) -> tuple[dict[str, str], dict[str, dict[str, float]]]:
    """Returns (title -> O*NET-SOC code, code -> {R..C: 0-1})."""
    titles = {row["Title"]: row["O*NET-SOC Code"] for row in read_tsv(folder / "Occupation Data.txt")}
    profiles: dict[str, dict[str, float]] = {}
    for row in read_tsv(folder / "Interests.txt"):
        if row["Scale ID"] == "OI" and row["Element Name"] in RIASEC:
            score = (float(row["Data Value"]) - 1.0) / 6.0
            profiles.setdefault(row["O*NET-SOC Code"], {})[RIASEC[row["Element Name"]]] = score
    return titles, profiles


def derive(mapping: dict[str, list[str]], titles: dict[str, str], profiles: dict[str, dict[str, float]]):
    problems: list[str] = []
    result: dict[str, dict[str, object]] = {}
    for path_id, occupation_titles in mapping.items():
        codes = []
        for title in occupation_titles:
            code = titles.get(title)
            if code is None:
                problems.append(f"{path_id}: no O*NET occupation titled {title!r}")
            elif len(profiles.get(code, {})) != 6:
                problems.append(f"{path_id}: {title!r} ({code}) has no complete interest profile")
            else:
                codes.append(code)
        if len(codes) < 3:
            problems.append(f"{path_id}: needs at least 3 matched occupations, has {len(codes)}")
            continue
        profile = {k: round(statistics.fmean(profiles[c][k] for c in codes), 2) for k in "RIASEC"}
        result[path_id] = {"riasec": profile, "onet_codes": codes}
    return result, problems


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--onet", type=Path, required=True, help="folder with Interests.txt and Occupation Data.txt")
    ap.add_argument("--version", default="", help="O*NET database version, e.g. 30.0 (recorded in streams.json)")
    ap.add_argument("--write", action="store_true", help="update streams.json")
    args = ap.parse_args()

    mapping_doc = json.loads((FRAMEWORKS / "path_occupations.json").read_text(encoding="utf-8"))
    titles, profiles = load_onet(args.onet)
    result, problems = derive(mapping_doc["paths"], titles, profiles)
    if problems:
        sys.exit("O*NET mapping problems:\n  " + "\n  ".join(problems))

    streams_path = FRAMEWORKS / "streams.json"
    streams = json.loads(streams_path.read_text(encoding="utf-8"))
    for group in streams["by_class"].values():
        for path in group["paths"]:
            derived = result.get(path["id"])
            if derived is None:
                sys.exit(f"path {path['id']!r} has no occupation list in path_occupations.json")
            print(f"{path['id']:<26} heuristic {path['riasec']}  ->  O*NET {derived['riasec']}")
            if args.write:
                path["riasec"] = derived["riasec"]
                path["riasec_source"] = {
                    "method": "mean O*NET Occupational Interest (OI) profile of the occupations this path leads to",
                    "onet_version": args.version,
                    "onet_codes": derived["onet_codes"],
                }
    if args.write:
        streams_path.write_text(json.dumps(streams, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("streams.json updated; review the changes before committing")


if __name__ == "__main__":
    main()
