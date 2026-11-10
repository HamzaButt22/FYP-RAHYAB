"""Database access: one SQLAlchemy engine per app, parameterised SQL only (SECURITY.md §5.4).

The API connects as the least-privilege role `api_rw` (database/schema.sql grants).
"""

from fastapi import Request
from sqlalchemy import Engine, create_engine

from rahyaab_api.problems import ProblemError


def make_engine(url: str) -> Engine | None:
    if not url:
        return None  # test settings without a database: routes that need one return 503
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5)


def get_engine(request: Request) -> Engine:
    """Call inside a route (not as a dependency), so request validation still answers without a database."""
    engine: Engine | None = request.app.state.engine
    if engine is None:
        raise ProblemError(503, "unavailable", "The service is not ready")
    return engine
