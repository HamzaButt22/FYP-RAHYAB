"""Join against a real PostgreSQL.

Test cases: TC-ONB-02/03/04, TC-VAL-03, TC-SEC-19, TC-EDGE-07, TC-AGE-01..04, TC-LIC-01..02.

Fixtures `api`, `world` and `admin` are in conftest.py; they skip when no test database is configured.
"""

import jwt
from fastapi.testclient import TestClient
from support import JOIN_URL as URL
from support import SIGNING_KEY as KEY
from support import World, sha

STUDENT_COLUMNS = {"nickname", "age_band", "age_verified", "class_id", "grade"}


def student_value(world: World, column: str, sid: str) -> object:
    assert column in STUDENT_COLUMNS
    return world.scalar(f"SELECT {column} FROM student WHERE id = :i", i=sid)  # noqa: S608 - allowlisted


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
    assert student_value(world, "nickname", sid) == "Ayesha_10"  # TC-VAL-06
    assert student_value(world, "age_band", sid) == "13-15"  # a band, never the birth year
    assert student_value(world, "age_verified", sid) is False  # only the student's own answer so far
    assert student_value(world, "class_id", sid) == class_id
    stored = world.scalar(
        "SELECT r.token_hash FROM refresh_token r JOIN device d ON d.id = r.device_id "
        "WHERE d.student_id = :i",
        i=sid,
    )
    assert stored == sha(data["refresh_token"]) and stored != data["refresh_token"]  # only the hash is kept
    assert world.scalar("SELECT count(*) FROM consent WHERE student_id = :i", i=sid) == 0


def test_the_class_decides_the_grade(api: TestClient, world: World) -> None:
    _, code = world.add_class(grade=9)
    r = api.post(URL, json=world.body(code, grade=12))  # a wrong picker value must not change the mode
    assert r.status_code == 201
    assert student_value(world, "grade", r.json()["student_id"]) == 9


# TC-ONB-03, TC-VAL-03
def test_unknown_and_expired_codes_get_the_same_answer(api: TestClient, world: World) -> None:
    _, expired_code = world.add_class(expired=True)
    unknown = api.post(URL, json=world.body(world.new_code()))
    expired = api.post(URL, json=world.body(expired_code))
    assert unknown.status_code == expired.status_code == 404
    assert unknown.json() == expired.json()
    assert unknown.json()["code"] == "code_not_accepted"


def test_parent_slip_grants_consent_once(api: TestClient, world: World) -> None:  # FR-05a, TC-SEC-19
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
    assert student_value(world, "age_verified", sid) is True

    second = api.post(URL, json=world.body(code, claim_code=claim))
    unknown = api.post(URL, json=world.body(code, claim_code="ZZZZ-9999"))
    unrecorded = api.post(URL, json=world.body(code, claim_code=world.add_slip(class_id, recorded=False)))
    expired = api.post(URL, json=world.body(code, claim_code=world.add_slip(class_id, expired=True)))
    other_class_id, _ = world.add_class()
    other_class = api.post(URL, json=world.body(code, claim_code=world.add_slip(other_class_id)))
    for r in (second, unknown, unrecorded, expired, other_class):
        assert r.status_code == 404
        assert r.json() == second.json()  # the same generic error as a bad class code


# --------------------------------------------------------------------------------------- age assurance
def test_a_self_declared_adult_does_not_get_consent(api: TestClient, world: World) -> None:  # TC-AGE-01
    _, code = world.add_class(grade=10)
    r = api.post(URL, json=world.body(code, birth_year=2000, birth_month=1))  # claims to be 26
    assert r.status_code == 201
    assert r.json()["consent_state"] == "pending"  # nothing uploads until a recorded slip proves it
    sid = r.json()["student_id"]
    assert student_value(world, "age_band", sid) == "25+"
    assert student_value(world, "age_verified", sid) is False
    assert world.scalar("SELECT count(*) FROM consent WHERE student_id = :i", i=sid) == 0


# TC-AGE-02, TC-EDGE-07
def test_an_adult_with_a_recorded_form_a2_consents_for_themself(api: TestClient, world: World) -> None:
    class_id, code = world.add_class(grade=12)
    claim = world.add_slip(class_id, kind="self", band="18-19")
    r = api.post(URL, json=world.body(code, grade=12, birth_year=2007, birth_month=1, claim_code=claim))
    assert r.status_code == 201, r.text
    assert r.json()["consent_state"] == "granted"
    sid = r.json()["student_id"]
    consent = world.scalar("SELECT type || ':' || method FROM consent WHERE student_id = :i", i=sid)
    assert consent == "self:school_form"
    assert student_value(world, "age_band", sid) == "18-19"
    assert world.scalar("SELECT count(*) FROM flag WHERE student_id = :i", i=sid) == 0  # answers agree


def test_the_school_record_wins_over_a_false_age(api: TestClient, world: World) -> None:  # TC-AGE-03
    class_id, code = world.add_class(grade=10)
    claim = world.add_slip(class_id, kind="parent", band="16-17")  # the register says 16 or 17
    r = api.post(URL, json=world.body(code, birth_year=2000, birth_month=1, claim_code=claim))  # claims 26
    assert r.status_code == 201
    sid = r.json()["student_id"]
    assert world.scalar("SELECT type FROM consent WHERE student_id = :i", i=sid) == "parent"  # not 'self'
    assert student_value(world, "age_band", sid) == "16-17"
    mismatch = world.scalar(
        "SELECT details->>'declared_band' || '>' || (details->>'verified_band') FROM flag "
        "WHERE student_id = :i AND type = 'age_mismatch'",
        i=sid,
    )
    assert mismatch == "25+>16-17"


def test_a_form_must_match_the_recorded_age(world: World) -> None:  # TC-AGE-04 (database rule)
    class_id, _ = world.add_class()
    for kind, band in (("self", "16-17"), ("parent", "18-19")):
        try:
            world.add_slip(class_id, kind=kind, band=band)
        except Exception as exc:  # noqa: BLE001 - any database refusal is the expected outcome
            assert "consent_slip_kind_band_check" in str(exc)
        else:
            raise AssertionError(f"a {kind} form with band {band} was accepted")


# ------------------------------------------------------------------------------------------- licences
def test_no_active_licence_means_no_join(api: TestClient, world: World) -> None:  # TC-LIC-01, FR-107
    _, code = world.add_class()
    world.set_licence(None)
    r = api.post(URL, json=world.body(code))
    assert r.status_code == 403 and r.json()["code"] == "school_access_inactive"
    world.set_licence("institution", expired=True)
    assert api.post(URL, json=world.body(code)).status_code == 403
    world.set_licence("institution")
    assert api.post(URL, json=world.body(code)).status_code == 201


def test_seats_are_enforced(api: TestClient, world: World) -> None:  # TC-LIC-02
    _, code = world.add_class()
    world.set_licence("institution", seats=2)
    assert [api.post(URL, json=world.body(code)).status_code for _ in range(3)] == [201, 201, 403]


# ---------------------------------------------------------------------------------------- rate limits
def test_device_limit_is_10_per_15_minutes(api: TestClient, world: World) -> None:  # TC-ONB-04 (a)
    _, code = world.add_class()
    body = world.body(code)
    for _ in range(10):
        assert api.post(URL, json=body).status_code == 201
    r = api.post(URL, json=body)
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) > 0
    assert "remaining=0" in r.headers["RateLimit"]


# TC-ONB-04 (b)
def test_bad_claim_codes_pause_claims_but_not_the_class(api: TestClient, world: World) -> None:
    class_id, code = world.add_class()
    for _ in range(30):
        assert api.post(URL, json=world.body(code, claim_code="BAD2-2222")).status_code == 404
    good_claim = world.add_slip(class_id)
    assert api.post(URL, json=world.body(code, claim_code=good_claim)).status_code == 404  # claims paused
    assert api.post(URL, json=world.body(code)).status_code == 201  # classmates can still join
    paused = world.scalar(
        "SELECT count(*) FROM audit_log WHERE action = 'claim_codes.paused' AND object = :o",
        o=f"class:{class_id}",
    )
    assert paused == 1


def test_one_ip_can_join_a_whole_class(api: TestClient, world: World) -> None:  # TC-ONB-04 (c)
    _, code = world.add_class()
    results = [api.post(URL, json=world.body(code)).status_code for _ in range(40)]
    assert results == [201] * 40
