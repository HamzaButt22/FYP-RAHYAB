"""Create tests/fixtures/dummy_telemetry.json: real telemetry from two scripted bot playthroughs.

    python -m tools.make_fixture

The analytics pipeline can then be tested (or demonstrated) without playing the game or touching the database.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")

from backend.database.repository import Repository  # noqa: E402
from tools.bots import PRESETS, play_assessment  # noqa: E402

OUT = ROOT / "tests" / "fixtures" / "dummy_telemetry.json"


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Repository(Path(tmp) / "fixture.db")
        data = {}
        for label, seed in (("explorer", 11), ("anxious", 12), ("reckless", 13)):
            app = play_assessment(replace(PRESETS[label], seed=seed), repo)
            events = repo.get_events(app.session.session_id)
            for e in events:
                e.pop("event_id", None)
            data[label] = events
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data), encoding="utf-8")
    print(f"wrote {OUT} ({sum(len(v) for v in data.values())} events, {OUT.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()
