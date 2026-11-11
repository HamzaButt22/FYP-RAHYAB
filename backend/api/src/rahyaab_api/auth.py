"""Who is calling: the student behind a 15-minute access token (ADR-0011).

Every student route takes `student: Annotated[CurrentStudent, Depends(current_student)]`. Any problem with the
token (missing, malformed, expired, wrong signature, deleted student or device) gets the same 401.
"""

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, Request
from sqlalchemy import text

from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError
from rahyaab_api.settings import Settings
from rahyaab_api.tokens import decode_access_token


@dataclass(frozen=True)
class CurrentStudent:
    student_id: UUID
    device_id: UUID


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def _unauthorized() -> ProblemError:
    return ProblemError(401, "unauthorized", "Please sign in again", headers={"WWW-Authenticate": "Bearer"})


def current_student(request: Request, settings: Annotated[Settings, Depends(_settings)]) -> CurrentStudent:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _unauthorized()
    try:
        claims = decode_access_token(settings, token)
        student_id, device_id = UUID(str(claims["sub"])), UUID(str(claims["did"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _unauthorized() from None
    with get_engine(request).connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM device WHERE id = :d AND student_id = :s"), {"d": device_id, "s": student_id}
        ).first()
    if exists is None:  # deleted student, or a device that was re-linked away
        raise _unauthorized()
    return CurrentStudent(student_id, device_id)
