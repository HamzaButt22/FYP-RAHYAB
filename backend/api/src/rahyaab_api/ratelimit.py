"""Fixed-window rate limits counted in PostgreSQL, so every API worker agrees (NFR-67, docs/api/README.md §3).

Keys hold only hashes (never a raw IP, public key or code). Each counter is updated in its own short
transaction, so a request that fails later still counts.
"""

import hashlib
from dataclasses import dataclass

from sqlalchemy import Engine, text

from rahyaab_api.problems import ProblemError

# The window starts at a multiple of :w seconds since the epoch, so every worker computes the same window.
_HIT = text(
    """
    INSERT INTO rate_limit (key, window_start, hits)
    VALUES (:k, to_timestamp(floor(extract(epoch FROM now()) / :w) * :w), 1)
    ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limit.hits + 1
    RETURNING hits, ceil(extract(epoch FROM (window_start + make_interval(secs => :w) - now())))::int
    """
)
_PEEK = text(
    """
    SELECT hits, ceil(extract(epoch FROM (window_start + make_interval(secs => :w) - now())))::int
    FROM rate_limit
    WHERE key = :k AND window_start = to_timestamp(floor(extract(epoch FROM now()) / :w) * :w)
    """
)


@dataclass(frozen=True)
class Limit:
    name: str
    max_hits: int
    window_s: int


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hit(engine: Engine, key: str, window_s: int) -> tuple[int, int]:
    """Count one hit. Returns (hits in this window, seconds until the window resets)."""
    with engine.begin() as conn:
        row = conn.execute(_HIT, {"k": key, "w": window_s}).one()
    return int(row[0]), max(int(row[1]), 1)


def peek(engine: Engine, key: str, window_s: int) -> tuple[int, int]:
    with engine.begin() as conn:
        row = conn.execute(_PEEK, {"k": key, "w": window_s}).one_or_none()
    return (int(row[0]), max(int(row[1]), 1)) if row else (0, window_s)


def too_many(limit: Limit, retry_after: int) -> ProblemError:
    # The wait time is shown; the number of tries left is not (forms-and-errors.md §4).
    return ProblemError(
        429,
        "rate_limited",
        "Too many tries. Please wait and try again.",
        headers={
            "Retry-After": str(retry_after),
            "RateLimit": f"limit={limit.max_hits}, remaining=0, reset={retry_after}",
        },
    )


def enforce(engine: Engine, limit: Limit, subject: str) -> None:
    hits, retry_after = hit(engine, f"{limit.name}:{digest(subject)}", limit.window_s)
    if hits > limit.max_hits:
        raise too_many(limit, retry_after)
