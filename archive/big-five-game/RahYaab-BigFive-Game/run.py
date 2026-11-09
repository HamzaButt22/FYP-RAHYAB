"""Single entry point for the whole project.

    python run.py              start the dashboard (background) AND the game window
    python run.py game         game only
    python run.py dashboard    dashboard only  -> http://localhost:5000
    python run.py demo [N]     let N scripted bots play the real game to fill the database
    python run.py test         run the automated test-suite
"""
from __future__ import annotations

import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

PORT = 5000


def start_dashboard_thread() -> threading.Thread:
    from backend.app import create_app
    app = create_app()
    t = threading.Thread(target=lambda: app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False), daemon=True)
    t.start()
    print(f"Dashboard running at http://localhost:{PORT}  (database: {app.config['REPO'].db_path})")
    return t


def main(argv: list[str]) -> int:
    cmd = argv[0] if argv else "all"
    if cmd == "dashboard":
        from backend.app import main as dash
        dash(port=PORT)
    elif cmd == "game":
        from game.main import main as game
        game()
    elif cmd == "demo":
        from backend.database.repository import Repository
        from tools.generate_demo_data import generate
        n = int(argv[1]) if len(argv) > 1 else 12
        repo = Repository()
        print(f"Generating {n} bot assessments into {repo.db_path}")
        generate(n, repo)
    elif cmd == "test":
        import pytest
        return pytest.main(["-q", str(ROOT / "tests")])
    elif cmd == "all":
        start_dashboard_thread()
        time.sleep(0.8)
        try:
            webbrowser.open(f"http://localhost:{PORT}")
        except Exception:
            pass
        from game.main import main as game
        game()
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
