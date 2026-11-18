"""Teacher dashboard API (FR-72..74, FR-77, FR-78, FR-83; docs/security/SECURITY.md §5.5).

    GET   /dash/classes                        the classes the caller may see, with counts
    GET   /dash/classes/{classId}/roster       consented students: progress, top path, confidence, flags
    GET   /dash/classes/{classId}/export.csv   the same as a CSV file (UTF-8 BOM)
    GET   /dash/students/{studentId}/summary   one student's page (D-04)
    GET   /dash/flags                          open flags across the caller's classes
    PATCH /dash/flags/{flagId}                 mark a flag as handled (needs the CSRF token)

Who sees what is decided in one place (`MY_CLASSES` and `VISIBLE`):
- teachers and counsellors: the classes assigned to them (staff_class); a school admin: every class of their
  school; a platform admin: every class (each read is audit-logged like everyone else's); researchers: none
  (403);
- in those classes, only students who are not archived and whose parent (or adult self) consent *and*
  teacher-visibility consent (the teacher box on Forms A and C) are in force.
A class or student outside that answers 404, so its existence is never revealed (TC-DASH-02, TC-DASH-03).
Row-Level Security in PostgreSQL is not used yet (ADR-0017); every query here goes through these two filters.
Every read of student data writes an audit entry (NFR-43). No numeric fit is ever returned (FR-54).
"""

from __future__ import annotations

import base64
import binascii
import csv
import io
import json
from datetime import date
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Connection, text

from rahyaab_api import staff_auth as sa
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.ratelimit import digest
from rahyaab_api.routers.results import frameworks

router = APIRouter(prefix="/dash", tags=["dashboard"])

RIASEC = "RIASEC"
# The words the dashboard shows, for the CSV file (the dashboard's own text is in its en.json).
CONFIDENCE_WORDS = {"high": "Sure", "medium": "Fairly sure", "low": "Not sure yet"}
FLAG_WORDS = {
    "not_started": "Not started",
    "stalled": "Stopped playing",
    "low_confidence": "Result not clear",
    "mixed_signals": "Mixed answers",
    "quality": "Rushed answers",
    "route_question": "Route question",
    "help_requested": "Asked for help",
    "age_mismatch": "Check age",
}

# The classes the caller may see. :role, :staff and :school come from the session, never from the request.
MY_CLASSES = """
    SELECT c.id FROM school_class c
    WHERE CAST(:role AS text) = 'admin'
       OR (CAST(:role AS text) = 'school_admin' AND c.school_id = :school)
       OR (CAST(:role AS text) IN ('teacher', 'counsellor') AND c.school_id = :school
           AND EXISTS (SELECT 1 FROM staff_class sc WHERE sc.staff_id = :staff AND sc.class_id = c.id))
"""

# A student the caller may see (alias st), once the class is one of MY_CLASSES.
VISIBLE = """
    st.archived_at IS NULL
    AND EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                AND co.type IN ('parent', 'self') AND co.withdrawn_at IS NULL)
    AND EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                AND co.type = 'teacher_visibility' AND co.withdrawn_at IS NULL)
"""

_STARTED = """EXISTS (SELECT 1 FROM game_run gr JOIN sitting si ON si.id = gr.sitting_id
                      WHERE si.student_id = st.id AND NOT gr.practice)"""

# One roster row per student (alias st); the caller adds the WHERE clause.
_ROW = f"""
    SELECT st.id, st.nickname, st.class_id,
           (SELECT sl.form_serial FROM consent co JOIN consent_slip sl ON sl.id = co.slip_id
            WHERE co.student_id = st.id AND co.type IN ('parent', 'self')
            ORDER BY co.granted_at DESC LIMIT 1) AS form_serial,
           {_STARTED} AS started,
           coalesce((SELECT max(gr.week) FROM game_run gr JOIN sitting si ON si.id = gr.sitting_id
                     WHERE si.student_id = st.id AND NOT gr.practice
                       AND EXISTS (SELECT 1 FROM raw_event re
                                   WHERE re.run_id = gr.id AND re.type = 'week_complete')), 0) AS week,
           rec.top_path_id, rec.confidence,
           coalesce((SELECT array_agg(f.type ORDER BY f.created_at) FROM flag f
                     WHERE f.student_id = st.id AND f.resolved_at IS NULL), '{{}}') AS flags
    FROM student st
    LEFT JOIN LATERAL (
      SELECT r.ranked->0->>'stream_id' AS top_path_id, r.confidence FROM recommendation r
      WHERE r.student_id = st.id ORDER BY r.created_at DESC LIMIT 1
    ) rec ON true
"""  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter


# ------------------------------------------------------------------------------------------- models
class ClassSummary(BaseModel):
    id: UUID
    school: str
    grade: int
    section: str
    name: str
    enrolled: int  # students the caller may see
    started: int
    blueprint_ready: int
    not_shown: int  # students of the class without both consents (a count only, never who)
    open_flags: int


class RosterRow(BaseModel):
    student_id: UUID
    nickname: str
    form_serial: str | None  # the consent-form number, to match the school's paper register
    started: bool
    week: int
    top_path_id: str | None
    top_path: str | None
    confidence: Literal["high", "medium", "low"] | None
    flags: list[str]


class RosterPage(BaseModel):
    items: list[RosterRow]
    next_cursor: str | None


class PathCard(BaseModel):
    stream_id: str
    name: str
    fit_band: str


class SummaryRecommendation(BaseModel):
    confidence: str
    provisional: bool
    ranked: list[PathCard]
    created_at: str


class StudentSummary(BaseModel):
    roster: RosterRow
    class_name: str
    school: str
    consent_method: str | None
    recommendation: SummaryRecommendation | None
    top_interests: list[str]  # interest types in the student's order, no numbers


class FlagOut(BaseModel):
    id: UUID
    student_id: UUID
    nickname: str
    class_id: UUID
    class_name: str
    type: str
    created_at: str


class ResolveIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resolved: Literal[True]


# ------------------------------------------------------------------------------------------ helpers
def dash_staff(
    staff: Annotated[sa.CurrentStaff, Depends(sa.current_staff)], response: Response
) -> sa.CurrentStaff:
    """A signed-in staff member who may use the dashboard. Researchers use /research only (403)."""
    if staff.role == "researcher":
        raise ProblemError(403, "forbidden", "This page is not part of your role")
    response.headers["Cache-Control"] = "no-store"  # student data is never kept by the browser or a proxy
    return staff


def dash_change(staff: Annotated[sa.CurrentStaff, Depends(sa.require_csrf)]) -> sa.CurrentStaff:
    if staff.role == "researcher":
        raise ProblemError(403, "forbidden", "This page is not part of your role")
    return staff


def scope_params(staff: sa.CurrentStaff) -> dict[str, Any]:
    return {"role": staff.role, "staff": staff.staff_id, "school": staff.school_id}


def not_found() -> ProblemError:
    return ProblemError(404, "not_found", "Not found")


def audit(conn: Connection, request: Request, staff: sa.CurrentStaff, action: str, obj: str) -> None:
    ip = request.client.host if request.client else "unknown"
    conn.execute(
        text("INSERT INTO audit_log (actor, action, object, ip_hash) VALUES (:a, :act, :o, :ip)"),
        {"a": str(staff.staff_id), "act": action, "o": obj, "ip": digest(ip)},
    )


def _path_names() -> dict[str, str]:
    streams, _ = frameworks()
    return {p["id"]: p["name"] for level in streams["by_class"].values() for p in level["paths"]}


def _row(r: Any, names: dict[str, str]) -> RosterRow:
    return RosterRow(
        student_id=r.id,
        nickname=r.nickname,
        form_serial=r.form_serial,
        started=r.started,
        week=r.week,
        top_path_id=r.top_path_id,
        top_path=names.get(r.top_path_id, r.top_path_id) if r.top_path_id else None,
        confidence=r.confidence,
        flags=list(r.flags),
    )


def class_in_scope(conn: Connection, staff: sa.CurrentStaff, class_id: UUID) -> Any:
    row = conn.execute(
        text(
            f"SELECT c.id, c.grade, c.section, s.name AS school FROM school_class c "  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
            f"JOIN school s ON s.id = c.school_id WHERE c.id = :c AND c.id IN ({MY_CLASSES})"
        ),
        {"c": class_id, **scope_params(staff)},
    ).first()
    if row is None:
        raise not_found()
    return row


def _encode_cursor(nickname: str, student_id: UUID) -> str:
    raw = json.dumps([nickname.lower(), str(student_id)]).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _decode_cursor(cursor: str) -> tuple[str, UUID]:
    try:
        raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        nickname, student_id = json.loads(raw)
        return str(nickname), UUID(str(student_id))
    except (ValueError, TypeError, binascii.Error):
        raise ProblemError(
            422, "validation_error", "Some fields need fixing", [field_error("cursor", "format")]
        ) from None


def csv_safe(value: object) -> str:
    """A CSV cell that a spreadsheet will never run as a formula (OWASP CSV injection)."""
    cell = "" if value is None else str(value)
    return "'" + cell if cell[:1] in ("=", "+", "-", "@", "\t", "\r") else cell


# ------------------------------------------------------------------------------------------- routes
@router.get("/classes", response_model=list[ClassSummary])
def list_classes(
    request: Request, staff: Annotated[sa.CurrentStaff, Depends(dash_staff)]
) -> list[ClassSummary]:
    with get_engine(request).connect() as conn:
        rows = conn.execute(
            text(
                f"""
                SELECT c.id, c.grade, c.section, s.name AS school,
                  (SELECT count(*) FROM student st WHERE st.class_id = c.id AND {VISIBLE}) AS enrolled,
                  (SELECT count(*) FROM student st WHERE st.class_id = c.id AND {VISIBLE}
                     AND {_STARTED}) AS started,
                  (SELECT count(*) FROM student st WHERE st.class_id = c.id AND {VISIBLE}
                     AND EXISTS (SELECT 1 FROM recommendation r
                                 WHERE r.student_id = st.id)) AS blueprint_ready,
                  (SELECT count(*) FROM student st WHERE st.class_id = c.id AND st.archived_at IS NULL
                     AND NOT ({VISIBLE})) AS not_shown,
                  (SELECT count(*) FROM flag f JOIN student st ON st.id = f.student_id
                     WHERE st.class_id = c.id AND {VISIBLE} AND f.resolved_at IS NULL) AS open_flags
                FROM school_class c JOIN school s ON s.id = c.school_id
                WHERE c.id IN ({MY_CLASSES})
                ORDER BY s.name, c.grade, c.section
                """  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
            ),
            scope_params(staff),
        ).all()
    return [
        ClassSummary(
            id=r.id,
            school=r.school,
            grade=r.grade,
            section=r.section,
            name=f"{r.grade}-{r.section}",
            enrolled=r.enrolled,
            started=r.started,
            blueprint_ready=r.blueprint_ready,
            not_shown=r.not_shown,
            open_flags=r.open_flags,
        )
        for r in rows
    ]


@router.get("/classes/{class_id}/roster", response_model=RosterPage)
def roster(
    class_id: UUID,
    request: Request,
    staff: Annotated[sa.CurrentStaff, Depends(dash_staff)],
    cursor: Annotated[str | None, Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
) -> RosterPage:
    after = _decode_cursor(cursor) if cursor else None
    names = _path_names()
    with get_engine(request).begin() as conn:
        class_in_scope(conn, staff, class_id)
        rows = conn.execute(
            text(
                _ROW
                + f"""
                WHERE st.class_id = :c AND {VISIBLE}
                  AND (CAST(:after_n AS text) IS NULL OR (lower(st.nickname), st.id) > (:after_n, :after_id))
                ORDER BY lower(st.nickname), st.id
                LIMIT :n
                """  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
            ),
            {
                "c": class_id,
                "after_n": after[0] if after else None,
                "after_id": after[1] if after else None,
                "n": limit + 1,
            },
        ).all()
        audit(conn, request, staff, "dash.roster", f"class:{class_id}")
    page = rows[:limit]
    more = len(rows) > limit
    return RosterPage(
        items=[_row(r, names) for r in page],
        next_cursor=_encode_cursor(page[-1].nickname, page[-1].id) if more and page else None,
    )


@router.get("/classes/{class_id}/export.csv")
def export_roster(
    class_id: UUID, request: Request, staff: Annotated[sa.CurrentStaff, Depends(dash_staff)]
) -> Response:
    names = _path_names()
    with get_engine(request).begin() as conn:
        cls = class_in_scope(conn, staff, class_id)
        rows = conn.execute(
            text(_ROW + f" WHERE st.class_id = :c AND {VISIBLE} ORDER BY lower(st.nickname), st.id"),
            {"c": class_id},
        ).all()
        audit(conn, request, staff, "dash.export", f"class:{class_id}")
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\r\n")
    writer.writerow(
        ["Nickname", "Form number", "Started", "Weeks done", "Top path", "How sure", "Open flags"]
    )
    for r in rows:
        row = _row(r, names)
        writer.writerow(
            [
                csv_safe(row.nickname),
                csv_safe(row.form_serial),
                "yes" if row.started else "no",
                row.week,
                csv_safe(row.top_path),
                csv_safe(CONFIDENCE_WORDS.get(row.confidence or "", "")),
                csv_safe("; ".join(FLAG_WORDS.get(f, f) for f in row.flags)),
            ]
        )
    filename = f"rahyaab-class-{cls.grade}-{cls.section}-{date.today().isoformat()}.csv"
    return Response(
        content="﻿" + out.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "no-store"},
    )


@router.get("/students/{student_id}/summary", response_model=StudentSummary)
def student_summary(
    student_id: UUID, request: Request, staff: Annotated[sa.CurrentStaff, Depends(dash_staff)]
) -> StudentSummary:
    names = _path_names()
    with get_engine(request).begin() as conn:
        row = conn.execute(
            text(_ROW + f" WHERE st.id = :s AND st.class_id IN ({MY_CLASSES}) AND {VISIBLE}"),
            {"s": student_id, **scope_params(staff)},
        ).first()
        if row is None:
            raise not_found()
        cls = class_in_scope(conn, staff, row.class_id)
        method = conn.execute(
            text(
                "SELECT method FROM consent WHERE student_id = :s AND type IN ('parent', 'self') "
                "AND withdrawn_at IS NULL ORDER BY granted_at DESC LIMIT 1"
            ),
            {"s": student_id},
        ).scalar_one_or_none()
        rec = conn.execute(
            text(
                "SELECT ranked, confidence, model_versions, input_hash, created_at FROM recommendation "
                "WHERE student_id = :s ORDER BY created_at DESC LIMIT 1"
            ),
            {"s": student_id},
        ).first()
        interests: list[str] = []
        if rec is not None:
            interests = list(
                conn.execute(
                    text(
                        "SELECT construct FROM trait_estimate WHERE student_id = :s AND input_hash = :h "
                        "AND construct = ANY(:riasec) AND theta IS NOT NULL ORDER BY theta DESC LIMIT 3"
                    ),
                    {"s": student_id, "h": rec.input_hash, "riasec": list(RIASEC)},
                ).scalars()
            )
        audit(conn, request, staff, "dash.summary", f"student:{student_id}")
    recommendation = None
    if rec is not None:
        ranked = rec.ranked if isinstance(rec.ranked, list) else json.loads(rec.ranked)
        versions = (
            rec.model_versions if isinstance(rec.model_versions, dict) else json.loads(rec.model_versions)
        )
        recommendation = SummaryRecommendation(
            confidence=rec.confidence,
            provisional=str(versions.get("irt", "")).startswith("m1-counts"),
            ranked=[
                PathCard(
                    stream_id=c["stream_id"],
                    name=names.get(c["stream_id"], c["stream_id"]),
                    fit_band=c["fit_band"],
                )
                for c in ranked
            ],
            created_at=rec.created_at.isoformat(),
        )
    return StudentSummary(
        roster=_row(row, names),
        class_name=f"{cls.grade}-{cls.section}",
        school=cls.school,
        consent_method=method,
        recommendation=recommendation,
        top_interests=interests,
    )


@router.get("/flags", response_model=list[FlagOut])
def list_flags(request: Request, staff: Annotated[sa.CurrentStaff, Depends(dash_staff)]) -> list[FlagOut]:
    with get_engine(request).begin() as conn:
        rows = conn.execute(
            text(
                f"""
                SELECT f.id, f.student_id, st.nickname, c.id AS class_id, c.grade, c.section, f.type,
                       f.created_at
                FROM flag f
                JOIN student st ON st.id = f.student_id
                JOIN school_class c ON c.id = st.class_id
                WHERE f.resolved_at IS NULL AND c.id IN ({MY_CLASSES}) AND {VISIBLE}
                ORDER BY f.created_at, f.id
                """  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
            ),
            scope_params(staff),
        ).all()
        audit(conn, request, staff, "dash.flags", f"flags:{len(rows)}")
    return [
        FlagOut(
            id=r.id,
            student_id=r.student_id,
            nickname=r.nickname,
            class_id=r.class_id,
            class_name=f"{r.grade}-{r.section}",
            type=r.type,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.patch("/flags/{flag_id}")
def resolve_flag(
    flag_id: UUID,
    body: ResolveIn,
    request: Request,
    staff: Annotated[sa.CurrentStaff, Depends(dash_change)],
) -> dict[str, str]:
    with get_engine(request).begin() as conn:
        found = conn.execute(
            text(
                f"""
                UPDATE flag f SET resolved_at = coalesce(f.resolved_at, now()),
                                  resolved_by = coalesce(f.resolved_by, :staff)
                FROM student st
                WHERE f.id = :f AND st.id = f.student_id AND st.class_id IN ({MY_CLASSES}) AND {VISIBLE}
                RETURNING f.id, f.resolved_at
                """  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter
            ),
            {"f": flag_id, **scope_params(staff)},
        ).first()
        if found is None:
            raise not_found()
        audit(conn, request, staff, "dash.flag_resolved", f"flag:{flag_id}")
    return {"id": str(found.id), "resolved_at": found.resolved_at.isoformat()}
