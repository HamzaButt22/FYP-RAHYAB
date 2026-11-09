"""FastAPI application factory. Routers are added module by module (ADR-0012, modular monolith)."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from rahyaab_api import __version__
from rahyaab_api.routers import health
from rahyaab_api.settings import Settings, get_settings

PROBLEM = "application/problem+json"


def _problem(status: int, code: str, title: str, errors: list[dict[str, str]] | None = None) -> JSONResponse:
    body: dict[str, object] = {"type": "about:blank", "status": status, "code": code, "title": title}
    if errors:
        body["errors"] = errors
    return JSONResponse(status_code=status, content=body, media_type=PROBLEM)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    settings.validate_for_runtime()
    docs = settings.app_env in ("development", "test")
    app = FastAPI(
        title="Rahyaab API",
        version=__version__,
        docs_url="/v1/docs" if docs else None,
        redoc_url=None,
        openapi_url="/v1/openapi.json" if docs else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,  # exact allowlist (NFR-77)
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-Id"],
        max_age=600,
    )

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _problem(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Field keys only; the submitted value is never echoed back (forms-and-errors.md §4).
        errors = [{"field": ".".join(str(p) for p in e["loc"][1:]), "code": e["type"]} for e in exc.errors()]
        return _problem(422, "validation_error", "Some fields need fixing", errors)

    @app.exception_handler(Exception)
    async def unexpected(_: Request, __: Exception) -> JSONResponse:
        # Details go to the server log only (SECURITY.md §3, verbose errors).
        return _problem(500, "internal_error", "Something went wrong on our side")

    app.include_router(health.router, prefix="/v1")
    return app


app = create_app()
