"""Results: the top-3 paths (POST /v1/results/compute, GET /v1/results/latest, GET /v1/results/{id}/why).

FR-45, FR-46, FR-51, FR-53, FR-56; RFC-0003. The scoring itself is backend/scoring (rahyaab_scoring):
this module only gathers the inputs, stores what comes out, and reads it back.

Inputs: the student's forced choices (`choice_made` events with data {pair, picked}) from runs that are
not practice runs and not in accessible task mode (FR-98: played but not measured); weeks played (the
number of `week_complete` events: the envelope and game_run allow weeks 0-4 only, so FR-51's extra
"week 5" is a fifth completed week, whatever content it replays); grade, board and current group.
Results need the family's consent, like uploads. The same inputs always give the same stored result
(input_hash).
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from rahyaab_scoring import interests, recommend
from sqlalchemy import Connection, text
from starlette.concurrency import run_in_threadpool

from rahyaab_api.auth import CurrentStudent, current_student
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError
from rahyaab_api.ratelimit import Limit, enforce

router = APIRouter(tags=["results"])

COMPUTE_LIMIT = Limit("results:student", 30, 60 * 60)
CARD_FIELDS = ("stream_id", "fit_band", "reasons", "doors", "plan_b")  # `fit` is stored, never shown (FR-54)


def frameworks_dir() -> Path:
    """design/game/frameworks: FRAMEWORKS_DIR, or found from this file (repo checkout and the API image)."""
    configured = os.environ.get("FRAMEWORKS_DIR")
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parents[5] / "design" / "game" / "frameworks"


@lru_cache(maxsize=1)
def frameworks() -> tuple[dict[str, Any], dict[str, Any]]:
    folder = frameworks_dir()
    streams = json.loads((folder / "streams.json").read_text(encoding="utf-8"))
    scoring = json.loads((folder / "scoring.json").read_text(encoding="utf-8"))
    return streams, scoring


def _consent_required() -> ProblemError:
    return ProblemError(403, "consent_required", "Results open once your family says OK")


def _public(row: Any) -> dict[str, Any]:
    ranked = row.ranked if isinstance(row.ranked, list) else json.loads(row.ranked)
    versions = row.model_versions if isinstance(row.model_versions, dict) else json.loads(row.model_versions)
    return {
        "id": str(row.id),
        "mode": row.mode,
        "provisional": versions.get("irt", "").startswith("m1-counts"),
        "confidence": row.confidence,
        "ranked": [{k: card[k] for k in CARD_FIELDS if k in card} for card in ranked],
        "tasks_measured": [],
        "model_version": row.model_version,
        "content_version": row.content_version,
        "input_hash": row.input_hash,
        "created_at": row.created_at.isoformat(),
    }


def _gather(conn: Connection, student_id: UUID) -> tuple[Any, list[interests.Choice], int, str]:
    student = conn.execute(
        text(
            """
            SELECT st.grade, st.board, st.current_group,
                   EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                           AND co.type IN ('parent', 'self') AND co.withdrawn_at IS NULL) AS consented
            FROM student st WHERE st.id = :s
            """
        ),
        {"s": student_id},
    ).one()
    rows = conn.execute(
        text(
            """
            SELECT re.type, re.data, gr.week, gr.content_version
            FROM raw_event re
            JOIN game_run gr ON gr.id = re.run_id
            JOIN sitting s ON s.id = gr.sitting_id
            WHERE s.student_id = :s AND NOT gr.practice AND NOT re.a11y_mode
              AND re.type IN ('choice_made', 'week_complete')
            ORDER BY re.event_id
            """
        ),
        {"s": student_id},
    ).all()
    choices: list[interests.Choice] = []
    weeks = 0
    content_version = "none"
    for r in rows:
        data = r.data if isinstance(r.data, dict) else json.loads(r.data or "{}")
        if r.type == "week_complete":
            weeks += 1
        elif isinstance(data.get("pair"), str) and isinstance(data.get("picked"), str):
            choices.append(interests.Choice(data["pair"], data["picked"]))
            content_version = r.content_version
    return student, choices, weeks, content_version


def _compute(engine: Any, student_id: UUID) -> dict[str, Any]:
    streams, scoring = frameworks()
    with engine.begin() as conn:
        student, choices, weeks, content_version = _gather(conn, student_id)
        if not student.consented:
            raise _consent_required()
        context = recommend.Context(
            grade=int(student.grade),
            board=student.board,
            current_group=student.current_group,
            weeks_played=weeks,
        )
        try:
            result = recommend.recommend(choices, context, streams, scoring)
        except recommend.InsufficientEvidence as e:
            raise ProblemError(
                409,
                "insufficient_evidence",
                "Not sure about you yet: one more week?",
                errors=[
                    {"field": "evidence", "code": e.reason, "message_key": f"results.evidence.{e.reason}"}
                ],
            ) from None
        except recommend.NotSupported:
            raise ProblemError(422, "mode_not_supported", "Results for this class come later") from None

        existing = conn.execute(
            text(
                "SELECT id, mode, ranked, confidence, model_version, model_versions, content_version, "
                "input_hash, "
                "created_at FROM recommendation WHERE student_id = :s AND input_hash = :h"
            ),
            {"s": student_id, "h": result.input_hash},
        ).one_or_none()
        if existing is not None:
            return _public(existing)  # the same inputs: the stored result, unchanged (RFC-0003)

        previous = conn.execute(
            text("SELECT id FROM recommendation WHERE student_id = :s ORDER BY created_at DESC LIMIT 1"),
            {"s": student_id},
        ).scalar_one_or_none()
        features = result.features
        for t in interests.RIASEC:
            conn.execute(
                text(
                    "INSERT INTO trait_estimate (student_id, construct, theta, se, model_version, "
                    "content_version, input_hash) VALUES (:s, :c, :theta, :se, :m, :cv, :h) "
                    "ON CONFLICT (student_id, input_hash, construct) DO NOTHING"
                ),
                {
                    "s": student_id,
                    "c": t,
                    "theta": features["theta"][t],
                    "se": features["se"][t],
                    "m": result.model_versions["irt"],
                    "cv": content_version,
                    "h": result.input_hash,
                },
            )
        row = conn.execute(
            text(
                """
                INSERT INTO recommendation (student_id, mode, ranked, features, contributions, rules_applied,
                    confidence, model_version, model_versions, content_version, input_hash, supersedes)
                VALUES (:s, :mode, CAST(:ranked AS jsonb), CAST(:features AS jsonb), CAST(:contrib AS jsonb),
                    CAST(:rules AS jsonb), :conf, :m3, CAST(:versions AS jsonb), :cv, :h, :prev)
                RETURNING id, mode, ranked, confidence, model_version, model_versions, content_version,
                    input_hash, created_at
                """
            ),
            {
                "s": student_id,
                "mode": result.mode,
                "ranked": json.dumps(result.ranked),
                "features": json.dumps({**features, **result.extras}),
                "contrib": json.dumps(result.contributions),
                "rules": json.dumps(result.rules_applied),
                "conf": result.confidence,
                "m3": result.model_versions["m3"],
                "versions": json.dumps(result.model_versions),
                "cv": content_version,
                "h": result.input_hash,
                "prev": previous,
            },
        ).one()
        return _public(row)


@router.post("/results/compute")
async def compute_result(
    request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> dict[str, Any]:
    engine = get_engine(request)
    await run_in_threadpool(enforce, engine, COMPUTE_LIMIT, str(student.student_id))
    return await run_in_threadpool(_compute, engine, student.student_id)


@router.get("/results/latest")
def latest_result(
    request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> dict[str, Any]:
    with get_engine(request).connect() as conn:
        row = conn.execute(
            text(
                "SELECT id, mode, ranked, confidence, model_version, model_versions, content_version, "
                "input_hash, "
                "created_at FROM recommendation WHERE student_id = :s ORDER BY created_at DESC LIMIT 1"
            ),
            {"s": student.student_id},
        ).one_or_none()
    if row is None:
        raise ProblemError(404, "not_found", "No result yet")
    return _public(row)


@router.get("/results/{result_id}/why")
def result_evidence(
    result_id: UUID, request: Request, student: Annotated[CurrentStudent, Depends(current_student)]
) -> dict[str, Any]:
    with get_engine(request).connect() as conn:
        row = conn.execute(
            text(
                "SELECT ranked, features, contributions, rules_applied, confidence FROM recommendation "
                "WHERE id = :id AND student_id = :s"
            ),
            {"id": result_id, "s": student.student_id},
        ).one_or_none()
    if row is None:  # someone else's result looks exactly like a missing one
        raise ProblemError(404, "not_found", "No such result")
    ranked, features, contributions = row.ranked, row.features, row.contributions
    _, scoring = frameworks()
    weights = scoring["m3_recommender"]["congruence"]["weights"]
    paths = []
    for card in ranked:
        sid = card["stream_id"]
        contrib = contributions.get(sid, {})
        total_w = sum(weights[k] for k in contrib) or 1.0
        paths.append(
            {
                "stream_id": sid,
                "contributions": [
                    {"feature": k, "weight": round(weights[k] / total_w, 4), "contribution": v}
                    for k, v in sorted(contrib.items(), key=lambda kv: -kv[1])
                ],
                "reasons": card.get("reasons", []),
                "rules_applied": sorted({g for d in card.get("doors", []) for g in d.get("gates", [])}),
            }
        )
    top_types = sorted(features["theta"], key=lambda t: -features["theta"][t])[:3]
    return {
        "result_id": str(result_id),
        "confidence": row.confidence,
        "evidence": {
            "choices": features.get("choices", 0),
            "coverage": features.get("coverage", 0),
            "weeks_played": features.get("weeks_played", 0),
            "top_interest_types": top_types,
            "differentiation": features.get("differentiation"),
        },
        "paths": paths,
        "rules_applied": row.rules_applied,
    }
