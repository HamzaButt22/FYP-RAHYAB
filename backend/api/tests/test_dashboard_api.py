"""Teacher dashboard API against the real database (FR-72..74, FR-77, FR-78, FR-83; TEST_CASES §2.6 and §3).

Who sees what: teachers and counsellors see their assigned classes, a school admin every class of their
school, a platform admin everything (audited); researchers are refused. Only students whose parent (or adult
self) consent and teacher-visibility consent are both in force appear. Another class or student answers 404,
so its existence is never revealed.
"""

import csv
import io
import secrets
import uuid
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import API_URL, MASTER_KEY_FILE, PEPPER, SIGNING_KEY, World
from test_results import choices, uuid7

from rahyaab_api import staff_auth as sa
from rahyaab_api.jobs import refresh_flags
from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

JOIN = "/v1/auth/student/join"
COMPUTE = "/v1/results/compute"


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


class School:
    """A school with classes, staff of every role and students, for one test."""

    def __init__(self, world: World, admin: Engine, client: TestClient) -> None:
        self.world, self.admin, self.client = world, admin, client
        self.staff: list[uuid.UUID] = []
        self.pack = f"test-{secrets.token_hex(4)}"
        with admin.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO content_pack (id, class_mode, min_app, sha256, signature, manifest, "
                    "size_bytes, "
                    "storage_uri) VALUES (:id, 'matric', '0.1.0', 'x', 'x', '{}', 1, 'test://none')"
                ),
                {"id": self.pack},
            )

    def sql(self, statement: str, **params: Any) -> Any:
        with self.admin.begin() as conn:
            result = conn.execute(text(statement), params)
            return result.all() if result.returns_rows else None

    def add_staff(self, role: str, classes: list[uuid.UUID] = (), school: bool = True) -> uuid.UUID:  # type: ignore[assignment]
        staff_id: uuid.UUID = self.sql(
            "INSERT INTO staff_user (school_id, email, password_hash, role) "
            "VALUES (:s, :e, '!', :r) RETURNING id",
            s=self.world.school_id if school else None,
            e=f"dash-{uuid.uuid4().hex[:10]}@test.invalid",
            r=role,
        )[0][0]
        for class_id in classes:
            self.sql("INSERT INTO staff_class (staff_id, class_id) VALUES (:s, :c)", s=staff_id, c=class_id)
        self.staff.append(staff_id)
        return staff_id

    def as_staff(self, staff_id: uuid.UUID) -> str:
        """Signs this client in as `staff_id` (a finished password + code session); returns the CSRF token."""
        token = sa.new_session_token()
        session_id = self.sql(
            "INSERT INTO staff_session (staff_id, token_hash, mfa_passed_at, expires_at) "
            "VALUES (:s, :h, now(), now() + interval '8 hours') RETURNING id",
            s=staff_id,
            h=sa.token_digest(token),
        )[0][0]
        self.client.cookies.clear()
        self.client.cookies.set(sa.SESSION_COOKIE, token, domain="testserver.local")
        return sa.csrf_for(SIGNING_KEY, session_id)

    def join(
        self, class_id: uuid.UUID, code: str, teacher: bool = True, consented: bool = True
    ) -> dict[str, Any]:
        overrides: dict[str, Any] = {}
        if consented:
            overrides["claim_code"] = self.world.add_slip(class_id, teacher=teacher)
        self.client.cookies.clear()
        joined = self.client.post(JOIN, json=self.world.body(code, **overrides))
        assert joined.status_code == 201, joined.text
        return joined.json()

    def play_weeks(self, student: dict[str, Any], weeks: int, prefer: str = "IRCSEA") -> None:
        picks = choices(prefer)
        sid = student["student_id"]
        device = self.sql("SELECT id FROM device WHERE student_id = :s", s=sid)[0][0]
        for week in range(1, weeks + 1):
            sitting, run = uuid7(), uuid7()
            self.sql(
                "INSERT INTO sitting (id, student_id, device_id, started_at) VALUES (:id, :s, :d, now())",
                id=sitting,
                s=sid,
                d=device,
            )
            self.sql(
                "INSERT INTO game_run (id, sitting_id, week, story_version, content_version) "
                "VALUES (:id, :sit, :w, 'test@1.0.0', :cv)",
                id=run,
                sit=sitting,
                w=week,
                cv=self.pack,
            )
            events = (
                [("run_start", "{}")]
                + [
                    ("choice_made", f'{{"pair": "{p}", "picked": "{k}"}}')
                    for p, k in picks[(week - 1) * 8 : week * 8]
                ]
                + [("week_complete", f'{{"week": {week}}}')]
            )
            for seq, (kind, data) in enumerate(events):
                self.sql(
                    "INSERT INTO raw_event (event_id, run_id, seq, type, monotonic_ms, a11y_mode, data) "
                    "VALUES (:e, :r, :seq, :t, :ms, false, CAST(:d AS jsonb))",
                    e=uuid7(),
                    r=run,
                    seq=seq,
                    t=kind,
                    ms=seq * 10.0,
                    d=data,
                )

    def result(self, student: dict[str, Any]) -> dict[str, Any]:
        self.client.cookies.clear()
        r = self.client.post(COMPUTE, headers={"Authorization": f"Bearer {student['access_token']}"})
        assert r.status_code == 200, r.text
        return r.json()

    def audits(self, actor: uuid.UUID, action: str) -> list[str]:
        return [
            r[0]
            for r in self.sql(
                "SELECT object FROM audit_log WHERE actor = :a AND action = :act", a=str(actor), act=action
            )
        ]

    def cleanup(self) -> None:
        self.client.cookies.clear()
        self.sql("DELETE FROM staff_user WHERE id = ANY(:ids)", ids=self.staff)
        self.sql("DELETE FROM game_run WHERE content_version = :p", p=self.pack)
        self.sql("DELETE FROM content_pack WHERE id = :p", p=self.pack)


@pytest.fixture
def school(world: World, admin: Engine, client: TestClient) -> Iterator[School]:
    s = School(world, admin, client)
    yield s
    s.cleanup()


def names(rows: list[dict[str, Any]]) -> set[str]:
    return {r["nickname"] for r in rows}


# ------------------------------------------------------------------------------------- who sees what
def test_tc_dash_02_teachers_see_only_their_own_classes(client: TestClient, school: School) -> None:
    mine, mine_code = school.world.add_class()
    other, other_code = school.world.add_class()
    school.join(mine, mine_code)
    school.join(other, other_code)
    teacher = school.add_staff("teacher", [mine])
    school.as_staff(teacher)

    classes = client.get("/v1/dash/classes").json()
    assert [c["id"] for c in classes] == [str(mine)]
    assert client.get(f"/v1/dash/classes/{mine}/roster").status_code == 200
    # A class of the same school that is not hers, and one of another school, look the same: not found.
    elsewhere = World(school.admin)
    try:
        foreign, _ = elsewhere.add_class()
        for class_id in (other, foreign, uuid.uuid4()):
            r = client.get(f"/v1/dash/classes/{class_id}/roster")
            assert r.status_code == 404 and r.json()["code"] == "not_found"
            assert client.get(f"/v1/dash/classes/{class_id}/export.csv").status_code == 404
    finally:
        elsewhere.cleanup()


def test_tc_dash_03_only_students_with_both_consents_are_listed(client: TestClient, school: School) -> None:
    class_id, code = school.world.add_class()
    shown = school.join(class_id, code)
    no_box = school.join(class_id, code, teacher=False)
    no_consent = school.join(class_id, code, consented=False)
    withdrawn = school.join(class_id, code)
    archived = school.join(class_id, code)
    school.sql(
        "UPDATE consent SET withdrawn_at = now() WHERE student_id = :s AND type = 'teacher_visibility'",
        s=withdrawn["student_id"],
    )
    school.sql(
        "UPDATE student SET archived_at = now(), archived_reason = 'left' WHERE id = :s",
        s=archived["student_id"],
    )
    school.as_staff(school.add_staff("teacher", [class_id]))

    rows = client.get(f"/v1/dash/classes/{class_id}/roster").json()["items"]
    assert [r["student_id"] for r in rows] == [shown["student_id"]]
    (summary,) = client.get("/v1/dash/classes").json()
    assert (
        summary["enrolled"] == 1 and summary["not_shown"] == 3
    )  # no box, no consent, withdrawn (archived: gone)
    for hidden in (no_box, no_consent, withdrawn, archived):
        assert client.get(f"/v1/dash/students/{hidden['student_id']}/summary").status_code == 404


def test_tc_sec_05_the_route_by_role_matrix(client: TestClient, school: School) -> None:
    class_id, code = school.world.add_class()
    student = school.join(class_id, code)
    roster, summary = (
        f"/v1/dash/classes/{class_id}/roster",
        f"/v1/dash/students/{student['student_id']}/summary",
    )

    client.cookies.clear()  # anonymous
    assert client.get(roster).status_code == client.get(summary).status_code == 401
    bearer = {
        "Authorization": f"Bearer {student['access_token']}"
    }  # a student's own token is not a staff session
    assert client.get(roster, headers=bearer).status_code == 401

    school.as_staff(school.add_staff("researcher", school=False))
    assert client.get(roster).status_code == client.get(summary).status_code == 403
    assert client.get("/v1/dash/classes").status_code == 403

    head = school.add_staff("school_admin")  # no classes assigned: sees the whole school
    school.as_staff(head)
    assert client.get(roster).status_code == client.get(summary).status_code == 200

    platform = school.add_staff("admin", school=False)
    school.as_staff(platform)
    assert client.get(roster).status_code == client.get(summary).status_code == 200
    assert f"class:{class_id}" in school.audits(platform, "dash.roster")
    assert f"student:{student['student_id']}" in school.audits(platform, "dash.summary")


# ------------------------------------------------------------------------------------ what they see
def test_tc_dash_07_the_roster_shows_progress_path_confidence_and_form_number(
    client: TestClient, school: School
) -> None:
    class_id, code = school.world.add_class()
    done = school.join(class_id, code)
    half = school.join(class_id, code)
    fresh = school.join(class_id, code)
    school.play_weeks(done, 4)
    result = school.result(done)
    school.play_weeks(half, 2)
    teacher = school.add_staff("teacher", [class_id])
    school.as_staff(teacher)

    rows = {r["student_id"]: r for r in client.get(f"/v1/dash/classes/{class_id}/roster").json()["items"]}
    top = rows[done["student_id"]]
    assert top["started"] is True and top["week"] == 4
    assert top["top_path_id"] == result["ranked"][0]["stream_id"] and top["top_path"]  # a name, not an id
    assert top["confidence"] == result["confidence"]
    assert rows[half["student_id"]]["week"] == 2 and rows[half["student_id"]]["top_path"] is None
    assert rows[fresh["student_id"]]["started"] is False and rows[fresh["student_id"]]["week"] == 0
    serials = {
        r[0] for r in school.sql("SELECT form_serial FROM consent_slip WHERE class_id = :c", c=class_id)
    }
    assert {r["form_serial"] for r in rows.values()} <= serials and all(
        r["form_serial"] for r in rows.values()
    )
    assert set(rows[done["student_id"]]) >= {"nickname", "flags"}
    assert "fit" not in str(top)  # no numeric fit anywhere (FR-54)

    (summary,) = client.get("/v1/dash/classes").json()
    assert (summary["enrolled"], summary["started"], summary["blueprint_ready"]) == (3, 2, 1)
    assert f"class:{class_id}" in school.audits(teacher, "dash.roster")


def test_tc_dash_07_the_roster_pages_by_nickname(client: TestClient, school: School) -> None:
    class_id, code = school.world.add_class()
    for _ in range(3):
        school.join(class_id, code)
    school.as_staff(school.add_staff("teacher", [class_id]))
    first = client.get(f"/v1/dash/classes/{class_id}/roster?limit=2").json()
    assert len(first["items"]) == 2 and first["next_cursor"]
    second = client.get(f"/v1/dash/classes/{class_id}/roster?limit=2&cursor={first['next_cursor']}").json()
    assert len(second["items"]) == 1 and second["next_cursor"] is None
    everyone = [r["nickname"].lower() for r in first["items"] + second["items"]]
    assert everyone == sorted(everyone) and len(set(everyone)) == 3
    assert client.get(f"/v1/dash/classes/{class_id}/roster?cursor=not-a-cursor").status_code == 422
    assert client.get(f"/v1/dash/classes/{class_id}/roster?limit=101").status_code == 422


def test_tc_dash_08_summary_shows_paths_and_interests_and_is_logged(
    client: TestClient, school: School
) -> None:
    class_id, code = school.world.add_class()
    student = school.join(class_id, code)
    school.play_weeks(student, 4, prefer="IRCSEA")
    result = school.result(student)
    teacher = school.add_staff("teacher", [class_id])
    school.as_staff(teacher)

    body = client.get(f"/v1/dash/students/{student['student_id']}/summary").json()
    assert body["roster"]["student_id"] == student["student_id"] and body["class_name"]
    assert [c["stream_id"] for c in body["recommendation"]["ranked"]] == [
        c["stream_id"] for c in result["ranked"]
    ]
    assert all(c["name"] and c["fit_band"] for c in body["recommendation"]["ranked"])
    assert body["top_interests"][:2] == ["I", "R"]  # the order the student chose, no numbers
    assert body["consent_method"] == "school_form"
    assert f"student:{student['student_id']}" in school.audits(teacher, "dash.summary")


def test_tc_dash_05_csv_export(client: TestClient, school: School) -> None:
    class_id, code = school.world.add_class()
    school.join(class_id, code)
    school.join(class_id, code)
    school.join(class_id, code, teacher=False)  # never exported
    teacher = school.add_staff("teacher", [class_id])
    school.as_staff(teacher)

    r = client.get(f"/v1/dash/classes/{class_id}/export.csv")
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    assert r.content.startswith(b"\xef\xbb\xbf")  # UTF-8 BOM, so Excel reads it right
    rows = list(csv.reader(io.StringIO(r.content.decode("utf-8-sig"))))
    assert rows[0][:2] == ["Nickname", "Form number"] and len(rows) == 3
    assert {r[-1] for r in rows[1:]} == {""} and {r[5] for r in rows[1:]} == {
        ""
    }  # words, not codes, when set
    assert "guardian" not in r.text.lower() and "phone" not in r.text.lower()
    assert f"class:{class_id}" in school.audits(teacher, "dash.export")


def test_tc_dash_05_csv_cells_cannot_run_as_formulas() -> None:
    from rahyaab_api.routers.dashboard import csv_safe

    assert csv_safe("=HYPERLINK(1)") == "'=HYPERLINK(1)"
    assert csv_safe("+92") == "'+92" and csv_safe("@x") == "'@x" and csv_safe("-1") == "'-1"
    assert csv_safe("Ali_10") == "Ali_10" and csv_safe(None) == ""


# ------------------------------------------------------------------------------------------- flags
def test_tc_dash_09_flags_are_raised_listed_and_handled(
    client: TestClient, school: School
) -> None:  # + TC-DASH-06
    class_id, code = school.world.add_class()
    slow = school.join(class_id, code)
    on_time = school.join(class_id, code)
    school.sql(
        "UPDATE student SET created_at = now() - interval '8 days' WHERE id = :s", s=slow["student_id"]
    )
    refresh_flags(school.admin)
    refresh_flags(school.admin)  # running twice raises nothing twice
    teacher = school.add_staff("teacher", [class_id])
    csrf = school.as_staff(teacher)

    flags = client.get("/v1/dash/flags").json()
    mine = [f for f in flags if f["student_id"] in (slow["student_id"], on_time["student_id"])]
    assert [(f["student_id"], f["type"]) for f in mine] == [(slow["student_id"], "not_started")]
    rows = {r["student_id"]: r for r in client.get(f"/v1/dash/classes/{class_id}/roster").json()["items"]}
    assert rows[slow["student_id"]]["flags"] == ["not_started"]
    exported = client.get(f"/v1/dash/classes/{class_id}/export.csv").text
    assert "Not started" in exported and "not_started" not in exported  # the words teachers see on screen
    (summary,) = client.get("/v1/dash/classes").json()
    assert summary["open_flags"] == 1

    flag_url = f"/v1/dash/flags/{mine[0]['id']}"
    assert client.patch(flag_url, json={"resolved": True}).status_code == 403  # no CSRF token (TC-DASH-06)
    assert client.patch(flag_url, json={"resolved": True}, headers={"X-CSRF-Token": csrf}).status_code == 200
    assert client.get("/v1/dash/flags").json() == [f for f in flags if f not in mine]
    assert f"flag:{mine[0]['id']}" in school.audits(teacher, "dash.flag_resolved")

    # A teacher of another class cannot see or handle it.
    other_class, _ = school.world.add_class()
    other_csrf = school.as_staff(school.add_staff("teacher", [other_class]))
    r = client.patch(flag_url, json={"resolved": True}, headers={"X-CSRF-Token": other_csrf})
    assert r.status_code == 404


def test_tc_dash_09_a_flag_closes_itself_when_the_reason_is_gone(school: School) -> None:
    class_id, code = school.world.add_class()
    student = school.join(class_id, code)
    school.sql(
        "UPDATE student SET created_at = now() - interval '8 days' WHERE id = :s", s=student["student_id"]
    )
    refresh_flags(school.admin)
    school.play_weeks(student, 1)  # started after all
    refresh_flags(school.admin)
    open_flags = school.sql(
        "SELECT type FROM flag WHERE student_id = :s AND resolved_at IS NULL", s=student["student_id"]
    )
    assert open_flags == []
