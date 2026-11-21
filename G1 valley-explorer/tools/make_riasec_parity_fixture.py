"""Generate RIASEC parity fixtures by running the ORIGINAL Python scorer (analytics/riasec_scoring.py).

Usage: python3 -I tools/make_riasec_parity_fixture.py <path-to-RahYaab-BigFive-Game_demo3> <out.json>
Level ids are strings in the TS config; the Python code expects integer level ids, so they are mapped
crossroads_caravan->2, career_workshop->4, park_mission->7 for the Python run only.
"""
import json, random, sys
from pathlib import Path

repo, out = Path(sys.argv[1]), Path(sys.argv[2])
sys.path.insert(0, str(repo))
from analytics.riasec_scoring import compute_riasec  # noqa: E402

here = Path(__file__).resolve().parent.parent
cfg = json.loads((here / "src/valley/core/riasec/riasec_config.json").read_text())
IDMAP = {"crossroads_caravan": 2, "career_workshop": 4, "park_mission": 7}
py_cfg = dict(cfg)
py_cfg["levels"] = {str(IDMAP[k]): v for k, v in cfg["levels"].items()}

TASKS = {
    "crossroads_caravan": ["wheel_workshop", "lantern_riddle", "mural_wall", "fireside_circle", "market_square", "ledger_tower"],
    "career_workshop": ["repair_pump", "plant_lab", "poster_studio", "teach_timetable", "open_day_stall", "sort_records"],
    "park_mission": ["park_repair", "park_survey", "park_design", "park_volunteers", "park_sponsors", "park_permits"],
}
ROLES = list(cfg["roles"])


def make_level(rng, lid):
    units = {}
    for tid in TASKS[lid]:
        sel = rng.choice([0, 0, 1, 2, 3, 4, 5, 6])
        if lid != "crossroads_caravan":
            sel = min(sel, 4)
        rounds = {}
        for r in range(min(sel, 3) if rng.random() < 0.85 else 0):
            rounds[r] = {"outcome": rng.choice(["completed", "completed", "abandoned"]),
                         "engaged_ms": rng.choice([None, rng.randint(2000, 60000)]), "expected_ms": rng.choice([None, 30000, 25000]),
                         "optional_taken": rng.randint(0, 2), "optional_total": rng.choice([0, 1, 2]), "hints": 0,
                         "bonus_taken": rng.random() < 0.3, "performance": rng.choice([None, round(rng.random(), 2)]),
                         "required_done": 3, "required_total": 3}
        units[tid] = {"task_id": tid, "selected_n": sel, "declined_n": 0, "optional_flag": rng.random() < 0.2, "via": None,
                      "revisit_n": rng.randint(0, 2), "looked": rng.random() < 0.3, "rounds": rounds, "bonus_taken": rng.random() < 0.2}
    votes = [rng.choice(ROLES) for _ in range(rng.randint(0, 3))] if lid == "park_mission" else []
    n = sum(u["selected_n"] for u in units.values())
    return {"level_id": lid, "units": units, "role_votes": votes, "completed": rng.random() < 0.8, "n_selections": n,
            "opportunities": TASKS[lid], "sequence": [], "descriptive": {}}


cases = []
rng = random.Random(20261115)
for _ in range(40):
    summ = {lid: make_level(rng, lid) for lid in TASKS if rng.random() < 0.85}
    py_in = {}
    for lid, s in summ.items():
        s2 = json.loads(json.dumps(s))
        s2["level_id"] = IDMAP[lid]
        for u in s2["units"].values():
            u["rounds"] = {int(k): v for k, v in u["rounds"].items()}
        py_in[IDMAP[lid]] = s2
    res = compute_riasec(py_in, cfg=py_cfg).to_dict()
    inv = {str(v): k for k, v in IDMAP.items()}
    cases.append({"input": summ, "expected": {
        "scores": res["scores"], "holland_code": res["holland_code"], "levels_used": [inv[str(l)] for l in res["levels_used"]],
        "level_scores": {inv[k]: v for k, v in res["level_scores"].items()}, "agreement": res["agreement"], "flat_profile": res["flat_profile"]}})
out.write_text(json.dumps(cases, indent=0))
print(f"wrote {len(cases)} cases")
