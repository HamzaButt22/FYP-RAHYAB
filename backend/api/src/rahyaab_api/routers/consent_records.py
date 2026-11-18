"""Consent records on the dashboard (D-11; FR-05a, FR-06, FR-78, FR-83).

    GET  /dash/classes/{classId}/consent-slips                       the class's paper forms and their status
    POST /dash/classes/{classId}/consent-slips                       print new forms (two locked files)
    POST /dash/classes/{classId}/consent-slips/{formSerial}:record   a signed form is back: record it

The same rules as the admin command (admin.py print_slips, record_slip): the age band comes from the school's
admission register, never from the student; Form A takes 13-15 or 16-17, Form C 18-19, 20-24 or 25+; the
research and teacher boxes are copied from the signed form. Forms are listed by number, not by student: a
claimed form shows the student's nickname only if the teacher box was ticked (FR-78), and claim codes are
never shown again. Printing returns the two files the admin command writes (the slips to print and the class
register), encrypted with one new password that is shown once; a sealed copy of the password is kept so the
admin command can give it again (register.py). Who: the class's teachers and counsellors, the school admin
and a platform admin (dashboard.MY_CLASSES); changes need the CSRF token; everything is audit-logged with the
staff member's id.
"""

from __future__ import annotations

import base64
from datetime import UTC, date, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text

from rahyaab_api import admin, register
from rahyaab_api import staff_auth as sa
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.ratelimit import Limit, enforce
from rahyaab_api.routers.dashboard import VISIBLE, audit, class_in_scope, dash_change, dash_staff, not_found
from rahyaab_api.settings import Settings

router = APIRouter(prefix="/dash", tags=["dashboard"])

PRINT_LIMIT = Limit("slips_print_class", 10, 3600)  # a class prints forms a few times a year
SERIAL = r"^[AC]-[0-9]{4}$"
Band = Literal["13-15", "16-17", "18-19", "20-24", "25+"]


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


class ConsentForm(BaseModel):
    serial: str
    kind: Literal["parent", "self"]  # Form A (a parent's consent) or Form C (an adult student's own)
    status: Literal["printed", "recorded", "claimed", "expired"]
    age_band: str | None  # from the admission register, once recorded
    research_opt_in: bool | None  # null until the signed form is recorded
    teacher_visible: bool | None
    recorded_at: datetime | None
    recorded_by: str | None  # the staff member's email
    claimed_at: datetime | None
    nickname: str | None  # only when claimed and the teacher box was ticked
    expires_at: datetime


class PrintIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    count: int = Field(ge=1, le=60)
    kind: Literal["parent", "self"]


class PrintedFile(BaseModel):
    name: str
    content: str  # base64 of the encrypted .xlsx


class PrintOut(BaseModel):
    count: int
    first: str
    last: str
    password: str  # shown once; never stored in clear
    files: list[PrintedFile]


class RecordIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    age_band: Band
    research_opt_in: bool
    teacher_visible: bool


FormStatus = Literal["printed", "recorded", "claimed", "expired"]


def _status(row: Any) -> FormStatus:
    if row.claimed_at is not None:
        return "claimed"
    if row.expires_at <= datetime.now(UTC):
        return "expired"
    return "recorded" if row.recorded_at is not None else "printed"


def _form(r: Any) -> ConsentForm:
    recorded = r.recorded_at is not None
    return ConsentForm(
        serial=r.form_serial,
        kind=r.kind,
        status=_status(r),
        age_band=r.verified_age_band,
        research_opt_in=r.research_opt_in if recorded else None,
        teacher_visible=r.teacher_visibility if recorded else None,
        recorded_at=r.recorded_at,
        recorded_by=r.recorded_by,
        claimed_at=r.claimed_at,
        nickname=r.nickname,
        expires_at=r.expires_at,
    )


_FORMS = f"""
    SELECT sl.form_serial, sl.kind, sl.verified_age_band, sl.research_opt_in, sl.teacher_visibility,
           sl.recorded_at, su.email AS recorded_by, sl.claimed_at, sl.expires_at,
           (SELECT st.nickname FROM consent co JOIN student st ON st.id = co.student_id
            WHERE co.slip_id = sl.id AND co.type IN ('parent', 'self') AND {VISIBLE}
            LIMIT 1) AS nickname
    FROM consent_slip sl
    LEFT JOIN staff_user su ON su.id = sl.recorded_by
"""  # noqa: S608 - fixed SQL fragments only; every value is a bound parameter


@router.get("/classes/{class_id}/consent-slips", response_model=list[ConsentForm])
def list_forms(
    class_id: UUID, request: Request, staff: Annotated[sa.CurrentStaff, Depends(dash_staff)]
) -> list[ConsentForm]:
    with get_engine(request).begin() as conn:
        class_in_scope(conn, staff, class_id)
        rows = conn.execute(
            text(_FORMS + " WHERE sl.class_id = :c ORDER BY sl.kind, sl.form_serial"), {"c": class_id}
        ).all()
        audit(conn, request, staff, "dash.consent_slips", f"class:{class_id}")
    return [_form(r) for r in rows]


@router.post("/classes/{class_id}/consent-slips", response_model=PrintOut, status_code=201)
def print_forms(
    class_id: UUID,
    body: PrintIn,
    request: Request,
    response: Response,
    staff: Annotated[sa.CurrentStaff, Depends(dash_change)],
    settings: Annotated[Settings, Depends(_settings)],
) -> PrintOut:
    engine = get_engine(request)
    with engine.begin() as conn:
        cls = class_in_scope(conn, staff, class_id)
    enforce(engine, PRINT_LIMIT, str(class_id))
    actor = str(staff.staff_id)
    password = register.new_password()
    with engine.begin() as conn:
        slips = admin.print_slips(conn, settings.code_pepper, class_id, body.count, body.kind, actor=actor)
        class_name = f"{cls.grade}-{cls.section}"
        first, last = slips[0][0], slips[-1][0]
        stamp = date.today().isoformat()
        files = [
            PrintedFile(
                name=admin._file_name(cls.school, class_name, "slips", first, last, stamp) + ".xlsx",
                content=base64.b64encode(
                    register.encrypted_bytes(register.slips_workbook(cls.school, class_name, slips), password)
                ).decode("ascii"),
            ),
            PrintedFile(
                name=admin._file_name(cls.school, class_name, "register", first, last, stamp) + ".xlsx",
                content=base64.b64encode(
                    register.encrypted_bytes(
                        register.register_workbook(cls.school, class_name, [s for s, _ in slips], body.kind),
                        password,
                    )
                ).decode("ascii"),
            ),
        ]
        admin.save_file_password(
            conn,
            settings.code_pepper,
            class_id,
            "slips_and_register",
            [f.name for f in files],
            password,
            actor,
        )
    response.headers["Cache-Control"] = "no-store"  # the password and claim codes are never cached
    return PrintOut(count=len(slips), first=first, last=last, password=password, files=files)


@router.post("/classes/{class_id}/consent-slips/{serial}:record", response_model=ConsentForm)
def record_form(
    class_id: UUID,
    serial: Annotated[str, Path(pattern=SERIAL)],
    body: RecordIn,
    request: Request,
    staff: Annotated[sa.CurrentStaff, Depends(dash_change)],
) -> ConsentForm:
    with get_engine(request).begin() as conn:
        class_in_scope(conn, staff, class_id)
        try:
            admin.record_slip(
                conn,
                class_id,
                serial,
                body.age_band,
                staff.staff_id,
                research=body.research_opt_in,
                teacher=body.teacher_visible,
                actor=str(staff.staff_id),
            )
        except admin.AdminError as e:
            if e.code == "not_found":
                raise not_found() from None
            if e.code == "already_recorded":
                raise ProblemError(409, "already_recorded", "This form is already recorded") from None
            if e.code == "band_not_allowed":
                raise ProblemError(
                    422,
                    "validation_error",
                    "Some fields need fixing",
                    [field_error("age_band", "not_allowed")],
                ) from None
            raise ProblemError(403, "forbidden", "You cannot record forms for this class") from None
        row = conn.execute(
            text(_FORMS + " WHERE sl.class_id = :c AND sl.form_serial = :s"), {"c": class_id, "s": serial}
        ).one()
    return _form(row)
