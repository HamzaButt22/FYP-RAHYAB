"""Student sign-in: join with a class code (POST /v1/auth/student/join) and refresh (POST /v1/auth/refresh).

Contract: docs/api/openapi.yaml `joinWithClassCode` and `refreshTokens`. Rules: FR-03, FR-04, FR-05a,
FR-100, FR-102, FR-107, NFR-39, NFR-44, NFR-67, NFR-74, ADR-0011 and ADR-0015.
Tests: tests/test_join_rules.py, test_join_validation.py, test_join_api.py, test_device_keys.py,
test_refresh_api.py.

Join: order of checks, chosen so that failures reveal and store as little as possible:
1. Request shape (Pydantic, strict, extra fields forbidden) -> 422 with errors[].
2. Age: under 13 by the student's own answer -> 422 age_out_of_range, before anything touches the database.
3. Rate limits per device key (10 / 15 min) and per IP (300 / 15 min) -> 429.
4. Unknown or expired class codes and bad claim codes get the same generic 404 (NFR-74).
5. The school must hold an active pilot or institution licence -> otherwise 403 (FR-107). A seat is used
   only when consent is granted (a claimed slip), so unconsented joins cannot use up a school's seats.
6. A class with 30 failed claim codes this hour stops accepting claim codes for the rest of the hour;
   joining without a claim code still works (one student cannot block a class).
7. One transaction creates the student, device, refresh token and consent records.

Age assurance (FR-100, docs/security/AGE_ASSURANCE.md): the student's own birth-year answer only stops
under-13s and sets a provisional band. Consent is granted only by a recorded paper slip, and the teacher
copies the age band from the school's admission register when recording it; that band wins. A mismatch
raises an `age_mismatch` flag for the teacher.

Refresh: the old token is single use and the request must be signed with the device key (device_keys.py).
- Wrong signature (a copied token, TC-SEC-18): the whole token family is revoked.
- Second use with the right signature: if it comes within the grace period and nothing newer in the family
  has been used, it is the same phone retrying after a lost response, so it gets a fresh pair and the
  undelivered pair is revoked. Otherwise the family is revoked (TC-ONB-10).
Every refusal is the same 401.
"""

import json
from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy import Connection, Engine, text
from sqlalchemy.engine import Row

from rahyaab_api.db import get_engine
from rahyaab_api.device_keys import load_public_key, verify_refresh_signature
from rahyaab_api.join_rules import (
    MIN_AGE,
    PAKISTAN,
    age_band,
    age_in_months,
    clean_nickname,
    nickname_problem,
)
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.ratelimit import Limit, digest, enforce, hit, peek
from rahyaab_api.settings import Settings
from rahyaab_api.tokens import access_token, new_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

DEVICE_LIMIT = Limit("join:dev", 10, 15 * 60)
IP_LIMIT = Limit("join:ip", 300, 15 * 60)
CLAIM_FAILURES = Limit("join:claimfail", 30, 60 * 60)  # per class
REFRESH_IP_LIMIT = Limit("refresh:ip", 300, 60)  # the general ceiling (docs/api/README.md §3)

ConsentState = Literal["pending", "granted", "withdrawn"]


class DeviceInfo(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    device_tier: Literal["low", "mid", "high"]
    os_major: int = Field(ge=8, le=30)
    app_version: str = Field(min_length=1, max_length=16)
    public_key: str = Field(min_length=16, max_length=200)
    integrity_token: str | None = Field(default=None, max_length=4096)

    @field_validator("public_key")
    @classmethod
    def _p256(cls, value: str) -> str:
        # A key the server cannot use would make every later refresh fail, so refuse it at join.
        if load_public_key(value) is None:
            raise PydanticCustomError("format", "public_key must be a base64 DER EC P-256 key")
        return value


class JoinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    class_code: str = Field(pattern=r"^[A-Z]{3}-[A-Z0-9]{3}$")
    grade: int = Field(ge=8, le=12)  # the app's picker; the server stores the class's own grade
    birth_year: int = Field(ge=1950, le=9999)
    birth_month: int = Field(ge=1, le=12)
    claim_code: str | None = Field(default=None, pattern=r"^[A-Z0-9]{4}-[A-Z0-9]{4}$")
    nickname: str = Field(max_length=100)
    lang: Literal["ur", "en"]
    device: DeviceInfo

    @field_validator("nickname")
    @classmethod
    def _nickname(cls, value: str) -> str:
        cleaned = clean_nickname(value)
        problem = nickname_problem(cleaned)
        if problem:
            raise PydanticCustomError(problem, "nickname is not allowed")
        return cleaned


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    student_id: UUID
    consent_state: ConsentState


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    refresh_token: str = Field(min_length=20, max_length=100)
    signature: str = Field(
        min_length=16,
        max_length=200,
        description="base64 DER SHA256withECDSA over 'rahyaab-refresh-v1:' + refresh_token (device_keys.py)",
    )


class _CodeRejected(Exception):
    """Internal: unknown or expired class code (rolled back)."""


class _ClaimRejected(Exception):
    """Internal: a claim code that is unknown, unrecorded, used, expired or from another class."""

    def __init__(self, class_id: UUID) -> None:
        super().__init__("claim rejected")
        self.class_id = class_id


def app_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def _not_accepted() -> ProblemError:
    # One message for unknown and expired class codes and every bad claim code (forms-and-errors.md §2, §4).
    return ProblemError(
        404,
        "code_not_accepted",
        "That code didn't work",
        errors=[field_error("class_code", "not_accepted")],
    )


def _no_school_access() -> ProblemError:
    # Only reachable with a valid class code, so it reveals nothing a student doesn't already have.
    return ProblemError(
        403,
        "school_access_inactive",
        "Your school's Rahyaab access isn't active right now. Please tell your teacher.",
        errors=[field_error("class_code", "access_inactive")],
    )


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _store_refresh_token(
    conn: Connection, settings: Settings, device_id: UUID, family_id: UUID | None
) -> str:
    """Stores a new refresh token (only its hash) and returns the token for the app.

    `family_id=None` starts a new family (at join); a refresh continues the old family.
    """
    token, token_hash = new_refresh_token()
    conn.execute(
        text(
            """
            INSERT INTO refresh_token (device_id, family_id, token_hash, expires_at)
            VALUES (:d, COALESCE(CAST(:f AS uuid), gen_random_uuid()), :h,
                    now() + make_interval(days => :days))
            """
        ),
        {"d": device_id, "f": family_id, "h": token_hash, "days": settings.refresh_token_days},
    )
    return token


# ------------------------------------------------------------------------------------------------ join
@router.post("/student/join", status_code=201, response_model=TokenPair)
def join_with_class_code(
    body: JoinRequest,
    request: Request,
    settings: Annotated[Settings, Depends(app_settings)],
) -> TokenPair:
    months = age_in_months(body.birth_year, body.birth_month, datetime.now(PAKISTAN).date())
    if months < MIN_AGE * 12:
        # The neutral stop: one code for every out-of-range age; nothing is stored (FR-04, TC-EDGE-06).
        raise ProblemError(
            422,
            "age_out_of_range",
            "Rahyaab is for students aged 13 and over",
            errors=[field_error("birth_year", "age_out_of_range")],
        )
    declared_band = age_band(months // 12)

    engine = get_engine(request)
    enforce(engine, DEVICE_LIMIT, body.device.public_key)
    enforce(engine, IP_LIMIT, _client_ip(request))

    try:
        return _create_profile(engine, settings, body, declared_band)
    except _CodeRejected:
        raise _not_accepted() from None
    except _ClaimRejected as rejected:
        count_claim_failure(engine, rejected.class_id)
        raise _not_accepted() from None


def _create_profile(engine: Engine, settings: Settings, body: JoinRequest, declared_band: str) -> TokenPair:
    with engine.begin() as conn:
        school_class = conn.execute(
            text(
                """
                SELECT c.id, c.school_id, c.grade, s.board
                FROM school_class c JOIN school s ON s.id = c.school_id
                WHERE c.code_hash = :h AND c.code_expires_at > now()
                """
            ),
            {"h": digest(body.class_code)},
        ).one_or_none()
        if school_class is None:
            raise _CodeRejected

        # Joining needs an active licence; a seat is used only when consent is granted (a claimed slip).
        seats = _active_licence_seats(conn, school_class.school_id)

        student_id: UUID = conn.execute(
            text(
                """
                INSERT INTO student (class_id, nickname, grade, board, age_band, age_verified)
                VALUES (:class_id, :nickname, :grade, :board, :band, false) RETURNING id
                """
            ),
            {
                "class_id": school_class.id,
                "nickname": body.nickname,
                "grade": school_class.grade,  # the class's own grade, not the picker (wrong mode otherwise)
                "board": school_class.board,
                "band": declared_band,  # provisional until a recorded slip brings the register's band
            },
        ).scalar_one()
        device_id: UUID = conn.execute(
            text(
                """
                INSERT INTO device (student_id, device_tier, os_major, public_key, app_version)
                VALUES (:s, :tier, :os, :key, :ver) RETURNING id
                """
            ),
            {
                "s": student_id,
                "tier": body.device.device_tier,
                "os": body.device.os_major,
                "key": body.device.public_key,
                "ver": body.device.app_version,
            },
        ).scalar_one()
        refresh = _store_refresh_token(conn, settings, device_id, family_id=None)

        consent_state: ConsentState = "pending"
        if body.claim_code:
            claim_slip(
                engine, conn, school_class.id, school_class.school_id, seats, student_id, body.claim_code
            )
            consent_state = "granted"

    return TokenPair(
        access_token=access_token(settings, student_id, device_id),
        refresh_token=refresh,
        expires_in=settings.access_token_minutes * 60,
        student_id=student_id,
        consent_state=consent_state,
    )


def _active_licence_seats(conn: Connection, school_id: UUID) -> int | None:
    """Seats of the school's active pilot or institution licence (None = unlimited); 403 without one (FR-107).

    The licence row is locked, so concurrent consents are counted one at a time: seats are never over-sold.
    """
    licence = conn.execute(
        text(
            """
            SELECT id, seats FROM licence
            WHERE school_id = :s AND kind IN ('pilot', 'institution')
              AND starts_at <= now() AND ends_at > now()
            ORDER BY seats IS NOT NULL, seats DESC
            LIMIT 1
            FOR UPDATE
            """
        ),
        {"s": school_id},
    ).one_or_none()
    if licence is None:
        raise _no_school_access()
    seats: int | None = licence.seats
    return seats


def _seat_is_free(conn: Connection, school_id: UUID, seats: int | None) -> bool:
    """A seat is used by a student with active parent or self consent, never by an unconsented join."""
    if seats is None:
        return True
    used = conn.execute(
        text(
            """
            SELECT count(DISTINCT st.id) FROM student st
            JOIN school_class c ON c.id = st.class_id
            JOIN consent co ON co.student_id = st.id
                           AND co.type IN ('parent', 'self') AND co.withdrawn_at IS NULL
            WHERE c.school_id = :s
            """
        ),
        {"s": school_id},
    ).scalar_one()
    return int(used) < seats


def claim_slip(
    engine: Engine,
    conn: Connection,
    class_id: UUID,
    school_id: UUID,
    seats: int | None,
    student_id: UUID,
    claim_code: str,
) -> None:
    """Binds a recorded consent slip to a student (at join, or later through /consents:claim).

    Raises _ClaimRejected (counted per class by the caller) or the 403 when no seat is free. The register's
    age band replaces the student's own answer; a disagreement raises an `age_mismatch` flag.
    """
    failures = peek(engine, f"{CLAIM_FAILURES.name}:{class_id}", CLAIM_FAILURES.window_s)[0]
    if failures >= CLAIM_FAILURES.max_hits:
        raise _not_accepted()  # paused, not counted again; joining without a claim code still works
    if not _seat_is_free(conn, school_id, seats):
        raise _no_school_access()
    slip = conn.execute(
        text(
            """
            UPDATE consent_slip SET claimed_at = now()
            WHERE claim_code_hash = :h AND class_id = :c AND claimed_at IS NULL
              AND recorded_at IS NOT NULL AND expires_at > now()
            RETURNING id, kind, verified_age_band, recorded_by, notice_version, research_opt_in
            """
        ),
        {"h": digest(claim_code), "c": class_id},
    ).one_or_none()
    if slip is None:
        raise _ClaimRejected(class_id)

    declared_band = conn.execute(
        text("SELECT age_band FROM student WHERE id = :s"), {"s": student_id}
    ).scalar_one()
    conn.execute(
        text("UPDATE student SET age_band = :b, age_verified = true WHERE id = :s"),
        {"b": slip.verified_age_band, "s": student_id},
    )
    _record_slip_consent(conn, student_id, slip)
    if declared_band != slip.verified_age_band:
        conn.execute(
            text(
                "INSERT INTO flag (student_id, type, details) VALUES (:s, 'age_mismatch', CAST(:d AS jsonb))"
            ),
            {
                "s": student_id,
                "d": json.dumps({"declared_band": declared_band, "verified_band": slip.verified_age_band}),
            },
        )


def count_claim_failure(engine: Engine, class_id: UUID) -> None:
    failures, _ = hit(engine, f"{CLAIM_FAILURES.name}:{class_id}", CLAIM_FAILURES.window_s)
    if failures == CLAIM_FAILURES.max_hits:
        _audit(engine, "claim_codes.paused", f"class:{class_id}")


def _record_slip_consent(conn: Connection, student_id: UUID, slip: Row[tuple[object, ...]]) -> None:
    # Form A (kind 'parent') is a parent's consent; Form C (kind 'self') is an adult student's own consent.
    # Both are school forms recorded by a teacher: method 'school_form', with the slip and the teacher.
    types = [slip.kind] + (["research"] if slip.research_opt_in else [])
    for consent_type in types:
        conn.execute(
            text(
                """
                INSERT INTO consent (student_id, type, method, notice_version, recorded_by, slip_id)
                VALUES (:s, :t, 'school_form', :v, :by, :slip)
                """
            ),
            {
                "s": student_id,
                "t": consent_type,
                "v": slip.notice_version,
                "by": slip.recorded_by,
                "slip": slip.id,
            },
        )


def _audit(engine: Engine, action: str, obj: str) -> None:
    # The teacher notification reads these entries (dashboard work, FYP-2).
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO audit_log (actor, action, object) VALUES ('system:join', :a, :o)"),
            {"a": action, "o": obj},
        )


# --------------------------------------------------------------------------------------------- refresh
def _unauthorized() -> ProblemError:
    # One answer for unknown, expired, revoked, reused and wrongly signed tokens.
    return ProblemError(401, "unauthorized", "Please sign in again")


def _consent_state(conn: Connection, student_id: UUID) -> ConsentState:
    row = conn.execute(
        text(
            """
            SELECT bool_or(withdrawn_at IS NULL) AS active, count(*) AS total
            FROM consent WHERE student_id = :s AND type IN ('parent', 'self')
            """
        ),
        {"s": student_id},
    ).one()
    if row.active:
        return "granted"
    return "withdrawn" if row.total else "pending"


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(
    body: RefreshRequest,
    request: Request,
    settings: Annotated[Settings, Depends(app_settings)],
) -> TokenPair:
    engine = get_engine(request)
    enforce(engine, REFRESH_IP_LIMIT, _client_ip(request))

    pair: TokenPair | None = None
    with engine.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT rt.id, rt.family_id, rt.device_id, rt.used_at, rt.revoked_at,
                       rt.expires_at > now() AS live,
                       rt.used_at > now() - make_interval(secs => :grace) AS used_recently,
                       NOT EXISTS (SELECT 1 FROM refresh_token o
                                   WHERE o.family_id = rt.family_id AND o.used_at > rt.used_at)
                         AS newest_used,
                       d.public_key, d.student_id
                FROM refresh_token rt JOIN device d ON d.id = rt.device_id
                WHERE rt.token_hash = :h
                FOR UPDATE OF rt
                """
            ),
            {"h": digest(body.refresh_token), "grace": settings.refresh_reuse_grace_seconds},
        ).one_or_none()

        if row is None or row.revoked_at is not None or not row.live:
            pass  # unknown, revoked or expired: refuse
        elif not verify_refresh_signature(row.public_key, body.refresh_token, body.signature):
            _revoke_family(conn, row.family_id)  # a copied token used on another device (TC-SEC-18)
        elif row.used_at is not None and not (row.used_recently and row.newest_used):
            _revoke_family(conn, row.family_id)  # an old token used again (TC-ONB-10)
        else:
            if row.used_at is None:
                conn.execute(text("UPDATE refresh_token SET used_at = now() WHERE id = :i"), {"i": row.id})
            else:
                # The same phone retrying after it lost the response: the pair it never received is revoked.
                conn.execute(
                    text(
                        "UPDATE refresh_token SET revoked_at = now() "
                        "WHERE family_id = :f AND used_at IS NULL AND revoked_at IS NULL"
                    ),
                    {"f": row.family_id},
                )
            conn.execute(
                text("UPDATE student SET last_active_at = now() WHERE id = :s"), {"s": row.student_id}
            )
            pair = TokenPair(
                access_token=access_token(settings, row.student_id, row.device_id),
                refresh_token=_store_refresh_token(conn, settings, row.device_id, row.family_id),
                expires_in=settings.access_token_minutes * 60,
                student_id=row.student_id,
                consent_state=_consent_state(conn, row.student_id),
            )

    if pair is None:  # raised after the commit, so a revocation is kept
        raise _unauthorized()
    return pair


def _revoke_family(conn: Connection, family_id: UUID) -> None:
    conn.execute(
        text("UPDATE refresh_token SET revoked_at = now() WHERE family_id = :f AND revoked_at IS NULL"),
        {"f": family_id},
    )
