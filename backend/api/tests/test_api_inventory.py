"""API inventory (OWASP API9): every route the app serves must be in docs/api/openapi.yaml.

A route that is not in the reviewed contract (a forgotten test route, a debug endpoint) fails the build.
"""

from pathlib import Path

import yaml
from fastapi.routing import APIRoute

from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

SPEC = Path(__file__).resolve().parents[3] / "docs" / "api" / "openapi.yaml"
PREFIX = "/v1"


def test_every_route_is_in_the_openapi_contract() -> None:
    spec = yaml.safe_load(SPEC.read_text(encoding="utf-8"))
    documented = {
        (path, method.upper())
        for path, ops in spec["paths"].items()
        for method in ops
        if method != "parameters"
    }
    app = create_app(
        Settings(
            app_env="production",
            jwt_signing_key="x" * 40,
            database_url="postgresql+psycopg://u:p@h/d",
            cors_allowed_origins=["https://dashboard.example.pk"],
        )
    )
    served = {
        (r.path.removeprefix(PREFIX), m)
        for r in app.routes
        if isinstance(r, APIRoute)
        for m in r.methods - {"HEAD", "OPTIONS"}
    }
    undocumented = served - documented
    assert not undocumented, f"routes missing from docs/api/openapi.yaml: {sorted(undocumented)}"
