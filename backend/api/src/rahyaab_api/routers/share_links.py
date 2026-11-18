"""The student's family links (FR-66, RFC-0004).

    POST   /share-links            a link to one of the student's own stored results; the token is shown once
    GET    /share-links            the student's links (no tokens), to see views and revoke old ones
    DELETE /share-links/{linkId}   revoke a link at once

A token is 22 characters from 62 (about 131 bits); only its SHA-256 is stored. A link lasts 30 days and shows
the result it was made for, never a newer one. Only after parent (or adult self) consent. Parent consent by
phone
(`scope: consent`, P-02) is post-MVP (MVP.md), so only `report` links are made for now.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text

from rahyaab_api import staff_auth as sa
from rahyaab_api.auth import CurrentStudent, current_student
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.ratelimit import Limit, enforce
from rahyaab_api.settings import Settings

router = APIRouter(tags=["sharing"])

LINK_DAYS = 30
CREATE_LIMIT = Limit("share_create_student", 20, 86400)  # a student shares with a few people, not hundreds


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


class CreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scope: Literal["report", "consent"]
    recommendation_id: UUID | None = None
    show_task_strengths: bool = True


class LinkOut(BaseModel):
    id: UUID
    url: str  # shown once
    expires_at: datetime


class LinkRow(BaseModel):
    id: UUID
    scope: str
    expires_at: datetime
    revoked: bool
    views: int


@router.post("/share-links", response_model=LinkOut, status_code=201)
def create_link(
    body: CreateIn,
    request: Request,
    response: Response,
    student: Annotated[CurrentStudent, Depends(current_student)],
    settings: Annotated[Settings, Depends(_settings)],
) -> LinkOut:
    if body.scope != "report":
        raise ProblemError(
            422, "validation_error", "Some fields need fixing", [field_error("scope", "not_allowed")]
        )
    if body.recommendation_id is None:
        raise ProblemError(
            422, "validation_error", "Some fields need fixing", [field_error("recommendation_id", "required")]
        )
    engine = get_engine(request)
    with engine.connect() as conn:
        consented = conn.execute(
            text(
                "SELECT 1 FROM consent WHERE student_id = :s AND type IN ('parent', 'self') "
                "AND withdrawn_at IS NULL"
            ),
            {"s": student.student_id},
        ).first()
        if consented is None:
            raise ProblemError(403, "consent_required", "Sharing opens once your family says OK")
        own = conn.execute(
            text("SELECT 1 FROM recommendation WHERE id = :r AND student_id = :s"),
            {"r": body.recommendation_id, "s": student.student_id},
        ).first()
    if own is None:
        raise ProblemError(404, "not_found", "Not found")
    enforce(engine, CREATE_LIMIT, str(student.student_id))
    token = sa.new_link_token()
    with engine.begin() as conn:
        row = conn.execute(
            text(
                "INSERT INTO share_link (token_hash, student_id, recommendation_id, scope, "
                "show_task_strengths, "
                "expires_at) VALUES (:h, :s, :r, 'report', :t, now() + make_interval(days => :d)) "
                "RETURNING id, expires_at"
            ),
            {
                "h": sa.token_digest(token),
                "s": student.student_id,
                "r": body.recommendation_id,
                "t": body.show_task_strengths,
                "d": LINK_DAYS,
            },
        ).one()
    response.headers["Cache-Control"] = "no-store"
    return LinkOut(id=row.id, url=f"{settings.parent_link_base}/p/{token}", expires_at=row.expires_at)


@router.get("/share-links", response_model=list[LinkRow])
def list_links(
    request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> list[LinkRow]:
    with get_engine(request).connect() as conn:
        rows = conn.execute(
            text(
                "SELECT id, scope, expires_at, revoked_at IS NOT NULL AS revoked, views FROM share_link "
                "WHERE student_id = :s ORDER BY expires_at DESC"
            ),
            {"s": student.student_id},
        ).all()
    return [
        LinkRow(id=r.id, scope=r.scope, expires_at=r.expires_at, revoked=r.revoked, views=r.views)
        for r in rows
    ]


@router.delete("/share-links/{link_id}", status_code=204)
def revoke_link(
    link_id: UUID, request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> Response:
    with get_engine(request).begin() as conn:
        found = conn.execute(
            text(
                "UPDATE share_link SET revoked_at = coalesce(revoked_at, now()) "
                "WHERE id = :i AND student_id = :s RETURNING id"
            ),
            {"i": link_id, "s": student.student_id},
        ).first()
    if found is None:
        raise ProblemError(404, "not_found", "Not found")
    return Response(status_code=204)
