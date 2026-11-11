"""Jobs worker against a real PostgreSQL. Fixtures are in conftest.py; skipped without a test database."""

from sqlalchemy import Engine, text

from rahyaab_api.jobs import purge_rate_limits


def test_old_rate_limit_windows_are_purged(admin: Engine) -> None:
    keys = ["test:purge:old", "test:purge:new"]
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM rate_limit WHERE key = ANY(:k)"), {"k": keys})
        conn.execute(
            text(
                "INSERT INTO rate_limit (key, window_start, hits) VALUES "
                "('test:purge:old', now() - interval '3 days', 5), ('test:purge:new', now(), 1)"
            )
        )
    assert purge_rate_limits(admin) >= 1
    with admin.begin() as conn:
        query = text("SELECT key FROM rate_limit WHERE key = ANY(:k)")
        left = conn.execute(query, {"k": keys}).scalars().all()
        conn.execute(text("DELETE FROM rate_limit WHERE key = ANY(:k)"), {"k": keys})
    assert left == ["test:purge:new"]
