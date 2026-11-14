"""The admin command: the only place real codes are made (FR-80, FR-05a, FR-107).

Codes made here must work in the API, rotated and expired codes must stop at once without touching joined
students, and slips follow the register-band rules. Database tests (skipped without a test database).
"""

import re
import secrets
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import ADMIN_URL, PEPPER, World, sha, sign_refresh

from rahyaab_api import admin

URL = "/v1/auth/student/join"
CLAIM_URL = "/v1/consents:claim"


def run(engine: Engine, fn, *args, **kwargs):  # type: ignore[no-untyped-def]
    with engine.begin() as conn:
        return fn(conn, *args, **kwargs)


def test_a_new_class_code_works_and_only_it_does(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 9, "Z1")
    world.class_ids.append(class_id)
    assert re.fullmatch(r"[A-HJ-NP-Z]{3}-[A-HJ-NP-Z2-9]{3}", code)
    assert api.post(URL, json=world.body(code)).status_code == 201
    assert api.post(URL, json=world.body("RYB-4K2")).status_code == 404  # well formed, but not issued here


def test_rotating_stops_the_old_code_but_keeps_joined_students(api: TestClient, world: World) -> None:
    class_id, old = run(world.admin, admin.add_class, PEPPER, world.school_id, 9, "Z2")
    world.class_ids.append(class_id)
    joined = api.post(URL, json=world.body(old)).json()
    new = run(world.admin, admin.rotate_class_code, PEPPER, class_id)
    assert new != old
    assert api.post(URL, json=world.body(old)).status_code == 404
    assert api.post(URL, json=world.body(new)).status_code == 201
    assert world.scalar("SELECT class_id FROM student WHERE id = :s", s=joined["student_id"]) == class_id


def test_expiring_stops_the_code(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 10, "Z3")
    world.class_ids.append(class_id)
    run(world.admin, admin.expire_class_code, class_id)
    assert api.post(URL, json=world.body(code)).status_code == 404
    listed = run(world.admin, admin.list_classes, world.school_id)
    assert (str(class_id), "10-Z3", date.today().isoformat(), False) in listed


def test_printed_slips_work_only_once_recorded(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 9, "Z4")
    world.class_ids.append(class_id)
    slips = run(world.admin, admin.print_slips, PEPPER, class_id, 3)
    assert [serial for serial, _ in slips] == ["A-0001", "A-0002", "A-0003"]
    (serial, claim), _, _ = slips
    assert api.post(URL, json=world.body(code, claim_code=claim)).status_code == 404  # not recorded yet
    run(world.admin, admin.record_slip, class_id, serial, "13-15", world.staff_id, research=True)
    joined = api.post(URL, json=world.body(code, claim_code=claim))
    assert joined.status_code == 201 and joined.json()["consent_state"] == "granted"
    more = run(world.admin, admin.print_slips, PEPPER, class_id, 1)
    assert more[0][0] == "A-0004"  # numbering continues


def test_recording_checks_the_form_and_the_teacher(world: World) -> None:
    class_id, _ = run(world.admin, admin.add_class, PEPPER, world.school_id, 11, "Z5")
    world.class_ids.append(class_id)
    run(world.admin, admin.print_slips, PEPPER, class_id, 1)
    with pytest.raises(admin.AdminError, match="Form A"):  # a parent form with an adult band
        run(world.admin, admin.record_slip, class_id, "A-0001", "18-19", world.staff_id)
    with pytest.raises(admin.AdminError, match="staff"):  # someone outside the school
        run(world.admin, admin.record_slip, class_id, "A-0001", "16-17", world.school_id)
    run(world.admin, admin.record_slip, class_id, "A-0001", "16-17", world.staff_id)
    with pytest.raises(admin.AdminError, match="already recorded"):
        run(world.admin, admin.record_slip, class_id, "A-0001", "16-17", world.staff_id)


def test_every_change_is_audited(world: World) -> None:
    class_id, _ = run(world.admin, admin.add_class, PEPPER, world.school_id, 12, "Z6")
    world.class_ids.append(class_id)
    run(world.admin, admin.rotate_class_code, PEPPER, class_id)
    actions = world.scalar(
        "SELECT string_agg(action, ',' ORDER BY id) FROM audit_log WHERE actor = 'admin-cli' AND object = :o",
        o=f"class:{class_id}",
    )
    assert actions == "class.add,class.code_rotated"


def test_licence_dates_and_kinds(world: World) -> None:
    until = date.today() + timedelta(days=200)
    licence_id = run(world.admin, admin.add_licence, world.school_id, "institution", until, 120)
    assert world.scalar("SELECT seats FROM licence WHERE id = :i", i=licence_id) == 120
    with pytest.raises(admin.AdminError):
        run(world.admin, admin.add_licence, world.school_id, "individual", until, None)


def test_the_command_refuses_to_run_without_the_pepper(
    world: World, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("DATABASE_URL", ADMIN_URL)
    monkeypatch.setenv("CODE_PEPPER", "")
    assert admin.main(["classes", "--school", str(world.school_id)]) == 2
    assert "CODE_PEPPER" in capsys.readouterr().err
    monkeypatch.setenv("CODE_PEPPER", PEPPER)
    assert admin.main(["classes", "--school", str(world.school_id)]) == 0


# ----------------------------------------------------------------------------- students and devices
REFRESH_URL = "/v1/auth/refresh"


def _joined(api: TestClient, world: World, code: str, **overrides: object) -> dict[str, str]:
    body = world.body(code, **overrides)
    pair = api.post(URL, json=body).json()
    pair["public_key"] = body["device"]["public_key"]
    return pair


def test_the_class_list_shows_form_numbers(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 9, "Y1")
    world.class_ids.append(class_id)
    ((serial, claim),) = run(world.admin, admin.print_slips, PEPPER, class_id, 1)
    run(world.admin, admin.record_slip, class_id, serial, "13-15", world.staff_id)
    _joined(api, world, code, nickname="Ali_10", claim_code=claim)
    _joined(api, world, code, nickname="Sitara_14")
    rows = {r["nickname"]: r for r in run(world.admin, admin.list_students, class_id)}
    assert rows["Ali_10"]["form"] == "A-0001" and rows["Ali_10"]["consent"] == "granted"
    assert rows["Sitara_14"]["form"] is None and rows["Sitara_14"]["consent"] == "waiting"


def test_removing_a_stranger_deletes_and_signs_out(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 9, "Y2")
    world.class_ids.append(class_id)
    pair = _joined(api, world, code)
    assert run(world.admin, admin.remove_student, pair["student_id"], "stranger") == "deleted"
    assert world.scalar("SELECT count(*) FROM student WHERE id = :s", s=pair["student_id"]) == 0
    with pytest.raises(admin.AdminError):
        run(world.admin, admin.remove_student, pair["student_id"], "bogus")


def test_removing_a_consented_student_keeps_their_results(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 10, "Y3")
    world.class_ids.append(class_id)
    ((serial, claim),) = run(world.admin, admin.print_slips, PEPPER, class_id, 1)
    run(world.admin, admin.record_slip, class_id, serial, "13-15", world.staff_id)
    pair = _joined(api, world, code, claim_code=claim)
    assert run(world.admin, admin.remove_student, pair["student_id"], "left") == "removed"
    assert world.scalar("SELECT class_id FROM student WHERE id = :s", s=pair["student_id"]) is None
    live = world.scalar(
        "SELECT count(*) FROM refresh_token rt JOIN device d ON d.id = rt.device_id "
        "WHERE d.student_id = :s AND rt.revoked_at IS NULL",
        s=pair["student_id"],
    )
    assert live == 0  # signed out everywhere
    world.scalar("DELETE FROM student WHERE id = :s RETURNING 1", s=pair["student_id"])  # test cleanup


def test_a_blocked_phone_is_signed_out_and_kept_out(api: TestClient, world: World) -> None:
    class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 11, "Y4")
    world.class_ids.append(class_id)
    pair = _joined(api, world, code)
    device_id = world.scalar("SELECT id FROM device WHERE student_id = :s", s=pair["student_id"])
    key_hash = run(world.admin, admin.block_device, "tried many codes", device_id=device_id)
    try:
        private = world.private_keys[pair["public_key"]]
        signed = {
            "refresh_token": pair["refresh_token"],
            "signature": sign_refresh(private, pair["refresh_token"]),
        }
        assert api.post(REFRESH_URL, json=signed).status_code == 401
        again = world.body(code)
        again["device"]["public_key"] = pair["public_key"]
        r = api.post(URL, json=again)
        assert r.status_code == 403 and r.json()["code"] == "device_blocked"
        run(world.admin, admin.unblock_device, key_hash)
        assert api.post(URL, json=again).status_code == 201
    finally:
        with world.admin.begin() as conn:
            conn.execute(text("DELETE FROM blocked_device WHERE key_hash = :h"), {"h": key_hash})


def test_limited_phones_can_be_found_and_blocked(api: TestClient, world: World) -> None:
    _, code = world.add_class()
    body = world.body(code)
    for _ in range(11):
        api.post(URL, json={**body, "nickname": f"Kid_{secrets.token_hex(3)}"})
    found = {h: blocked for h, _, _, blocked in run(world.admin, admin.limited_devices, 1)}
    key_hash = sha(body["device"]["public_key"])
    assert found.get(key_hash) is False
    run(world.admin, admin.block_device, "join limit", key_hash=key_hash)
    try:
        assert {h: b for h, _, _, b in run(world.admin, admin.limited_devices, 1)}[key_hash] is True
    finally:
        run(world.admin, admin.unblock_device, key_hash)


def test_year_end_stops_every_class_code(api: TestClient, world: World) -> None:
    codes = []
    for section in ("Y5", "Y6"):
        class_id, code = run(world.admin, admin.add_class, PEPPER, world.school_id, 9, section)
        world.class_ids.append(class_id)
        codes.append(code)
    assert run(world.admin, admin.year_end, world.school_id) >= 2
    assert all(api.post(URL, json=world.body(c)).status_code == 404 for c in codes)
