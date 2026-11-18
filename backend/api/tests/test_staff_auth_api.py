"""Staff sign-in, two-step code and password reset against the real database (FR-71, FR-106, NFR-40).

TC-SEC-10 (reset request is enumeration-safe) and TC-SEC-11 (reset token rules) are here, plus the login,
MFA, lockout, session and CSRF rules from docs/security/SECURITY.md §5.
"""

import time
import uuid
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import API_URL, MASTER_KEY, MASTER_KEY_FILE, PEPPER, SIGNING_KEY, World

from rahyaab_api import staff_auth as sa
from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

LOGIN = "/v1/auth/staff/login"
SETUP = "/v1/auth/staff/mfa/setup"
MFA = "/v1/auth/staff/mfa"
ME = "/v1/auth/staff/me"
LOGOUT = "/v1/auth/staff/logout"
RESET = "/v1/auth/staff/password-reset"
CONFIRM = "/v1/auth/staff/password-reset:confirm"
COOKIE = "__Host-rahyaab_session"
PASSWORD = "green tea at four"  # noqa: S105 - test value


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
    # https, so the Secure session cookie is sent back like a browser would.
    with TestClient(app, base_url="https://testserver") as c:
        yield c
    app.state.engine.dispose()


class Staff:
    def __init__(self, world: World, admin: Engine) -> None:
        self.id = world.staff_id
        self.admin = admin
        with admin.begin() as conn:
            self.email = conn.execute(
                text("UPDATE staff_user SET password_hash = :h WHERE id = :id RETURNING email"),
                {"h": sa.hash_password(PASSWORD), "id": self.id},
            ).scalar_one()

    def sql(self, statement: str, **params: object) -> list[tuple[object, ...]]:
        with self.admin.begin() as conn:
            result = conn.execute(text(statement), {"id": self.id, "e": self.email, **params})
            return [tuple(r) for r in result.all()] if result.returns_rows else []


@pytest.fixture
def staff(world: World, admin: Engine, client: TestClient) -> Iterator[Staff]:
    s = Staff(world, admin)
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM rate_limit WHERE key LIKE 'staff_%'"))
    client.cookies.clear()
    yield s
    client.cookies.clear()
    with admin.begin() as conn:
        # The audit log is append-only (a trigger refuses deletes); each test's staff id is new, so its rows
        # never mix with another test's.
        conn.execute(text("DELETE FROM email_outbox WHERE to_address = :e"), {"e": s.email})
        conn.execute(text("DELETE FROM rate_limit WHERE key LIKE 'staff_%'"))


def login(client: TestClient, email: str, password: str = PASSWORD) -> dict[str, object]:
    r = client.post(LOGIN, json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    body: dict[str, object] = r.json()
    return body


def step_now() -> int:
    return int(time.time() // 30)


def enrol(client: TestClient, staff: Staff) -> bytes:
    """First sign-in: password, set up the authenticator, enter the first code. Returns the secret."""
    challenge = login(client, staff.email)
    assert challenge["mfa_setup_required"] is True
    r = client.post(SETUP, json={"mfa_challenge_id": challenge["mfa_challenge_id"]})
    assert r.status_code == 200, r.text
    secret = sa.secret_from_setup_key(r.json()["setup_key"])
    r = client.post(
        MFA, json={"mfa_challenge_id": challenge["mfa_challenge_id"], "code": sa.totp_at(secret, step_now())}
    )
    assert r.status_code == 204, r.text
    return secret


def sign_in(client: TestClient, staff: Staff, secret: bytes, step: int) -> None:
    challenge = login(client, staff.email)
    assert challenge["mfa_setup_required"] is False
    r = client.post(
        MFA, json={"mfa_challenge_id": challenge["mfa_challenge_id"], "code": sa.totp_at(secret, step)}
    )
    assert r.status_code == 204, r.text


def outbox(staff: Staff, template: str) -> list[str]:
    rows = staff.sql(
        "SELECT link FROM email_outbox WHERE to_address = :e AND template = :t ORDER BY created_at",
        t=template,
    )
    return [str(r[0] or "") for r in rows]


def token_from(link: str) -> str:
    return link.rsplit("token=", 1)[1]


# ----------------------------------------------------------------------------------------- sign in
def test_tc_sec_17_first_sign_in_sets_up_the_authenticator_then_signs_in(
    client: TestClient, staff: Staff
) -> None:
    enrol(client, staff)
    set_cookie = client.cookies.jar
    cookie = next(c for c in set_cookie if c.name == COOKIE)
    assert cookie.secure and cookie.path == "/" and cookie.domain in ("testserver", "testserver.local")
    assert cookie.has_nonstandard_attr("HttpOnly") and cookie.get_nonstandard_attr("SameSite") == "strict"

    r = client.get(ME)
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == staff.email and me["role"] == "teacher"
    assert len(me["csrf_token"]) >= 32
    assert staff.sql("SELECT mfa_secret_encrypted IS NOT NULL FROM staff_user WHERE id = :id") == [(True,)]
    actions = {r[0] for r in staff.sql("SELECT action FROM audit_log WHERE actor = :a", a=str(staff.id))}
    assert {"staff.mfa_enrolled", "staff.login"} <= actions


def test_tc_sec_20_wrong_password_and_unknown_email_get_the_same_answer(
    client: TestClient, staff: Staff
) -> None:
    wrong = client.post(LOGIN, json={"email": staff.email, "password": "not the password at all"})
    unknown = client.post(LOGIN, json={"email": f"nobody-{uuid.uuid4()}@test.invalid", "password": PASSWORD})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()
    assert wrong.json()["code"] == "sign_in_failed"


def test_tc_sec_20_no_access_without_the_second_factor(client: TestClient, staff: Staff) -> None:
    secret = enrol(client, staff)
    client.cookies.clear()
    challenge = login(client, staff.email)
    # The challenge id is not a session.
    client.cookies.set(COOKIE, str(challenge["mfa_challenge_id"]), domain="testserver.local")
    assert client.get(ME).status_code == 401
    client.cookies.clear()
    wrong = sa.totp_at(secret, step_now() + 5)
    r = client.post(MFA, json={"mfa_challenge_id": challenge["mfa_challenge_id"], "code": wrong})
    assert r.status_code == 401
    assert client.get(ME).status_code == 401


def test_tc_sec_21_a_code_works_only_once(client: TestClient, staff: Staff) -> None:
    secret = enrol(client, staff)  # used the current step
    client.cookies.clear()
    sign_in(client, staff, secret, step_now() + 1)  # the next step is still accepted
    client.cookies.clear()
    challenge = login(client, staff.email)
    r = client.post(
        MFA,
        json={"mfa_challenge_id": challenge["mfa_challenge_id"], "code": sa.totp_at(secret, step_now() + 1)},
    )
    assert r.status_code == 401


def test_setup_is_refused_once_an_authenticator_is_set_up(client: TestClient, staff: Staff) -> None:
    enrol(client, staff)
    challenge = login(client, staff.email)
    r = client.post(SETUP, json={"mfa_challenge_id": challenge["mfa_challenge_id"]})
    assert r.status_code == 409 and r.json()["code"] == "mfa_already_set_up"


def test_tc_sec_21_five_wrong_passwords_lock_the_account(client: TestClient, staff: Staff) -> None:
    for _ in range(5):
        r = client.post(LOGIN, json={"email": staff.email, "password": "wrong wrong wrong"})
        assert r.status_code == 401
    r = client.post(LOGIN, json={"email": staff.email, "password": PASSWORD})
    assert r.status_code == 429 and "Retry-After" in r.headers
    # The per-email window is cleared, but the account itself is locked for 15 minutes.
    staff.sql("DELETE FROM rate_limit WHERE key LIKE 'staff_%'")
    r = client.post(LOGIN, json={"email": staff.email, "password": PASSWORD})
    assert r.status_code == 429
    assert staff.sql(
        "SELECT locked_until > now() + interval '14 minutes' FROM staff_user WHERE id = :id"
    ) == [(True,)]


def test_tc_sec_21_a_good_sign_in_clears_the_failure_count(client: TestClient, staff: Staff) -> None:
    for _ in range(2):
        client.post(LOGIN, json={"email": staff.email, "password": "wrong wrong wrong"})
    enrol(client, staff)
    assert staff.sql("SELECT failed_logins FROM staff_user WHERE id = :id") == [(0,)]


def test_disabled_staff_cannot_sign_in_or_keep_a_session(client: TestClient, staff: Staff) -> None:
    enrol(client, staff)
    staff.sql("UPDATE staff_user SET disabled_at = now() WHERE id = :id")
    assert client.get(ME).status_code == 401
    r = client.post(LOGIN, json={"email": staff.email, "password": PASSWORD})
    assert r.status_code == 401 and r.json()["code"] == "sign_in_failed"


def test_tc_sec_17_session_ends_after_30_minutes_idle_or_8_hours(client: TestClient, staff: Staff) -> None:
    enrol(client, staff)
    assert client.get(ME).status_code == 200
    staff.sql("UPDATE staff_session SET last_seen_at = now() - interval '31 minutes' WHERE staff_id = :id")
    assert client.get(ME).status_code == 401
    client.cookies.clear()
    sign_in(client, staff, sa.secret_from_setup_key(_setup_key_of(staff)), step_now() + 1)
    staff.sql("UPDATE staff_session SET expires_at = now() - interval '1 second' WHERE staff_id = :id")
    assert client.get(ME).status_code == 401


def _setup_key_of(staff: Staff) -> str:
    sealed = staff.sql("SELECT mfa_secret_encrypted FROM staff_user WHERE id = :id")[0][0]
    assert isinstance(sealed, (bytes, memoryview))
    return sa.setup_key(sa.open_secret(bytes(sealed), MASTER_KEY, staff.id))


def test_tc_sec_22_sign_out_needs_the_csrf_token_and_ends_the_session(
    client: TestClient, staff: Staff
) -> None:
    enrol(client, staff)
    csrf = client.get(ME).json()["csrf_token"]
    assert client.post(LOGOUT).status_code == 403
    assert client.post(LOGOUT, headers={"X-CSRF-Token": "x" * 43}).status_code == 403
    r = client.post(LOGOUT, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 204
    assert staff.sql(
        "SELECT count(*) FROM staff_session WHERE staff_id = :id AND revoked_at IS NULL "
        "AND mfa_passed_at IS NOT NULL"
    ) == [(0,)]
    assert client.get(ME).status_code == 401


def test_tc_sec_14_unknown_fields_are_refused(client: TestClient, staff: Staff) -> None:
    r = client.post(LOGIN, json={"email": staff.email, "password": PASSWORD, "role": "admin"})
    assert r.status_code == 422
    assert {"field": "role", "code": "not_allowed", "message_key": "errors.role.not_allowed"} in r.json()[
        "errors"
    ]


# ---------------------------------------------------------------------------------- password reset
def test_tc_sec_10_reset_request_is_enumeration_safe(client: TestClient, staff: Staff) -> None:
    nobody = f"nobody-{uuid.uuid4()}@test.invalid"
    t0 = time.perf_counter()
    known = client.post(RESET, json={"email": staff.email})
    t1 = time.perf_counter()
    unknown = client.post(RESET, json={"email": nobody})
    t2 = time.perf_counter()
    assert known.status_code == unknown.status_code == 202
    assert known.content == unknown.content
    assert abs((t1 - t0) - (t2 - t1)) < 0.05  # ±50 ms
    assert len(outbox(staff, "staff_reset")) == 1
    client.post(RESET, json={"email": staff.email})
    client.post(RESET, json={"email": staff.email})
    r = client.post(RESET, json={"email": staff.email})  # the 4th in an hour
    assert r.status_code == 429


def test_tc_sec_11_reset_token_rules(client: TestClient, staff: Staff) -> None:
    secret = enrol(client, staff)
    session_cookie = client.cookies.get(COOKIE)
    client.cookies.clear()
    client.post(RESET, json={"email": staff.email})
    client.post(RESET, json={"email": staff.email})
    first, second = (token_from(link) for link in outbox(staff, "staff_reset"))
    assert staff.sql(
        "SELECT count(*) FROM password_reset WHERE staff_id = :id AND token_hash = :h",
        h=sa.token_digest(second),
    ) == [(1,)]

    weak = client.post(CONFIRM, json={"token": second, "new_password": "password1234"})
    assert weak.status_code == 422
    assert (
        weak.json()["errors"][0]["field"] == "new_password" and weak.json()["errors"][0]["code"] == "common"
    )

    new_password = "a quiet walk by the canal"  # noqa: S105 - test value
    assert client.post(CONFIRM, json={"token": second, "new_password": new_password}).status_code == 204
    again = client.post(CONFIRM, json={"token": second, "new_password": new_password})
    other = client.post(CONFIRM, json={"token": first, "new_password": new_password})
    unknown = client.post(CONFIRM, json={"token": sa.new_link_token(), "new_password": new_password})
    assert again.status_code == other.status_code == unknown.status_code == 400
    assert again.json() == other.json() == unknown.json()
    assert again.json()["code"] == "reset_link_invalid"

    # Every session is gone, and the next sign-in still needs the code.
    client.cookies.set(COOKIE, str(session_cookie), domain="testserver.local")
    assert client.get(ME).status_code == 401
    client.cookies.clear()
    challenge = login(client, staff.email, new_password)
    assert challenge["mfa_setup_required"] is False
    assert client.get(ME).status_code == 401
    r = client.post(
        MFA,
        json={"mfa_challenge_id": challenge["mfa_challenge_id"], "code": sa.totp_at(secret, step_now() + 1)},
    )
    assert r.status_code == 204

    actions = [
        r[0] for r in staff.sql("SELECT action FROM audit_log WHERE object = :o", o=f"staff:{staff.id}")
    ]
    assert "staff.password_changed" in actions
    assert len(outbox(staff, "staff_password_changed")) == 1


def test_tc_sec_11_an_expired_link_gets_the_same_answer(client: TestClient, staff: Staff) -> None:
    client.post(RESET, json={"email": staff.email})
    (link,) = outbox(staff, "staff_reset")
    staff.sql("UPDATE password_reset SET expires_at = now() - interval '1 minute' WHERE staff_id = :id")
    r = client.post(CONFIRM, json={"token": token_from(link), "new_password": "a quiet walk by the canal"})
    assert r.status_code == 400 and r.json()["code"] == "reset_link_invalid"


def test_reset_links_point_at_the_dashboard_and_last_30_minutes(client: TestClient, staff: Staff) -> None:
    client.post(RESET, json={"email": staff.email})
    (link,) = outbox(staff, "staff_reset")
    assert link.startswith("http://localhost:5173/reset#token=")  # a fragment: never sent to a server
    minutes = staff.sql(
        "SELECT extract(epoch FROM expires_at - now()) / 60 FROM password_reset WHERE staff_id = :id"
    )
    assert 29 < float(str(minutes[0][0])) <= 30
