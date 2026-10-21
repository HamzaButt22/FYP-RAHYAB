"""Low level SQLite helpers: path resolution, connections and schema creation.

All SQL in the project lives in `repository.py`; this module only knows how to open a
connection and create the schema. To move to PostgreSQL later, replace this module
(psycopg2 / SQLAlchemy engine) and port `repository.py` -- nothing else touches SQL.
"""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "rahyaab.db"


def resolve_db_path(path: str | os.PathLike | None = None) -> Path:
    """Explicit argument > RAHYAAB_DB environment variable > data/rahyaab.db"""
    if path:
        return Path(path)
    env = os.environ.get("RAHYAAB_DB")
    return Path(env) if env else DEFAULT_DB_PATH


def connect(path: str | os.PathLike | None = None) -> sqlite3.Connection:
    db_path = resolve_db_path(path)
    conn = sqlite3.connect(str(db_path), timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(path: str | os.PathLike | None = None) -> Path:
    """Create the database file and all tables if they do not exist yet."""
    db_path = resolve_db_path(path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    conn = connect(db_path)
    try:
        # WAL lets the dashboard read while the game is writing.
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript(schema)
        conn.commit()
    finally:
        conn.close()
    return db_path
