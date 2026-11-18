"""Consent records on the dashboard (D-11; FR-05a, FR-06, FR-78, FR-83). Database tests.

Teachers of a class (and the school admin) list its paper consent forms, record a returned form (the age band
from the admission register and the research and teacher boxes), and print new numbered forms as the same two
encrypted Excel files the admin command makes, with the password shown once and a sealed copy kept.
"""

import base64
import io
import re
import uuid
from collections.abc import Iterator
from typing import Any

import msoffcrypto
import msoffcrypto.exceptions
import openpyxl
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import API_URL, MASTER_KEY_FILE, PEPPER, SIGNING_KEY, World
from test_dashboard_api import School

from rahyaab_api import register
from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

JOIN = "/v1/auth/student/join"


@pytest.fixture(scope="module")
def client(admin: Engine) -> Iterator[TestClient]:
    app = create_app(
        Settings(
            app_env="test",
            database_url=API_URL,
            jwt_signing_key=SIGNING_KEY,
            code_pepper=PEPPER,
            data_key_wrapper_file=MASTER_KEY_FILE,
        )
    )
    with TestClient(app, base_url="https://testserver") as c:
        yield c
    app.state.engine.dispose()


@pytest.fixture
def school(world: World, admin: Engine, client: TestClient) -> Iterator[School]:
    s = School(world, admin, client)
    yield s
    # Forms recorded by this test's staff go first: consent_slip.recorded_by keeps their staff row in place.
    s.sql("DELETE FROM school_file WHERE class_id = ANY(:c)", c=world.class_ids)
    s.sql("DELETE FROM student WHERE class_id = ANY(:c)", c=world.class_ids)
    s.sql("DELETE FROM consent_slip WHERE class_id = ANY(:c)", c=world.class_ids)
    s.cleanup()


def forms_url(class_id: uuid.UUID) -> str:
    return f"/v1/dash/classes/{class_id}/consent-slips"


def record_url(class_id: uuid.UUID, serial: str) -> str:
    return f"/v1/dash/classes/{class_id}/consent-slips/{serial}:record"


def decrypt(content_b64: str, password: str) -> openpyxl.Workbook:
    office = msoffcrypto.OfficeFile(io.BytesIO(base64.b64decode(content_b64)))
    office.load_key(password=password)
    plain = io.BytesIO()
    office.decrypt(plain)
    plain.seek(0)
    return openpyxl.load_workbook(plain)


def printed(
    client: TestClient, class_id: uuid.UUID, csrf: str, count: int = 3, kind: str = "parent"
) -> dict[str, Any]:
    r = client.post(forms_url(class_id), json={"count": count, "kind": kind}, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201, r.text
    body: dict[str, Any] = r.json()
    return body


# ------------------------------------------------------------------------------------------- printing
def test_tc_dash_12_printing_gives_two_encrypted_files_and_a_sealed_password(
    client: TestClient, school: School
) -> None:
    class_id, _ = school.world.add_class()
    teacher = school.add_staff("teacher", [class_id])
    csrf = school.as_staff(teacher)

    r = client.post(forms_url(class_id), json={"count": 3, "kind": "parent"}, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201 and r.headers["cache-control"] == "no-store"
    body = r.json()
    assert (body["first"], body["last"], body["count"]) == ("A-0001", "A-0003", 3)
    assert len(body["files"]) == 2 and all(f["name"].endswith(".xlsx") for f in body["files"])
    slips = decrypt(body["files"][0]["content"], body["password"])["Slips"]
    rows = [[c.value for c in row] for row in slips.iter_rows(min_row=2)]
    assert [r[0] for r in rows] == ["A-0001", "A-0002", "A-0003"] and all(r[1] for r in rows)
    register_ws = decrypt(body["files"][1]["content"], body["password"])["Register"]
    assert register_ws["H1"].value == "Teacher box ticked"
    with pytest.raises(msoffcrypto.exceptions.InvalidKeyError):
        decrypt(body["files"][0]["content"], "wrong-password")

    # The sealed copy opens to the same password (only the admin command reads it), and nothing else is kept.
    (file_id, sealed) = school.sql(
        "SELECT id, sealed_password FROM school_file WHERE class_id = :c", c=class_id
    )[0]
    assert register.open_password(bytes(sealed), PEPPER, file_id) == body["password"]
    assert f"class:{class_id}:3" in school.audits(teacher, "slips.print")
    # Numbering continues; Form C has its own series.
    assert printed(client, class_id, csrf, 2)["first"] == "A-0004"
    assert printed(client, class_id, csrf, 1, kind="self")["first"] == "C-0001"


def test_tc_dash_12_printing_checks_count_kind_csrf_and_class(client: TestClient, school: School) -> None:
    class_id, _ = school.world.add_class()
    other, _ = school.world.add_class()
    csrf = school.as_staff(school.add_staff("teacher", [class_id]))
    for bad in (
        {"count": 0, "kind": "parent"},
        {"count": 61, "kind": "parent"},
        {"count": 2, "kind": "teacher"},
    ):
        assert client.post(forms_url(class_id), json=bad, headers={"X-CSRF-Token": csrf}).status_code == 422
    assert client.post(forms_url(class_id), json={"count": 2, "kind": "parent"}).status_code == 403  # no CSRF
    r = client.post(forms_url(other), json={"count": 2, "kind": "parent"}, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 404


# ------------------------------------------------------------------------------------------ recording
def test_tc_dash_11_recording_a_returned_form(client: TestClient, school: School) -> None:
    class_id, code = school.world.add_class()
    teacher = school.add_staff("teacher", [class_id])
    csrf = school.as_staff(teacher)
    body = printed(client, class_id, csrf, 2)
    slips = decrypt(body["files"][0]["content"], body["password"])["Slips"]
    claim = {row[0].value: row[1].value for row in slips.iter_rows(min_row=2)}

    headers = {"X-CSRF-Token": csrf}
    form = {"age_band": "13-15", "research_opt_in": True, "teacher_visible": True}
    assert client.post(record_url(class_id, "A-0001"), json=form).status_code == 403  # no CSRF
    r = client.post(record_url(class_id, "A-0001"), json=form, headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "recorded"
    again = client.post(record_url(class_id, "A-0001"), json=form, headers=headers)
    assert again.status_code == 409 and again.json()["code"] == "already_recorded"
    adult_band = client.post(
        record_url(class_id, "A-0002"), json={**form, "age_band": "18-19"}, headers=headers
    )
    assert adult_band.status_code == 422 and adult_band.json()["errors"][0]["field"] == "age_band"
    assert client.post(record_url(class_id, "A-9999"), json=form, headers=headers).status_code == 404
    assert "slip:" in "".join(school.audits(teacher, "slip.record"))

    # The student who brings form A-0001 can now join with its claim code, and the teacher sees them.
    school.client.cookies.clear()
    joined = client.post(JOIN, json=school.world.body(code, claim_code=claim["A-0001"]))
    assert joined.status_code == 201 and joined.json()["consent_state"] == "granted"
    sid = joined.json()["student_id"]
    kinds = {r[0] for r in school.sql("SELECT type FROM consent WHERE student_id = :s", s=sid)}
    assert kinds == {"parent", "research", "teacher_visibility"}
    assert (
        school.sql("SELECT recorded_by FROM consent WHERE student_id = :s AND type = 'parent'", s=sid)[0][0]
        == teacher
    )


def test_tc_dash_11_another_class_teacher_cannot_record(client: TestClient, school: School) -> None:
    class_id, _ = school.world.add_class()
    other, _ = school.world.add_class()
    printed(client, class_id, school.as_staff(school.add_staff("teacher", [class_id])), 1)
    csrf = school.as_staff(school.add_staff("teacher", [other]))
    form = {"age_band": "13-15", "research_opt_in": False, "teacher_visible": True}
    r = client.post(record_url(class_id, "A-0001"), json=form, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 404


# -------------------------------------------------------------------------------------------- listing
def test_tc_dash_10_the_forms_list_shows_status_without_naming_hidden_students(
    client: TestClient, school: School
) -> None:
    class_id, code = school.world.add_class()
    teacher = school.add_staff("teacher", [class_id])
    csrf = school.as_staff(teacher)
    body = printed(client, class_id, csrf, 4)
    slips = decrypt(body["files"][0]["content"], body["password"])["Slips"]
    claim = {row[0].value: row[1].value for row in slips.iter_rows(min_row=2)}
    headers = {"X-CSRF-Token": csrf}
    for serial, teacher_box in (("A-0001", True), ("A-0002", False), ("A-0003", True)):
        form = {"age_band": "13-15", "research_opt_in": False, "teacher_visible": teacher_box}
        assert client.post(record_url(class_id, serial), json=form, headers=headers).status_code == 200
    school.client.cookies.clear()
    shown = client.post(JOIN, json=school.world.body(code, claim_code=claim["A-0001"])).json()
    client.post(JOIN, json=school.world.body(code, claim_code=claim["A-0002"]))  # no teacher box
    school.sql(
        "UPDATE consent_slip SET expires_at = now() - interval '1 day' "
        "WHERE class_id = :c AND form_serial = 'A-0004'",
        c=class_id,
    )
    school.as_staff(teacher)

    r = client.get(forms_url(class_id))
    assert r.status_code == 200
    forms = {f["serial"]: f for f in r.json()}
    assert [forms[s]["status"] for s in ("A-0001", "A-0002", "A-0003", "A-0004")] == [
        "claimed",
        "claimed",
        "recorded",
        "expired",
    ]
    assert (
        forms["A-0001"]["nickname"]
        == school.sql("SELECT nickname FROM student WHERE id = :s", s=shown["student_id"])[0][0]
    )
    assert forms["A-0002"]["nickname"] is None  # claimed, but the family did not agree to teacher visibility
    assert forms["A-0001"]["teacher_visible"] is True and forms["A-0002"]["teacher_visible"] is False
    assert forms["A-0001"]["age_band"] == "13-15" and forms["A-0004"]["age_band"] is None
    assert forms["A-0001"]["recorded_by"] and forms["A-0001"]["kind"] == "parent"
    # Claim codes are never shown again: no such field, and nothing shaped like a code (XXXX-XXXX).
    assert all("claim_code" not in f for f in r.json())
    assert not re.search(r"[A-Z2-9]{4}-[A-Z2-9]{4}", r.text)
    assert f"class:{class_id}" in school.audits(teacher, "dash.consent_slips")


def test_tc_dash_10_forms_list_scope(client: TestClient, school: School) -> None:
    class_id, _ = school.world.add_class()
    other, _ = school.world.add_class()
    school.as_staff(school.add_staff("teacher", [class_id]))
    assert client.get(forms_url(other)).status_code == 404
    school.as_staff(school.add_staff("researcher", school=False))
    assert client.get(forms_url(class_id)).status_code == 403
    school.as_staff(school.add_staff("school_admin"))
    assert client.get(forms_url(class_id)).status_code == 200


def test_tc_dash_12_the_api_can_store_but_never_read_sealed_passwords(admin: Engine) -> None:
    with admin.connect() as conn:
        can = {
            p: conn.execute(
                text("SELECT has_table_privilege('api_rw', 'school_file', :p)"), {"p": p}
            ).scalar()
            for p in ("INSERT", "SELECT", "UPDATE", "DELETE")
        }
    assert can == {"INSERT": True, "SELECT": False, "UPDATE": False, "DELETE": False}
