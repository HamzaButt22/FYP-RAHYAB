import pytest
from fastapi.testclient import TestClient

from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings


def client() -> TestClient:
    return TestClient(
        create_app(Settings(app_env="test", cors_allowed_origins=["https://dashboard.example.pk"]))
    )


def test_health_ok() -> None:
    r = client().get("/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_unknown_route_is_problem_json() -> None:
    r = client().get("/v1/does-not-exist")
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("application/problem+json")


def test_cors_allows_only_the_exact_origin() -> None:  # TC-SEC-09
    c = client()
    good = c.options(
        "/v1/health",
        headers={"Origin": "https://dashboard.example.pk", "Access-Control-Request-Method": "GET"},
    )
    assert good.headers.get("access-control-allow-origin") == "https://dashboard.example.pk"
    for origin in ("https://evil.example", "null", "https://x.dashboard.example.pk"):
        bad = c.options("/v1/health", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})
        assert "access-control-allow-origin" not in bad.headers


def test_production_settings_refuse_unsafe_values() -> None:
    with pytest.raises(ValueError):
        Settings(app_env="production", debug=True, jwt_signing_key="x" * 40).validate_for_runtime()
    with pytest.raises(ValueError):
        Settings(app_env="production", jwt_signing_key="").validate_for_runtime()
    with pytest.raises(ValueError):
        Settings(
            app_env="production", jwt_signing_key="x" * 40, cors_allowed_origins=["*"]
        ).validate_for_runtime()


def test_cors_origins_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://a.example.pk, https://b.example.pk")
    assert Settings().cors_allowed_origins == ["https://a.example.pk", "https://b.example.pk"]


def test_missing_app_env_fails_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("APP_ENV", raising=False)
    settings = Settings(_env_file=None)
    assert settings.app_env == "production"
    with pytest.raises(ValueError):
        settings.validate_for_runtime()  # no JWT key, no database URL


def test_docs_are_off_outside_development_and_test() -> None:
    app = create_app(
        Settings(
            app_env="production",
            jwt_signing_key="x" * 40,
            database_url="postgresql+psycopg://u:p@db/x",
            cors_allowed_origins=["https://dashboard.example.pk"],
        )
    )
    c = TestClient(app)
    assert c.get("/v1/docs").status_code == 404
    assert c.get("/v1/openapi.json").status_code == 404
