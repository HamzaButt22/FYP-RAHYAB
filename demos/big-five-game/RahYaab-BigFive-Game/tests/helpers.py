"""Hand-written event streams for exact feature-formula tests."""


class Stream:
    def __init__(self):
        self.rows = []
        self.t = 0

    def add(self, event_type, level=None, action=None, dt=None, risk=None, advance=1000, **meta):
        self.t += advance
        self.rows.append({"event_id": len(self.rows), "session_id": "S", "level_id": level, "timestamp": "2026-10-06T15:00:00",
                          "t_ms": self.t, "event_type": event_type, "action": action, "decision_time_ms": dt,
                          "risk_level": risk, "metadata": meta})
        return self

    def resp(self, level, category, kind, dt=2000, **meta):
        return self.add("DECISION_RESPONSE", level, f"{kind}_x", dt=dt, category=category, chosen_kind=kind,
                        selection_changes=meta.pop("changes", 0), **meta)
