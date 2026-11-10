"""Student join with a class code (POST /v1/auth/student/join).

Contract: docs/api/openapi.yaml `joinWithClassCode`. Rules: FR-03, FR-04, FR-05a, FR-100, FR-102,
NFR-44, NFR-67, NFR-74 and ADR-0011. Tests: tests/test_join_rules.py, tests/test_join_api.py.

Order of checks, chosen so that failures reveal and store as little as possible:
1. Request shape (Pydantic, strict, extra fields forbidden) -> 422 with errors[].
2. Age: under 13 -> 422 age_out_of_range, before anything touches the database.
3. Rate limits per device key (10 / 15 min) and per IP (300 / 15 min) -> 429.
4. A class code with 30 failed attempts this hour is paused.
5. Unknown, expired or paused codes and bad claim codes all get the same generic 404 (NFR-74).
6. One transaction creates the student, device, refresh token and consent records.
"""

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy import Engine, text

from rahyaab_api.db import get_engine
from rahyaab_api.join_rules import (
    MIN_AGE,
    PAKISTAN,
    SELF_CONSENT_AGE,
    age_band,
    age_in_months,
    clean_nickname,
    nickname_problem,
)
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.ratelimit import Limit, digest, enforce, hit, peek
from rahyaab_api.settings import Settings
from rahyaab_api.tokens import access_token, new_refresh_token

router = APIRouter(prefix="/auth/student", tags=["auth"])

DEVICE_LIMIT = Limit("join:dev", 10, 15 * 60)
IP_LIMIT = Limit("join:ip", 300, 15 * 60)
CODE_FAILURES = Limit("join:codefail", 30, 60 * 60)


class DeviceInfo(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    device_tier: Literal["low", "mid", "high"]
    os_major: int = Field(ge=8, le=30)
    app_version: str = Field(min_length=1, max_length=16)
    public_key: str = Field(min_length=16, max_length=200)
    integrity_token: str | None = Field(default=None, max_length=4096)


class JoinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    class_code: str = Field(pattern=r"^[A-Z]{3}-[A-Z0-9]{3}$")
    grade: int = Field(ge=8, le=12)
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
    consent_state: Literal["pending", "granted", "withdrawn"]


class _CodeRejected(Exception):
    """Internal: the class code or claim code was not accepted (rolled back, then counted)."""


def app_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def _not_accepted() -> ProblemError:
    # One message for unknown, expired and paused codes and for bad claim codes (forms-and-errors.md §2, §4).
    return ProblemError(
        404,
        "code_not_accepted",
        "That code didn't work",
        errors=[field_error("class_code", "not_accepted")],
    )


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/join", status_code=201, response_model=TokenPair)
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
    years = months // 12

    engine = get_engine(request)
    enforce(engine, DEVICE_LIMIT, body.device.public_key)
    enforce(engine, IP_LIMIT, _client_ip(request))

    code_hash = digest(body.class_code)
    failures_key = f"{CODE_FAILURES.name}:{code_hash}"
    if peek(engine, failures_key, CODE_FAILURES.window_s)[0] >= CODE_FAILURES.max_hits:
        raise _not_accepted()  # paused: same answer as an unknown code

    try:
        result = _create_profile(engine, settings, body, code_hash, years)
    except _CodeRejected:
        failures, _ = hit(engine, failures_key, CODE_FAILURES.window_s)
        if failures == CODE_FAILURES.max_hits:
            _record_pause(engine, code_hash)
        raise _not_accepted() from None
    return result


def _create_profile(
    engine: Engine, settings: Settings, body: JoinRequest, code_hash: str, years: int
) -> TokenPair:
    adult = years >= SELF_CONSENT_AGE
    with engine.begin() as conn:
        school_class = conn.execute(
            text(
                """
                SELECT c.id, s.board FROM school_class c JOIN school s ON s.id = c.school_id
                WHERE c.code_hash = :h AND c.code_expires_at > now()
                """
            ),
            {"h": code_hash},
        ).one_or_none()
        if school_class is None:
            raise _CodeRejected

        slip = None
        if body.claim_code and not adult:  # adults consent for themselves; a slip is not needed
            slip = conn.execute(
                text(
                    """
                    UPDATE consent_slip SET claimed_at = now()
                    WHERE claim_code_hash = :h AND class_id = :c AND claimed_at IS NULL AND expires_at > now()
                    RETURNING id, recorded_by, notice_version, research_opt_in
                    """
                ),
                {"h": digest(body.claim_code), "c": school_class.id},
            ).one_or_none()
            if slip is None:
                raise _CodeRejected

        student_id: UUID = conn.execute(
            text(
                """
                INSERT INTO student (class_id, nickname, grade, board, age_band)
                VALUES (:class_id, :nickname, :grade, :board, :band) RETURNING id
                """
            ),
            {
                "class_id": school_class.id,
                "nickname": body.nickname,
                "grade": body.grade,
                "board": school_class.board,
                "band": age_band(years),
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

        refresh, refresh_hash = new_refresh_token()
        conn.execute(
            text(
                """
                INSERT INTO refresh_token (device_id, family_id, token_hash, expires_at)
                VALUES (:d, gen_random_uuid(), :h, now() + make_interval(days => :days))
                """
            ),
            {"d": device_id, "h": refresh_hash, "days": settings.refresh_token_days},
        )

        consent_state: Literal["pending", "granted"] = "pending"
        if adult:
            conn.execute(
                text(
                    """
                    INSERT INTO consent (student_id, type, method, notice_version)
                    VALUES (:s, 'self', 'self', :v)
                    """
                ),
                {"s": student_id, "v": settings.consent_notice_version},
            )
            consent_state = "granted"
        elif slip is not None:
            types = ["parent", "research"] if slip.research_opt_in else ["parent"]
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
            consent_state = "granted"

    return TokenPair(
        access_token=access_token(settings, student_id, device_id),
        refresh_token=refresh,
        expires_in=settings.access_token_minutes * 60,
        student_id=student_id,
        consent_state=consent_state,
    )


def _record_pause(engine: Engine, code_hash: str) -> None:
    # The teacher notification reads this audit entry (dashboard work, FYP-2). Only a hash prefix is kept.
    with engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO audit_log (actor, action, object) "
                "VALUES ('system:join', 'class_code.paused', :o)"
            ),
            {"o": f"code_hash:{code_hash[:16]}"},
        )
