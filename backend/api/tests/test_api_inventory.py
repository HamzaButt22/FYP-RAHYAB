"""API inventory (OWASP API9): every route the app serves must be in docs/api/openapi.yaml.

A route that is not in the reviewed contract (a forgotten test route, a debug endpoint) fails the build.
"""

import re
from collections.abc import Iterable, Iterator
from pathlib import Path

import yaml
from fastapi.routing import APIRoute

from rahyaab_api.main import create_app
from rahyaab_api.settings import Settings

SPEC = Path(__file__).resolve().parents[3] / "docs" / "api" / "openapi.yaml"
PREFIX = "/v1"


def shape(path: str) -> str:
    """The path with parameter names blanked: /results/{result_id}/why and /results/{resultId}/why match."""
    return re.sub(r"\{[^}]+\}", "{}", path)


def served_routes(routes: Iterable[object], prefix: str = "") -> Iterator[tuple[str, str]]:
    """Every (path, method) the app answers, including routes inside included routers. FastAPI 0.162 keeps
    an included router as one wrapper object (`original_router` + `include_context.prefix`) instead of
    copying its routes into `app.routes`, so a flat scan would see none of them."""
    for r in routes:
        if isinstance(r, APIRoute):
            for m in r.methods - {"HEAD", "OPTIONS"}:
                yield prefix + r.path, m
        elif hasattr(r, "original_router"):
            inner = r.original_router.routes
            yield from served_routes(inner, prefix + r.include_context.prefix)


def test_tc_sec_04_every_route_is_in_the_openapi_contract() -> None:
    spec = yaml.safe_load(SPEC.read_text(encoding="utf-8"))
    documented = {
        (shape(path), method.upper())
        for path, ops in spec["paths"].items()
        for method in ops
        if method != "parameters"
    }
    app = create_app(
        Settings(
            app_env="production",
            jwt_signing_key="x" * 40,
            code_pepper="y" * 40,
            database_url="postgresql+psycopg://u:p@h/d",
            cors_allowed_origins=["https://dashboard.example.pk"],
            dashboard_url="https://dashboard.example.pk",
        )
    )
    served = {(shape(path.removeprefix(PREFIX)), m) for path, m in served_routes(app.routes)}
    # Guard: an empty scan would pass silently (it did, until 17 Nov 2026).
    assert ("/auth/student/join", "POST") in served and len(served) >= 15
    undocumented = served - documented
    assert not undocumented, f"routes missing from docs/api/openapi.yaml: {sorted(undocumented)}"
