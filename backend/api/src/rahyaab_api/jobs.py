"""Background jobs worker (`python -m rahyaab_api.jobs`).

Jobs to add as they are built: retention and deletion, monthly partitions (owner role), rescoring,
O*NET cache refresh, nightly encrypted backup. Until then the worker only stays alive and logs.
"""

import logging
import signal
import time

log = logging.getLogger("rahyaab.jobs")
_running = True


def _stop(*_: object) -> None:
    global _running
    _running = False


def main(interval_s: int = 3600) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)
    log.info("jobs worker started (no jobs registered yet)")
    while _running:
        time.sleep(1 if interval_s <= 0 else min(interval_s, 5))
    log.info("jobs worker stopped")


if __name__ == "__main__":
    main()
