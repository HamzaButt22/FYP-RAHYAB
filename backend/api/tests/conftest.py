"""Test settings and shared fixtures.

The app module builds its app at import time, so the environment is set before anything imports it.
"""

import os
import secrets

os.environ.setdefault("APP_ENV", "test")

from collections.abc import Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import Engine, create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402
from support import ADMIN_URL, API_URL, MASTER_KEY_FILE, PEPPER, SIGNING_KEY, World  # noqa: E402

from rahyaab_api.main import create_app  # noqa: E402
from rahyaab_api.settings import Settings  # noqa: E402


@pytest.fixture(scope="module")
def admin() -> Iterator[Engine]:
    if not (API_URL and ADMIN_URL):
        pytest.skip("TEST_DATABASE_URL and TEST_ADMIN_DATABASE_URL are not set")
    engine = create_engine(ADMIN_URL, connect_args={"connect_timeout": 3})
    try:
        with engine.connect():
            pass
    except OperationalError:
        pytest.skip("the test database is not reachable (start it with: python tools/dev.py db)")
    yield engine
    engine.dispose()


@pytest.fixture(scope="module")
def api(admin: Engine) -> Iterator[TestClient]:
    app = create_app(
        Settings(
            app_env="test",
            database_url=API_URL,
            jwt_signing_key=SIGNING_KEY,
            code_pepper=PEPPER,
            data_key_wrapper_file=MASTER_KEY_FILE,
        )
    )
    with TestClient(app) as c:
        yield c
    app.state.engine.dispose()


@pytest.fixture
def world(admin: Engine) -> Iterator[World]:
    w = World(admin)
    yield w
    w.cleanup()


@pytest.fixture
def pack(admin: Engine) -> Iterator[str]:
    """A throwaway content pack for runs that tests insert directly (results, sharing)."""
    pack_id = f"test-{secrets.token_hex(4)}"
    with admin.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO content_pack (id, class_mode, min_app, sha256, signature, manifest, size_bytes, "
                "storage_uri) VALUES (:id, 'matric', '0.1.0', 'x', 'x', '{}', 1, 'test://none')"
            ),
            {"id": pack_id},
        )
    yield pack_id
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM game_run WHERE content_version = :p"), {"p": pack_id})
        conn.execute(text("DELETE FROM content_pack WHERE id = :p"), {"p": pack_id})
