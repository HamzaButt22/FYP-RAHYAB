"""Fill the database with demo sessions by letting scripted bots play the REAL game headlessly.

    python -m tools.generate_demo_data --n 12
    python -m tools.generate_demo_data --n 6 --db data/demo.db

Every row produced is real telemetry from the real game code; nothing is faked. Bot players are flagged
`is_demo = 1` so the dashboard can include/exclude them.
"""
from __future__ import annotations

import argparse
import os
import random
import sys
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

from backend.database.repository import Repository  # noqa: E402
from tools.bots import PRESETS, play_assessment, random_persona  # noqa: E402


def generate(n: int, repo: Repository, seed: int = 2026, verbose: bool = True) -> list[str]:
    rng = random.Random(seed)
    names = list(PRESETS)
    session_ids = []
    for i in range(n):
        if i < len(names):
            persona = replace(PRESETS[names[i]], seed=rng.randrange(1 << 30))
            label = names[i]
        else:
            persona = random_persona(rng, f"mix{i - len(names) + 1}")
            label = persona.name
        app = play_assessment(persona, repo)
        if app.state != "results":
            if verbose:
                print(f"  [{i + 1}/{n}] {label}: did not finish (state={app.state}) - skipped")
            continue
        scores = app.output.prediction.scores
        session_ids.append(app.session.session_id)
        if verbose:
            s = " ".join(f"{k[0].upper()}={v:5.1f}" for k, v in scores.items())
            print(f"  [{i + 1}/{n}] {label:10s} {app.session.session_id}  {s}")
    return session_ids


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--n", type=int, default=12, help="number of bot assessments to play")
    ap.add_argument("--db", default=None, help="database path (default: data/rahyaab.db)")
    ap.add_argument("--seed", type=int, default=2026)
    args = ap.parse_args()
    repo = Repository(args.db)
    print(f"Generating {args.n} assessments into {repo.db_path}")
    ids = generate(args.n, repo, args.seed)
    print(f"Done: {len(ids)} completed sessions.")


if __name__ == "__main__":
    main()
