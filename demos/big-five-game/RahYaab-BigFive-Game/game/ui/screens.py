"""All non-gameplay screens: menu, name entry, briefing, instructions, level intro/outcome, pause,
processing, personality results and telemetry analytics."""
from __future__ import annotations

import math

import pygame

from analytics.personality_scoring import TRAIT_LABELS, TRAITS
from game import settings as S
from game.ui import widgets as W

INSTRUCTION_PAGES = 3
LEVEL_BLURB = {
    1: "Scenario 1 of 4  -  Exploration",
    2: "Scenario 2 of 4  -  Planning with limited resources",
    3: "Scenario 3 of 4  -  Social interaction",
    4: "Scenario 4 of 4  -  Pressure and uncertainty",
}
LABEL_COLORS = {"Low": (148, 163, 184), "Moderate": (251, 191, 36), "High": (52, 211, 153)}


def _backdrop(surf, app, tint=(22, 30, 60)):
    surf.blit(W.vertical_gradient((S.SCREEN_W, S.SCREEN_H), tint, (10, 12, 22)), (0, 0))
    t = app.frame / 60.0
    for i in range(26):
        x = (i * 173 + t * (6 + i % 5)) % S.SCREEN_W
        y = (i * 97 + 40 * math.sin(t / 2 + i)) % S.SCREEN_H
        pygame.draw.circle(surf, (60, 80, 140), (int(x), int(y)), 2 + i % 3)


def draw(surf: pygame.Surface, app) -> None:
    fn = globals().get(f"draw_{app.state}")
    if fn is None:
        raise RuntimeError(f"no screen for state {app.state!r}")
    fn(surf, app)


# ------------------------------------------------------------------------- menus
def draw_menu(surf, app):
    _backdrop(surf, app)
    W.text(surf, "RahYaab", (S.SCREEN_W // 2, 130), 120, S.TEXT, anchor="center", bold=True)
    W.text(surf, "Behavioral Personality Assessment Game", (S.SCREEN_W // 2, 205), 40, S.ACCENT, anchor="center")
    W.text(surf, "Play four short scenarios. Your behavior - not a questionnaire - is the evidence.",
           (S.SCREEN_W // 2, 245), 26, S.TEXT_DIM, anchor="center")
    from game.app import MENU_ITEMS
    for i, item in enumerate(MENU_ITEMS):
        r = pygame.Rect(0, 0, 460, 62)
        r.center = (S.SCREEN_W // 2, 340 + i * 80)
        sel = i == app.menu_index
        W.panel(surf, r, S.PANEL_LIGHT if sel else S.PANEL, S.ACCENT if sel else None, 14)
        W.text(surf, item, r.center, 36, S.TEXT if sel else S.TEXT_DIM, anchor="center", bold=sel)
    W.text(surf, "Up / Down + Enter", (S.SCREEN_W // 2, 600), 24, S.TEXT_DIM, anchor="center")
    W.text(surf, "Prototype scoring - behavioral indicators, not a validated psychometric test.",
           (S.SCREEN_W // 2, 660), 22, (120, 130, 160), anchor="center")


def draw_name(surf, app):
    _backdrop(surf, app)
    W.text(surf, "New Assessment", (S.SCREEN_W // 2, 160), 64, S.TEXT, anchor="center", bold=True)
    W.text(surf, "Enter a name or nickname for this session", (S.SCREEN_W // 2, 240), 30, S.TEXT_DIM, anchor="center")
    r = pygame.Rect(0, 0, 560, 70)
    r.center = (S.SCREEN_W // 2, 330)
    W.panel(surf, r, S.PANEL, S.ACCENT, 14)
    cursor = "_" if (app.frame // 30) % 2 == 0 else " "
    W.text(surf, app.name_text + cursor, r.center, 42, S.TEXT, anchor="center")
    W.text(surf, "Press Enter to continue  -  Esc to go back", (S.SCREEN_W // 2, 420), 24, S.TEXT_DIM, anchor="center")
    W.text(surf, "Only this name and your in-game actions are stored (locally, in the project database).",
           (S.SCREEN_W // 2, 600), 22, (120, 130, 160), anchor="center")


def draw_briefing(surf, app):
    _backdrop(surf, app)
    W.text(surf, f"Welcome, {app.session.player_name}!", (S.SCREEN_W // 2, 110), 58, S.TEXT, anchor="center", bold=True)
    box = pygame.Rect(150, 170, 800, 400)
    W.panel(surf, box, S.PANEL, S.ACCENT, 16)
    y = box.y + 24
    y = W.paragraph(surf, "You are about to play 4 short game levels (about 8-12 minutes). There are no right or wrong "
                    "answers - just play the way that feels natural to you.", (box.x + 30, y), 28, 740, S.TEXT) + 14
    for line in ("What the game records: movement, choices, timing, retries and mistakes (telemetry).",
                 "What happens next: the telemetry becomes behavioral features, then an estimated Big Five profile.",
                 "Important: this is a prototype. The result is a set of behavioral indicators, not a diagnosis."):
        pygame.draw.circle(surf, S.ACCENT, (box.x + 38, y + 11), 4)
        y = W.paragraph(surf, line, (box.x + 56, y), 25, 700, S.TEXT_DIM) + 8
    W.text(surf, "Controls:  Move WASD / Arrow keys     Interact  E or Space     Choose  Up/Down + Enter or number     Pause  P",
           (S.SCREEN_W // 2, 520), 24, S.WARN, anchor="center")
    W.text(surf, "Press Enter to begin Level 1", (S.SCREEN_W // 2, 625), 34, S.ACCENT_2, anchor="center", bold=True)


def draw_instructions(surf, app):
    _backdrop(surf, app)
    W.text(surf, "Instructions", (S.SCREEN_W // 2, 70), 64, S.TEXT, anchor="center", bold=True)
    pages = [
        ("How to play", [
            "Move your character with WASD or the arrow keys.",
            "Press E or Space next to objects, villagers and stations to interact.",
            "When a choice appears, use Up/Down and Enter - or press the option's number.",
            "Press P at any time to pause. Nothing is timed while the game is paused.",
            "There are 4 levels. If you fail a level you can try again (up to 3 attempts) or move on.",
        ]),
        ("The four scenarios", [
            "1. The Whispering Valley - an open valley with a marked road and many optional places.",
            "2. The Workshop - fill orders from a limited stock of materials.",
            "3. Harbor Village - villagers who might ask for help, or wait for you to talk.",
            "4. The Crumbling Vault - a countdown, uncertain locks and a laser corridor.",
            "No question ever asks about your personality: your choices are the data.",
        ]),
        ("What is recorded and how it is used", [
            "Every meaningful action becomes a telemetry event stored in a local SQLite database.",
            "After level 4 the game automatically cleans the telemetry and calculates behavioral features.",
            "A transparent weighted model turns those features into 0-100 Big Five (OCEAN) indicators.",
            "The weights are prototype assumptions - NOT a validated psychometric instrument.",
            "Open the dashboard (python run.py) to inspect the raw telemetry and the results.",
        ]),
    ]
    title, lines = pages[app.instr_page]
    box = pygame.Rect(120, 130, 860, 440)
    W.panel(surf, box, S.PANEL, S.ACCENT, 16)
    W.text(surf, title, (box.x + 30, box.y + 22), 44, S.ACCENT, bold=True)
    y = box.y + 90
    for ln in lines:
        pygame.draw.circle(surf, S.ACCENT_2, (box.x + 40, y + 12), 5)
        y = W.paragraph(surf, ln, (box.x + 62, y), 28, 760, S.TEXT) + 14
    W.text(surf, f"Page {app.instr_page + 1} / {INSTRUCTION_PAGES}", (S.SCREEN_W // 2, 600), 26, S.TEXT_DIM, anchor="center")
    W.text(surf, "Left / Right to turn pages, Enter to continue, Esc for the menu", (S.SCREEN_W // 2, 640), 24, S.TEXT_DIM, anchor="center")


# ------------------------------------------------------------------ level screens
def draw_intro(surf, app):
    from game.app import INTRO_TEXT, LEVELS
    _backdrop(surf, app, (30, 36, 70))
    cls = LEVELS[app.level_idx]
    W.text(surf, LEVEL_BLURB[cls.level_id], (S.SCREEN_W // 2, 120), 30, S.ACCENT, anchor="center")
    W.text(surf, cls.name, (S.SCREEN_W // 2, 190), 82, S.TEXT, anchor="center", bold=True)
    box = pygame.Rect(0, 0, 820, 200)
    box.center = (S.SCREEN_W // 2, 360)
    W.panel(surf, box, S.PANEL, None, 16)
    W.paragraph(surf, INTRO_TEXT[cls.level_id], (box.x + 30, box.y + 28), 30, 760, S.TEXT)
    W.text(surf, "Objective: " + cls.objective, (S.SCREEN_W // 2, 520), 26, S.WARN, anchor="center")
    W.text(surf, cls.controls_hint, (S.SCREEN_W // 2, 560), 24, S.TEXT_DIM, anchor="center")
    W.text(surf, "Press Enter to start", (S.SCREEN_W // 2, 630), 36, S.ACCENT_2, anchor="center", bold=True)


def draw_play(surf, app):
    app.level.draw(surf)


def draw_paused(surf, app):
    if app.level is not None:
        app.level.draw(surf)
    shade = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
    shade.fill((6, 8, 16, 200))
    surf.blit(shade, (0, 0))
    from game.app import PAUSE_ITEMS
    W.text(surf, "PAUSED", (S.SCREEN_W // 2, 200), 90, S.TEXT, anchor="center", bold=True)
    for i, item in enumerate(PAUSE_ITEMS):
        r = pygame.Rect(0, 0, 560, 60)
        r.center = (S.SCREEN_W // 2, 340 + i * 80)
        sel = i == app.pause_index
        W.panel(surf, r, S.PANEL_LIGHT if sel else S.PANEL, S.ACCENT if sel else None, 14)
        W.text(surf, item, r.center, 30, S.TEXT, anchor="center")
    W.text(surf, "The game clock is stopped while paused.", (S.SCREEN_W // 2, 540), 24, S.TEXT_DIM, anchor="center")


def draw_outcome(surf, app):
    app.level.draw(surf)
    shade = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
    shade.fill((6, 8, 16, 205))
    surf.blit(shade, (0, 0))
    lvl = app.level
    ok = lvl.status == "complete"
    box = pygame.Rect(0, 0, 780, 430)
    box.center = (S.SCREEN_W // 2, S.SCREEN_H // 2)
    W.panel(surf, box, S.PANEL, S.ACCENT_2 if ok else S.DANGER, 18)
    W.text(surf, "LEVEL COMPLETE" if ok else "LEVEL FAILED", (box.centerx, box.y + 60), 64,
           S.ACCENT_2 if ok else S.DANGER, anchor="center", bold=True)
    W.text(surf, lvl.name, (box.centerx, box.y + 110), 34, S.TEXT, anchor="center")
    if not ok:
        reasons = {"quota_missed": "You delivered less than the 100-coin quota.",
                   "timeout": "The vault collapsed before you got out."}
        W.paragraph(surf, reasons.get(lvl.fail_reason, "Something went wrong."), (box.x + 60, box.y + 150), 28, 660, S.TEXT_DIM)
    else:
        W.text(surf, f"Time on this attempt: {lvl.elapsed_ms / 1000:.0f}s", (box.centerx, box.y + 165), 28, S.TEXT_DIM, anchor="center")
    opts = app._outcome_options()
    for i, o in enumerate(opts):
        r = pygame.Rect(box.x + 120, box.y + 230 + i * 68, box.w - 240, 56)
        sel = i == app.outcome_index
        W.panel(surf, r, S.PANEL_LIGHT if sel else (36, 42, 64), S.ACCENT if sel else None, 12)
        W.text(surf, f"{i + 1}.  {o}", r.center, 30, S.TEXT, anchor="center")
    if not ok and app.attempt < S.MAX_ATTEMPTS:
        W.text(surf, f"Attempt {app.attempt} of {S.MAX_ATTEMPTS}", (box.centerx, box.bottom - 24), 22, S.TEXT_DIM, anchor="center")


def draw_processing(surf, app):
    _backdrop(surf, app, (24, 40, 70))
    W.text(surf, "Assessment complete", (S.SCREEN_W // 2, 180), 70, S.TEXT, anchor="center", bold=True)
    steps = ["Raw telemetry stored", "Cleaning events", "Extracting behavioral features",
             "Estimating Big Five indicators", "Building your report"]
    shown = min(len(steps), 1 + app.processing_frames // 12)
    for i in range(shown):
        done = i < shown - 1 or app.processing_frames > 60
        pygame.draw.circle(surf, S.ACCENT_2 if done else S.WARN, (360, 300 + i * 52), 10)
        W.text(surf, steps[i], (390, 300 + i * 52), 34, S.TEXT, anchor="midleft")
    n = app.output.summary.get("total_events", 0) if app.output else 0
    W.text(surf, f"{n} telemetry events processed", (S.SCREEN_W // 2, 610), 28, S.TEXT_DIM, anchor="center")


# --------------------------------------------------------------------------- results
def draw_results(surf, app):
    out = app.output
    pred = out.prediction
    _backdrop(surf, app, (20, 28, 56))
    W.text(surf, "YOUR PERSONALITY PROFILE", (40, 24), 52, S.TEXT, bold=True)
    W.text(surf, f"{app.session.player_name if app.session else ''}   -   estimated from your gameplay behavior (prototype model)",
           (42, 74), 24, S.TEXT_DIM)
    y = 124
    for i, t in enumerate(TRAITS):
        sel = i == app.result_trait
        r = pygame.Rect(30, y - 6, 500, 86)
        if sel:
            W.panel(surf, r, S.PANEL_LIGHT, S.TRAIT_COLORS[t], 12)
        W.text(surf, TRAIT_LABELS[t], (46, y + 2), 30, S.TEXT, bold=sel)
        W.text(surf, f"{pred.scores[t]:.0f}", (410, y), 40, S.TRAIT_COLORS[t], anchor="topright", bold=True)
        W.text(surf, pred.labels[t], (506, y + 8), 24, LABEL_COLORS[pred.labels[t]], anchor="topright", bold=True)
        blocks = 20
        filled = round(pred.scores[t] / 100 * blocks)
        for b in range(blocks):
            br = pygame.Rect(46 + b * 23, y + 44, 19, 20)
            pygame.draw.rect(surf, S.TRAIT_COLORS[t] if b < filled else (36, 42, 62), br, border_radius=3)
        y += 94
    # evidence panel
    t = TRAITS[app.result_trait]
    ev = out.evidence[t]
    box = pygame.Rect(560, 118, 510, 480)
    W.panel(surf, box, S.PANEL, S.TRAIT_COLORS[t], 16)
    W.text(surf, f"{ev['trait']}: {ev['label']}", (box.x + 24, box.y + 18), 40, S.TRAIT_COLORS[t], bold=True)
    yy = W.paragraph(surf, ev["headline"], (box.x + 24, box.y + 66), 26, 460, S.TEXT) + 8
    W.text(surf, "Observed behavioral indicators:", (box.x + 24, yy), 24, S.TEXT_DIM, bold=True)
    yy += 30
    for line in ev["indicators"] or ["(no relevant behavior was recorded)"]:
        pygame.draw.circle(surf, S.TRAIT_COLORS[t], (box.x + 32, yy + 9), 4)
        yy = W.paragraph(surf, line, (box.x + 48, yy), 23, 440, S.TEXT, 1) + 5
    cov = f"Evidence coverage {round(ev['coverage'] * 100)}%  |  confidence: {ev['confidence']}"
    W.text(surf, cov, (box.x + 24, box.bottom - 78), 21, S.TEXT_DIM)
    W.paragraph(surf, ev["caveat"], (box.x + 24, box.bottom - 54), 20, 465, (160, 150, 120), 0)
    W.text(surf, "PROTOTYPE SCORING: weights are design assumptions, not a validated psychometric model.", (40, 612), 21, S.WARN)
    W.text(surf, "Scores summarise behavior in this one session; they are not a diagnosis.", (40, 636), 21, (140, 150, 180))
    hint = "Up/Down: choose trait    Enter: telemetry analytics    X: save report (JSON)    M: main menu"
    W.text(surf, hint, (S.SCREEN_W // 2, 676), 22, S.TEXT_DIM, anchor="center")
    if app.saved_report:
        W.text(surf, f"Saved: {app.saved_report.name}", (S.SCREEN_W - 40, 24), 22, S.ACCENT_2, anchor="topright")


def _fmt_pct(v):
    return "n/a" if v is None else f"{round(v * 100)}%"


def draw_analytics(surf, app):
    out = app.output
    sm = out.summary
    _backdrop(surf, app, (20, 28, 56))
    W.text(surf, "TELEMETRY ANALYTICS", (40, 24), 52, S.TEXT, bold=True)
    W.text(surf, f"Session {app.session.session_id}   -   {sm['total_events']} events stored in the database",
           (42, 76), 24, S.TEXT_DIM)
    mins, secs = divmod(int(sm["total_play_time_s"]), 60)
    tiles = [
        ("Total play time", f"{mins}:{secs:02d}"), ("Levels completed", f"{sm['levels_completed']} / 4"),
        ("Decisions made", str(sm["decisions_made"])),
        ("Avg decision time", "n/a" if sm["average_decision_time_s"] is None else f"{sm['average_decision_time_s']:.1f}s"),
        ("Exploration rate", _fmt_pct(sm["exploration_rate"])), ("Risk-taking rate", _fmt_pct(sm["risk_taking_rate"])),
        ("Helping rate", _fmt_pct(sm["helping_rate"])), ("Retry rate", _fmt_pct(sm["retry_rate"])),
        ("Strategy changes", str(sm["strategy_changes"])), ("Errors", str(sm["errors"])),
    ]
    for i, (label, value) in enumerate(tiles):
        col, row = i % 5, i // 5
        r = pygame.Rect(40 + col * 204, 124 + row * 124, 192, 110)
        W.panel(surf, r, S.PANEL, None, 14)
        W.text(surf, value, (r.centerx, r.y + 44), 48, S.ACCENT, anchor="center", bold=True)
        W.text(surf, label, (r.centerx, r.y + 84), 22, S.TEXT_DIM, anchor="center")
    # per level durations
    W.text(surf, "Time per level attempt", (40, 388), 28, S.TEXT, bold=True)
    y = 424
    for lv in out.levels[:8]:
        outcome = {"complete": "completed", "failed": "failed", "unfinished": "unfinished"}[lv["outcome"]]
        col = S.ACCENT_2 if lv["outcome"] == "complete" else S.DANGER
        W.text(surf, f"Level {lv['level_id']}", (40, y), 24, S.TEXT)
        W.text(surf, f"{lv['duration_s']:.0f}s", (140, y), 24, S.TEXT_DIM)
        W.text(surf, outcome, (210, y), 24, col)
        y += 28
    # event type distribution
    counts = out.events["event_type"].value_counts().head(8)
    W.text(surf, "Most frequent events", (520, 388), 28, S.TEXT, bold=True)
    mx = max(1, int(counts.max())) if len(counts) else 1
    for i, (k, v) in enumerate(counts.items()):
        yy = 424 + i * 28
        W.text(surf, k, (520, yy), 22, S.TEXT_DIM)
        W.bar(surf, (760, yy + 2, 240, 18), v / mx, S.ACCENT, radius=5)
        W.text(surf, str(int(v)), (1010, yy), 22, S.TEXT)
    W.text(surf, f"Database: {app.repo.db_path}", (40, 650), 20, (120, 130, 160))
    W.text(surf, "Enter: back to results    X: save report (JSON)    M: main menu", (S.SCREEN_W // 2, 676), 22, S.TEXT_DIM, anchor="center")
    if app.saved_report:
        W.text(surf, f"Saved: {app.saved_report.name}", (S.SCREEN_W - 40, 24), 22, S.ACCENT_2, anchor="topright")
