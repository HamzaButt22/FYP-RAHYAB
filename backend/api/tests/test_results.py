"""POST /v1/results/compute, GET /v1/results/latest and /why (FR-45, FR-46, FR-51, FR-56; RFC-0003).

Play is inserted straight into the database (sitting, run, events), so each test controls exactly which
choices exist. Database tests (skipped without a test database).
"""

import json
import secrets
import time
import uuid
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import text
from support import World

URL = "/v1/results/compute"
JOIN_URL = "/v1/auth/student/join"
RIASEC = "RIASEC"
PAIRS = [f"{a}-{b}" for i, a in enumerate(RIASEC) for b in RIASEC[i + 1 :]]


def uuid7() -> str:
    ms = int(time.time() * 1000)
    value = (ms << 80) | (0x7 << 76) | (secrets.randbits(12) << 64) | (0b10 << 62) | secrets.randbits(62)
    return str(uuid.UUID(int=value))


def choices(prefer: str, rounds: int = 2) -> list[tuple[str, str]]:
    out = []
    for _ in range(rounds):
        for pair in PAIRS:
            a, b = pair.split("-")
            out.append((pair, a if prefer.index(a) < prefer.index(b) else b))
    return out


class Student:
    def __init__(
        self, api: TestClient, world: World, pack: str, consented: bool = True, grade: int = 9
    ) -> None:
        self.api, self.world, self.pack = api, world, pack
        class_id, code = world.add_class(grade=grade)
        overrides: dict[str, Any] = {"grade": grade}
        if consented:
            overrides["claim_code"] = world.add_slip(class_id, band="16-17" if grade >= 11 else "13-15")
        body = world.body(code, **overrides)
        if grade >= 11:
            body["birth_year"] = 2009
        joined = api.post(JOIN_URL, json=body).json()
        self.id = uuid.UUID(joined["student_id"])
        self.headers = {"Authorization": f"Bearer {joined['access_token']}"}
        with world.admin.connect() as conn:
            self.device = conn.execute(
                text("SELECT id FROM device WHERE student_id = :s"), {"s": self.id}
            ).scalar_one()

    def play(
        self,
        picks: list[tuple[str, str]],
        week: int = 1,
        practice: bool = False,
        a11y: bool = False,
        complete: bool = True,
    ) -> None:
        sitting, run = uuid7(), uuid7()
        with self.world.admin.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO sitting (id, student_id, device_id, started_at) VALUES (:id, :s, :d, now())"
                ),
                {"id": sitting, "s": self.id, "d": self.device},
            )
            conn.execute(
                text(
                    "INSERT INTO game_run (id, sitting_id, week, story_version, content_version, practice) "
                    "VALUES (:id, :sit, :w, 'test@1.0.0', :cv, :p)"
                ),
                {"id": run, "sit": sitting, "w": week, "cv": self.pack, "p": practice},
            )
            events = [("run_start", {})] + [("choice_made", {"pair": p, "picked": k}) for p, k in picks]
            if complete:
                events.append(("week_complete", {"week": week}))
            for seq, (kind, data) in enumerate(events):
                conn.execute(
                    text(
                        "INSERT INTO raw_event (event_id, run_id, seq, type, monotonic_ms, a11y_mode, data) "
                        "VALUES (:e, :r, :seq, :t, :ms, :a, CAST(:d AS jsonb))"
                    ),
                    {
                        "e": uuid7(),
                        "r": run,
                        "seq": seq,
                        "t": kind,
                        "ms": seq * 10.0,
                        "a": a11y,
                        "d": json.dumps(data),
                    },
                )

    def compute(self) -> Any:
        return self.api.post(URL, headers=self.headers)


def test_without_consent_there_is_no_result(api: TestClient, world: World, pack: str) -> None:
    s = Student(api, world, pack, consented=False)
    s.play(choices("IRCSEA"))
    r = s.compute()
    assert r.status_code == 403 and r.json()["code"] == "consent_required"


def test_too_little_play_asks_for_one_more_week(api: TestClient, world: World, pack: str) -> None:  # FR-51
    s = Student(api, world, pack)
    s.play(choices("IRCSEA", rounds=1)[:6])
    r = s.compute()
    assert r.status_code == 409 and r.json()["code"] == "insufficient_evidence"
    assert r.json()["errors"][0]["code"] == "low_coverage"
    assert world.scalar("SELECT count(*) FROM recommendation WHERE student_id = :s", s=s.id) == 0


def test_a_full_week_set_gives_three_cards_and_stores_them(api: TestClient, world: World, pack: str) -> None:
    s = Student(api, world, pack)
    picks = choices("IRCSEA")
    for week in range(1, 5):  # spread over four weeks, as the game does
        s.play(picks[(week - 1) * 8 : week * 8], week=week)
    r = s.compute()
    assert r.status_code == 200, r.text
    body = r.json()
    assert (
        body["mode"] == "matric" and body["provisional"] is True and body["confidence"] in {"low", "medium"}
    )
    assert len(body["ranked"]) == 3
    for card in body["ranked"]:
        assert set(card) == {"stream_id", "fit_band", "reasons", "doors", "plan_b"}  # no numeric fit (FR-54)
        assert card["plan_b"] and 2 <= len(card["reasons"]) <= 3
    assert world.scalar("SELECT count(*) FROM trait_estimate WHERE student_id = :s", s=s.id) == 6
    latest = api.get("/v1/results/latest", headers=s.headers).json()
    assert latest["id"] == body["id"]
    again = s.compute().json()  # the same inputs give the stored result, not a new one (RFC-0003)
    assert again["id"] == body["id"]
    assert world.scalar("SELECT count(*) FROM recommendation WHERE student_id = :s", s=s.id) == 1


def test_practice_and_accessible_mode_runs_are_never_scored(api: TestClient, world: World, pack: str) -> None:
    s = Student(api, world, pack)
    s.play(choices("IRCSEA"), practice=True)
    s.play(choices("IRCSEA"), a11y=True)
    assert s.compute().status_code == 409


def test_after_the_extra_week_a_result_always_opens(
    api: TestClient, world: World, pack: str
) -> None:  # FR-51
    s = Student(api, world, pack)
    few = choices("IRCSEA", rounds=1)[:6]
    for week in (1, 2, 3, 4, 4):  # the extra week replays week-4 content: weeks are 0-4 in the envelope
        s.play(few if week == 1 else [], week=week)
    r = s.compute()
    assert r.status_code == 200 and r.json()["confidence"] == "low"


def test_new_play_makes_a_new_result_that_supersedes_the_old(
    api: TestClient, world: World, pack: str
) -> None:
    s = Student(api, world, pack)
    s.play(choices("IRCSEA"))
    first = s.compute().json()
    s.play(choices("IRCSEA", rounds=1), week=2)
    second = s.compute().json()
    assert second["id"] != first["id"]
    assert world.scalar("SELECT supersedes FROM recommendation WHERE id = :i", i=second["id"]) == uuid.UUID(
        first["id"]
    )


def test_why_shows_contributions_and_rules_only_to_the_owner(
    api: TestClient, world: World, pack: str
) -> None:
    owner, other = Student(api, world, pack), Student(api, world, pack)
    owner.play(choices("IRCSEA"))
    result_id = owner.compute().json()["id"]
    why = api.get(f"/v1/results/{result_id}/why", headers=owner.headers)
    assert why.status_code == 200
    body = why.json()
    assert len(body["paths"]) == 3 and body["evidence"]["choices"] == 30
    for path in body["paths"]:
        assert path["contributions"] and all(c["contribution"] > 0 for c in path["contributions"])
    assert api.get(f"/v1/results/{result_id}/why", headers=other.headers).status_code == 404
    assert api.get("/v1/results/latest", headers=other.headers).status_code == 404


def test_why_explains_choices_path_types_and_rule_sources(
    api: TestClient, world: World, pack: str
) -> None:  # FR-56: a real explanation, not only a count
    s = Student(api, world, pack)
    s.play(choices("IRCSEA"))  # I always wins, A always loses; every pair twice
    body = api.get(f"/v1/results/{s.compute().json()['id']}/why", headers=s.headers).json()
    profile = body["evidence"]["interest_profile"]
    assert [p["type"] for p in profile] == list("IRCSEA")
    assert profile[0] == {"type": "I", "chosen": 10, "offered": 10}
    assert profile[-1] == {"type": "A", "chosen": 0, "offered": 10}
    for path in body["paths"]:
        assert len(path["path_types"]) == 3 and set(path["path_types"]) <= set(RIASEC)
        assert {r["id"] for r in path["rules"]} == set(path["rules_applied"])
        for rule in path["rules"]:
            assert rule["source"] and rule["verification"] in {"primary", "reported", "unverified"}


def test_classes_without_a_recommender_yet_say_so(api: TestClient, world: World, pack: str) -> None:
    s = Student(api, world, pack, grade=11)
    s.play(choices("IRCSEA"))
    r = s.compute()
    assert r.status_code == 422 and r.json()["code"] == "mode_not_supported"
