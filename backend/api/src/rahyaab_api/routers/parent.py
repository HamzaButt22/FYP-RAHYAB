"""The family report page (P-01, P-01b; FR-66..68, FR-105; ADR-0008, RFC-0004).

    GET /p/{token}              the report, server-rendered (Jinja2, autoescaped), no login, no app
    GET /p/static/{name}        parent.css, parent.js and the design tokens (tokens.css)

Built from the **stored** result the link was made for, never recomputed (TC-SHARE-06). An unknown, expired or
revoked link, a withdrawn consent or an archived student all get the same 410 page. Every response carries a
strict CSP with no inline script or style, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
`Cache-Control: no-store` and `noindex`; there are no CORS headers. The link preview names no child.
Rate limits (RFC-0004): 30 requests a minute per address; 20 unknown tokens in 10 minutes block that address
for 15 minutes. The page works without JavaScript; parent.js adds Listen (the phone's own voice) and the
"My children" list, which lives only in the parent's browser (localStorage), off unless the parent saves.
Entry odds and costs (FR-68) come only from streams.json with a source and a date; otherwise the page says
to ask the school. Talk-together questions are draft copy for the content review.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, Response
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import Engine, text

from rahyaab_api import staff_auth as sa
from rahyaab_api.db import get_engine
from rahyaab_api.ratelimit import digest, hit, peek
from rahyaab_api.routers.results import frameworks, frameworks_dir

router = APIRouter(tags=["parent"])

HERE = Path(__file__).resolve().parent.parent / "parent_page"
TEMPLATES = Environment(
    loader=FileSystemLoader(HERE / "templates"),
    autoescape=select_autoescape(enabled_extensions=("html",), default=True),
    trim_blocks=True,
    lstrip_blocks=True,
)
RIASEC = "RIASEC"
PAGE_LIMIT = (30, 60)  # requests per minute per address
UNKNOWN_LIMIT = (20, 600)  # unknown tokens per 10 minutes per address
BLOCK_SECONDS = 900

HEADERS = {
    "Content-Security-Policy": (
        "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; "
        "form-action 'none'; frame-ancestors 'none'"
    ),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
}

TYPE_WORDS = {
    "R": "hands-on work",
    "I": "science",
    "A": "creative work",
    "S": "helping people",
    "E": "leading others",
    "C": "organising",
}
BAND_WORDS = {"strong": "Strong fit", "good": "Good fit", "worth_a_look": "Worth a look"}
CONFIDENCE_WORDS = {"high": "sure", "medium": "fairly sure", "low": "not sure yet"}
# Draft questions for the content review (FR-68): one per strong interest, plus two for every family.
QUESTIONS = {
    "R": "What have you built, fixed or made with your hands that you were proud of?",
    "I": "What would you like to find out about how things work?",
    "A": "What do you like to draw, write, design or make?",
    "S": "When did you last help someone? How did it feel?",
    "E": "When have you led a group or organised something?",
    "C": "Do you like planning things and keeping them in order? What?",
}
EVERY_FAMILY = [
    "Which subjects do you look forward to, and which ones do you dread?",
    "Who could we ask about {path}: a teacher, a relative or someone who studied it?",
]
STATIC = {
    "parent.css": ("text/css; charset=utf-8", HERE / "static" / "parent.css"),
    "parent.js": ("text/javascript; charset=utf-8", HERE / "static" / "parent.js"),
}


@lru_cache(maxsize=1)
def path_names() -> dict[str, str]:
    streams, _ = frameworks()
    return {p["id"]: p["name"] for level in streams["by_class"].values() for p in level["paths"]}


@lru_cache(maxsize=1)
def _costs() -> dict[str, dict[str, Any]]:
    streams, _ = frameworks()
    return {
        p["id"]: p["cost_estimate"]
        for level in streams["by_class"].values()
        for p in level["paths"]
        if p.get("cost_estimate")
    }


def _join(words: list[str]) -> str:
    return words[0] if len(words) == 1 else ", ".join(words[:-1]) + " and " + words[-1]


def _reason(nickname: str, reason: dict[str, Any], names: dict[str, str]) -> str:
    types = [TYPE_WORDS[t] for t in reason.get("types", []) if t in TYPE_WORDS]
    code = reason.get("code")
    if code == "interest_match" and types:
        return f"{nickname}'s choices lean towards {_join(types)}, and so does this path."
    if code == "ability_support":
        return f"{nickname}'s task results support it."
    if code == "keeps_doors_open" and reason.get("doors"):
        return f"It keeps {_join([names.get(d, d) for d in reason['doors']])} open."
    if code == "path_strength" and types:
        return f"It suits people who enjoy {_join(types)}."
    return ""


def _cost_line(path_id: str) -> str | None:
    cost = _costs().get(path_id)
    if not cost:
        return None
    per = "a year" if cost["per"] == "year" else "for the whole course"
    return (
        f"About PKR {cost['min_pkr']:,} to {cost['max_pkr']:,} {per} "
        f"(checked {cost['last_verified']}, source: {cost['source_url']})"
    )


def render_report(
    *,
    nickname: str,
    cards: list[dict[str, Any]],
    questions: list[str],
    confidence: str,
    weeks: int,
    provisional: bool,
) -> str:
    return TEMPLATES.get_template("report.html").render(
        nickname=nickname,
        cards=cards,
        questions=questions,
        confidence=confidence,
        weeks=weeks,
        provisional=provisional,
    )


def _gone() -> HTMLResponse:
    return HTMLResponse(TEMPLATES.get_template("gone.html").render(), status_code=410, headers=HEADERS)


def _too_many() -> HTMLResponse:
    headers = {**HEADERS, "Retry-After": str(BLOCK_SECONDS)}
    return HTMLResponse(TEMPLATES.get_template("busy.html").render(), status_code=429, headers=headers)


def _limited(engine: Engine, ip: str) -> bool:
    """True when this address must wait: blocked after guessing, or too many pages a minute."""
    blocked, _ = peek(engine, f"parent_block:{digest(ip)}", BLOCK_SECONDS)
    if blocked:
        return True
    hits, _ = hit(engine, f"parent_ip:{digest(ip)}", PAGE_LIMIT[1])
    return hits > PAGE_LIMIT[0]


def _count_unknown(engine: Engine, ip: str) -> bool:
    """Counts an unknown token; True when the address has now guessed too often (and is blocked)."""
    misses, _ = hit(engine, f"parent_unknown:{digest(ip)}", UNKNOWN_LIMIT[1])
    if misses > UNKNOWN_LIMIT[0]:
        hit(engine, f"parent_block:{digest(ip)}", BLOCK_SECONDS)
        return True
    return False


_REPORT = text(
    """
    SELECT sl.id, st.id AS student_id, st.nickname, r.ranked, r.confidence, r.model_versions, r.input_hash,
           r.created_at,
           (SELECT count(DISTINCT gr.week) FROM game_run gr JOIN sitting si ON si.id = gr.sitting_id
            WHERE si.student_id = st.id AND NOT gr.practice AND gr.week > 0
              AND EXISTS (SELECT 1 FROM raw_event re WHERE re.run_id = gr.id AND re.type = 'week_complete')
              AND si.started_at <= r.created_at) AS weeks
    FROM share_link sl
    JOIN student st ON st.id = sl.student_id
    JOIN recommendation r ON r.id = sl.recommendation_id
    WHERE sl.token_hash = :h AND sl.scope = 'report' AND sl.revoked_at IS NULL AND sl.expires_at > now()
      AND st.archived_at IS NULL
      AND EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                  AND co.type IN ('parent', 'self') AND co.withdrawn_at IS NULL)
    """
)


@router.get("/p/static/{name}", include_in_schema=False)
def static_file(name: str) -> Response:
    if name == "tokens.css":
        body = (frameworks_dir().parents[1] / "tokens" / "tokens.css").read_bytes()
        return Response(
            body, media_type="text/css; charset=utf-8", headers={"Cache-Control": "public, max-age=3600"}
        )
    entry = STATIC.get(name)
    if entry is None:
        return Response(status_code=404, headers=HEADERS)
    media, path = entry
    return Response(path.read_bytes(), media_type=media, headers={"Cache-Control": "public, max-age=3600"})


@router.get("/p/{token}", response_class=HTMLResponse)
def report_page(token: str, request: Request) -> Response:
    engine = get_engine(request)
    ip = request.client.host if request.client else "unknown"
    if _limited(engine, ip):
        return _too_many()
    if len(token) != 22 or not token.isascii() or not token.isalnum():
        return _too_many() if _count_unknown(engine, ip) else _gone()
    with engine.begin() as conn:
        row = conn.execute(_REPORT, {"h": sa.token_digest(token)}).first()
        if row is not None:
            conn.execute(text("UPDATE share_link SET views = views + 1 WHERE id = :i"), {"i": row.id})
            top = list(
                conn.execute(
                    text(
                        "SELECT construct FROM trait_estimate WHERE student_id = :s AND input_hash = :h "
                        "AND construct = ANY(:riasec) AND theta IS NOT NULL ORDER BY theta DESC LIMIT 2"
                    ),
                    {"s": row.student_id, "h": row.input_hash, "riasec": list(RIASEC)},
                ).scalars()
            )
    if row is None:
        return _too_many() if _count_unknown(engine, ip) else _gone()

    names = path_names()
    ranked = row.ranked if isinstance(row.ranked, list) else json.loads(row.ranked)
    versions = row.model_versions if isinstance(row.model_versions, dict) else json.loads(row.model_versions)
    cards = [
        {
            "name": names.get(c["stream_id"], c["stream_id"]),
            "band": BAND_WORDS.get(c["fit_band"], ""),
            "reasons": [r for r in (_reason(row.nickname, x, names) for x in c.get("reasons", [])) if r],
            "plan_b": ", ".join(names.get(p, p) for p in c.get("plan_b", [])),
            "cost": _cost_line(c["stream_id"]),
        }
        for c in ranked
    ]
    questions = [QUESTIONS[t] for t in top if t in QUESTIONS] + [
        q.format(path=cards[0]["name"]) if cards else q for q in EVERY_FAMILY
    ]
    html = render_report(
        nickname=row.nickname,
        cards=cards,
        questions=questions,
        confidence=CONFIDENCE_WORDS.get(row.confidence, ""),
        weeks=int(row.weeks or 0),
        provisional=str(versions.get("irt", "")).startswith("m1-counts"),
    )
    return HTMLResponse(html, headers=HEADERS)
