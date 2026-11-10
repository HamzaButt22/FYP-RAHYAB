"""Join request validation that needs no database (TC-ONB-02, TC-VAL-07, TC-EDGE-06)."""

from typing import Any

from fastapi.testclient import TestClient

from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

URL = "/v1/auth/student/join"


def client() -> TestClient:
    # No DATABASE_URL: anything that reaches the database answers 503, so these tests prove the checks
    # below run first and store nothing.
    return TestClient(create_app(Settings(app_env="test", jwt_signing_key="t" * 40)))


def valid_body(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "class_code": "RYB-4K2",
        "grade": 9,
        "birth_year": 2011,
        "birth_month": 5,
        "nickname": "Ayesha_10",
        "lang": "ur",
        "device": {
            "device_tier": "low",
            "os_major": 13,
            "app_version": "0.1.0",
            "public_key": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE-test-key",
        },
    }
    body.update(overrides)
    return body


def test_identifying_fields_are_refused() -> None:  # TC-ONB-02
    for extra in ({"name": "Ayesha Khan"}, {"phone": "03001234567"}, {"email": "a@b.pk"}):
        r = client().post(URL, json=valid_body(**extra))
        assert r.status_code == 422
        field = next(iter(extra))
        expected = {"field": field, "code": "not_allowed", "message_key": f"errors.{field}.not_allowed"}
        assert expected in r.json()["errors"]


def test_three_bad_fields_give_three_field_errors_without_echo() -> None:  # TC-VAL-07
    body = valid_body(class_code="ryb4k2", grade=7, nickname="call 03001234567")
    r = client().post(URL, json=body)
    assert r.status_code == 422
    assert r.headers["content-type"].startswith("application/problem+json")
    errors = r.json()["errors"]
    assert {e["field"] for e in errors} == {"class_code", "grade", "nickname"}
    assert {(e["field"], e["code"]) for e in errors} == {
        ("class_code", "format"),
        ("grade", "out_of_range"),
        ("nickname", "contains_phone"),
    }
    assert all(e["message_key"] == f"errors.{e['field']}.{e['code']}" for e in errors)
    for typed in ("ryb4k2", "03001234567"):
        assert typed not in r.text  # never echo input (NFR-74)


def test_strict_types_do_not_coerce_strings() -> None:
    r = client().post(URL, json=valid_body(grade="9"))
    assert r.status_code == 422
    assert {"field": "grade", "code": "format", "message_key": "errors.grade.format"} in r.json()["errors"]


def test_under_13_stops_before_the_database() -> None:  # TC-EDGE-06, FR-04
    r = client().post(URL, json=valid_body(birth_year=2020, birth_month=1))
    assert r.status_code == 422
    assert r.json()["code"] == "age_out_of_range"
    # A future birth date gets the same neutral answer as any other out-of-range age.
    r2 = client().post(URL, json=valid_body(birth_year=2099, birth_month=1))
    assert r2.status_code == 422
    assert r2.json()["code"] == "age_out_of_range"


def test_valid_request_needs_the_database() -> None:
    # Proves the age check passed and nothing was answered from validation alone.
    r = client().post(URL, json=valid_body())
    assert r.status_code == 503
