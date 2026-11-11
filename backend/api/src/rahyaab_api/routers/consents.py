"""Consent after joining: claim a recorded paper slip later (POST /v1/consents:claim, FR-05a).

A student who joined before their family's signed form came back enters the claim code when it does. The
same rules as at join apply (student_auth.claim_slip): only a recorded, unexpired slip of the student's own
class; the register's age band wins; claim codes pause per class after 30 failures; a seat is used now.
"""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text

from rahyaab_api.auth import CurrentStudent, current_student
from rahyaab_api.db import get_engine
from rahyaab_api.ratelimit import Limit, enforce
from rahyaab_api.routers.student_auth import (
    _active_licence_seats,
    _ClaimRejected,
    _client_ip,
    _not_accepted,
    claim_slip,
    count_claim_failure,
)

router = APIRouter(tags=["consent"])

CLAIM_STUDENT_LIMIT = Limit("claim:student", 10, 15 * 60)


class ClaimRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    claim_code: str = Field(pattern=r"^[A-Z0-9]{4}-[A-Z0-9]{4}$")


class ClaimResult(BaseModel):
    consent_state: Literal["granted"]


@router.post("/consents:claim", response_model=ClaimResult)
def claim_consent_slip(
    body: ClaimRequest,
    request: Request,
    student: Annotated[CurrentStudent, Depends(current_student)],
) -> ClaimResult:
    engine = get_engine(request)
    enforce(engine, CLAIM_STUDENT_LIMIT, str(student.student_id))
    enforce(engine, Limit("join:ip", 300, 15 * 60), _client_ip(request))  # shares the join ceiling per IP

    with engine.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT st.class_id, c.school_id,
                       EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                               AND co.type IN ('parent', 'self') AND co.withdrawn_at IS NULL) AS has_consent
                FROM student st JOIN school_class c ON c.id = st.class_id
                WHERE st.id = :s
                """
            ),
            {"s": student.student_id},
        ).one_or_none()
        if row is None:  # individual path (no class): slips do not apply
            raise _not_accepted()
        if row.has_consent:
            return ClaimResult(consent_state="granted")  # already granted; the slip is not used up
        seats = _active_licence_seats(conn, row.school_id)
        try:
            claim_slip(engine, conn, row.class_id, row.school_id, seats, student.student_id, body.claim_code)
        except _ClaimRejected:
            failed_class = row.class_id
        else:
            return ClaimResult(consent_state="granted")
    count_claim_failure(engine, failed_class)  # outside the rolled-back transaction
    raise _not_accepted()
