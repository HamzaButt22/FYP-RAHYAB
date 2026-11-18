"""Staff accounts, for the admin command (`python -m rahyaab_api.admin staff-...`; FR-80, FR-106).

An admin never sees or sets anyone's password (SECURITY.md §5.2): a new account has no password until its
owner uses the invite link emailed to them (72 hours), and a forced reset makes the old password stop
working and emails a reset link (30 minutes). Every change is audit-logged with the actor `admin-cli`.
Emails are queued in email_outbox and sent by the jobs worker (mail.py).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlsplit
from uuid import UUID

from sqlalchemy import Connection, text

from rahyaab_api import mail
from rahyaab_api import staff_auth as sa

ACTOR = "admin-cli"
ROLES = ("teacher", "counsellor", "school_admin", "admin", "researcher")
SCHOOL_ROLES = ("teacher", "counsellor", "school_admin")
_EMAIL = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,189}\.[^@\s]{2,63}$")


class StaffAdminError(Exception):
    """A request the admin can fix (shown as one line)."""


@dataclass(frozen=True)
class StaffRow:
    id: UUID
    email: str
    role: str
    status: str  # invited, active, locked or disabled
    mfa: bool
    classes: int


def check_dashboard_url(url: str) -> str:
    """The dashboard address for email links: https, or http only on this computer (development)."""
    url = url.rstrip("/")
    parts = urlsplit(url)
    local = parts.hostname in ("localhost", "127.0.0.1")
    if parts.scheme != "https" and not (parts.scheme == "http" and local):
        raise StaffAdminError("DASHBOARD_URL must be an https address (http only for localhost)")
    return url


def _audit(conn: Connection, action: str, staff_id: UUID) -> None:
    conn.execute(
        text("INSERT INTO audit_log (actor, action, object) VALUES (:a, :act, :o)"),
        {"a": ACTOR, "act": action, "o": f"staff:{staff_id}"},
    )


def _email_of(conn: Connection, staff_id: UUID) -> str:
    email = conn.execute(
        text("SELECT email FROM staff_user WHERE id = :id"), {"id": staff_id}
    ).scalar_one_or_none()
    if email is None:
        raise StaffAdminError(f"no staff member with id {staff_id}")
    return str(email)


def _revoke_sessions(conn: Connection, staff_id: UUID) -> None:
    conn.execute(
        text("UPDATE staff_session SET revoked_at = now() WHERE staff_id = :id AND revoked_at IS NULL"),
        {"id": staff_id},
    )


def _send_link(conn: Connection, staff_id: UUID, email: str, purpose: str, dashboard_url: str) -> None:
    """Every older link stops working, then a new one is emailed."""
    conn.execute(
        text("UPDATE password_reset SET used_at = now() WHERE staff_id = :id AND used_at IS NULL"),
        {"id": staff_id},
    )
    token = sa.new_link_token()
    minutes = sa.INVITE_HOURS * 60 if purpose == "invite" else sa.RESET_MINUTES
    conn.execute(
        text(
            "INSERT INTO password_reset (token_hash, staff_id, purpose, expires_at) "
            "VALUES (:h, :id, :p, now() + make_interval(mins => :m))"
        ),
        {"h": sa.token_digest(token), "id": staff_id, "p": purpose, "m": minutes},
    )
    template = "staff_invite" if purpose == "invite" else "staff_reset"
    mail.queue(conn, email, template, f"{check_dashboard_url(dashboard_url)}/reset#token={token}")


def add_staff(
    conn: Connection, email: str, role: str, school_id: UUID | None, class_ids: list[UUID], dashboard_url: str
) -> UUID:
    """A new staff account with no password, its classes, and an invite email. Returns the staff id."""
    email = email.strip().lower()
    if not _EMAIL.match(email) or len(email) > 254:
        raise StaffAdminError("that does not look like an email address")
    if role not in ROLES:
        raise StaffAdminError(f"role must be one of: {', '.join(ROLES)}")
    if role in SCHOOL_ROLES and school_id is None:
        raise StaffAdminError(f"a {role} needs --school")
    if conn.execute(text("SELECT 1 FROM staff_user WHERE email = :e"), {"e": email}).first():
        raise StaffAdminError("a staff account with that email already exists")
    staff_id: UUID = conn.execute(
        text(
            "INSERT INTO staff_user (school_id, email, password_hash, role) "
            "VALUES (:s, :e, :p, :r) RETURNING id"
        ),
        {"s": school_id if role in SCHOOL_ROLES else None, "e": email, "p": sa.NO_PASSWORD, "r": role},
    ).scalar_one()
    for class_id in class_ids:
        assign_class(conn, staff_id, class_id)
    _send_link(conn, staff_id, email, "invite", dashboard_url)
    _audit(conn, "staff.add", staff_id)
    return staff_id


def invite_again(conn: Connection, staff_id: UUID, dashboard_url: str) -> None:
    """A new invite link (the old one stops working), for a link that expired or never arrived."""
    _send_link(conn, staff_id, _email_of(conn, staff_id), "invite", dashboard_url)
    _audit(conn, "staff.invite_again", staff_id)


def force_reset(conn: Connection, staff_id: UUID, dashboard_url: str) -> None:
    """The current password stops working now, every session ends, and a reset link is emailed."""
    email = _email_of(conn, staff_id)
    conn.execute(
        text("UPDATE staff_user SET password_hash = :p WHERE id = :id"), {"p": sa.NO_PASSWORD, "id": staff_id}
    )
    _revoke_sessions(conn, staff_id)
    _send_link(conn, staff_id, email, "reset", dashboard_url)
    _audit(conn, "staff.force_reset", staff_id)


def set_disabled(conn: Connection, staff_id: UUID, disabled: bool) -> None:
    _email_of(conn, staff_id)
    conn.execute(
        text("UPDATE staff_user SET disabled_at = CASE WHEN :d THEN now() ELSE NULL END WHERE id = :id"),
        {"d": disabled, "id": staff_id},
    )
    if disabled:
        _revoke_sessions(conn, staff_id)
    _audit(conn, "staff.disable" if disabled else "staff.enable", staff_id)


def reset_mfa(conn: Connection, staff_id: UUID) -> None:
    """For a lost or replaced phone: the authenticator is forgotten, every session ends, and the next
    sign-in sets up a new one. Check who is asking before running this (in person or by phone)."""
    _email_of(conn, staff_id)
    conn.execute(
        text("UPDATE staff_user SET mfa_secret_encrypted = NULL, mfa_last_step = NULL WHERE id = :id"),
        {"id": staff_id},
    )
    _revoke_sessions(conn, staff_id)
    _audit(conn, "staff.mfa_reset", staff_id)


def assign_class(conn: Connection, staff_id: UUID, class_id: UUID) -> None:
    """Only classes of the staff member's own school (FR-78)."""
    same_school = conn.execute(
        text(
            "SELECT 1 FROM staff_user u JOIN school_class c ON c.school_id = u.school_id "
            "WHERE u.id = :s AND c.id = :c"
        ),
        {"s": staff_id, "c": class_id},
    ).first()
    if same_school is None:
        raise StaffAdminError("that class is not in this staff member's school")
    conn.execute(
        text("INSERT INTO staff_class (staff_id, class_id) VALUES (:s, :c) ON CONFLICT DO NOTHING"),
        {"s": staff_id, "c": class_id},
    )
    conn.execute(
        text("INSERT INTO audit_log (actor, action, object) VALUES (:a, 'staff.assign_class', :o)"),
        {"a": ACTOR, "o": f"staff:{staff_id}:class:{class_id}"},
    )


def unassign_class(conn: Connection, staff_id: UUID, class_id: UUID) -> None:
    conn.execute(
        text("DELETE FROM staff_class WHERE staff_id = :s AND class_id = :c"), {"s": staff_id, "c": class_id}
    )
    conn.execute(
        text("INSERT INTO audit_log (actor, action, object) VALUES (:a, 'staff.unassign_class', :o)"),
        {"a": ACTOR, "o": f"staff:{staff_id}:class:{class_id}"},
    )


def list_staff(conn: Connection, school_id: UUID | None) -> list[StaffRow]:
    """Staff of one school, or the team accounts (admin, researcher) when school_id is None."""
    rows = conn.execute(
        text(
            """
            SELECT u.id, u.email, u.role, u.password_hash = :none AS invited,
                   u.disabled_at IS NOT NULL AS disabled, coalesce(u.locked_until > now(), false) AS locked,
                   u.mfa_secret_encrypted IS NOT NULL AS mfa,
                   (SELECT count(*) FROM staff_class sc WHERE sc.staff_id = u.id) AS classes
            FROM staff_user u
            WHERE u.school_id IS NOT DISTINCT FROM :s
            ORDER BY u.email
            """
        ),
        {"s": school_id, "none": sa.NO_PASSWORD},
    ).all()
    return [
        StaffRow(
            id=r.id,
            email=r.email,
            role=r.role,
            status="disabled"
            if r.disabled
            else "locked"
            if r.locked
            else "invited"
            if r.invited
            else "active",
            mfa=bool(r.mfa),
            classes=int(r.classes),
        )
        for r in rows
    ]
