"""Flask application factory + dev server:  python backend/app.py   ->  http://localhost:5000"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from flask import Flask, jsonify  # noqa: E402

from backend.database.repository import Repository  # noqa: E402
from backend.routes import api, pages  # noqa: E402


def create_app(db_path=None) -> Flask:
    app = Flask(__name__, template_folder=str(ROOT / "dashboard" / "templates"),
                static_folder=str(ROOT / "dashboard" / "static"), static_url_path="/static")
    app.config["REPO"] = Repository(db_path)          # creates the database + tables if missing
    app.register_blueprint(api.bp)
    app.register_blueprint(pages.bp)

    @app.errorhandler(404)
    def not_found(e):
        from flask import request
        if request.path.startswith("/api/"):
            return jsonify({"error": "not found"}), 404
        return "Not found", 404

    return app


def main(host: str = "127.0.0.1", port: int = 5000) -> None:
    app = create_app()
    print(f"RahYaab dashboard: http://localhost:{port}   (database: {app.config['REPO'].db_path})")
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    main()
