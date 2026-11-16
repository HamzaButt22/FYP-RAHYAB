#!/usr/bin/env python3
"""Local web server and append-only telemetry receiver for Arcade Career Explorer."""
from __future__ import annotations

import json
import math
import re
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
LOG_PATH = ROOT / "example_session_log.jsonl"
SESSION_DIR = ROOT / "sessions"
MAX_BODY_BYTES = 2_000_000
WRITE_LOCK = threading.Lock()
SESSION_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,80}$")


class ArcadeHandler(SimpleHTTPRequestHandler):
    """Serve the static game and receive its JSON session summaries."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler API
        if urlparse(self.path).path != "/api/telemetry":
            self.send_error(404, "Unknown API endpoint")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY_BYTES:
                self._json_response(413, {"error": "Payload size must be between 1 byte and 2 MB."})
                return
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("Payload must be a JSON object.")
            session_id = payload.get("session_id")
            events = payload.get("events")
            if not isinstance(session_id, str) or not SESSION_ID_RE.fullmatch(session_id):
                raise ValueError("session_id contains unsupported characters or is missing.")
            if not isinstance(events, list) or len(events) > 20_000 or any(not isinstance(e, dict) for e in events):
                raise ValueError("events must be an array of at most 20,000 JSON objects.")
            allowed_games = {"R", "I", "A", "S", "E", "C"}
            allowed_types = {"input", "error", "hint", "first_action", "kinematic_path"}
            for index, event in enumerate(events):
                progress = event.get("progress")
                if event.get("type") not in allowed_types or event.get("game") not in allowed_games:
                    raise ValueError(f"events[{index}] has an unsupported type or game.")
                if (not isinstance(progress, (int, float)) or isinstance(progress, bool)
                        or not math.isfinite(progress) or not 0 <= progress <= 1):
                    raise ValueError(f"events[{index}].progress must be a finite number from 0 to 1.")
                if not 0.15 <= progress <= 0.85:
                    raise ValueError(f"events[{index}] is outside the 15%-85% steady-state window.")
                for key in ("normalized_inter_input_delay", "normalized_recovery_delay",
                            "relative_first_action_delay", "path_deviation_index"):
                    value = event.get(key)
                    if value is not None and (not isinstance(value, (int, float)) or isinstance(value, bool)
                                              or not math.isfinite(value) or value < 0):
                        raise ValueError(f"events[{index}].{key} must be null or a finite non-negative number.")
            profile = payload.get("profile", {})
            if not isinstance(profile, dict):
                raise ValueError("profile must be a JSON object.")

            received = datetime.now(timezone.utc).isoformat()
            # Keep an event-per-line append-only JSONL stream for downstream feature extraction.
            rows = [
                {"session_id": session_id, "received_at": received, **event}
                for event in events
            ]
            session = {
                "schema_version": 1,
                "session_id": session_id,
                "received_at": received,
                "profile": profile,
                "events": events,
            }
            SESSION_DIR.mkdir(parents=True, exist_ok=True)
            with WRITE_LOCK:
                if rows:
                    with LOG_PATH.open("a", encoding="utf-8", newline="\n") as stream:
                        for row in rows:
                            stream.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
                        stream.flush()
                # Replace the per-session snapshot atomically so interrupted writes cannot leave half a JSON file.
                target = SESSION_DIR / f"session_{session_id}.json"
                temporary = target.with_suffix(".json.tmp")
                temporary.write_text(json.dumps(session, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                temporary.replace(target)
            self._json_response(201, {"ok": True, "session_id": session_id, "events_saved": len(events)})
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            self._json_response(400, {"error": str(exc)})
        except OSError as exc:
            self.log_error("Unable to persist telemetry: %s", exc)
            self._json_response(500, {"error": "The server could not save the session."})

    def _json_response(self, status: int, body: dict) -> None:
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, fmt: str, *args) -> None:
        # Keep normal request logging concise and avoid echoing submitted telemetry.
        super().log_message(fmt, *args)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Run Arcade Career Explorer on localhost.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: localhost only).")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), ArcadeHandler)
    print(f"Arcade Career Explorer: http://{args.host}:{args.port}/")
    print(f"Telemetry append log: {LOG_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
