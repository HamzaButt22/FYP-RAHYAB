import pytest

from backend.app import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app(tmp_path / "api.db")
    return app.test_client()


def make_session(client):
    pid = client.post("/api/players", json={"name": "Api User"}).get_json()["player_id"]
    sid = client.post("/api/sessions", json={"player_id": pid}).get_json()["session_id"]
    return pid, sid


def test_health_and_empty_overview(client):
    assert client.get("/api/health").get_json()["status"] == "ok"
    ov = client.get("/api/overview").get_json()
    assert ov["players"] == 0 and ov["completed_assessments"] == 0 and ov["average_scores"] is None


def test_player_validation(client):
    assert client.post("/api/players", json={}).status_code == 400
    assert client.post("/api/sessions", json={"player_id": 99}).status_code == 400
    assert client.get("/api/players/99").status_code == 404


def test_full_remote_flow_with_dummy_data(client, dummy):
    pid, sid = make_session(client)
    events = [{k: v for k, v in e.items() if k not in ("session_id", "player_id")} for e in dummy["anxious"]]
    r = client.post(f"/api/sessions/{sid}/events", json={"events": events})
    assert r.status_code == 201 and r.get_json()["inserted"] == len(events)
    assert client.get(f"/api/sessions/{sid}/events?limit=5&type=DECISION_RESPONSE").get_json()["events"][0]["event_type"] == "DECISION_RESPONSE"
    assert client.get(f"/api/sessions/{sid}/result").status_code == 404           # not analysed yet
    done = client.post(f"/api/sessions/{sid}/complete", json={}).get_json()
    assert set(done["result"]["scores"]) >= {"openness", "neuroticism"}
    assert client.get(f"/api/sessions/{sid}").get_json()["status"] == "completed"
    assert len(client.get(f"/api/sessions/{sid}/features").get_json()) > 20
    tel = client.get(f"/api/sessions/{sid}/telemetry").get_json()
    assert tel["event_counts"]["DECISION_RESPONSE"] > 5 and len(tel["exploration"]["heatmap"]) == 7
    ov = client.get("/api/overview").get_json()
    assert ov["completed_assessments"] == 1 and ov["average_scores"]["neuroticism"] == done["result"]["scores"]["neuroticism"]
    assert client.get("/api/telemetry/overview").get_json()["score_distribution"]["openness"]
    assert client.get(f"/api/players/{pid}").get_json()["sessions"][0]["session_id"] == sid


def test_bad_event_payloads_rejected(client):
    _, sid = make_session(client)
    assert client.post(f"/api/sessions/{sid}/events", json={"events": []}).status_code == 400
    bad = {"events": [{"event_type": "NOPE", "timestamp": "x", "t_ms": 1}]}
    assert client.post(f"/api/sessions/{sid}/events", json=bad).status_code == 422
    assert client.post("/api/sessions/ghost/events", json={"events": [{"event_type": "SESSION_START", "timestamp": "x", "t_ms": 1}]}).status_code == 404
    assert client.post(f"/api/sessions/{sid}/complete", json={}).status_code == 422   # no telemetry


def test_dashboard_pages_render(client, dummy):
    pid, sid = make_session(client)
    client.post(f"/api/sessions/{sid}/events", json={"events": dummy["explorer"][:50]})
    for url in ("/", "/telemetry", f"/players/{pid}", f"/sessions/{sid}/events", f"/telemetry?session={sid}"):
        r = client.get(url)
        assert r.status_code == 200 and b"RahYaab" in r.data, url
    assert client.get("/players/999").status_code == 404
    assert client.get("/static/js/charts.js").status_code == 200
