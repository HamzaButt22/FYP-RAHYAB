"""School setup on the dashboard (D-09; FR-80, FR-106, FR-83). Database tests.

A school admin manages their own school only: invites teachers, counsellors and school admins (an email,
never a password), changes their classes, disables an account, forces a password reset or resets two-step
sign-in, adds classes and makes new class codes (each shown once). Platform admin and researcher accounts are
made with the admin command only. A platform admin may use these routes for a school named in the request.
"""

import uuid
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from support import API_URL, MASTER_KEY_FILE, PEPPER, SIGNING_KEY, World
from test_dashboard_api import School

from rahyaab_api import staff_auth as sa
from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

STAFF = "/v1/admin/staff"
CLASSES = "/v1/admin/classes"
ROTATE = "/v1/admin/codes:rotate"
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
    # Staff invited through the API are this school's too; remove them with the test's own staff.
    s.sql("DELETE FROM email_outbox WHERE to_address LIKE 'setup-%@test.invalid'")
    s.sql(
        "DELETE FROM staff_user WHERE school_id = :s AND email LIKE 'setup-%@test.invalid'", s=world.school_id
    )
    s.cleanup()


def email() -> str:
    return f"setup-{uuid.uuid4().hex[:10]}@test.invalid"


def as_head(school: School) -> tuple[uuid.UUID, dict[str, str]]:
    head = school.add_staff("school_admin")
    return head, {"X-CSRF-Token": school.as_staff(head)}


def staff_row(rows: list[dict[str, Any]], staff_id: uuid.UUID) -> dict[str, Any]:
    return next(r for r in rows if r["id"] == str(staff_id))


# ---------------------------------------------------------------------------------------- who may use it
def test_tc_adm_03_only_school_admins_and_platform_admins(client: TestClient, school: School) -> None:
    client.cookies.clear()
    assert client.get(STAFF).status_code == client.get(CLASSES).status_code == 401
    for role in ("teacher", "counsellor"):
        school.as_staff(school.add_staff(role))
        assert client.get(STAFF).status_code == client.get(CLASSES).status_code == 403
    school.as_staff(school.add_staff("researcher", school=False))
    assert client.get(STAFF).status_code == 403
    head, _ = as_head(school)
    assert client.get(STAFF).status_code == client.get(CLASSES).status_code == 200
    # A platform admin names the school; without it the request is incomplete.
    school.as_staff(school.add_staff("admin", school=False))
    assert client.get(STAFF).status_code == 422
    assert client.get(f"{STAFF}?school_id={school.world.school_id}").status_code == 200


def test_tc_adm_03_school_admins_see_only_their_own_school(client: TestClient, school: School) -> None:
    head, _ = as_head(school)
    other = World(school.admin)
    try:
        rows = client.get(STAFF).json()
        assert str(head) in {r["id"] for r in rows} and str(other.staff_id) not in {r["id"] for r in rows}
        # Naming another school is refused the same way as anything that does not exist.
        assert client.get(f"{STAFF}?school_id={other.school_id}").status_code == 404
        r = client.patch(
            f"{STAFF}/{other.staff_id}",
            json={"disabled": True},
            headers={"X-CSRF-Token": school.as_staff(head)},
        )
        assert r.status_code == 404
    finally:
        other.cleanup()


# ------------------------------------------------------------------------------------------- invite
def test_tc_adm_04_inviting_a_teacher_sends_an_invite_and_sets_classes(
    client: TestClient, school: School
) -> None:
    class_a, _ = school.world.add_class()
    class_b, _ = school.world.add_class()
    head, csrf = as_head(school)
    address = email()
    r = client.post(
        STAFF,
        json={"email": address.upper(), "role": "teacher", "class_ids": [str(class_a), str(class_b)]},
        headers=csrf,
    )
    assert r.status_code == 201, r.text
    new_id = uuid.UUID(r.json()["id"])
    assert school.sql("SELECT password_hash, school_id FROM staff_user WHERE id = :i", i=new_id)[0] == (
        sa.NO_PASSWORD,
        school.world.school_id,
    )
    assert (
        school.sql(
            "SELECT count(*) FROM email_outbox WHERE to_address = :e AND template = 'staff_invite'", e=address
        )[0][0]
        == 1
    )
    row = staff_row(client.get(STAFF).json(), new_id)
    assert row["email"] == address and row["status"] == "invited" and row["two_step"] is False
    assert {c["id"] for c in row["classes"]} == {str(class_a), str(class_b)}
    assert any(a.startswith("staff:") for a in school.audits(head, "staff.add"))

    again = client.post(STAFF, json={"email": address, "role": "teacher"}, headers=csrf)
    assert again.status_code == 409 and again.json()["code"] == "email_taken"


def test_tc_adm_04_school_admins_cannot_create_team_accounts_or_use_other_classes(
    client: TestClient, school: School
) -> None:
    _, csrf = as_head(school)
    for role in ("admin", "researcher"):
        r = client.post(STAFF, json={"email": email(), "role": role}, headers=csrf)
        assert r.status_code == 422 and r.json()["errors"][0]["field"] == "role"
    other = World(school.admin)
    try:
        foreign, _ = other.add_class()
        r = client.post(
            STAFF, json={"email": email(), "role": "teacher", "class_ids": [str(foreign)]}, headers=csrf
        )
        assert r.status_code == 422 and r.json()["errors"][0]["field"] == "class_ids"
    finally:
        other.cleanup()
    assert client.post(STAFF, json={"email": email(), "role": "teacher"}).status_code == 403  # no CSRF
    bad = client.post(STAFF, json={"email": "not-an-email", "role": "teacher"}, headers=csrf)
    assert bad.status_code == 422


# -------------------------------------------------------------------------------------------- change
def test_tc_adm_05_changing_classes_disabling_and_resets(client: TestClient, school: School) -> None:
    class_a, _ = school.world.add_class()
    class_b, _ = school.world.add_class()
    teacher = school.add_staff("teacher", [class_a])
    school.sql(
        "UPDATE staff_user SET password_hash = 'x', mfa_secret_encrypted = '\\x00' WHERE id = :i", i=teacher
    )
    school.sql(
        "INSERT INTO staff_session (staff_id, token_hash, mfa_passed_at, expires_at) "
        "VALUES (:s, :h, now(), now() + interval '1 hour')",
        s=teacher,
        h=f"live-{teacher.hex}",
    )
    head, csrf = as_head(school)
    url = f"{STAFF}/{teacher}"

    r = client.patch(url, json={"class_ids": [str(class_b)]}, headers=csrf)
    assert r.status_code == 200
    assert {c["id"] for c in r.json()["classes"]} == {str(class_b)}

    live = "SELECT count(*) FROM staff_session WHERE staff_id = :i AND revoked_at IS NULL"
    assert client.patch(url, json={"reset_two_step": True}, headers=csrf).json()["two_step"] is False
    assert school.sql(live, i=teacher)[0][0] == 0
    assert client.patch(url, json={"force_password_reset": True}, headers=csrf).status_code == 200
    assert school.sql("SELECT password_hash FROM staff_user WHERE id = :i", i=teacher)[0][0] == sa.NO_PASSWORD
    assert client.patch(url, json={"disabled": True}, headers=csrf).json()["status"] == "disabled"
    assert client.patch(url, json={"disabled": False}, headers=csrf).json()["status"] != "disabled"
    actions = {r[0] for r in school.sql("SELECT action FROM audit_log WHERE actor = :a", a=str(head))}
    assert {
        "staff.assign_class",
        "staff.mfa_reset",
        "staff.force_reset",
        "staff.disable",
        "staff.enable",
    } <= actions
    assert client.patch(url, json={"disabled": True}).status_code == 403  # no CSRF


def test_tc_adm_05_nobody_can_disable_or_reset_themselves_or_touch_team_accounts(
    client: TestClient, school: School
) -> None:
    head, csrf = as_head(school)
    for change in ({"disabled": True}, {"force_password_reset": True}, {"reset_two_step": True}):
        r = client.patch(f"{STAFF}/{head}", json=change, headers=csrf)
        assert r.status_code == 409 and r.json()["code"] == "not_on_yourself"
    platform = school.add_staff("admin", school=False)
    assert client.patch(f"{STAFF}/{platform}", json={"disabled": True}, headers=csrf).status_code == 404
    assert client.patch(f"{STAFF}/{uuid.uuid4()}", json={"disabled": True}, headers=csrf).status_code == 404


# ------------------------------------------------------------------------------------------- classes
def test_tc_adm_06_adding_a_class_gives_a_code_once_that_works(client: TestClient, school: School) -> None:
    head, csrf = as_head(school)
    r = client.post(CLASSES, json={"grade": 9, "section": "Z9"}, headers=csrf)
    assert r.status_code == 201 and r.headers["cache-control"] == "no-store"
    body = r.json()
    school.world.class_ids.append(uuid.UUID(body["class_id"]))
    listed = {c["id"]: c for c in client.get(CLASSES).json()}
    assert listed[body["class_id"]]["name"] == "9-Z9" and listed[body["class_id"]]["code_live"] is True
    assert "class_code" not in listed[body["class_id"]]  # never shown again
    joined = client.post(JOIN, json=school.world.body(body["class_code"]))
    assert joined.status_code == 201
    csrf = {"X-CSRF-Token": school.as_staff(head)}  # signing in again gives a new session and CSRF token
    again = client.post(CLASSES, json={"grade": 9, "section": "Z9"}, headers=csrf)
    assert again.status_code == 409 and again.json()["code"] == "class_exists"
    for bad in (
        {"grade": 7, "section": "A"},
        {"grade": 9, "section": "TOO-LONG-9"},
        {"grade": 9, "section": ""},
    ):
        assert client.post(CLASSES, json=bad, headers=csrf).status_code == 422
    assert f"class:{body['class_id']}" in school.audits(head, "class.add")


def test_tc_adm_06_a_new_code_stops_the_old_one(client: TestClient, school: School) -> None:
    class_id, old = school.world.add_class()
    head, csrf = as_head(school)
    r = client.post(ROTATE, json={"class_id": str(class_id)}, headers=csrf)
    assert r.status_code == 200 and r.headers["cache-control"] == "no-store"
    new = r.json()["class_code"]
    assert new != old
    client.cookies.clear()
    assert client.post(JOIN, json=school.world.body(old)).status_code == 404
    assert client.post(JOIN, json=school.world.body(new)).status_code == 201
    csrf = {"X-CSRF-Token": school.as_staff(head)}  # a new session has a new CSRF token
    other = World(school.admin)
    try:
        foreign, _ = other.add_class()
        assert client.post(ROTATE, json={"class_id": str(foreign)}, headers=csrf).status_code == 404
    finally:
        other.cleanup()
