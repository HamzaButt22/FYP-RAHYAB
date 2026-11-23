"""Synthetic data for the end-to-end (browser) tests in frontend/e2e. LOCAL database only.

    python tools/dev.py e2e          (runs this, then the Playwright suite)

Run inside backend/api's environment (`uv run python ../../tools/e2e_seed.py`) with DATABASE_URL (the local admin
role) and CODE_PEPPER set, as `tools/dev.py e2e` does. It refuses any database that is not on this computer.

Each run first deletes the previous run's "E2E Test School" (a fixed id), then makes, all invented:
- the school, a pilot licence and class 9-E2E;
- a teacher of that class with a random password (written only to the git-ignored state file);
- three Form A consent slips: A-0001 and A-0002 recorded with the teacher box ticked, A-0003 printed only;
- two students who join through the running API with the claim codes of A-0001 and A-0002;
- four weeks of play for each, inserted like backend/api/tests/test_results.py, then POST /results/compute;
- family links through POST /share-links: one per student, and one more for the first that is then turned off.

The tests read frontend/e2e/.state/seed.json. Nothing here is part of the API or the app (NFR-66).
"""

from __future__ import annotations

import base64
import json
import os
import re
import secrets
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from sqlalchemy import Connection, create_engine, text
from sqlalchemy.engine import make_url

from rahyaab_api import staff_auth as sa
from rahyaab_api.codes import code_hash, new_claim_code, new_class_code

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "frontend" / "e2e" / ".state" / "seed.json"
API = os.environ.get("E2E_API_URL", "http://localhost:8000").rstrip("/")
SCHOOL_ID = uuid.UUID("e2e00000-0000-4000-8000-000000000001")  # fixed, so the next run can remove it
PACK = "e2e-2026.11.0"
TEACHER = "e2e-teacher@example.test"
RIASEC = "RIASEC"
PAIRS = [f"{a}-{b}" for i, a in enumerate(RIASEC) for b in RIASEC[i + 1 :]]
STUDENTS = [("Ayan_E2E", "IRCSEA"), ("Sana_E2E", "SAECIR")]  # invented nicknames and preferences


def uuid7() -> str:
    ms = int(time.time() * 1000)
    value = (ms << 80) | (0x7 << 76) | (secrets.randbits(12) << 64) | (0b10 << 62) | secrets.randbits(62)
    return str(uuid.UUID(int=value))


def choices(prefer: str) -> list[tuple[str, str]]:
    """Two rounds of every RIASEC pair, always picking the type that comes first in `prefer`."""
    out = []
    for _ in range(2):
        for pair in PAIRS:
            a, b = pair.split("-")
            out.append((pair, a if prefer.index(a) < prefer.index(b) else b))
    return out


def call(method: str, path: str, body: Any = None, token: str | None = None) -> tuple[int, Any]:
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(f"{API}/v1{path}", data=data, method=method)
    request.add_header("Accept", "application/json")
    if body is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:  # noqa: S310 - local API only
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read() or b"null")


def must(expected: int, answer: tuple[int, Any], what: str) -> Any:
    status, body = answer
    if status != expected:
        sys.exit(f"e2e seed: {what} answered {status}: {body}")
    return body


def remove_previous(conn: Connection) -> None:
    classes = "SELECT id FROM school_class WHERE school_id = :s"
    conn.execute(text(f"DELETE FROM student WHERE class_id IN ({classes})"), {"s": SCHOOL_ID})  # noqa: S608
    conn.execute(text(f"DELETE FROM consent_slip WHERE class_id IN ({classes})"), {"s": SCHOOL_ID})  # noqa: S608
    conn.execute(text("DELETE FROM staff_user WHERE school_id = :s OR email = :e"), {"s": SCHOOL_ID, "e": TEACHER})
    conn.execute(text("DELETE FROM school WHERE id = :s"), {"s": SCHOOL_ID})
    # Fresh counters for the browser: the parent page, staff sign-in and joins are rate limited per address.
    conn.execute(
        text(
            "DELETE FROM rate_limit WHERE key LIKE 'parent\\_%' OR key LIKE 'staff\\_login\\_%' "
            "OR key LIKE 'staff\\_mfa\\_%' OR key LIKE 'share\\_%' OR key LIKE 'join:ip:%'"
        )
    )


def device_key() -> str:
    private = ec.generate_private_key(ec.SECP256R1())
    der = private.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)
    return base64.b64encode(der).decode()


def play(conn: Connection, student_id: str, prefer: str) -> None:
    device = conn.execute(text("SELECT id FROM device WHERE student_id = :s"), {"s": student_id}).scalar_one()
    picks = choices(prefer)
    for week in range(1, 5):
        sitting, run = uuid7(), uuid7()
        conn.execute(
            text("INSERT INTO sitting (id, student_id, device_id, started_at) VALUES (:id, :s, :d, now())"),
            {"id": sitting, "s": student_id, "d": device},
        )
        conn.execute(
            text(
                "INSERT INTO game_run (id, sitting_id, week, story_version, content_version, practice) "
                "VALUES (:id, :sit, :w, 'e2e@1.0.0', :cv, false)"
            ),
            {"id": run, "sit": sitting, "w": week, "cv": PACK},
        )
        week_picks = picks[(week - 1) * 8 : week * 8]
        events = [("run_start", {})] + [("choice_made", {"pair": p, "picked": k}) for p, k in week_picks]
        events.append(("week_complete", {"week": week}))
        for seq, (kind, data) in enumerate(events):
            conn.execute(
                text(
                    "INSERT INTO raw_event (event_id, run_id, seq, type, monotonic_ms, a11y_mode, data) "
                    "VALUES (:e, :r, :seq, :t, :ms, false, CAST(:d AS jsonb))"
                ),
                {"e": uuid7(), "r": run, "seq": seq, "t": kind, "ms": seq * 10.0, "d": json.dumps(data)},
            )


def main() -> None:
    url = make_url(os.environ["DATABASE_URL"])
    if url.host not in ("127.0.0.1", "localhost"):
        sys.exit("e2e seed: refusing a database that is not on this computer")
    if not re.match(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", API):
        sys.exit("e2e seed: refusing an API that is not on this computer")
    pepper = os.environ["CODE_PEPPER"]
    engine = create_engine(url)

    class_code = new_class_code()
    password = secrets.token_urlsafe(18)  # random each run; only in the git-ignored state file
    claims = {serial: new_claim_code() for serial in ("A-0001", "A-0002", "A-0003")}
    with engine.begin() as conn:
        remove_previous(conn)
        conn.execute(
            text(
                "INSERT INTO school (id, name, district, type, board) "
                "VALUES (:id, 'E2E Test School', 'Testville', 'govt', 'FBISE')"
            ),
            {"id": SCHOOL_ID},
        )
        conn.execute(
            text("INSERT INTO licence (kind, school_id, ends_at) VALUES ('pilot', :s, now() + interval '30 days')"),
            {"s": SCHOOL_ID},
        )
        class_id = conn.execute(
            text(
                "INSERT INTO school_class (school_id, grade, section, code_hash, code_expires_at) "
                "VALUES (:s, 9, 'E2E', :h, now() + interval '30 days') RETURNING id"
            ),
            {"s": SCHOOL_ID, "h": code_hash(class_code, pepper)},
        ).scalar_one()
        staff_id = conn.execute(
            text(
                "INSERT INTO staff_user (school_id, email, password_hash, role) "
                "VALUES (:s, :e, :h, 'teacher') RETURNING id"
            ),
            {"s": SCHOOL_ID, "e": TEACHER, "h": sa.hash_password(password)},
        ).scalar_one()
        conn.execute(text("INSERT INTO staff_class (staff_id, class_id) VALUES (:s, :c)"), {"s": staff_id, "c": class_id})
        for serial, claim in claims.items():
            recorded = serial != "A-0003"
            conn.execute(
                text(
                    "INSERT INTO consent_slip (class_id, kind, form_serial, claim_code_hash, research_opt_in, "
                    "teacher_visibility, notice_version, recorded_by, recorded_at, verified_age_band, expires_at) "
                    "VALUES (:c, 'parent', :serial, :h, false, true, '2026-11', :by, CASE WHEN :rec THEN now() END, "
                    "CASE WHEN :rec THEN '13-15' END, now() + interval '60 days')"
                ),
                {
                    "c": class_id,
                    "serial": serial,
                    "h": code_hash(claim, pepper),
                    "by": staff_id if recorded else None,
                    "rec": recorded,
                },
            )
        conn.execute(
            text(
                "INSERT INTO content_pack (id, class_mode, min_app, sha256, signature, manifest, size_bytes, "
                "storage_uri) VALUES (:id, 'matric', '0.1.0', 'x', 'x', '{}', 1, 'e2e://none') "
                "ON CONFLICT (id) DO NOTHING"
            ),
            {"id": PACK},
        )

    students = []
    for (nickname, prefer), serial in zip(STUDENTS, ("A-0001", "A-0002"), strict=True):
        body = {
            "class_code": class_code,
            "claim_code": claims[serial],
            "grade": 9,
            "birth_year": 2011,
            "birth_month": 5,
            "nickname": nickname,
            "lang": "en",
            "device": {"device_tier": "low", "os_major": 13, "app_version": "0.1.0", "public_key": device_key()},
        }
        joined = must(201, call("POST", "/auth/student/join", body), f"join {nickname}")
        token = joined["access_token"]
        with engine.begin() as conn:
            play(conn, joined["student_id"], prefer)
        result = must(200, call("POST", "/results/compute", token=token), f"compute for {nickname}")
        link = must(201, call("POST", "/share-links", {"scope": "report", "recommendation_id": result["id"]}, token), "link")
        students.append(
            {
                "nickname": nickname,
                "form": serial,
                "report_url": link["url"],
                "ranked": [card["stream_id"] for card in result["ranked"]],
                "plan_b": [card.get("plan_b", []) for card in result["ranked"]],
                "token": token,
                "result_id": result["id"],
            }
        )

    # One more link for the first student, turned off at once (TC-SHARE-02).
    first = students[0]
    body = {"scope": "report", "recommendation_id": first["result_id"]}
    revoked = must(201, call("POST", "/share-links", body, first["token"]), "link")
    status, _ = call("DELETE", f"/share-links/{revoked['id']}", token=first["token"])
    if status != 204:
        sys.exit(f"e2e seed: turning off a link answered {status}")
    for s in students:
        del s["token"], s["result_id"]  # the tests act as a parent and a teacher, never as the student

    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(
        json.dumps(
            {
                "api": API,
                "class": {"id": str(class_id), "name": "9-E2E"},
                "teacher": {"email": TEACHER, "password": password},
                "students": students,
                "revoked_url": revoked["url"],
                "forms": {"claimed": ["A-0001", "A-0002"], "printed": ["A-0003"]},
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"e2e seed: E2E Test School, class 9-E2E, 2 students with results, 3 links -> {STATE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
