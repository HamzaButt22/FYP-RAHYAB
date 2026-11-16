"""The student's own profile (S-05, FR-101, FR-104): read it, and change the facts the results depend on.

GET /me/profile returns the profile. PATCH /me/profile (JSON merge patch) changes, for now, the board,
the current group and the student's situation; nickname, grade (the class check-in), district and marks
come later. A field set to null is cleared.

The current group depends on the class (streams.json, by_class): class 8 has no group yet; class 9-10 has
a Matric group (the class-8 decision: matric_science_bio, matric_science_cs, ...); class 11-12 has an
Intermediate stream (the class 9-10 decision: pre_medical, ics, ...). The results engine reads the group
for the doors (rules.py: does the student have Biology?). Changing a fact does not change a stored result;
the next POST /results/compute uses it.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Connection, text
from starlette.concurrency import run_in_threadpool

from rahyaab_api.auth import CurrentStudent, current_student
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError, field_error
from rahyaab_api.routers.results import frameworks

router = APIRouter(tags=["profile"])

Board = Literal["FBISE", "PUNJAB", "SINDH", "KPK", "BALOCHISTAN", "AJK", "CAMBRIDGE", "OTHER"]
Situation = Literal[
    "repeating_class",
    "private_candidate",
    "returning_learner",
    "changed_board",
    "o_a_level",
    "dae",
    "madrassa_or_foreign",
]
EDITABLE = ("board", "current_group", "situation")
UPDATE = text(
    """
    UPDATE student SET
      board         = CASE WHEN :set_board         THEN :value_board         ELSE board         END,
      current_group = CASE WHEN :set_current_group THEN :value_current_group ELSE current_group END,
      situation     = CASE WHEN :set_situation     THEN :value_situation     ELSE situation     END
    WHERE id = :s
    """
)


class ProfileUpdate(BaseModel):
    """The fields a student can change now. Unknown or not-yet-editable fields are refused (422)."""

    model_config = ConfigDict(extra="forbid", strict=True)

    board: Board | None = None
    current_group: str | None = None
    situation: Situation | None = None


def groups_for(grade: int) -> tuple[str, ...]:
    """The current-group ids a student in this class can have (empty: no group yet)."""
    streams, _ = frameworks()
    decided_in = {9: "8", 10: "8", 11: "9-10", 12: "9-10"}.get(grade)
    if decided_in is None:
        return ()
    return tuple(p["id"] for p in streams["by_class"][decided_in]["paths"])


def _read(conn: Connection, student_id: UUID) -> dict[str, Any]:
    row = conn.execute(
        text(
            "SELECT id, nickname, grade, board, current_group, district, marks, class_id, age_band, "
            "situation FROM student WHERE id = :s"
        ),
        {"s": student_id},
    ).one()
    return {
        "student_id": str(row.id),
        "nickname": row.nickname,
        "grade": int(row.grade),
        "board": row.board,
        "current_group": row.current_group,
        "district": row.district,
        "marks": row.marks,
        "class_id": str(row.class_id) if row.class_id else None,
        "age_band": row.age_band,
        "situation": row.situation,
        "groups": list(groups_for(int(row.grade))),
    }


def _update(engine: Any, student_id: UUID, patch: ProfileUpdate) -> dict[str, Any]:
    changes = {k: getattr(patch, k) for k in EDITABLE if k in patch.model_fields_set}
    with engine.begin() as conn:
        grade = int(
            conn.execute(text("SELECT grade FROM student WHERE id = :s"), {"s": student_id}).scalar_one()
        )
        group = changes.get("current_group")
        if group is not None and group not in groups_for(grade):
            raise ProblemError(
                422,
                "validation_failed",
                "Please check the highlighted field",
                errors=[field_error("current_group", "not_for_your_class")],
            )
        if changes:
            params: dict[str, Any] = {"s": student_id}
            for (
                field
            ) in EDITABLE:  # set_x: whether the patch named x (null clears it); value_x: the new value
                params[f"set_{field}"] = field in changes
                params[f"value_{field}"] = changes.get(field)
            conn.execute(UPDATE, params)
        return _read(conn, student_id)


@router.get("/me/profile")
def get_profile(
    request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> dict[str, Any]:
    with get_engine(request).connect() as conn:
        return _read(conn, student.student_id)


@router.patch("/me/profile")
async def update_profile(
    patch: ProfileUpdate, request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> dict[str, Any]:
    return await run_in_threadpool(_update, get_engine(request), student.student_id, patch)
