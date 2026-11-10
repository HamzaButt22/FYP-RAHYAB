"""Join against a real PostgreSQL (TC-ONB-02/03/04, TC-VAL-03, TC-SEC-19, TC-EDGE-07).

Fixtures `api`, `world` and `admin` are in conftest.py; they skip when no test database is configured.
"""

import jwt
from fastapi.testclient import TestClient
from support import JOIN_URL as URL
from support import SIGNING_KEY as KEY
from support import World, sha


def test_join_creates_a_pseudonymous_profile(api: TestClient, world: World) -> None:  # TC-ONB-02
    class_id, code = world.add_class()
    r = api.post(URL, json=world.body(code, nickname="  Ayesha​_10 "))
    assert r.status_code == 201, r.text
    data = r.json()
    assert set(data) == {"access_token", "refresh_token", "expires_in", "student_id", "consent_state"}
    assert data["consent_state"] == "pending" and data["expires_in"] == 900

    claims = jwt.decode(data["access_token"], KEY, algorithms=["HS256"], issuer="rahyaab-api")
    assert claims["sub"] == data["student_id"] and claims["typ"] == "access"
    sid = data["student_id"]
    assert world.scalar("SELECT nickname FROM student WHERE id = :i", i=sid) == "Ayesha_10"  # TC-VAL-06
    assert world.scalar("SELECT age_band FROM student WHERE id = :i", i=sid) == "13-15"  # band, not the year
    assert world.scalar("SELECT class_id FROM student WHERE id = :i", i=sid) == class_id
    # Only the refresh token's hash is stored.
    stored = world.scalar(
        "SELECT r.token_hash FROM refresh_token r JOIN device d ON d.id = r.device_id "
        "WHERE d.student_id = :i",
        i=sid,
    )
    assert stored == sha(data["refresh_token"]) and stored != data["refresh_token"]
    assert world.scalar("SELECT count(*) FROM consent WHERE student_id = :i", i=sid) == 0


# TC-ONB-03, TC-VAL-03
def test_unknown_and_expired_codes_get_the_same_answer(api: TestClient, world: World) -> None:
    _, expired_code = world.add_class(expired=True)
    unknown = api.post(URL, json=world.body(world.new_code()))
    expired = api.post(URL, json=world.body(expired_code))
    assert unknown.status_code == expired.status_code == 404
    assert unknown.json() == expired.json()
    assert unknown.json()["code"] == "code_not_accepted"
    assert (
        world.scalar(
            "SELECT count(*) FROM student s JOIN school_class c ON c.id = s.class_id WHERE c.school_id = :s",
            s=world.school_id,
        )
        == 0
    )


def test_claim_code_grants_consent_once(api: TestClient, world: World) -> None:  # FR-05a, TC-SEC-19
    class_id, code = world.add_class()
    claim = world.add_slip(class_id, research=True)
    first = api.post(URL, json=world.body(code, claim_code=claim))
    assert first.status_code == 201, first.text
    assert first.json()["consent_state"] == "granted"
    sid = first.json()["student_id"]
    kinds = world.scalar(
        "SELECT string_agg(type || ':' || method, ',' ORDER BY type) FROM consent WHERE student_id = :i",
        i=sid,
    )
    assert kinds == "parent:school_form,research:school_form"
    recorded_by = world.scalar(
        "SELECT recorded_by FROM consent WHERE student_id = :i AND type = 'parent'", i=sid
    )
    assert recorded_by == world.staff_id

    second = api.post(URL, json=world.body(code, claim_code=claim))
    unrecorded = api.post(URL, json=world.body(code, claim_code="ZZZZ-9999"))
    expired_claim = world.add_slip(class_id, expired=True)
    expired = api.post(URL, json=world.body(code, claim_code=expired_claim))
    for r in (second, unrecorded, expired):
        assert r.status_code == 404
        assert r.json() == second.json()  # the same generic error as a bad class code


def test_adults_consent_for_themselves(api: TestClient, world: World) -> None:  # TC-EDGE-07, FR-100
    _, code = world.add_class(grade=12)
    r = api.post(URL, json=world.body(code, grade=12, birth_year=2007, birth_month=1))
    assert r.status_code == 201, r.text
    assert r.json()["consent_state"] == "granted"
    sid = r.json()["student_id"]
    assert world.scalar("SELECT method FROM consent WHERE student_id = :i", i=sid) == "self"
    assert world.scalar("SELECT age_band FROM student WHERE id = :i", i=sid) == "18-19"


def test_device_limit_is_10_per_15_minutes(api: TestClient, world: World) -> None:  # TC-ONB-04 (a)
    _, code = world.add_class()
    body = world.body(code)
    for _ in range(10):
        assert api.post(URL, json=body).status_code == 201
    r = api.post(URL, json=body)
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) > 0
    assert "remaining=0" in r.headers["RateLimit"]


def test_code_pauses_after_30_failures(api: TestClient, world: World) -> None:  # TC-ONB-04 (b)
    _, code = world.add_class()
    for _ in range(30):  # bad claim codes against a real class code, from many devices
        assert api.post(URL, json=world.body(code, claim_code="BAD0-0000")).status_code == 404
    paused = api.post(URL, json=world.body(code))  # a correct join is now refused too
    assert paused.status_code == 404 and paused.json()["code"] == "code_not_accepted"
    assert (
        world.scalar(
            "SELECT count(*) FROM audit_log WHERE action = 'class_code.paused' AND object = :o",
            o=f"code_hash:{sha(code)[:16]}",
        )
        == 1
    )


def test_one_ip_can_join_a_whole_class(api: TestClient, world: World) -> None:  # TC-ONB-04 (c)
    _, code = world.add_class()
    results = [api.post(URL, json=world.body(code)).status_code for _ in range(40)]
    assert results == [201] * 40
