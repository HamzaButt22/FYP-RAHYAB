"""School setup on the dashboard (D-09; FR-80, FR-106, FR-83).

    GET   /admin/staff                 staff of the school, with their classes and status
    POST  /admin/staff                 invite a teacher, counsellor or school admin (an email link)
    PATCH /admin/staff/{staffId}       change classes, disable or enable, reset password or two-step
    GET   /admin/classes               classes of the school and whether their code still works
    POST  /admin/classes               add a class; its code is shown once
    POST  /admin/codes:rotate          a new code for a class (the old one stops at once); shown once

Who: a school admin, for their own school only; a platform admin, for the school named by `school_id`.
Teachers, counsellors and researchers get 403. Another school's staff or classes answer 404.
Rules (SECURITY.md §5.2, §5.5):
- Platform admin and researcher accounts are made with the admin command only, never here, so a school
  account cannot grant team-level access.
- Nobody can disable themselves, force their own reset or reset their own two-step sign-in (a school could
  lock out its last admin); changing one's own classes is fine.
- Nobody sees or sets a password: invites and resets send a link (staff_admin.py).
- Class codes are stored only as a keyed hash, so they are shown once and never again.
Every change is audit-logged with the school admin's staff id.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Connection, text

from rahyaab_api import admin, staff_admin
from rahyaab_api import staff_auth as sa
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.routers.staff_auth import EMAIL
from rahyaab_api.settings import Settings

router = APIRouter(prefix="/admin", tags=["admin"])

SCHOOL_ROLES = ("teacher", "counsellor", "school_admin")
SECTION = r"^[A-Za-z0-9]{1,8}$"


def _settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def _not_found() -> ProblemError:
    return ProblemError(404, "not_found", "Not found")


def _invalid(field: str, code: str = "not_allowed") -> ProblemError:
    return ProblemError(422, "validation_error", "Some fields need fixing", [field_error(field, code)])


def _school(conn: Connection, staff: sa.CurrentStaff, school_id: UUID | None) -> UUID:
    """The school this request may manage."""
    if staff.role == "school_admin" and staff.school_id is not None:
        if school_id is not None and school_id != staff.school_id:
            raise _not_found()
        return staff.school_id
    if staff.role == "admin":
        if school_id is None:
            raise _invalid("school_id", "required")
        if conn.execute(text("SELECT 1 FROM school WHERE id = :s"), {"s": school_id}).first() is None:
            raise _not_found()
        return school_id
    raise ProblemError(403, "forbidden", "Only a school admin can change school setup")


def no_store(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store"


# ------------------------------------------------------------------------------------------- models
class ClassRef(BaseModel):
    id: UUID
    name: str


class StaffOut(BaseModel):
    id: UUID
    email: str
    role: str
    status: Literal["active", "invited", "locked", "disabled"]
    two_step: bool
    classes: list[ClassRef]
    is_you: bool


class InviteIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(max_length=254, pattern=EMAIL)
    role: Literal["teacher", "counsellor", "school_admin", "admin", "researcher"]
    class_ids: list[UUID] = Field(default_factory=list, max_length=40)
    school_id: UUID | None = None

    @field_validator("email", mode="after")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.strip().lower()


class ChangeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    class_ids: list[UUID] | None = Field(default=None, max_length=40)
    disabled: bool | None = None
    force_password_reset: Literal[True] | None = None
    reset_two_step: Literal[True] | None = None


class ClassOut(BaseModel):
    id: UUID
    grade: int
    section: str
    name: str
    code_expires_at: datetime
    code_live: bool


class ClassIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    grade: int = Field(ge=8, le=12)
    section: str = Field(pattern=SECTION)
    school_id: UUID | None = None


class NewCode(BaseModel):
    class_id: UUID
    class_code: str
    expires_at: datetime


class RotateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    class_id: UUID


# ------------------------------------------------------------------------------------------ helpers
def _staff_rows(conn: Connection, school_id: UUID, me: UUID, only: UUID | None = None) -> list[StaffOut]:
    rows = conn.execute(
        text(
            """
            SELECT u.id, u.email, u.role, u.disabled_at IS NOT NULL AS disabled,
                   coalesce(u.locked_until > now(), false) AS locked,
                   NOT starts_with(u.password_hash, '$argon2') AS invited,
                   u.mfa_secret_encrypted IS NOT NULL AS two_step,
                   coalesce((SELECT json_agg(json_build_object('id', c.id,
                                                               'name', c.grade || '-' || c.section)
                                             ORDER BY c.grade, c.section)
                             FROM staff_class sc JOIN school_class c ON c.id = sc.class_id
                             WHERE sc.staff_id = u.id), '[]') AS classes
            FROM staff_user u
            WHERE u.school_id = :s AND u.role = ANY(:roles) AND (CAST(:only AS uuid) IS NULL OR u.id = :only)
            ORDER BY u.email
            """
        ),
        {"s": school_id, "roles": list(SCHOOL_ROLES), "only": only},
    ).all()
    return [
        StaffOut(
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
            two_step=r.two_step,
            classes=[ClassRef(**c) for c in r.classes],
            is_you=r.id == me,
        )
        for r in rows
    ]


def _classes_of(conn: Connection, school_id: UUID, class_ids: list[UUID]) -> None:
    """Every class must belong to the school (FR-78)."""
    if not class_ids:
        return
    found = conn.execute(
        text("SELECT count(*) FROM school_class WHERE school_id = :s AND id = ANY(:ids)"),
        {"s": school_id, "ids": list(set(class_ids))},
    ).scalar_one()
    if found != len(set(class_ids)):
        raise _invalid("class_ids")


def _class_in_school(conn: Connection, school_id: UUID, class_id: UUID) -> None:
    found = conn.execute(
        text("SELECT 1 FROM school_class WHERE id = :c AND school_id = :s"), {"c": class_id, "s": school_id}
    ).first()
    if found is None:
        raise _not_found()


# ------------------------------------------------------------------------------------------- routes
@router.get("/staff", response_model=list[StaffOut])
def list_staff(
    request: Request,
    response: Response,
    staff: Annotated[sa.CurrentStaff, Depends(sa.current_staff)],
    school_id: Annotated[UUID | None, Query()] = None,
) -> list[StaffOut]:
    no_store(response)
    with get_engine(request).connect() as conn:
        school = _school(conn, staff, school_id)
        return _staff_rows(conn, school, staff.staff_id)


@router.post("/staff", response_model=StaffOut, status_code=201)
def invite_staff(
    body: InviteIn,
    request: Request,
    staff: Annotated[sa.CurrentStaff, Depends(sa.require_csrf)],
    settings: Annotated[Settings, Depends(_settings)],
) -> StaffOut:
    with get_engine(request).begin() as conn:
        school = _school(conn, staff, body.school_id)
        if body.role not in SCHOOL_ROLES:
            raise _invalid("role")  # team accounts are made with the admin command only
        _classes_of(conn, school, body.class_ids)
        if conn.execute(text("SELECT 1 FROM staff_user WHERE email = :e"), {"e": body.email}).first():
            raise ProblemError(409, "email_taken", "A staff account with that email already exists")
        try:
            new_id = staff_admin.add_staff(
                conn,
                body.email,
                body.role,
                school,
                body.class_ids,
                settings.dashboard_url,
                str(staff.staff_id),
            )
        except staff_admin.StaffAdminError:
            raise _invalid("email", "format") from None
        (row,) = _staff_rows(conn, school, staff.staff_id, only=new_id)
    return row


@router.patch("/staff/{staff_id}", response_model=StaffOut)
def change_staff(
    staff_id: UUID,
    body: ChangeIn,
    request: Request,
    staff: Annotated[sa.CurrentStaff, Depends(sa.require_csrf)],
    settings: Annotated[Settings, Depends(_settings)],
    school_id: Annotated[UUID | None, Query()] = None,
) -> StaffOut:
    actor = str(staff.staff_id)
    with get_engine(request).begin() as conn:
        school = _school(conn, staff, school_id)
        if not _staff_rows(conn, school, staff.staff_id, only=staff_id):
            raise _not_found()  # not this school's, a team account, or no such account
        own = staff_id == staff.staff_id
        if own and (body.disabled is not None or body.force_password_reset or body.reset_two_step):
            raise ProblemError(409, "not_on_yourself", "Ask another school admin to do this for you")
        if body.class_ids is not None:
            _classes_of(conn, school, body.class_ids)
            current = set(
                conn.execute(
                    text("SELECT class_id FROM staff_class WHERE staff_id = :s"), {"s": staff_id}
                ).scalars()
            )
            wanted = set(body.class_ids)
            for class_id in sorted(current - wanted, key=str):
                staff_admin.unassign_class(conn, staff_id, class_id, actor)
            for class_id in sorted(wanted - current, key=str):
                staff_admin.assign_class(conn, staff_id, class_id, actor)
        if body.reset_two_step:
            staff_admin.reset_mfa(conn, staff_id, actor)
        if body.force_password_reset:
            staff_admin.force_reset(conn, staff_id, settings.dashboard_url, actor)
        if body.disabled is not None:
            staff_admin.set_disabled(conn, staff_id, body.disabled, actor)
        (row,) = _staff_rows(conn, school, staff.staff_id, only=staff_id)
    return row


@router.get("/classes", response_model=list[ClassOut])
def list_classes(
    request: Request,
    staff: Annotated[sa.CurrentStaff, Depends(sa.current_staff)],
    school_id: Annotated[UUID | None, Query()] = None,
) -> list[ClassOut]:
    with get_engine(request).connect() as conn:
        school = _school(conn, staff, school_id)
        rows = conn.execute(
            text(
                "SELECT id, grade, section, code_expires_at, code_expires_at > now() AS live "
                "FROM school_class WHERE school_id = :s ORDER BY grade, section"
            ),
            {"s": school},
        ).all()
    return [
        ClassOut(
            id=r.id,
            grade=r.grade,
            section=r.section,
            name=f"{r.grade}-{r.section}",
            code_expires_at=r.code_expires_at,
            code_live=r.live,
        )
        for r in rows
    ]


@router.post("/classes", response_model=NewCode, status_code=201)
def add_class(
    body: ClassIn,
    request: Request,
    response: Response,
    staff: Annotated[sa.CurrentStaff, Depends(sa.require_csrf)],
    settings: Annotated[Settings, Depends(_settings)],
) -> NewCode:
    section = body.section.upper()
    with get_engine(request).begin() as conn:
        school = _school(conn, staff, body.school_id)
        taken = conn.execute(
            text("SELECT 1 FROM school_class WHERE school_id = :s AND grade = :g AND section = :sec"),
            {"s": school, "g": body.grade, "sec": section},
        ).first()
        if taken:
            raise ProblemError(409, "class_exists", "That class already exists")
        class_id, code = admin.add_class(
            conn, settings.code_pepper, school, body.grade, section, actor=str(staff.staff_id)
        )
        expires = conn.execute(
            text("SELECT code_expires_at FROM school_class WHERE id = :c"), {"c": class_id}
        ).scalar_one()
    no_store(response)
    return NewCode(class_id=class_id, class_code=code, expires_at=expires)


@router.post("/codes:rotate", response_model=NewCode)
def rotate_code(
    body: RotateIn,
    request: Request,
    response: Response,
    staff: Annotated[sa.CurrentStaff, Depends(sa.require_csrf)],
    settings: Annotated[Settings, Depends(_settings)],
    school_id: Annotated[UUID | None, Query()] = None,
) -> NewCode:
    with get_engine(request).begin() as conn:
        school = _school(conn, staff, school_id)
        _class_in_school(conn, school, body.class_id)
        code = admin.rotate_class_code(conn, settings.code_pepper, body.class_id, actor=str(staff.staff_id))
        expires = conn.execute(
            text("SELECT code_expires_at FROM school_class WHERE id = :c"), {"c": body.class_id}
        ).scalar_one()
    no_store(response)
    return NewCode(class_id=body.class_id, class_code=code, expires_at=expires)
