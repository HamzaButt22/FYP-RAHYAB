"""Claiming a consent slip after joining (POST /v1/consents:claim, FR-05a, TC-CON-01..04).

Fixtures `api`, `world` and `admin` are in conftest.py; they skip when no test database is configured.
"""

from typing import Any

from fastapi.testclient import TestClient
from support import JOIN_URL, World

CLAIM_URL = "/v1/consents:claim"


def join(api: TestClient, world: World, code: str, **overrides: Any) -> dict[str, Any]:
    r = api.post(JOIN_URL, json=world.body(code, **overrides))
    assert r.status_code == 201, r.text
    data: dict[str, Any] = r.json()
    return data


def claim(api: TestClient, token: str, claim_code: str) -> Any:
    return api.post(CLAIM_URL, json={"claim_code": claim_code}, headers={"Authorization": f"Bearer {token}"})


def test_a_pending_student_claims_their_slip_later(api: TestClient, world: World) -> None:  # TC-CON-01
    class_id, code = world.add_class(grade=10)
    pair = join(api, world, code, birth_year=2000, birth_month=1)  # pending; claims to be 26
    assert pair["consent_state"] == "pending"
    slip = world.add_slip(class_id, kind="parent", band="16-17")  # the form comes back a week later
    r = claim(api, pair["access_token"], slip)
    assert r.status_code == 200 and r.json() == {"consent_state": "granted"}
    sid = pair["student_id"]
    assert (
        world.scalar("SELECT age_band || ':' || age_verified FROM student WHERE id = :i", i=sid)
        == "16-17:true"
    )
    assert (
        world.scalar("SELECT count(*) FROM flag WHERE student_id = :i AND type = 'age_mismatch'", i=sid) == 1
    )


def test_claiming_again_keeps_the_slip(api: TestClient, world: World) -> None:  # TC-CON-02
    class_id, code = world.add_class()
    pair = join(api, world, code, claim_code=world.add_slip(class_id))
    spare = world.add_slip(class_id)
    assert claim(api, pair["access_token"], spare).json() == {"consent_state": "granted"}
    assert (
        world.scalar(
            "SELECT count(*) FROM consent_slip WHERE claimed_at IS NOT NULL AND class_id = :c", c=class_id
        )
        == 1
    )  # the spare slip is not used up


def test_bad_claims_get_the_generic_answer(api: TestClient, world: World) -> None:  # TC-CON-03
    class_id, code = world.add_class()
    other_class, _ = world.add_class()
    pair = join(api, world, code)
    for bad in ("ZZZZ-9999", world.add_slip(class_id, recorded=False), world.add_slip(other_class)):
        r = claim(api, pair["access_token"], bad)
        assert r.status_code == 404 and r.json()["code"] == "code_not_accepted"


def test_claiming_needs_a_valid_token(api: TestClient, world: World) -> None:  # TC-CON-04
    class_id, code = world.add_class()
    slip = world.add_slip(class_id)
    assert api.post(CLAIM_URL, json={"claim_code": slip}).status_code == 401
    assert claim(api, "not-a-token", slip).status_code == 401
    pair = join(api, world, code)
    world.scalar("DELETE FROM student WHERE id = :i RETURNING 1", i=pair["student_id"])
    assert claim(api, pair["access_token"], slip).status_code == 401  # a deleted student's token is dead
