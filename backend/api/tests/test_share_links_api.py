"""Share links and the parent report page (FR-66, FR-67, FR-68, FR-105; RFC-0004; TEST_CASES §2.5).

The student makes a link to their stored result; the parent opens /p/<token>: a server-rendered page with no
login, built from that stored result only, behind strict headers and rate limits. Database tests.
"""

import hashlib
import re
import uuid
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import World
from test_results import Student, choices

from rahyaab_api.routers import parent

LINKS = "/v1/share-links"
TOKEN = re.compile(r"/p/([0-9A-Za-z]{22})$")


@pytest.fixture(autouse=True)
def fresh_limits(admin: Engine) -> Iterator[None]:
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM rate_limit WHERE key LIKE 'parent_%' OR key LIKE 'share_%'"))
    yield
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM rate_limit WHERE key LIKE 'parent_%' OR key LIKE 'share_%'"))


def with_result(
    api: TestClient, world: World, pack: str, prefer: str = "IRCSEA"
) -> tuple[Student, dict[str, Any]]:
    s = Student(api, world, pack)
    for week in range(1, 5):
        s.play(choices(prefer)[(week - 1) * 8 : week * 8], week=week)
    r = s.compute()
    assert r.status_code == 200, r.text
    return s, r.json()


def make_link(api: TestClient, s: Student, result_id: str, **extra: Any) -> dict[str, Any]:
    r = api.post(LINKS, json={"scope": "report", "recommendation_id": result_id, **extra}, headers=s.headers)
    assert r.status_code == 201, r.text
    body: dict[str, Any] = r.json()
    return body


def token_of(link: dict[str, Any]) -> str:
    match = TOKEN.search(link["url"])
    assert match, link["url"]
    return match.group(1)


# ---------------------------------------------------------------------------------------- the link
def test_tc_share_01_a_link_has_a_strong_token_and_only_its_hash_is_stored(
    api: TestClient, world: World, pack: str
) -> None:
    s, result = with_result(api, world, pack)
    link = make_link(api, s, result["id"])
    token = token_of(link)
    rows = (
        world.admin.connect()
        .execute(
            text(
                "SELECT token_hash, scope, extract(epoch FROM expires_at - now()) / 86400 "
                "FROM share_link WHERE id = :i"
            ),
            {"i": link["id"]},
        )
        .one()
    )
    assert rows[0] == hashlib.sha256(token.encode()).hexdigest() and token not in str(rows)
    assert rows[1] == "report" and 29.9 < float(rows[2]) <= 30
    listed = api.get(LINKS, headers=s.headers).json()
    assert [(item["id"], item["revoked"], item["views"]) for item in listed] == [(link["id"], False, 0)]
    assert "url" not in listed[0] and token not in str(listed)  # the token is shown once only


def test_tc_share_09_links_only_for_your_own_stored_result_after_consent(
    api: TestClient, world: World, pack: str
) -> None:
    s, result = with_result(api, world, pack)
    other, _ = with_result(api, world, pack, prefer="SEACIR")
    r = api.post(LINKS, json={"scope": "report", "recommendation_id": result["id"]}, headers=other.headers)
    assert r.status_code == 404  # another student's result looks like no result at all
    r = api.post(LINKS, json={"scope": "report", "recommendation_id": str(uuid.uuid4())}, headers=s.headers)
    assert r.status_code == 404
    r = api.post(LINKS, json={"scope": "consent"}, headers=s.headers)
    assert r.status_code == 422  # parent consent by phone is post-MVP (MVP.md)
    no_consent = Student(api, world, pack, consented=False)
    r = api.post(
        LINKS, json={"scope": "report", "recommendation_id": result["id"]}, headers=no_consent.headers
    )
    assert r.status_code == 403 and r.json()["code"] == "consent_required"
    assert api.post(LINKS, json={"scope": "report", "recommendation_id": result["id"]}).status_code == 401


def test_tc_share_02_revoked_expired_and_unknown_links_look_the_same(
    api: TestClient, world: World, pack: str
) -> None:
    s, result = with_result(api, world, pack)
    revoked, expired = make_link(api, s, result["id"]), make_link(api, s, result["id"])
    assert api.get(f"/p/{token_of(revoked)}").status_code == 200
    assert api.delete(f"{LINKS}/{revoked['id']}", headers=s.headers).status_code == 204
    world.admin.connect().execution_options(isolation_level="AUTOCOMMIT").execute(
        text("UPDATE share_link SET expires_at = now() - interval '1 second' WHERE id = :i"),
        {"i": expired["id"]},
    )
    pages = [api.get(f"/p/{t}") for t in (token_of(revoked), token_of(expired), "A" * 22)]
    assert {p.status_code for p in pages} == {410}
    assert pages[0].text == pages[1].text == pages[2].text
    assert "This link is no longer active" in pages[0].text
    other, _ = with_result(api, world, pack, prefer="SEACIR")
    assert api.delete(f"{LINKS}/{expired['id']}", headers=other.headers).status_code == 404


# ---------------------------------------------------------------------------------------- the page
def test_tc_share_10_the_page_shows_the_stored_result_in_plain_english(
    api: TestClient, world: World, pack: str
) -> None:
    s, result = with_result(api, world, pack)
    nickname = world.scalar("SELECT nickname FROM student WHERE id = :s", s=s.id)
    page = api.get(f"/p/{token_of(make_link(api, s, result['id']))}")
    assert page.status_code == 200 and page.headers["content-type"].startswith("text/html")
    html = page.text
    assert nickname in html
    names = parent.path_names()
    for card in result["ranked"]:
        assert names[card["stream_id"]] in html
    assert "Plan B" in html and "Talk about it together" in html
    assert "a starting point, not a verdict" in html
    assert not re.search(r"\b0\.\d+\b|\bfit\s*[:=]\s*\d", html)  # no numeric fit anywhere (FR-54)
    assert (
        world.scalar(
            "SELECT views FROM share_link WHERE token_hash = :h",
            h=hashlib.sha256(token_of(make_link(api, s, result["id"])).encode()).hexdigest(),
        )
        == 0
    )
    assert world.scalar("SELECT sum(views) FROM share_link WHERE student_id = :s", s=s.id) == 1


def test_tc_share_05_headers_and_no_inline_scripts(api: TestClient, world: World, pack: str) -> None:
    s, result = with_result(api, world, pack)
    for page in (api.get(f"/p/{token_of(make_link(api, s, result['id']))}"), api.get("/p/" + "B" * 22)):
        h = page.headers
        assert (
            "default-src 'none'" in h["content-security-policy"]
            and "'unsafe-inline'" not in h["content-security-policy"]
        )
        assert "frame-ancestors 'none'" in h["content-security-policy"]
        assert h["x-frame-options"] == "DENY" and h["referrer-policy"] == "no-referrer"
        assert h["x-content-type-options"] == "nosniff" and h["cache-control"] == "no-store"
        assert "noindex" in h["x-robots-tag"]
        assert "access-control-allow-origin" not in h  # no CORS on parent pages (NFR-77)
        assert not re.search(r"<script(?![^>]*\bsrc=)", page.text)  # every script is a file
        assert " style=" not in page.text and " on" + "click=" not in page.text


def test_tc_share_07_the_link_preview_has_no_child_data(api: TestClient, world: World, pack: str) -> None:
    s, result = with_result(api, world, pack)
    nickname = world.scalar("SELECT nickname FROM student WHERE id = :s", s=s.id)
    html = api.get(f"/p/{token_of(make_link(api, s, result['id']))}").text
    head = html.split("</head>", 1)[0]
    title = re.search(r"<title>(.*?)</title>", head).group(1)  # type: ignore[union-attr]
    assert nickname not in head and title == "Family report · Rahyaab"
    assert 'property="og:title" content="A family report from Rahyaab"' in head


def test_tc_share_06_an_old_link_keeps_showing_the_result_it_was_made_for(
    api: TestClient, world: World, pack: str
) -> None:
    s, first = with_result(api, world, pack, prefer="IRCSEA")
    link = make_link(api, s, first["id"])
    for week in range(1, 5):  # more play pointing elsewhere makes a new result
        s.play(choices("ASEIRC")[(week - 1) * 8 : week * 8], week=week)
    second = s.compute().json()
    assert second["id"] != first["id"]
    html = api.get(f"/p/{token_of(link)}").text
    names = parent.path_names()
    first_names = [names[c["stream_id"]] for c in first["ranked"]]
    positions = [html.index(n) for n in first_names]
    assert positions == sorted(positions)  # the first result's order, unchanged


def test_tc_share_04_page_weight_stays_small(api: TestClient, world: World, pack: str) -> None:
    s, result = with_result(api, world, pack)
    page = api.get(f"/p/{token_of(make_link(api, s, result['id']))}")
    css, js = api.get("/p/static/parent.css"), api.get("/p/static/parent.js")
    assert css.status_code == js.status_code == 200
    assert css.headers["content-type"].startswith("text/css") and "javascript" in js.headers["content-type"]
    assert len(page.content) + len(css.content) + len(js.content) <= 150 * 1024


def test_tc_share_03_guessing_is_rate_limited(api: TestClient) -> None:
    # 20 unknown tokens from one address in 10 minutes: that address waits 15 minutes.
    answers = [api.get(f"/p/{uuid.uuid4().hex[:22]}").status_code for _ in range(21)]
    assert answers[:20] == [410] * 20 and answers[20] == 429
    late = api.get("/p/" + "C" * 22)
    assert late.status_code == 429 and late.headers["retry-after"] == "900"


def test_tc_sec_13_the_template_escapes_what_students_typed() -> None:
    html = parent.render_report(
        nickname="<script>alert(1)</script>",
        cards=[
            {"name": "<b>x</b>", "band": "Strong fit", "reasons": ["<i>y</i>"], "plan_b": "z", "doors": []}
        ],
        questions=["q"],
        confidence="fairly sure",
        weeks=4,
        provisional=True,
    )
    assert "<script>alert" not in html and "&lt;script&gt;" in html and "&lt;b&gt;x" in html
