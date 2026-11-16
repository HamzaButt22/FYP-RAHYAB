import json
import os
import sys
from pathlib import Path

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
os.environ["RAHYAAB_JSONL"] = "0"
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pytest  # noqa: E402

from backend.database.repository import Repository  # noqa: E402

FIXTURE = Path(__file__).parent / "fixtures" / "dummy_telemetry.json"


@pytest.fixture
def repo(tmp_path):
    return Repository(tmp_path / "test.db")


@pytest.fixture(scope="session")
def dummy():
    """{'explorer': [events], 'anxious': [...], 'reckless': [...]} -- real telemetry from bot playthroughs."""
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture
def loaded_session(repo, dummy):
    """A session populated from the dummy dataset, without playing the game."""
    pid = repo.create_player("Fixture Player")
    sid = repo.create_session(pid)
    repo.insert_events(sid, pid, dummy["explorer"])
    return repo, pid, sid
