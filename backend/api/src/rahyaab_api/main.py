"""FastAPI application factory. Routers are added module by module (ADR-0012, modular monolith)."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from rahyaab_api import __version__
from rahyaab_api.db import make_engine
from rahyaab_api.problems import FIELD_CODES, ProblemError, field_error, problem_response
from rahyaab_api.routers import consents, health, student_auth
from rahyaab_api.settings import Settings, get_settings

log = logging.getLogger("rahyaab.api")

# Our own field-error codes (raised by validators); everything else is mapped through FIELD_CODES.
CUSTOM_FIELD_CODES = {"contains_phone", "full_name", "too_short", "too_long", "format"}


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
    app.state.settings = settings
    app.state.engine = make_engine(settings.database_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,  # exact allowlist (NFR-77)
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-Id"],
        max_age=600,
    )

    @app.exception_handler(ProblemError)
    async def problem(_: Request, exc: ProblemError) -> JSONResponse:
        return problem_response(exc.status, exc.code, exc.title, exc.errors, exc.headers)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return problem_response(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Field paths, codes and message keys only; the submitted value is never echoed (NFR-74, FR-102).
        errors = []
        for e in exc.errors():
            field = ".".join(str(p) for p in e["loc"][1:]) or "body"
            kind = str(e["type"])
            code = kind if kind in CUSTOM_FIELD_CODES else FIELD_CODES.get(kind, "format")
            errors.append(field_error(field, code))
        return problem_response(422, "validation_error", "Some fields need fixing", errors)

    @app.exception_handler(Exception)
    async def unexpected(_: Request, exc: Exception) -> JSONResponse:
        # Details go to the server log only (SECURITY.md §3, verbose errors); never to the client.
        log.exception("unhandled error: %s", type(exc).__name__)
        return problem_response(500, "internal_error", "Something went wrong on our side")

    app.include_router(health.router, prefix="/v1")
    app.include_router(student_auth.router, prefix="/v1")
    app.include_router(consents.router, prefix="/v1")
    return app


app = create_app()
