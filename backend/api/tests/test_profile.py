"""GET and PATCH /v1/me/profile (S-05, FR-101, FR-104). Database tests (skipped without a test database)."""

from typing import Any

from fastapi.testclient import TestClient
from support import World

URL = "/v1/me/profile"
JOIN_URL = "/v1/auth/student/join"
MERGE = {"Content-Type": "application/merge-patch+json"}


def join(api: TestClient, world: World, grade: int = 9) -> dict[str, str]:
    _, code = world.add_class(grade=grade)
    body = world.body(code, grade=grade)
    if grade >= 11:
        body["birth_year"] = 2009
    joined = api.post(JOIN_URL, json=body).json()
    return {"Authorization": f"Bearer {joined['access_token']}"}


def patch(api: TestClient, headers: dict[str, str], body: dict[str, Any]) -> Any:
    return api.patch(URL, json=body, headers={**headers, **MERGE})


def test_the_profile_shows_the_class_facts_and_the_groups_to_choose_from(
    api: TestClient, world: World
) -> None:
    headers = join(api, world, grade=9)
    r = api.get(URL, headers=headers)
    assert r.status_code == 200
    p = r.json()
    assert p["grade"] == 9 and p["board"] == "FBISE" and p["current_group"] is None
    assert p["age_band"] == "13-15" and p["situation"] is None
    assert "matric_science_bio" in p["groups"] and "pre_medical" not in p["groups"]


def test_a_class_9_student_sets_and_clears_their_matric_group(api: TestClient, world: World) -> None:
    headers = join(api, world, grade=9)
    r = patch(api, headers, {"current_group": "matric_science_cs"})
    assert r.status_code == 200 and r.json()["current_group"] == "matric_science_cs"
    assert api.get(URL, headers=headers).json()["current_group"] == "matric_science_cs"
    r = patch(api, headers, {"current_group": None})
    assert r.status_code == 200 and r.json()["current_group"] is None


def test_a_group_from_another_class_is_refused(api: TestClient, world: World) -> None:
    headers = join(api, world, grade=9)
    r = patch(api, headers, {"current_group": "pre_medical"})  # an Intermediate stream, for class 11-12
    assert r.status_code == 422
    assert r.json()["errors"] == [
        {
            "field": "current_group",
            "code": "not_for_your_class",
            "message_key": "errors.current_group.not_for_your_class",
        }
    ]
    class_8 = join(api, world, grade=8)
    assert api.get(URL, headers=class_8).json()["groups"] == []
    assert patch(api, class_8, {"current_group": "matric_science_bio"}).status_code == 422


def test_class_11_chooses_from_intermediate_streams(api: TestClient, world: World) -> None:
    headers = join(api, world, grade=11)
    r = patch(api, headers, {"current_group": "ics", "board": "PUNJAB", "situation": "changed_board"})
    assert r.status_code == 200
    p = r.json()
    assert (p["current_group"], p["board"], p["situation"]) == ("ics", "PUNJAB", "changed_board")


def test_only_the_editable_fields_with_known_values_are_accepted(api: TestClient, world: World) -> None:
    headers = join(api, world)
    assert patch(api, headers, {"board": "MARS"}).status_code == 422
    assert patch(api, headers, {"situation": "astronaut"}).status_code == 422
    for not_yet in ({"nickname": "New_Name"}, {"grade": 10}, {"district": "Lahore"}, {"student_id": "x"}):
        assert patch(api, headers, not_yet).status_code == 422, not_yet
    assert patch(api, headers, {}).status_code == 200  # nothing to change


def test_the_profile_needs_a_signed_in_student(api: TestClient) -> None:
    assert api.get(URL).status_code == 401
    assert api.patch(URL, json={"board": "FBISE"}, headers=MERGE).status_code == 401
