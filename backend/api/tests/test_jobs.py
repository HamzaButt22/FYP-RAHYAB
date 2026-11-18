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


# ------------------------------------------------------------------------- staff emails and sessions
def _outbox_rows(admin: Engine, to: str) -> list[tuple[str, int]]:
    with admin.begin() as conn:
        rows = conn.execute(
            text("SELECT template, attempts FROM email_outbox WHERE to_address = :t ORDER BY template"),
            {"t": to},
        ).all()
    return [(r[0], int(r[1])) for r in rows]


def test_queued_staff_emails_are_sent_then_deleted(admin: Engine) -> None:
    from rahyaab_api import mail
    from rahyaab_api.jobs import send_outbox

    to = "jobs-mail-ok@test.invalid"
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM email_outbox WHERE to_address = :t"), {"t": to})
        mail.queue(conn, to, "staff_reset", "http://localhost:5173/reset#token=" + "A" * 22)
        mail.queue(conn, to, "staff_password_changed")
    sent: list[object] = []
    ok, failed = send_outbox(admin, sent.append, "Rahyaab <no-reply@rahyaab.pk>")
    mine = [m for m in sent if m["To"] == to]  # type: ignore[index]
    assert len(mine) == 2 and ok >= 2 and failed == 0
    reset = next(m for m in mine if "Reset" in m["Subject"])  # type: ignore[index, operator]
    assert "reset#token=" + "A" * 22 in reset.get_content()  # type: ignore[attr-defined]
    assert _outbox_rows(admin, to) == []


def test_a_failed_send_is_retried_then_given_up(admin: Engine) -> None:
    from rahyaab_api import mail
    from rahyaab_api.jobs import purge_staff_auth, send_outbox

    to = "jobs-mail-fail@test.invalid"
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM email_outbox WHERE to_address = :t"), {"t": to})
        mail.queue(conn, to, "staff_password_changed")

    def broken(msg: object) -> None:
        if msg["To"] == to:  # type: ignore[index]
            raise OSError("mail server down")

    for _ in range(5):
        send_outbox(admin, broken, "no-reply@rahyaab.pk")
    assert _outbox_rows(admin, to) == [("staff_password_changed", 5)]
    send_outbox(admin, broken, "no-reply@rahyaab.pk")  # 5 tries: not tried again
    assert _outbox_rows(admin, to) == [("staff_password_changed", 5)]
    purge_staff_auth(admin)  # given-up emails are removed
    assert _outbox_rows(admin, to) == []


def test_old_staff_sessions_links_and_emails_are_purged(admin: Engine, world: World) -> None:
    from rahyaab_api.jobs import purge_staff_auth

    with admin.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO staff_session (staff_id, token_hash, expires_at, revoked_at) VALUES "
                "(:s, :a, now() - interval '2 days', NULL), "
                "(:s, :b, now() + interval '1 hour', now() - interval '2 days'), "
                "(:s, :c, now() + interval '1 hour', NULL)"
            ),
            {
                "s": world.staff_id,
                "a": "old-" + world.staff_id.hex,
                "b": "rev-" + world.staff_id.hex,
                "c": "live-" + world.staff_id.hex,
            },
        )
        conn.execute(
            text(
                "INSERT INTO password_reset (token_hash, staff_id, expires_at) VALUES "
                "(:a, :s, now() - interval '8 days'), (:b, :s, now() - interval '2 days')"
            ),
            {"s": world.staff_id, "a": "oldr-" + world.staff_id.hex, "b": "newr-" + world.staff_id.hex},
        )
        conn.execute(
            text(
                "INSERT INTO email_outbox (to_address, template, created_at) VALUES "
                "('jobs-old@test.invalid', 'staff_password_changed', now() - interval '4 days')"
            )
        )
    purge_staff_auth(admin)
    with admin.begin() as conn:
        sessions = (
            conn.execute(
                text("SELECT token_hash FROM staff_session WHERE staff_id = :s"), {"s": world.staff_id}
            )
            .scalars()
            .all()
        )
        resets = (
            conn.execute(
                text("SELECT token_hash FROM password_reset WHERE staff_id = :s"), {"s": world.staff_id}
            )
            .scalars()
            .all()
        )
        old_mail = conn.execute(
            text("SELECT count(*) FROM email_outbox WHERE to_address = 'jobs-old@test.invalid'")
        ).scalar()
    assert sessions == ["live-" + world.staff_id.hex]
    assert resets == ["newr-" + world.staff_id.hex]
    assert old_mail == 0


def test_tc_sec_04_log_only_email_is_refused_outside_development() -> None:
    import pytest

    from rahyaab_api.jobs import mail_transport

    assert mail_transport({"APP_ENV": "development", "MAIL_TRANSPORT": "log"}) == "log"
    assert mail_transport({"APP_ENV": "production"}) == "smtp"
    for env in ("staging", "production"):
        with pytest.raises(ValueError, match="MAIL_TRANSPORT"):
            mail_transport({"APP_ENV": env, "MAIL_TRANSPORT": "log"})
    with pytest.raises(ValueError, match="MAIL_TRANSPORT"):
        mail_transport({"APP_ENV": "development", "MAIL_TRANSPORT": "carrier-pigeon"})
