"""Jobs worker against a real PostgreSQL. Fixtures are in conftest.py; skipped without a test database."""

from sqlalchemy import Engine, text
from support import World

from rahyaab_api.jobs import purge_rate_limits, purge_school_files, purge_unconsented_students


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


def test_never_consented_profiles_are_deleted_after_30_days(admin: Engine, world: World) -> None:
    class_id, _ = world.add_class()
    with admin.begin() as conn:
        ids = conn.execute(
            text(
                "INSERT INTO student (class_id, nickname, grade, age_band, created_at) VALUES "
                "(:c, 'old_pending', 9, '13-15', now() - interval '31 days'), "
                "(:c, 'new_pending', 9, '13-15', now() - interval '5 days'), "
                "(:c, 'old_consented', 9, '13-15', now() - interval '31 days') RETURNING id, nickname"
            ),
            {"c": class_id},
        ).all()
        by_name = {name: sid for sid, name in ids}
        conn.execute(
            text(
                "INSERT INTO consent (student_id, type, method, notice_version) "
                "VALUES (:s, 'self', 'in_app', '2026-11')"
            ),
            {"s": by_name["old_consented"]},
        )
    purge_unconsented_students(admin)
    with admin.begin() as conn:
        left = (
            conn.execute(
                text("SELECT nickname FROM student WHERE class_id = :c ORDER BY nickname"), {"c": class_id}
            )
            .scalars()
            .all()
        )
    assert left == ["new_pending", "old_consented"]


def test_an_archived_profile_is_kept_30_days_after_archiving(admin: Engine, world: World) -> None:
    class_id, _ = world.add_class()
    with admin.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO student (class_id, nickname, grade, age_band, created_at, archived_at, "
                "archived_reason) VALUES "
                "(:c, 'recent_archive', 9, '13-15', now() - interval '40 days', "
                "now() - interval '2 days', 'left'), "
                "(:c, 'old_archive', 9, '13-15', now() - interval '80 days', "
                "now() - interval '31 days', 'left')"
            ),
            {"c": class_id},
        )
    purge_unconsented_students(admin)
    with admin.connect() as conn:
        left = (
            conn.execute(
                text("SELECT nickname FROM student WHERE class_id = :c ORDER BY nickname"), {"c": class_id}
            )
            .scalars()
            .all()
        )
    assert left == ["recent_archive"]


def test_school_file_password_backups_are_deleted_after_400_days(admin: Engine, world: World) -> None:
    class_id, _ = world.add_class()
    with admin.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO school_file (id, class_id, kind, file_names, sealed_password, created_at) "
                "VALUES "
                "(gen_random_uuid(), :c, 'class_list', 'old.xlsx', '\\x00', now() - interval '401 days'), "
                "(gen_random_uuid(), :c, 'class_list', 'new.xlsx', '\\x00', now() - interval '399 days')"
            ),
            {"c": class_id},
        )
    purge_school_files(admin)
    with admin.connect() as conn:
        left = (
            conn.execute(text("SELECT file_names FROM school_file WHERE class_id = :c"), {"c": class_id})
            .scalars()
            .all()
        )
    assert left == ["new.xlsx"]
