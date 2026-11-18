"""Staff sign-in, two-step code, sign-out and password reset (FR-71, FR-106, NFR-40; SECURITY.md §5).

    POST /auth/staff/login                    email + password -> a challenge for the code step
    POST /auth/staff/mfa/setup                first sign-in only: a new authenticator key for the challenge
    POST /auth/staff/mfa                      the 6-digit code -> the session cookie
    GET  /auth/staff/me                       who is signed in, and the CSRF token for changes
    POST /auth/staff/logout                   ends this session (needs the CSRF token)
    POST /auth/staff/password-reset           always 202, same body (TC-SEC-10)
    POST /auth/staff/password-reset:confirm   new password with a link token (TC-SEC-11)

Wrong email and wrong password get the same 401 with the same timing. Every sign-in, setup, sign-out and
password change is written to the audit log (FR-83).
"""

from __future__ import annotations

import time
from datetime import timedelta
from typing import Annotated
from uuid import UUID

from cryptography.exceptions import InvalidTag
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Connection, text

from rahyaab_api import mail
from rahyaab_api import staff_auth as sa
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.ratelimit import Limit, digest, enforce, too_many
from rahyaab_api.settings import Settings

router = APIRouter(prefix="/auth/staff", tags=["auth"])

LOGIN_EMAIL = Limit("staff_login_email", 5, 900)  # NFR-40: 5 per 15 minutes per identity
LOGIN_IP = Limit("staff_login_ip", 30, 900)  # a school shares one address; 30 still stops spraying
MFA_STAFF = Limit("staff_mfa_staff", 5, 900)
MFA_IP = Limit("staff_mfa_ip", 30, 900)
RESET_EMAIL = Limit("staff_reset_email", 3, 3600)  # FR-106: 3 per hour per email and per IP
RESET_IP = Limit("staff_reset_ip", 3, 3600)
CONFIRM_IP = Limit("staff_confirm_ip", 10, 3600)

EMAIL = r"^[^@\s]{1,64}@[^@\s]{1,189}\.[^@\s]{2,63}$"


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def _ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _audit(conn: Connection, request: Request, actor: str, action: str, staff_id: UUID) -> None:
    conn.execute(
        text("INSERT INTO audit_log (actor, action, object, ip_hash) VALUES (:a, :act, :o, :ip)"),
        {"a": actor, "act": action, "o": f"staff:{staff_id}", "ip": digest(_ip(request))},
    )


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EmailIn(_Strict):
    email: str = Field(max_length=254, pattern=EMAIL)

    @field_validator("email", mode="after")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.strip().lower()


class LoginIn(EmailIn):
    password: str = Field(min_length=12, max_length=128)


class LoginOut(BaseModel):
    mfa_challenge_id: str
    mfa_setup_required: bool


class ChallengeIn(_Strict):
    mfa_challenge_id: str = Field(min_length=20, max_length=64)


class MfaIn(ChallengeIn):
    code: str = Field(pattern=r"^[0-9]{6}$")


class SetupOut(BaseModel):
    setup_key: str
    otpauth_uri: str


class MeOut(BaseModel):
    email: str
    role: str
    school_id: UUID | None
    csrf_token: str


class ResetOut(BaseModel):
    message_key: str


class ConfirmIn(_Strict):
    token: str = Field(pattern=r"^[0-9A-Za-z]{22}$")
    new_password: str = Field(min_length=12, max_length=128)


def _sign_in_failed() -> ProblemError:
    return ProblemError(401, "sign_in_failed", "Wrong email or password")


def _challenge_expired() -> ProblemError:
    return ProblemError(401, "challenge_expired", "Please sign in again")


# ------------------------------------------------------------------------------------------- sign in
@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, request: Request) -> LoginOut:
    engine = get_engine(request)
    enforce(engine, LOGIN_IP, _ip(request))
    enforce(engine, LOGIN_EMAIL, body.email)
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, password_hash, disabled_at IS NOT NULL AS disabled,
                       ceil(extract(epoch FROM (locked_until - now())))::int AS locked_s,
                       mfa_secret_encrypted IS NOT NULL AS enrolled
                FROM staff_user WHERE email = :e
                """
            ),
            {"e": body.email},
        ).first()
    if row is None:
        sa.burn_time()
        raise _sign_in_failed()
    if row.locked_s is not None and row.locked_s > 0:
        raise too_many(row.locked_s)
    if not sa.verify_password(row.password_hash, body.password):
        # Committed before answering: raising inside the transaction would roll the count back.
        with engine.begin() as conn:
            failed = conn.execute(
                text(
                    "UPDATE staff_user SET failed_logins = LEAST(failed_logins + 1, 1000) "
                    "WHERE id = :id RETURNING failed_logins"
                ),
                {"id": row.id},
            ).scalar_one()
            minutes = sa.lockout_minutes(int(failed))
            if minutes:
                conn.execute(
                    text(
                        "UPDATE staff_user SET locked_until = now() + make_interval(mins => :m) "
                        "WHERE id = :id"
                    ),
                    {"m": minutes, "id": row.id},
                )
        raise _sign_in_failed()
    if row.disabled:
        raise _sign_in_failed()
    with engine.begin() as conn:
        new_hash = (
            sa.hash_password(body.password) if sa.needs_rehash(row.password_hash) else row.password_hash
        )
        conn.execute(
            text(
                "UPDATE staff_user SET failed_logins = 0, locked_until = NULL, password_hash = :h "
                "WHERE id = :id"
            ),
            {"h": new_hash, "id": row.id},
        )
        challenge = sa.new_session_token()
        conn.execute(
            text(
                "INSERT INTO staff_session (staff_id, token_hash, expires_at) "
                "VALUES (:id, :h, now() + make_interval(mins => :m))"
            ),
            {"id": row.id, "h": sa.token_digest(challenge), "m": sa.CHALLENGE_MINUTES},
        )
    return LoginOut(mfa_challenge_id=challenge, mfa_setup_required=not row.enrolled)


_CHALLENGE = text(
    """
    SELECT s.id AS session_id, u.id AS staff_id, u.email, u.mfa_secret_encrypted, u.mfa_last_step,
           s.mfa_pending_secret
    FROM staff_session s JOIN staff_user u ON u.id = s.staff_id
    WHERE s.token_hash = :h AND s.mfa_passed_at IS NULL AND s.revoked_at IS NULL AND s.expires_at > now()
      AND u.disabled_at IS NULL
    """
)


@router.post("/mfa/setup", response_model=SetupOut)
def mfa_setup(body: ChallengeIn, request: Request) -> SetupOut:
    """First sign-in: a new authenticator key, kept with the challenge until its first code is entered.
    Asking again replaces it. Refused once an authenticator is set up (only an admin can reset that)."""
    engine = get_engine(request)
    enforce(engine, MFA_IP, _ip(request))
    with engine.begin() as conn:
        row = conn.execute(_CHALLENGE, {"h": sa.token_digest(body.mfa_challenge_id)}).first()
        if row is None:
            raise _challenge_expired()
        if row.mfa_secret_encrypted is not None:
            raise ProblemError(409, "mfa_already_set_up", "Your authenticator app is already set up")
        secret = sa.new_totp_secret()
        conn.execute(
            text("UPDATE staff_session SET mfa_pending_secret = :p WHERE id = :id"),
            {"p": sa.seal_secret(secret, sa.master_key(request), row.staff_id), "id": row.session_id},
        )
    return SetupOut(setup_key=sa.setup_key(secret), otpauth_uri=sa.otpauth_uri(secret, row.email))


@router.post("/mfa", status_code=204)
def mfa(body: MfaIn, request: Request) -> Response:
    engine = get_engine(request)
    enforce(engine, MFA_IP, _ip(request))
    with engine.connect() as conn:
        row = conn.execute(_CHALLENGE, {"h": sa.token_digest(body.mfa_challenge_id)}).first()
    if row is None:
        raise _challenge_expired()
    enforce(engine, MFA_STAFF, str(row.staff_id))
    sealed = row.mfa_secret_encrypted if row.mfa_secret_encrypted is not None else row.mfa_pending_secret
    if sealed is None:
        raise ProblemError(401, "mfa_setup_needed", "Set up your authenticator app first")
    try:
        secret = sa.open_secret(bytes(sealed), sa.master_key(request), row.staff_id)
    except InvalidTag:
        raise ProblemError(401, "mfa_setup_needed", "Ask your admin to reset your authenticator") from None
    step = sa.match_totp(secret, body.code, time.time(), row.mfa_last_step)
    wrong = ProblemError(401, "mfa_failed", "That code didn't work")
    if step is None:
        raise wrong
    enrolling = row.mfa_secret_encrypted is None
    token = sa.new_session_token()
    with engine.begin() as conn:
        # The step is claimed in the same statement that checks it, so two requests can't both use one code.
        claimed = conn.execute(
            text(
                "UPDATE staff_user SET mfa_last_step = :step, "
                "mfa_secret_encrypted = COALESCE(mfa_secret_encrypted, :pending) "
                "WHERE id = :id AND (mfa_last_step IS NULL OR mfa_last_step < :step) RETURNING id"
            ),
            {"step": step, "pending": bytes(sealed) if enrolling else None, "id": row.staff_id},
        ).first()
        if claimed is None:
            raise wrong
        # A new token for the signed-in session, so the challenge id is never a session (no fixation).
        conn.execute(
            text(
                "UPDATE staff_session SET token_hash = :h, mfa_passed_at = now(), mfa_pending_secret = NULL, "
                "last_seen_at = now(), expires_at = now() + make_interval(hours => :hours) WHERE id = :id"
            ),
            {"h": sa.token_digest(token), "hours": sa.SESSION_HOURS, "id": row.session_id},
        )
        if enrolling:
            _audit(conn, request, str(row.staff_id), "staff.mfa_enrolled", row.staff_id)
        _audit(conn, request, str(row.staff_id), "staff.login", row.staff_id)
    response = Response(status_code=204)
    response.set_cookie(
        sa.SESSION_COOKIE,
        token,
        max_age=int(timedelta(hours=sa.SESSION_HOURS).total_seconds()),
        path="/",
        secure=True,
        httponly=True,
        samesite="strict",
    )
    return response


@router.get("/me", response_model=MeOut)
def me(
    staff: Annotated[sa.CurrentStaff, Depends(sa.current_staff)],
    settings: Annotated[Settings, Depends(_settings)],
) -> MeOut:
    return MeOut(
        email=staff.email,
        role=staff.role,
        school_id=staff.school_id,
        csrf_token=sa.csrf_for(settings.jwt_signing_key, staff.session_id),
    )


@router.post("/logout", status_code=204)
def logout(request: Request, staff: Annotated[sa.CurrentStaff, Depends(sa.require_csrf)]) -> Response:
    with get_engine(request).begin() as conn:
        conn.execute(
            text("UPDATE staff_session SET revoked_at = now() WHERE id = :id"), {"id": staff.session_id}
        )
        _audit(conn, request, str(staff.staff_id), "staff.logout", staff.staff_id)
    response = Response(status_code=204)
    response.delete_cookie(sa.SESSION_COOKIE, path="/", secure=True, httponly=True, samesite="strict")
    return response


# ------------------------------------------------------------------------------------ password reset
@router.post("/password-reset", status_code=202, response_model=ResetOut)
def request_reset(
    body: EmailIn, request: Request, settings: Annotated[Settings, Depends(_settings)]
) -> ResetOut:
    """Always the same 202 and body. The email is queued, not sent, so the timing does not depend on whether
    the account exists (SECURITY.md §5.2)."""
    engine = get_engine(request)
    enforce(engine, RESET_IP, _ip(request))
    enforce(engine, RESET_EMAIL, body.email)
    with engine.begin() as conn:
        staff_id = conn.execute(
            text("SELECT id FROM staff_user WHERE email = :e AND disabled_at IS NULL"), {"e": body.email}
        ).scalar_one_or_none()
        if staff_id is not None:
            token = sa.new_link_token()
            conn.execute(
                text(
                    "INSERT INTO password_reset (token_hash, staff_id, purpose, expires_at) "
                    "VALUES (:h, :id, 'reset', now() + make_interval(mins => :m))"
                ),
                {"h": sa.token_digest(token), "id": staff_id, "m": sa.RESET_MINUTES},
            )
            # In the fragment (#), so the token never reaches a server log or a Referer header.
            mail.queue(conn, body.email, "staff_reset", f"{settings.dashboard_url}/reset#token={token}")
            _audit(conn, request, "anonymous", "staff.password_reset_requested", staff_id)
    return ResetOut(message_key="auth.reset.sent")


@router.post("/password-reset:confirm", status_code=204)
def confirm_reset(body: ConfirmIn, request: Request) -> Response:
    engine = get_engine(request)
    enforce(engine, CONFIRM_IP, _ip(request))
    invalid = ProblemError(400, "reset_link_invalid", "This link has expired or was already used")
    digest_ = sa.token_digest(body.token)
    with engine.connect() as conn:
        row = conn.execute(
            text(
                "SELECT r.staff_id, r.purpose, u.email "
                "FROM password_reset r JOIN staff_user u ON u.id = r.staff_id "
                "WHERE r.token_hash = :h AND r.used_at IS NULL AND r.expires_at > now() "
                "AND u.disabled_at IS NULL"
            ),
            {"h": digest_},
        ).first()
    if row is None:
        raise invalid
    problems = sa.password_problems(body.new_password, row.email)
    if problems:
        raise ProblemError(
            422, "validation_error", "Some fields need fixing", [field_error("new_password", problems[0])]
        )
    password_hash = sa.hash_password(body.new_password)
    with engine.begin() as conn:
        used = conn.execute(
            text(
                "UPDATE password_reset SET used_at = now() "
                "WHERE token_hash = :h AND used_at IS NULL RETURNING 1"
            ),
            {"h": digest_},
        ).first()
        if used is None:  # used by a parallel request a moment ago
            raise invalid
        conn.execute(
            text("UPDATE password_reset SET used_at = now() WHERE staff_id = :id AND used_at IS NULL"),
            {"id": row.staff_id},
        )
        conn.execute(
            text(
                "UPDATE staff_user SET password_hash = :p, failed_logins = 0, locked_until = NULL "
                "WHERE id = :id"
            ),
            {"p": password_hash, "id": row.staff_id},
        )
        conn.execute(
            text("UPDATE staff_session SET revoked_at = now() WHERE staff_id = :id AND revoked_at IS NULL"),
            {"id": row.staff_id},
        )
        if row.purpose == "reset":
            _audit(conn, request, str(row.staff_id), "staff.password_changed", row.staff_id)
            mail.queue(conn, row.email, "staff_password_changed")
        else:
            _audit(conn, request, str(row.staff_id), "staff.invite_accepted", row.staff_id)
    return Response(status_code=204)
