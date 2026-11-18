"""Background jobs worker (`python -m rahyaab_api.jobs`).

Runs as the `jobs` database role (DATABASE_URL), which may only delete and read what retention needs.
Jobs so far (hourly): purge old rate-limit windows; delete profiles that never received consent within
UNCONSENTED_DAYS (DATA_GOVERNANCE.md: nothing was ever uploaded for them, and the phone purges its local
data after 14 days, FR-05); delete school-file password backups after SCHOOL_FILE_DAYS; delete ended staff
sessions, used or expired staff links and old staff emails; raise and close the automatic teacher flags
(`refresh_flags`, FR-73). Every 30 seconds: send queued staff emails
(mail.py; MAIL_TRANSPORT, SMTP_URL, MAIL_FROM). Still to add: retention and deletion, monthly partitions
(owner role), rescoring, O*NET cache refresh, nightly backup.
"""

import logging
import os
import signal
import time
from collections.abc import Callable, Mapping
from email.message import EmailMessage
from functools import partial

from sqlalchemy import Engine, create_engine, text

from rahyaab_api import mail

log = logging.getLogger("rahyaab.jobs")
_running = True
RATE_LIMIT_KEEP_HOURS = 24  # the longest window is 1 hour; a day of history helps abuse reviews
UNCONSENTED_DAYS = 30
SCHOOL_FILE_DAYS = 400  # a school year and a margin; the register is needed all year (register.py)
MAIL_TRIES = 5
MAIL_BATCH = 50
MAIL_INTERVAL_S = 30
STAFF_SESSION_KEEP_DAYS = 1  # ended sessions, kept a day for abuse reviews
STAFF_LINK_KEEP_DAYS = 7  # used or expired reset and invite links (DATA_GOVERNANCE.md §3)
MAIL_KEEP_DAYS = 3
# Automatic teacher flags (FR-73). The rules are here so they can be changed in one place.
NOT_STARTED_DAYS = 7  # joined this long ago and no week started
STALLED_DAYS = 14  # started, not finished, and nothing played for this long
HANDLED_QUIET_DAYS = 14  # a flag a teacher marked handled is not raised again for this long
AUTO_FLAGS = ("not_started", "stalled", "low_confidence")

# Which students have a reason for each automatic flag now. low_confidence ignores provisional results (the
# interim m1-counts scorer marks every F1 result as low confidence, so it would flag everyone).
_DUE = """
    WITH s AS (
      SELECT st.id, st.created_at,
             EXISTS (SELECT 1 FROM game_run gr JOIN sitting si ON si.id = gr.sitting_id
                     WHERE si.student_id = st.id AND NOT gr.practice) AS started,
             coalesce((SELECT max(gr.week) FROM game_run gr JOIN sitting si ON si.id = gr.sitting_id
                       WHERE si.student_id = st.id AND NOT gr.practice
                         AND EXISTS (SELECT 1 FROM raw_event re
                                     WHERE re.run_id = gr.id AND re.type = 'week_complete')), 0) AS week,
             greatest(st.last_active_at, (SELECT max(si.started_at) FROM sitting si
                                          WHERE si.student_id = st.id)) AS last_seen,
             (SELECT r.confidence FROM recommendation r
              WHERE r.student_id = st.id AND r.model_versions->>'irt' NOT LIKE 'm1-counts%'
              ORDER BY r.created_at DESC LIMIT 1) AS confidence
      FROM student st
      WHERE st.archived_at IS NULL
    ), due AS (
      SELECT id, 'not_started' AS type FROM s
      WHERE NOT started AND created_at < now() - make_interval(days => :ns)
      UNION ALL
      SELECT id, 'stalled' FROM s
      WHERE started AND week < 4 AND last_seen < now() - make_interval(days => :st)
      UNION ALL
      SELECT id, 'low_confidence' FROM s WHERE confidence = 'low'
    )
"""


def _stop(*_: object) -> None:
    global _running
    _running = False


def purge_rate_limits(engine: Engine, keep_hours: int = RATE_LIMIT_KEEP_HOURS) -> int:
    """Deletes rate-limit windows that started more than `keep_hours` ago. Returns the number removed."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM rate_limit WHERE window_start < now() - make_interval(hours => :h)"),
            {"h": keep_hours},
        )
    return int(result.rowcount or 0)


def purge_unconsented_students(engine: Engine, days: int = UNCONSENTED_DAYS) -> int:
    """Deletes students who never had parent or self consent and joined more than `days` ago.

    An archived student (admin.py student-remove) is kept for `days` after archiving, so a removal made by
    mistake can be undone (student-restore) before anything is deleted.
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                DELETE FROM student st
                WHERE st.created_at < now() - make_interval(days => :d)
                  AND (st.archived_at IS NULL OR st.archived_at < now() - make_interval(days => :d))
                  AND NOT EXISTS (SELECT 1 FROM consent co
                                  WHERE co.student_id = st.id AND co.type IN ('parent', 'self'))
                """
            ),
            {"d": days},
        )
    return int(result.rowcount or 0)


def purge_school_files(engine: Engine, days: int = SCHOOL_FILE_DAYS) -> int:
    """Deletes sealed school-file password backups made more than `days` ago. Returns the number removed."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM school_file WHERE created_at < now() - make_interval(days => :d)"), {"d": days}
        )
    return int(result.rowcount or 0)


def purge_staff_auth(engine: Engine) -> tuple[int, int, int]:
    """Deletes staff sessions that ended more than a day ago, reset and invite links used or expired more than
    7 days ago, and staff emails 3 days old or given up on. Returns (sessions, links, emails)."""
    with engine.begin() as conn:
        sessions = conn.execute(
            text(
                "DELETE FROM staff_session WHERE expires_at < now() - make_interval(days => :d) "
                "OR revoked_at < now() - make_interval(days => :d)"
            ),
            {"d": STAFF_SESSION_KEEP_DAYS},
        ).rowcount
        links = conn.execute(
            text(
                "DELETE FROM password_reset WHERE expires_at < now() - make_interval(days => :d) "
                "OR used_at < now() - make_interval(days => :d)"
            ),
            {"d": STAFF_LINK_KEEP_DAYS},
        ).rowcount
        emails = conn.execute(
            text(
                "DELETE FROM email_outbox "
                "WHERE created_at < now() - make_interval(days => :d) OR attempts >= :t"
            ),
            {"d": MAIL_KEEP_DAYS, "t": MAIL_TRIES},
        ).rowcount
    return int(sessions or 0), int(links or 0), int(emails or 0)


def refresh_flags(engine: Engine) -> tuple[int, int]:
    """Raises the automatic teacher flags whose reason holds now, and closes those whose reason is gone
    (a student who started after all). A flag a teacher marked handled is not raised again for
    HANDLED_QUIET_DAYS. Returns (raised, closed)."""
    params = {
        "ns": NOT_STARTED_DAYS,
        "st": STALLED_DAYS,
        "quiet": HANDLED_QUIET_DAYS,
        "auto": list(AUTO_FLAGS),
    }
    with engine.begin() as conn:
        closed = conn.execute(
            text(
                _DUE  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
                + """
                UPDATE flag f SET resolved_at = now()
                WHERE f.resolved_at IS NULL AND f.type = ANY(:auto)
                  AND NOT EXISTS (SELECT 1 FROM due d WHERE d.id = f.student_id AND d.type = f.type)
                """
            ),
            params,
        ).rowcount
        raised = conn.execute(
            text(
                _DUE  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
                + """
                INSERT INTO flag (student_id, type)
                SELECT d.id, d.type FROM due d
                WHERE NOT EXISTS (
                  SELECT 1 FROM flag f WHERE f.student_id = d.id AND f.type = d.type
                    AND (f.resolved_at IS NULL
                         OR (f.resolved_by IS NOT NULL
                             AND f.resolved_at > now() - make_interval(days => :quiet))))
                """
            ),
            params,
        ).rowcount
    return int(raised or 0), int(closed or 0)


def send_outbox(engine: Engine, deliver: Callable[[EmailMessage], None], sender: str) -> tuple[int, int]:
    """Sends queued staff emails (at most MAIL_BATCH). A sent email is deleted at once; a failed one is
    tried again next time, up to MAIL_TRIES. Returns (sent, failed). Content is never logged."""
    sent = failed = 0
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                "SELECT id, to_address, template, link FROM email_outbox WHERE attempts < :t "
                "ORDER BY created_at LIMIT :n FOR UPDATE SKIP LOCKED"
            ),
            {"t": MAIL_TRIES, "n": MAIL_BATCH},
        ).all()
        for row in rows:
            try:
                deliver(mail.message(sender, row.to_address, row.template, row.link))
            except Exception as exc:  # one bad address or a mail-server hiccup must not stop the rest
                log.warning("staff email not sent (%s); will try again", type(exc).__name__)
                conn.execute(
                    text("UPDATE email_outbox SET attempts = attempts + 1 WHERE id = :id"), {"id": row.id}
                )
                failed += 1
            else:
                conn.execute(text("DELETE FROM email_outbox WHERE id = :id"), {"id": row.id})
                sent += 1
    return sent, failed


def mail_transport(env: Mapping[str, str]) -> str:
    """MAIL_TRANSPORT: 'smtp' (default) or 'log'. 'log' writes emails, links included, to this worker's log,
    so it is refused anywhere but a developer's computer (NFR-66: no debug paths in a release)."""
    transport = env.get("MAIL_TRANSPORT", "smtp") or "smtp"
    if transport not in ("smtp", "log"):
        raise ValueError("MAIL_TRANSPORT must be smtp or log")
    if transport == "log" and env.get("APP_ENV", "production") not in ("development", "test"):
        raise ValueError("MAIL_TRANSPORT=log is only allowed with APP_ENV=development or test")
    return transport


def _log_email(msg: EmailMessage) -> None:
    log.info(
        "DEVELOPMENT ONLY, email not sent:\nTo: %s\nSubject: %s\n\n%s",
        msg["To"],
        msg["Subject"],
        msg.get_content(),
    )


def _deliverer(env: Mapping[str, str]) -> Callable[[EmailMessage], None] | None:
    if mail_transport(env) == "log":
        return _log_email
    smtp_url = env.get("SMTP_URL", "")
    return partial(mail.smtp_send, smtp_url) if smtp_url else None


def main(interval_s: int = 3600) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)
    url = os.environ.get("DATABASE_URL", "")
    engine = create_engine(url, pool_pre_ping=True) if url else None
    if engine is None:
        log.warning("DATABASE_URL is not set; no jobs will run")
    deliver = _deliverer(os.environ)  # raises (and the worker stops) for MAIL_TRANSPORT=log in a release
    sender = os.environ.get("MAIL_FROM", "Rahyaab <no-reply@rahyaab.pk>")
    if deliver is None:
        log.warning("SMTP_URL is not set; staff emails stay queued")
    log.info("jobs worker started")
    next_run = next_mail = 0.0
    while _running:
        if engine is not None and time.monotonic() >= next_run:
            try:
                log.info("rate_limit purge removed %d windows", purge_rate_limits(engine))
                log.info("removed %d never-consented profiles", purge_unconsented_students(engine))
                log.info("removed %d old school-file password backups", purge_school_files(engine))
                log.info(
                    "removed %d staff sessions, %d staff links, %d staff emails", *purge_staff_auth(engine)
                )
                log.info("teacher flags: %d raised, %d closed", *refresh_flags(engine))
            except Exception:  # keep the worker alive; the next run retries
                log.exception("a purge failed")
            next_run = time.monotonic() + interval_s
        if engine is not None and deliver is not None and time.monotonic() >= next_mail:
            try:
                sent, failed = send_outbox(engine, deliver, sender)
                if sent or failed:
                    log.info("staff emails: %d sent, %d failed", sent, failed)
            except Exception:
                log.exception("sending staff emails failed")
            next_mail = time.monotonic() + MAIL_INTERVAL_S
        time.sleep(1)
    log.info("jobs worker stopped")


if __name__ == "__main__":
    main()
