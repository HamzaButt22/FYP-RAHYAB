"""Background jobs worker (`python -m rahyaab_api.jobs`).

Runs as the `jobs` database role (DATABASE_URL), which may only delete and read what retention needs.
Jobs so far: purge old rate-limit windows (hourly). Still to add: retention and deletion, monthly
partitions (owner role), rescoring, O*NET cache refresh, nightly encrypted backup.
"""

import logging
import os
import signal
import time

from sqlalchemy import Engine, create_engine, text

log = logging.getLogger("rahyaab.jobs")
_running = True
RATE_LIMIT_KEEP_HOURS = 24  # the longest window is 1 hour; a day of history helps abuse reviews


def _stop(*_: object) -> None:
    global _running
    _running = False


def purge_rate_limits(engine: Engine, keep_hours: int = RATE_LIMIT_KEEP_HOURS) -> int:
    """Deletes rate-limit windows that started more than `keep_hours` ago. Returns the number removed."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM rate_limit WHERE window_start < now() - make_interval(hours => :h)"),
            {"h": keep_hours},
        )
    return int(result.rowcount or 0)


def main(interval_s: int = 3600) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)
    url = os.environ.get("DATABASE_URL", "")
    engine = create_engine(url, pool_pre_ping=True) if url else None
    if engine is None:
        log.warning("DATABASE_URL is not set; no jobs will run")
    log.info("jobs worker started")
    next_run = 0.0
    while _running:
        if engine is not None and time.monotonic() >= next_run:
            try:
                log.info("rate_limit purge removed %d windows", purge_rate_limits(engine))
            except Exception:  # keep the worker alive; the next run retries
                log.exception("rate_limit purge failed")
            next_run = time.monotonic() + interval_s
        time.sleep(1)
    log.info("jobs worker stopped")


if __name__ == "__main__":
    main()
