"""Staff accounts from the admin command (FR-80, FR-106; SECURITY.md §5.2).

An admin adds, disables and resets staff, but never sees or sets a password: a new account gets an invite
link by email, and a forced reset sends a reset link. Database tests (skipped without a test database).
"""

import time
import uuid
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import World

from rahyaab_api import staff_admin
from rahyaab_api import staff_auth as sa
from rahyaab_api.staff_admin import StaffAdminError

DASH = "http://localhost:5173"
PASSWORD = "the river is wide today"  # noqa: S105 - test value


class Admin:
    def __init__(self, world: World, engine: Engine) -> None:
        self.world, self.engine = world, engine
        self.made: list[uuid.UUID] = []

    def run(self, fn, *args, **kwargs):  # type: ignore[no-untyped-def]
        with self.engine.begin() as conn:
            return fn(conn, *args, **kwargs)

    def add(
        self, role: str = "teacher", school: bool = True, classes: list[uuid.UUID] | None = None
    ) -> tuple[uuid.UUID, str]:
        email = f"new-{uuid.uuid4().hex[:12]}@Test.invalid"  # mixed case on purpose
        staff_id = self.run(
            staff_admin.add_staff, email, role, self.world.school_id if school else None, classes or [], DASH
        )
        self.made.append(staff_id)
        return staff_id, email.lower()

    def one(self, sql: str, **params: object) -> object:
        with self.engine.begin() as conn:
            return conn.execute(text(sql), params).scalar()

    def link(self, email: str, template: str) -> str:
        return str(
            self.one(
                "SELECT link FROM email_outbox WHERE to_address = :e AND template = :t "
                "ORDER BY created_at DESC LIMIT 1",
                e=email,
                t=template,
            )
        )


@pytest.fixture
def adm(world: World, admin: Engine) -> Iterator[Admin]:
    a = Admin(world, admin)
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM rate_limit WHERE key LIKE 'staff_%'"))
    yield a
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM email_outbox WHERE to_address LIKE 'new-%@test.invalid'"))
        conn.execute(text("DELETE FROM staff_user WHERE id = ANY(:ids)"), {"ids": a.made})
        conn.execute(text("DELETE FROM rate_limit WHERE key LIKE 'staff_%'"))


def accept_invite(api: TestClient, link: str) -> None:
    token = link.rsplit("token=", 1)[1]
    r = api.post("/v1/auth/staff/password-reset:confirm", json={"token": token, "new_password": PASSWORD})
    assert r.status_code == 204, r.text


def test_tc_sec_23_a_new_account_gets_an_invite_and_no_password(api: TestClient, adm: Admin) -> None:
    staff_id, email = adm.add()
    assert adm.one("SELECT password_hash FROM staff_user WHERE id = :i", i=staff_id) == sa.NO_PASSWORD
    assert adm.one("SELECT email FROM staff_user WHERE id = :i", i=staff_id) == email  # stored in lower case
    link = adm.link(email, "staff_invite")
    assert link.startswith(f"{DASH}/reset#token=")
    hours = adm.one(
        "SELECT extract(epoch FROM expires_at - now()) / 3600 FROM password_reset "
        "WHERE staff_id = :i AND purpose = 'invite'",
        i=staff_id,
    )
    assert 71 < float(str(hours)) <= 72
    # Nobody can sign in before the invite is used, whatever they type.
    assert api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD}).status_code == 401

    accept_invite(api, link)
    r = api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 200 and r.json()["mfa_setup_required"] is True
    actions = {
        adm.one(
            "SELECT action FROM audit_log WHERE object = :o AND action = 'staff.invite_accepted'",
            o=f"staff:{staff_id}",
        )
    }
    assert actions == {"staff.invite_accepted"}
    # Accepting an invite is not a password change, so no "your password was changed" email.
    assert (
        adm.one(
            "SELECT count(*) FROM email_outbox WHERE to_address = :e AND template = 'staff_password_changed'",
            e=email,
        )
        == 0
    )


def test_school_staff_need_a_school_and_classes_of_that_school(adm: Admin, world: World) -> None:
    with pytest.raises(StaffAdminError, match="school"):
        adm.add(role="teacher", school=False)
    other = World(adm.engine)
    try:
        foreign, _ = other.add_class()
        with pytest.raises(StaffAdminError, match="class"):
            adm.add(classes=[foreign])
    finally:
        other.cleanup()
    own, _ = world.add_class()
    staff_id, _ = adm.add(classes=[own])
    assert (
        adm.one("SELECT count(*) FROM staff_class WHERE staff_id = :i AND class_id = :c", i=staff_id, c=own)
        == 1
    )
    researcher, _ = adm.add(role="researcher", school=False)  # team roles have no school
    assert adm.one("SELECT school_id FROM staff_user WHERE id = :i", i=researcher) is None


def test_bad_email_or_role_or_a_second_account_is_refused(adm: Admin) -> None:
    with pytest.raises(StaffAdminError, match="email"):
        adm.run(staff_admin.add_staff, "not-an-email", "teacher", adm.world.school_id, [], DASH)
    with pytest.raises(StaffAdminError, match="role"):
        adm.run(staff_admin.add_staff, "x@test.invalid", "boss", adm.world.school_id, [], DASH)
    _, email = adm.add()
    with pytest.raises(StaffAdminError, match="already"):
        adm.run(staff_admin.add_staff, email.upper(), "teacher", adm.world.school_id, [], DASH)


def _signed_in(api: TestClient, adm: Admin) -> tuple[uuid.UUID, str, bytes]:
    staff_id, email = adm.add()
    accept_invite(api, adm.link(email, "staff_invite"))
    challenge = api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD}).json()
    key = api.post(
        "/v1/auth/staff/mfa/setup", json={"mfa_challenge_id": challenge["mfa_challenge_id"]}
    ).json()["setup_key"]
    secret = sa.secret_from_setup_key(key)
    code = sa.totp_at(secret, int(time.time() // 30))
    r = api.post("/v1/auth/staff/mfa", json={"mfa_challenge_id": challenge["mfa_challenge_id"], "code": code})
    assert r.status_code == 204
    return staff_id, email, secret


def live_sessions(adm: Admin, staff_id: uuid.UUID) -> int:
    return int(
        str(
            adm.one(
                "SELECT count(*) FROM staff_session WHERE staff_id = :i AND revoked_at IS NULL "
                "AND mfa_passed_at IS NOT NULL",
                i=staff_id,
            )
        )
    )


def test_tc_sec_23_a_forced_reset_stops_the_old_password_and_sends_a_link(
    api: TestClient, adm: Admin
) -> None:
    staff_id, email, _ = _signed_in(api, adm)
    adm.run(staff_admin.force_reset, staff_id, DASH)
    assert live_sessions(adm, staff_id) == 0
    assert api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD}).status_code == 401
    assert adm.link(email, "staff_reset").startswith(f"{DASH}/reset#token=")


def test_tc_sec_23_disable_and_enable(api: TestClient, adm: Admin) -> None:
    staff_id, email, _ = _signed_in(api, adm)
    adm.run(staff_admin.set_disabled, staff_id, True)
    assert live_sessions(adm, staff_id) == 0
    assert api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD}).status_code == 401
    adm.run(staff_admin.set_disabled, staff_id, False)
    assert api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD}).status_code == 200


def test_tc_sec_23_resetting_the_authenticator_asks_for_a_new_setup(api: TestClient, adm: Admin) -> None:
    staff_id, email, _ = _signed_in(api, adm)
    adm.run(staff_admin.reset_mfa, staff_id)
    assert live_sessions(adm, staff_id) == 0
    r = api.post("/v1/auth/staff/login", json={"email": email, "password": PASSWORD})
    assert r.json()["mfa_setup_required"] is True
    assert (
        adm.one(
            "SELECT action FROM audit_log WHERE object = :o AND action = 'staff.mfa_reset'",
            o=f"staff:{staff_id}",
        )
        == "staff.mfa_reset"
    )


def test_assign_and_list(adm: Admin, world: World) -> None:
    class_id, _ = world.add_class()
    staff_id, email = adm.add()
    adm.run(staff_admin.assign_class, staff_id, class_id)
    adm.run(staff_admin.assign_class, staff_id, class_id)  # twice is fine
    rows = {r.email: r for r in adm.run(staff_admin.list_staff, world.school_id)}
    assert rows[email].status == "invited" and rows[email].classes == 1 and rows[email].mfa is False
    adm.run(staff_admin.unassign_class, staff_id, class_id)
    adm.run(staff_admin.set_disabled, staff_id, True)
    rows = {r.email: r for r in adm.run(staff_admin.list_staff, world.school_id)}
    assert rows[email].status == "disabled" and rows[email].classes == 0


def test_unknown_staff_is_a_clear_error(adm: Admin) -> None:
    with pytest.raises(StaffAdminError, match="no staff"):
        adm.run(staff_admin.reset_mfa, uuid.uuid4())


def test_dashboard_address_must_be_https_except_on_this_computer() -> None:
    assert staff_admin.check_dashboard_url("https://dashboard.rahyaab.pk/") == "https://dashboard.rahyaab.pk"
    assert staff_admin.check_dashboard_url("http://localhost:5173") == "http://localhost:5173"
    with pytest.raises(StaffAdminError, match="https"):
        staff_admin.check_dashboard_url("http://dashboard.rahyaab.pk")
