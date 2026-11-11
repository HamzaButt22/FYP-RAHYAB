"""Token refresh against a real PostgreSQL (ADR-0011, TC-ONB-10, TC-SEC-18).

Fixtures `api`, `world` and `admin` are in conftest.py; they skip when no test database is configured.
"""

from typing import Any

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import text
from support import JOIN_URL, REFRESH_URL, SIGNING_KEY, World, make_device_key, sha, sign_refresh


def join(api: TestClient, world: World, **overrides: Any) -> tuple[dict[str, Any], Any]:
    """Joins a new student; returns the token pair and the device's private key."""
    _, code = world.add_class()
    body = world.body(code, **overrides)
    r = api.post(JOIN_URL, json=body)
    assert r.status_code == 201, r.text
    return r.json(), world.private_keys[body["device"]["public_key"]]


def refresh(api: TestClient, token: str, private: Any) -> Any:
    return api.post(REFRESH_URL, json={"refresh_token": token, "signature": sign_refresh(private, token)})


def test_refresh_rotates_the_pair(api: TestClient, world: World) -> None:
    pair, key = join(api, world)
    r = refresh(api, pair["refresh_token"], key)
    assert r.status_code == 200, r.text
    new = r.json()
    assert new["student_id"] == pair["student_id"]
    assert new["refresh_token"] != pair["refresh_token"]
    assert new["consent_state"] == "pending"
    claims = jwt.decode(new["access_token"], SIGNING_KEY, algorithms=["HS256"], issuer="rahyaab-api")
    assert claims["sub"] == pair["student_id"]
    # The new token keeps working: a chain of refreshes is the normal case.
    assert refresh(api, new["refresh_token"], key).status_code == 200


def test_a_retry_after_a_lost_response_gets_a_fresh_pair(api: TestClient, world: World) -> None:  # TC-ONB-11
    pair, key = join(api, world)
    lost = refresh(api, pair["refresh_token"], key)  # the server answered, but the phone never got it
    assert lost.status_code == 200
    retry = refresh(api, pair["refresh_token"], key)  # same phone, same key, seconds later
    assert retry.status_code == 200
    assert retry.json()["refresh_token"] not in (lost.json()["refresh_token"], pair["refresh_token"])
    assert refresh(api, lost.json()["refresh_token"], key).status_code == 401  # the undelivered pair is dead
    assert refresh(api, retry.json()["refresh_token"], key).status_code == 200  # the phone carries on


# TC-ONB-10
def test_reusing_a_token_after_its_successor_was_used_revokes(api: TestClient, world: World) -> None:
    pair, key = join(api, world)
    first = refresh(api, pair["refresh_token"], key)
    assert refresh(api, first.json()["refresh_token"], key).status_code == 200  # the successor is in use
    assert refresh(api, pair["refresh_token"], key).status_code == 401  # so the old token is a replay
    assert refresh(api, first.json()["refresh_token"], key).status_code == 401  # family revoked


def test_reusing_a_token_after_the_grace_period_revokes(api: TestClient, world: World) -> None:  # TC-ONB-10
    pair, key = join(api, world)
    first = refresh(api, pair["refresh_token"], key)
    with world.admin.begin() as conn:
        conn.execute(
            text("UPDATE refresh_token SET used_at = now() - interval '10 minutes' WHERE token_hash = :h"),
            {"h": sha(pair["refresh_token"])},
        )
    assert refresh(api, pair["refresh_token"], key).status_code == 401
    assert refresh(api, first.json()["refresh_token"], key).status_code == 401  # family revoked


def test_a_copied_token_signed_by_another_key_is_refused_and_revokes(  # TC-SEC-18
    api: TestClient, world: World
) -> None:
    pair, key = join(api, world)
    _, thief_key = make_device_key()
    stolen = refresh(api, pair["refresh_token"], thief_key)
    assert stolen.status_code == 401
    assert refresh(api, pair["refresh_token"], key).status_code == 401  # family revoked: re-link needed


def test_every_refusal_looks_the_same(api: TestClient, world: World) -> None:
    pair, key = join(api, world)
    unknown = refresh(api, "x" * 43, key)
    wrong_key = refresh(api, pair["refresh_token"], make_device_key()[1])
    revoked = refresh(api, pair["refresh_token"], key)
    for r in (unknown, wrong_key, revoked):
        assert r.status_code == 401
        assert (
            r.json()
            == unknown.json()
            == {
                "type": "about:blank",
                "status": 401,
                "code": "unauthorized",
                "title": "Please sign in again",
            }
        )


def test_an_expired_token_is_refused(api: TestClient, world: World) -> None:
    pair, key = join(api, world)
    with world.admin.begin() as conn:
        conn.execute(
            text("UPDATE refresh_token SET expires_at = now() - interval '1 second' WHERE token_hash = :h"),
            {"h": sha(pair["refresh_token"])},
        )
    assert refresh(api, pair["refresh_token"], key).status_code == 401


def test_refresh_reports_current_consent(api: TestClient, world: World) -> None:  # FR-100
    class_id, code = world.add_class(grade=12)
    claim = world.add_slip(class_id, kind="self")
    body = world.body(code, grade=12, birth_year=2007, birth_month=1, claim_code=claim)
    r = api.post(JOIN_URL, json=body)
    assert r.status_code == 201, r.text
    key = world.private_keys[body["device"]["public_key"]]
    again = refresh(api, r.json()["refresh_token"], key)
    assert again.status_code == 200 and again.json()["consent_state"] == "granted"
