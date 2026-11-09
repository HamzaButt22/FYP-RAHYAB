"""Pure-logic core for Career Expedition (no GUI). Importable and testable headlessly.

Contains: game content, telemetry Session, scoring (heuristic + trained-model hook),
calibration questionnaire, O*NET / fallback career matching, and a synthetic-player
simulator (for pipeline testing ONLY - never evidence of validity).
"""
import csv, json, math, os, random, time
from datetime import datetime

LETTERS = list("RIASEC")
NAMES = {"R": "Realistic", "I": "Investigative", "A": "Artistic",
         "S": "Social", "E": "Enterprising", "C": "Conventional"}
COLORS = {"R": "#d97706", "I": "#2563eb", "A": "#9333ea",
          "S": "#059669", "E": "#dc2626", "C": "#475569"}
TAGLINES = {
    "R": "Hands-on, practical work with tools, machines and materials",
    "I": "Questions, evidence, analysis and experiments",
    "A": "Originality, expression, design and open-ended creation",
    "S": "Helping, teaching, cooperating and understanding people",
    "E": "Leading, persuading, negotiating and taking initiative",
    "C": "Structure, accuracy, records and following procedures",
}

# ---------------------------------------------------------------- game content
# FAIRNESS: every decision step offers ONE option per RIASEC letter (6 options,
# shuffled each time). Every letter therefore has identical opportunity in every
# zone, so playing a zone cannot inflate that zone's letter.
def _s(prompt, R, I, A, S, E, C):
    return {"prompt": prompt, "options": {"R": R, "I": I, "A": A, "S": S, "E": E, "C": C}}

ZONES = [
    {"code": "R", "title": "Field Workshop", "blurb": "A stalled generator, a toolbox and a deadline.",
     "steps": [
        _s("A generator has stopped. What do you do first?",
           "Open the casing and handle the loose wiring myself",
           "Measure voltages to work out where the fault is",
           "Sketch a better-looking redesigned housing",
           "Gather the crew and ask how they are coping",
           "Decide who leads the repair and set a deadline",
           "Read the maintenance log and follow the checklist"),
        _s("Power is back. What next?",
           "Adjust and tune the machine until it runs smoothly",
           "Test why it failed in the first place",
           "Customize how it looks",
           "Show a new teammate how to fix it",
           "Pitch a plan to buy more generators",
           "Record the repair and file the paperwork")]},
    {"code": "I", "title": "Mystery Lab", "blurb": "A sensor reports a signal nobody can explain.",
     "steps": [
        _s("A sensor shows an unexplained signal. Your move?",
           "Build a quick rig to test the sensor physically",
           "Compare readings over time to find a pattern",
           "Turn the readings into a picture to see them differently",
           "Ask colleagues what they have seen before",
           "Call a decision meeting and take charge",
           "Log every reading in a tidy table"),
        _s("Two explanations fit the data. What now?",
           "Build a device that can tell them apart",
           "Design an experiment to separate them",
           "Imagine a third, unconventional explanation",
           "Discuss both with the team",
           "Back the likelier one and commit to it",
           "Follow the standard diagnostic procedure")]},
    {"code": "A", "title": "Design Studio", "blurb": "Create an identity for a brand-new project.",
     "steps": [
        _s("You are creating an identity for a new brand.",
           "Make a physical model of the logo from real materials",
           "Research why some designs work better than others",
           "Invent a bold original concept",
           "Ask the audience how the designs make them feel",
           "Pitch the concept to win the client",
           "Apply a consistent style guide"),
        _s("The first draft feels unfinished.",
           "Work the materials by hand until it feels right",
           "Test which version people notice more",
           "Throw it out and try something unexpected",
           "Co-create with a friend",
           "Set a deadline and ship it",
           "Tidy the alignment and spacing")]},
    {"code": "S", "title": "Community Hub", "blurb": "People nearby need help in different ways.",
     "steps": [
        _s("A new student is lost and embarrassed.",
           "Walk them to the room and show them around",
           "Ask questions to find out what exactly is confusing",
           "Draw them a friendly map",
           "Listen first and reassure them",
           "Organize other students to welcome them",
           "Hand them the schedule and the rules"),
        _s("A teammate cannot understand a task.",
           "Demonstrate it hands-on",
           "Break it into logical steps",
           "Explain it through a story or picture",
           "Teach patiently and check how they feel",
           "Motivate them with a clear goal",
           "Give them a step-by-step instruction sheet")]},
    {"code": "E", "title": "Startup Challenge", "blurb": "100 credits, one week, one big opportunity.",
     "steps": [
        _s("You have 100 credits and a week. Where does your effort go?",
           "Build the actual product",
           "Research the market",
           "Design the brand",
           "Build relationships with customers",
           "Pitch to win a big client",
           "Plan the budget and schedule carefully"),
        _s("A rival offers you a deal.",
           "Make a better product instead",
           "Analyse the terms in depth",
           "Counter with a creative proposal",
           "Look for a win-win arrangement",
           "Negotiate for a larger share",
           "Check every clause of the contract")]},
    {"code": "C", "title": "Operations Desk", "blurb": "A busy office with messy records.",
     "steps": [
        _s("The records are messy. How do you start?",
           "Set up the physical files and shelves",
           "Look for patterns in the errors",
           "Design a clearer layout",
           "Ask staff what slows them down",
           "Tackle the most urgent item first",
           "Sort by category, then date"),
        _s("The totals do not match.",
           "Handle the original paper documents to check",
           "Trace the source of the discrepancy",
           "Imagine a completely new system",
           "Talk to the clerk who entered the data",
           "Decide to escalate and fix it fast",
           "Check the totals line by line")]},
]
ZONE_BY_CODE = {z["code"]: z for z in ZONES}

# ---------------------------------------------------------------- telemetry
class Session:
    """Collects telemetry. `clock` is injectable so simulations can use fake time."""
    def __init__(self, pid, meta=None, clock=time.time):
        self.clock, self.pid, self.meta = clock, pid, meta or {}
        self.t0 = self.last = clock()
        self.events = []
        self.z = {L: dict(entries=0, dwell=0.0, enter_t=None, early_exits=0, completed=False,
                          bonus_attempts=0, bonus_successes=0, retries=0, last_failed=False)
                  for L in LETTERS}
        self.choices = {L: 0 for L in LETTERS}
        self.latencies, self.n_decisions, self.entry_order = [], 0, []

    def log(self, event, zone=None, action=None, evidence=None, points=None, extra=None):
        now = self.clock()
        rec = {"timestamp": datetime.fromtimestamp(now).isoformat(timespec="milliseconds"),
               "elapsed_s": round(now - self.t0, 3), "delta_s": round(now - self.last, 3),
               "event": event, "zone": zone, "action": action, "evidence": evidence,
               "riasec_points": points or {}, "extra": extra or {}}
        self.last = now
        self.events.append(rec)
        return rec

    def enter_zone(self, code):
        z = self.z[code]; z["entries"] += 1; z["enter_t"] = self.clock()
        if z["entries"] == 1: self.entry_order.append(code)
        self.log("zone_enter", code, "enter",
                 "voluntary return to a zone already visited" if z["entries"] > 1 else "voluntary first entry",
                 extra={"entry_number": z["entries"], "voluntary_return": z["entries"] > 1})

    def exit_zone(self, code, reason="back_to_hub"):
        z = self.z[code]
        if z["enter_t"] is None: return
        dwell = self.clock() - z["enter_t"]; z["dwell"] += dwell; z["enter_t"] = None
        if reason == "abandoned" and not z["completed"]: z["early_exits"] += 1
        self.log("zone_exit", code, reason, f"left zone ({reason})", extra={"dwell_s": round(dwell, 2)})

    def decision(self, code, step, letter, text, order, shown_t):
        lat = max(0.0, self.clock() - shown_t)
        self.latencies.append(lat); self.choices[letter] += 1; self.n_decisions += 1
        self.log("decision", code, text,
                 f"chose the {NAMES[letter]}-type option over 5 alternatives of other interest types",
                 {letter: 2}, {"step": step, "chosen_letter": letter, "option_order": order,
                               "chosen_position": order.index(letter), "latency_s": round(lat, 2)})

    def complete_zone(self, code):
        self.z[code]["completed"] = True
        self.log("zone_complete", code, "complete", "finished the zone's core decisions")

    def bonus_attempt(self, code, success, duration):
        z = self.z[code]; z["bonus_attempts"] += 1
        retry = z["last_failed"]
        if retry: z["retries"] += 1
        if success: z["bonus_successes"] += 1
        z["last_failed"] = not success
        self.log("bonus_attempt", code, "bonus", "voluntary optional challenge" +
                 (" (retry after failure = persistence)" if retry else ""),
                 extra={"success": success, "duration_s": round(duration, 2), "retry": retry,
                        "attempt_number": z["bonus_attempts"]})

    def summary(self):
        zs = {L: {k: (round(v, 3) if isinstance(v, float) else v) for k, v in z.items() if k != "enter_t"}
              for L, z in self.z.items()}
        return {"zones": zs, "choices": dict(self.choices), "latencies": [round(x, 2) for x in self.latencies],
                "n_decisions": self.n_decisions, "entry_order": self.entry_order,
                "duration_s": round(self.clock() - self.t0, 2)}

# ---------------------------------------------------------------- features & scoring
def feature_names():
    names = []
    for L in LETTERS:
        names += [f"{L}_choice_rate", f"{L}_dwell_share", f"{L}_returns", f"{L}_bonus_attempts", f"{L}_retries"]
    return names + ["mean_latency", "zones_visited", "early_exits"]

def features(summ):
    z, n = summ["zones"], max(1, summ["n_decisions"])
    tot_dwell = sum(z[L]["dwell"] for L in LETTERS) or 1.0
    f = {}
    for L in LETTERS:
        f[f"{L}_choice_rate"] = summ["choices"][L] / n
        f[f"{L}_dwell_share"] = z[L]["dwell"] / tot_dwell
        f[f"{L}_returns"] = max(0, z[L]["entries"] - 1)
        f[f"{L}_bonus_attempts"] = z[L]["bonus_attempts"]
        f[f"{L}_retries"] = z[L]["retries"]
    lat = summ["latencies"]
    f["mean_latency"] = sum(lat) / len(lat) if lat else 0.0
    f["zones_visited"] = sum(1 for L in LETTERS if z[L]["entries"] > 0)
    f["early_exits"] = sum(z[L]["early_exits"] for L in LETTERS)
    return f

# Heuristic weights are PLACEHOLDERS to be replaced by a trained model (see analysis/).
W_CHOICE, W_ENGAGE = 0.6, 0.4

def _code(scores):
    order = sorted(LETTERS, key=lambda L: (-scores[L], LETTERS.index(L)))
    return "".join(order[:3]), order

def heuristic_scores(summ):
    z, n = summ["zones"], max(1, summ["n_decisions"])
    max_dwell = max(z[L]["dwell"] for L in LETTERS) or 1.0
    scores, hw = {}, {}
    for L in LETTERS:
        p = summ["choices"][L] / n
        choice_idx = min(1.0, p / 0.5)                    # choosing a letter in half of all steps = max
        eng = [z[L]["dwell"] / max_dwell,                  # lingering
               min(max(0, z[L]["entries"] - 1), 2) / 2,    # voluntary returns
               min(z[L]["bonus_attempts"], 3) / 3,         # optional-task engagement
               min(z[L]["retries"], 2) / 2]                # persistence after failure
        engagement = sum(eng) / len(eng)
        scores[L] = round(100 * (W_CHOICE * choice_idx + W_ENGAGE * engagement), 1)
        se = math.sqrt(max(p * (1 - p), 0.02) / n)
        hw[L] = round(100 * W_CHOICE * 1.28 * se / 0.5 + 5, 1)
    code, order = _code(scores)
    return {"scores": scores, "interval": hw, "code": code, "order": order, "source": "heuristic"}

def load_model(path):
    try:
        with open(path, encoding="utf-8") as fh: return json.load(fh)
    except (OSError, ValueError):
        return None

def model_scores(model, summ):
    f = features(summ); names = model["features"]
    x = [(f[nm] - m) / (s or 1.0) for nm, m, s in zip(names, model["mean"], model["std"])]
    scores, hw = {}, {}
    for L in LETTERS:
        y = model["intercept"][L] + sum(c * v for c, v in zip(model["coef"][L], x))
        scores[L] = round(min(100.0, max(0.0, y)), 1)
        hw[L] = round(1.28 * model.get("resid_sd", {}).get(L, 15.0), 1)
    code, order = _code(scores)
    src = "trained model" + (" (SYNTHETIC DATA - pipeline test only)" if model.get("synthetic") else "")
    return {"scores": scores, "interval": hw, "code": code, "order": order, "source": src}

def profile(summ, model=None):
    return model_scores(model, summ) if model else heuristic_scores(summ)

# ---------------------------------------------------------------- calibration questionnaire
# ORIGINAL placeholder items (6 per scale). NOT the validated O*NET Interest Profiler.
# To use validated items, drop a questionnaire_override.json: [{"scale":"R","text":"..."}, ...]
_Q = {
 "R": ["Repair a bicycle or a small engine", "Build something with hand tools", "Operate machinery or heavy equipment",
       "Install electrical wiring", "Assemble furniture or equipment from parts", "Work outdoors with tools and materials"],
 "I": ["Conduct a science experiment", "Study how diseases spread", "Analyze data to find patterns",
       "Solve difficult logic puzzles", "Read about new scientific discoveries", "Investigate why a machine or program failed"],
 "A": ["Write a story or poem", "Design a poster or logo", "Play or compose music",
       "Act in a play", "Take and edit photographs", "Design the look of a room"],
 "S": ["Teach someone a new skill", "Help people work through personal problems", "Care for sick or injured people",
       "Volunteer at a community organization", "Work with children or older adults", "Lead a discussion so everyone takes part"],
 "E": ["Start my own business", "Persuade people to back an idea", "Lead a team toward a goal",
       "Negotiate a deal", "Run for a leadership position", "Give a persuasive presentation"],
 "C": ["Keep accurate financial records", "Organize files and data", "Check documents for errors",
       "Follow clear procedures to finish a task", "Use spreadsheets to track information", "Schedule and coordinate appointments"],
}
def load_questionnaire(base_dir):
    p = os.path.join(base_dir, "questionnaire_override.json")
    try:
        with open(p, encoding="utf-8") as fh:
            items = json.load(fh)
        return [(i["scale"], i["text"]) for i in items], "validated override file"
    except (OSError, ValueError, KeyError):
        return [(L, _Q[L][k]) for k in range(6) for L in LETTERS], "original placeholder items (NOT validated)"

def score_questionnaire(items, answers):
    """answers: {index: 1..5}. Returns {L: 0..100}."""
    out = {}
    for L in LETTERS:
        vals = [answers[i] for i, (s, _) in enumerate(items) if s == L and i in answers]
        out[L] = round((sum(vals) / len(vals) - 1) / 4 * 100, 1) if vals else None
    return out

# ---------------------------------------------------------------- careers
# Illustrative fallback table: values (1-7, RIASEC order) are AUTHORED APPROXIMATIONS, NOT O*NET DATA.
_FALLBACK = {
 "Mechanical Engineer": (6.5, 5.5, 3, 2, 3.5, 3.5), "Civil Engineer": (6.2, 5.2, 2.8, 2.5, 4, 4),
 "Electrician": (6.8, 3.5, 1.8, 2.5, 3, 4), "Automotive Technician": (6.8, 3.8, 1.8, 2.5, 3, 3.5),
 "Surveying Technician": (6, 3.8, 2, 2.5, 3, 4.5), "Industrial Designer": (5, 4.5, 6, 2.5, 3.5, 3),
 "Data Analyst": (2.5, 6.2, 2.5, 2.5, 3.5, 5.2), "Research Scientist": (3.5, 6.8, 3, 2.8, 2.5, 3.2),
 "Software Developer": (2.8, 6, 3, 2.5, 3.2, 4.5), "Laboratory Technologist": (4.5, 6, 2, 3, 2.5, 4.5),
 "Economist": (1.8, 6.2, 2.5, 2.8, 4.5, 5), "Cybersecurity Analyst": (3.5, 6, 2, 2.5, 3.5, 5),
 "Graphic Designer": (2.5, 3, 6.8, 2.8, 3.8, 3.5), "UX Designer": (2.5, 5, 6.2, 4, 3.8, 3.5),
 "Writer": (1.8, 3.8, 6.8, 3.5, 3.2, 3), "Animator": (3, 3.5, 6.5, 2.5, 3, 3.5),
 "Architect": (4.5, 5, 6.2, 3, 4, 3.8), "Teacher": (2, 3.5, 4.5, 6.5, 4, 4),
 "Counselor": (1.8, 4.2, 4, 6.8, 3.8, 3.2), "Nurse": (3.5, 4.8, 2.5, 6.5, 3.5, 4),
 "Social Worker": (1.8, 3.8, 3, 6.8, 4, 4), "HR Specialist": (1.8, 3, 3, 5.5, 5.5, 5.2),
 "Occupational Therapist": (3.8, 4.5, 3.5, 6.5, 3, 3.8), "Entrepreneur": (3, 4, 4, 3.5, 6.8, 4),
 "Sales Manager": (2, 3, 2.8, 4.5, 6.8, 4.8), "Marketing Specialist": (1.8, 4, 5, 4, 6, 4.5),
 "Project Manager": (2.8, 4, 2.8, 4.5, 6.2, 5.5), "Real Estate Agent": (2, 3, 3, 4.5, 6.5, 4.8),
 "Accountant": (1.8, 4, 1.8, 2.5, 4.2, 6.8), "Financial Analyst": (1.8, 5, 2, 2.5, 5.2, 6.2),
 "Compliance Officer": (1.8, 4.2, 2, 3.5, 4.8, 6.5), "Records Manager": (2, 3, 2, 3, 3.8, 6.8),
}

def _occ_code(vec):
    return "".join(sorted(LETTERS, key=lambda L: (-vec[L], LETTERS.index(L)))[:3])

def load_occupations(onet_dir):
    """Reads O*NET 'Interests.txt' (+ optional 'Occupation Data.txt') if present in onet_dir."""
    ip = os.path.join(onet_dir, "Interests.txt")
    if os.path.exists(ip):
        titles = {}
        op = os.path.join(onet_dir, "Occupation Data.txt")
        if os.path.exists(op):
            with open(op, encoding="utf-8", newline="") as fh:
                for r in csv.DictReader(fh, delimiter="\t"):
                    titles[r["O*NET-SOC Code"]] = r["Title"]
        vecs = {}
        by_name = {v: k for k, v in NAMES.items()}
        with open(ip, encoding="utf-8", newline="") as fh:
            for r in csv.DictReader(fh, delimiter="\t"):
                if r.get("Scale ID") == "OI" and r.get("Element Name") in by_name:
                    vecs.setdefault(r["O*NET-SOC Code"], {})[by_name[r["Element Name"]]] = float(r["Data Value"])
        occ = [{"title": titles.get(c, c), "vec": v, "code": _occ_code(v)} for c, v in vecs.items() if len(v) == 6]
        if occ: return occ, f"O*NET Interests file ({len(occ)} occupations)"
    occ = [{"title": t, "vec": dict(zip(LETTERS, v)), "code": _occ_code(dict(zip(LETTERS, v)))} for t, v in _FALLBACK.items()]
    return occ, "ILLUSTRATIVE built-in table (not O*NET data) - add O*NET Interests.txt to the onet/ folder"

def pearson(a, b):
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den if den else 0.0

def match_careers(scores, occupations, n=8):
    p = [scores[L] for L in LETTERS]
    ranked = sorted(((pearson(p, [o["vec"][L] for L in LETTERS]), o) for o in occupations), key=lambda t: -t[0])
    return [(o["title"], round(s, 2), o["code"]) for s, o in ranked[:n]]

# ---------------------------------------------------------------- synthetic players (PIPELINE TESTING ONLY)
def random_true_profile(rng):
    u = [rng.random() for _ in range(6)]
    v = [0.5 * u[k] + 0.25 * (u[k - 1] + u[(k + 1) % 6]) for k in range(6)]   # adjacent scales correlate
    lo, hi = min(v), max(v)
    return {L: 100 * (x - lo) / ((hi - lo) or 1) for L, x in zip(LETTERS, v)}

def simulate_session(true, rng, pid="synthetic"):
    t = [0.0]
    s = Session(pid, {"synthetic": True}, clock=lambda: t[0])
    def adv(a, b): t[0] += rng.uniform(a, b)
    wts = [math.exp(true[L] / 25) for L in LETTERS]
    first = rng.choices(LETTERS, wts, k=1)[0]
    rest = [L for L in LETTERS if L != first]
    rng.shuffle(rest)
    order = [first] + rest
    for code in order:
        s.enter_zone(code)
        for i, step in enumerate(ZONE_BY_CODE[code]["steps"]):
            shown = t[0]; adv(2, 6)
            letters = list(LETTERS); rng.shuffle(letters)
            pick = rng.choices(letters, [math.exp(true[L] / 12) for L in letters], k=1)[0]
            s.decision(code, i, pick, "sim", letters, shown)
        s.complete_zone(code)
        if rng.random() < 0.25 + true[code] / 150:
            for _ in range(rng.randint(1, 3)):
                adv(3, 8); s.bonus_attempt(code, rng.random() < 0.5, 5.0)
                if rng.random() > 0.3 + true[code] / 200: break
        adv(1, 4 + true[code] / 10)
        s.exit_zone(code)
        if rng.random() < true[code] / 220:
            s.enter_zone(code); adv(2, 6); s.exit_zone(code)
    return s
