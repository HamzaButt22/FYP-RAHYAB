"""Staff sign-in building blocks (FR-71, FR-106, NFR-40; docs/security/SECURITY.md §5).

Staff sign in with email and password, then a 6-digit code from an authenticator app (TOTP, RFC 6238). The
dashboard session is a random token in a `__Host-` cookie (HttpOnly, Secure, SameSite=Strict); only its
SHA-256 is stored (staff_session). Changes also need a CSRF token tied to the session.

- Passwords: argon2id, 64 MB, 3 iterations, parallelism 1 (DATA_GOVERNANCE.md §4). 12 to 128 characters,
  not a common password, not containing the email name. A full breached-password check would mean sending
  hashes to an outside
  service, so it is not done; the short list below catches the most common choices.
- Authenticator keys: 160-bit, envelope-encrypted with the master key file (restricted.py) and bound to the
  staff id, so a copy of the database or a backup cannot produce codes. Losing the master key means every
  staff member sets up their authenticator again (admin command `staff-mfa-reset`).
- Codes: one step (30 s) either side is accepted, and never a step at or before the last one used.
- Sessions end after 30 minutes without use or 8 hours in all; the code step must be finished within 10.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
from dataclasses import dataclass
from typing import Annotated
from urllib.parse import quote
from uuid import UUID

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.twofactor.hotp import HOTP
from fastapi import Depends, Request
from sqlalchemy import text

from rahyaab_api import restricted
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError
from rahyaab_api.settings import Settings

SESSION_COOKIE = "__Host-rahyaab_session"
CSRF_HEADER = "X-CSRF-Token"
IDLE_MINUTES = 30
SESSION_HOURS = 8
CHALLENGE_MINUTES = 10
RESET_MINUTES = 30
INVITE_HOURS = 72
STEP_SECONDS = 30
ISSUER = "Rahyaab"
# Not a valid argon2 hash, so nothing ever matches it: an invited account has no password until the invite
# link is used, and nobody (an admin included) ever sets one for someone else.
NO_PASSWORD = "!"  # noqa: S105 - a marker that no password matches, not a password

_hasher = PasswordHasher(time_cost=3, memory_cost=64 * 1024, parallelism=1)
# Checked when an email is unknown, so a wrong email takes as long as a wrong password.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))
_TOKEN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"  # noqa: S105 - alphabet
_COMMON = frozenset(
    {
        "password1234",
        "password12345",
        "password123456",
        "passwordpassword",
        "123456789012",
        "1234567890123",
        "12345678901234",
        "qwertyuiop12",
        "qwerty123456",
        "qwertyuiopasdf",
        "1q2w3e4r5t6y",
        "iloveyou1234",
        "welcome12345",
        "letmein12345",
        "admin1234567",
        "administrator",
        "teacher12345",
        "teacher123456",
        "school123456",
        "abcdefghijkl",
        "abc123456789",
        "pakistan1234",
        "pakistan12345",
        "pakistan123456",
        "rahyaab12345",
        "rahyaab123456",
        "changeme1234",
        "football1234",
        "princess1234",
        "sunshine1234",
    }
)


# ------------------------------------------------------------------------------------------ passwords
def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(stored: str, password: str) -> bool:
    try:
        return _hasher.verify(stored, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(stored: str) -> bool:
    """True when a stored hash uses older argon2 settings (it is replaced at the next good sign-in)."""
    try:
        return _hasher.check_needs_rehash(stored)
    except InvalidHashError:
        return False


def burn_time() -> None:
    """The cost of one password check, spent when there is no account to check against."""
    verify_password(_DUMMY_HASH, "not the password")


def password_problems(password: str, email: str) -> list[str]:
    """[] when the password may be used, else one field-error code (too_short, too_long, common,
    contains_email)."""
    if len(password) < 12:
        return ["too_short"]
    if len(password) > 128:
        return ["too_long"]
    lowered = password.lower()
    name = email.split("@", 1)[0].lower()
    if len(name) >= 4 and name in lowered:
        return ["contains_email"]
    if lowered in _COMMON or len(set(lowered)) <= 3 or lowered.isdigit():
        return ["common"]
    return []


def lockout_minutes(failed: int) -> int:
    """How long an account is locked after `failed` wrong passwords in a row: none before 5, then 15
    minutes, doubling each time, at most a day (NFR-40)."""
    if failed < 5:
        return 0
    return int(min(15 * 2 ** (failed - 5), 24 * 60))


# ------------------------------------------------------------------------------ links and sessions
def new_link_token() -> str:
    """22 characters from 62 (about 131 bits) for invite and reset links (openapi: ^[0-9A-Za-z]{22}$)."""
    return "".join(secrets.choice(_TOKEN_ALPHABET) for _ in range(22))


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def csrf_for(signing_key: str, session_id: UUID) -> str:
    mac = hmac.new(signing_key.encode("utf-8"), b"csrf:" + session_id.bytes, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(mac).decode("ascii").rstrip("=")


# ------------------------------------------------------------------------------- one-time codes
def new_totp_secret() -> bytes:
    return os.urandom(20)


def setup_key(secret: bytes) -> str:
    """The key typed into an authenticator app (base32, no padding)."""
    return base64.b32encode(secret).decode("ascii").rstrip("=")


def secret_from_setup_key(key: str) -> bytes:
    return base64.b32decode(key + "=" * (-len(key) % 8))


def otpauth_uri(secret: bytes, email: str) -> str:
    label = f"{ISSUER}:{quote(email, safe='')}"
    return (
        f"otpauth://totp/{label}?secret={setup_key(secret)}&issuer={ISSUER}&algorithm=SHA1&digits=6&period=30"
    )


def totp_at(secret: bytes, step: int) -> str:
    # RFC 6238 authenticator apps use HMAC-SHA1; HMAC is not weakened by SHA-1 collisions.
    return HOTP(secret, 6, hashes.SHA1()).generate(step).decode("ascii")  # noqa: S303


def match_totp(secret: bytes, code: str, now: float, last_step: int | None) -> int | None:
    """The step `code` belongs to (now, or one step either side), or None. A step at or before
    `last_step` never matches, so each code works once."""
    current = int(now // STEP_SECONDS)
    found = None
    for step in (current - 1, current, current + 1):
        # Every candidate is compared, in constant time, whatever matched before.
        if hmac.compare_digest(totp_at(secret, step), code) and (last_step is None or step > last_step):
            found = step
    return found


def _aad(staff_id: UUID) -> bytes:
    return b"staff-mfa:" + staff_id.bytes


def seal_secret(secret: bytes, master_key: bytes, staff_id: UUID) -> bytes:
    return restricted.seal(secret, master_key, _aad(staff_id))


def open_secret(sealed: bytes, master_key: bytes, staff_id: UUID) -> bytes:
    """Raises InvalidTag for another master key, another staff member or a changed row."""
    return restricted.open_sealed(sealed, master_key, _aad(staff_id))


def master_key(request: Request) -> bytes:
    """The master key, read once from DATA_KEY_WRAPPER_FILE. Without it, the code step answers 503: no
    authenticator key is ever stored unencrypted or under a weaker key."""
    key: bytes | None = getattr(request.app.state, "master_key", None)
    if key is None:
        settings: Settings = request.app.state.settings
        try:
            key = restricted.load_master_key(settings.data_key_wrapper_file)
        except restricted.MasterKeyError:
            raise ProblemError(503, "unavailable", "The service is not ready") from None
        request.app.state.master_key = key
    return key


# ------------------------------------------------------------------------------ who is calling
@dataclass(frozen=True)
class CurrentStaff:
    staff_id: UUID
    session_id: UUID
    email: str
    role: str
    school_id: UUID | None


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def signed_out() -> ProblemError:
    return ProblemError(401, "unauthorized", "Please sign in again")


def current_staff(request: Request) -> CurrentStaff:
    """The signed-in staff member. Anything wrong with the session (none, unknown, code step not done,
    signed out, idle too long, too old, account disabled) gets the same 401."""
    token = request.cookies.get(SESSION_COOKIE, "")
    if not token or len(token) > 64:
        raise signed_out()
    with get_engine(request).begin() as conn:
        row = conn.execute(
            text(
                """
                UPDATE staff_session s SET last_seen_at = now()
                FROM staff_user u
                WHERE s.token_hash = :h AND u.id = s.staff_id
                  AND s.mfa_passed_at IS NOT NULL AND s.revoked_at IS NULL AND s.expires_at > now()
                  AND s.last_seen_at > now() - make_interval(mins => :idle) AND u.disabled_at IS NULL
                RETURNING s.id, u.id, u.email, u.role, u.school_id
                """
            ),
            {"h": token_digest(token), "idle": IDLE_MINUTES},
        ).first()
    if row is None:
        raise signed_out()
    return CurrentStaff(staff_id=row[1], session_id=row[0], email=row[2], role=row[3], school_id=row[4])


def require_csrf(
    request: Request,
    staff: Annotated[CurrentStaff, Depends(current_staff)],
    settings: Annotated[Settings, Depends(_settings)],
) -> CurrentStaff:
    """For every route that changes something: the X-CSRF-Token header must match the session's token
    (from GET /auth/staff/me). SameSite=Strict already stops most cross-site requests; this is the second
    layer (NFR-69)."""
    sent = request.headers.get(CSRF_HEADER, "")
    if not hmac.compare_digest(
        sent.encode("utf-8"), csrf_for(settings.jwt_signing_key, staff.session_id).encode("ascii")
    ):
        raise ProblemError(403, "csrf_failed", "Please reload the page and try again")
    return staff
