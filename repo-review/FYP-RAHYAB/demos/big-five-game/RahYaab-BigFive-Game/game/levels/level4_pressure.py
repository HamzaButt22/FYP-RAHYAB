"""Level 4 - The Crumbling Vault (pressure and uncertainty).

A countdown is running. Three locked gates each offer an uncertain choice (scan the lock to get a noisy hint,
take a slow-but-safe bypass, or force the lock and gamble). A sweeping-laser corridor punishes bad timing, a
surprise tremor strikes mid-level, and running out of time fails the level (retry allowed).
Evidence recorded: decision latency under pressure, re-scans ("repeated checking"), option changes before confirming,
risky vs safe choices, failure responses / recovery time, erratic movement, reaction to the surprise event.
"""
from __future__ import annotations

import math

import pygame

from analytics.event_schema import (CAT_PRESSURE, CAT_REWARD, KIND_CHECK, KIND_RISKY, KIND_SAFE, EventType as E)
from game import settings as S
from game.input_state import InputState
from game.levels.base import FAILED, RUNNING, Level
from game.ui import widgets as W

TIME_LIMIT_S = 120.0
SCAN_COST_S = 3.0
SAFE_COST_S = 10.0
LOCKDOWN_COST_S = 15.0
LASER_COST_S = 5.0
TREMOR_AT_S = 30.0
TREMOR_COST_S = 5.0
TREMOR_LOCK_MS = 1000

CORRIDOR_TOP = pygame.Rect(250, 0, 430, 150)
CORRIDOR_BOTTOM = pygame.Rect(250, 450, 430, 154)
WALLS_X = (230, 700, 880)
GATE_P = [0.70, 0.50, 0.35]          # true probability that forcing the lock succeeds
BEAMS = [  # (slot x, width, period s, phase)
    (300, 70, 3.2, 0.0), (410, 70, 2.6, 1.5), (520, 70, 3.8, 3.0)]
EXIT_RECT = pygame.Rect(1030, 250, 60, 100)
CHEST_POS = (960, 400)
ENTRY_RESPAWN = (275, 300)


def gate_rects(i):
    x = WALLS_X[i]
    return (pygame.Rect(x, 0, 20, 250), pygame.Rect(x, 350, 20, 254), pygame.Rect(x, 250, 20, 100))


class PressureLevel(Level):
    level_id = 4
    name = "The Crumbling Vault"
    scenario = "pressure"
    objective = "Escape before the vault collapses! Three locked gates, a laser corridor, and the clock."
    task_name = "escape_vault"
    start_pos = (60, 300)

    def build(self) -> None:
        self.time_left = TIME_LIMIT_S
        self.level_ms = 0.0
        self.beam_t = 0.0
        self.beam_mult = 1.0
        self.gate_open = [False, False, False]
        self.gate_started = [False, False, False]
        self.scans = [0, 0, 0]
        self.hint = [None, None, None]
        self.tremor_done = False
        self.lock_ms = 0.0
        self.awaiting_reaction = False
        self.reaction_since = 0.0
        self.shake_ms = 0.0
        self.chest_used = False
        self.laser_hits = 0
        self.lockdowns = 0
        self.session.strategies.last = self.session.strategies.last

    def level_start_metadata(self) -> dict:
        return {"time_limit_s": TIME_LIMIT_S, "gates_total": 3, "tremor_at_s": TREMOR_AT_S}

    # ----------------------------------------------------------------- geometry
    def solids(self):
        s = [CORRIDOR_TOP, CORRIDOR_BOTTOM]
        for i in range(3):
            top, bottom, door = gate_rects(i)
            s += [top, bottom]
            if not self.gate_open[i]:
                s.append(door)
        return s

    def beam_rects(self):
        out = []
        for slot, w, period, phase in BEAMS:
            y = 300 + 125 * math.sin(2 * math.pi * self.beam_t / period + phase)
            out.append(pygame.Rect(slot, int(y) - 6, w, 12))
        return out

    # -------------------------------------------------------------------- timing
    def _tick(self, dt: float) -> None:
        self.level_ms += dt * 1000
        self.time_left -= dt
        self.beam_t += dt * self.beam_mult
        if self.shake_ms > 0:
            self.shake_ms -= dt * 1000
        if not self.tremor_done and self.level_ms >= TREMOR_AT_S * 1000:
            self.tremor_done = True
            self.time_left -= TREMOR_COST_S
            self.beam_mult = 1.35
            self.lock_ms = TREMOR_LOCK_MS
            self.shake_ms = 1300
            self.awaiting_reaction = True
            self.reaction_since = self.session.clock.ms + TREMOR_LOCK_MS
            self.log.log(E.ENV_EVENT, action="tremor", time_lost_s=TREMOR_COST_S, lock_ms=TREMOR_LOCK_MS,
                         time_left_s=round(self.time_left, 1))
            self.say("The vault shakes! Rocks fall... -5s and the lasers speed up!", 3000)
        if self.time_left <= 0 and self.status == RUNNING:
            self.time_left = 0.0
            self.log.log(E.FAILURE, action="time_expired", freeze_ms=0)
            self.fail("timeout", laser_hits=self.laser_hits, lockdowns=self.lockdowns, gates_open=sum(self.gate_open))

    def update(self, dt: float, inp: InputState) -> None:
        if self.status != RUNNING:
            return
        self._tick(dt)
        if self.status != RUNNING:
            return
        if self.lock_ms > 0:
            self.lock_ms -= dt * 1000
            self.elapsed_ms += dt * 1000
            return
        if self.awaiting_reaction and inp.any_input:
            self.awaiting_reaction = False
            self.log.log(E.PLAYER_INTERACTION, action="tremor_reaction", object_id="tremor", novel=False,
                         reaction_ms=round(max(0.0, self.session.clock.ms - self.reaction_since)))
        super().update(dt, inp)

    # -------------------------------------------------------------------- logic
    def on_update(self, dt: float, inp: InputState) -> None:
        if not self.player.frozen:
            pr = self.player.rect
            if any(pr.colliderect(b) for b in self.beam_rects()):
                self._laser_hit()
        for i in range(3):
            if not self.gate_open[i] and not self.gate_started[i]:
                top, bottom, door = gate_rects(i)
                if self.dist_to(door.center) < 95:
                    self.gate_started[i] = True
                    self.log.log(E.PLAYER_INTERACTION, action="approach_gate", object_id=f"gate{i + 1}", novel=False,
                                 time_left_s=round(self.time_left, 1))
                    self._gate_dialog(i)
                    return
        if EXIT_RECT.collidepoint(self.player.pos):
            self.complete(time_left_s=round(self.time_left, 1), laser_hits=self.laser_hits, lockdowns=self.lockdowns,
                          scans=sum(self.scans))

    def _laser_hit(self) -> None:
        self.laser_hits += 1
        self.time_left -= LASER_COST_S
        self.log.log(E.FAILURE, action="laser_hit", freeze_ms=1500, time_lost_s=LASER_COST_S, hits=self.laser_hits,
                     time_left_s=round(self.time_left, 1))
        self.player.freeze(1500)
        self.player.teleport(*ENTRY_RESPAWN)
        self.say("ZAP! Laser hit: -5 seconds.", 2200)

    def _gate_dialog(self, i: int) -> None:
        gid = f"gate{i + 1}"
        p = GATE_P[i]

        def reading() -> str:
            noise = self.rng.uniform(-0.15, 0.15)
            return f"{max(5, min(95, round(100 * (p + noise))))}%"

        def body() -> str:
            base = "A glowing console guards the next chamber. Forcing the lock could save time... or trigger an alarm."
            if self.hint[i]:
                base += f"\nScanner reading #{self.scans[i]}: forcing the lock looks about {self.hint[i]} safe."
            else:
                base += "\nYou have no scanner reading yet."
            return base

        def on_check(opt, dlg):
            self.scans[i] += 1
            self.time_left -= SCAN_COST_S
            self.hint[i] = reading()
            self.log.log(E.PLAYER_INTERACTION, action="scan" if self.scans[i] == 1 else "recheck",
                         object_id=gid, novel=False, n_scans=self.scans[i], hint=self.hint[i],
                         time_left_s=round(self.time_left, 1))
            dlg.set_body(body())

        def chosen(o):
            scanned = self.scans[i] > 0
            if o["kind"] == KIND_SAFE:
                self.time_left -= SAFE_COST_S
                self.log.log(E.PLAYER_INTERACTION, action="safe_bypass", object_id=gid, novel=False, time_lost_s=SAFE_COST_S)
                self.say(f"Safe bypass: -{int(SAFE_COST_S)} seconds.", 2200)
            else:
                ok = self.rng.random() < p
                self.log.log(E.RISK_ACTION, action="force_lock", risk_level=0.7, success=ok, p_success=p, gate_id=gid,
                             scans_before=self.scans[i])
                if ok:
                    self.say("Click! The lock gives way.", 2200)
                else:
                    self.lockdowns += 1
                    self.time_left -= LOCKDOWN_COST_S
                    self.log.log(E.FAILURE, action="gate_lockdown", freeze_ms=2000, time_lost_s=LOCKDOWN_COST_S, gate_id=gid,
                                 time_left_s=round(self.time_left, 1))
                    self.player.freeze(2000)
                    self.say("ALARM! Lockdown: -15 seconds.", 2600)
            self.gate_open[i] = True
            self.session.strategies.adopt(f"{'scan' if scanned else 'blind'}_{'safe' if o['kind'] == KIND_SAFE else 'risky'}",
                                          "vault_gate", level_id=4, gate_id=gid)

        opts = [
            {"key": "scan", "label": f"Scan the lock for a hint (-{int(SCAN_COST_S)}s each time)", "kind": KIND_CHECK, "risk_level": 0.0},
            {"key": "safe_bypass", "label": f"Take the safe bypass (-{int(SAFE_COST_S)}s guaranteed)", "kind": KIND_SAFE, "risk_level": 0.1},
            {"key": "force_lock", "label": f"Force the lock (success unknown; failure costs -{int(LOCKDOWN_COST_S)}s)", "kind": KIND_RISKY, "risk_level": 0.7},
        ]
        self.open_choice(f"l4_{gid}", CAT_PRESSURE, f"Gate {i + 1} of 3", body(), opts, chosen, on_check=on_check,
                         context={"gate_id": gid, "time_left_s": round(self.time_left, 1)},
                         footer="The countdown keeps running while you decide!")

    def on_interact(self) -> None:
        if not self.chest_used and self.dist_to(CHEST_POS) < 55:
            opts = [{"key": "gold_bars", "label": "Take the gold bars (40 points, sure thing)", "kind": KIND_SAFE, "risk_level": 0.0},
                    {"key": "sealed_relic", "label": "Open the sealed relic case (0 to 120 points)", "kind": KIND_RISKY, "risk_level": 0.6}]

            def chosen(o):
                self.chest_used = True
                gain = 40 if o["key"] == "gold_bars" else self.rng.choice([0, 20, 60, 120])
                self.log.log(E.REWARD_SELECTED, action=o["key"], chosen_kind=o["kind"], reward_value=gain, risk_level=o["risk_level"])
                if o["key"] == "sealed_relic":
                    self.log.log(E.RISK_ACTION, action="open_relic_case", risk_level=0.6, success=gain >= 60, p_success=0.5)
                self.session.coins += gain
                self.say(f"You secured {gain} points of treasure.", 2800)

            self.open_choice("l4_chest", CAT_REWARD, "Vault Treasure", "A glittering chest... but the ceiling is cracking.",
                             opts, chosen, footer="The countdown keeps running!")

    def on_end(self) -> None:
        pass

    # --------------------------------------------------------------------- draw
    def hud_extra(self):
        return [("time left", f"{max(0, math.ceil(self.time_left))}s")]

    def draw(self, screen: pygame.Surface) -> None:
        super().draw(screen)
        if self.shake_ms > 0:
            import random as _r
            dx, dy = _r.randint(-7, 7), _r.randint(-7, 7)
            copy = screen.copy()
            screen.fill(S.BG)
            screen.blit(copy, (dx, dy))
        if self.time_left < 20 and self.status == RUNNING:
            pulse = int(40 + 40 * math.sin(self.level_ms / 120))
            v = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
            pygame.draw.rect(v, (255, 40, 40, pulse), v.get_rect(), 14)
            screen.blit(v, (0, 0))

    def draw_world(self, world: pygame.Surface) -> None:
        world.blit(W.vertical_gradient((S.WORLD_W, S.WORLD_H), (34, 38, 56), (20, 22, 34)), (0, 0))
        for x in range(0, 1100, 55):
            pygame.draw.line(world, (42, 46, 66), (x, 0), (x, 604))
        for y in range(0, 604, 55):
            pygame.draw.line(world, (42, 46, 66), (0, y), (1100, y))
        for r in (CORRIDOR_TOP, CORRIDOR_BOTTOM):
            pygame.draw.rect(world, (64, 68, 92), r)
            pygame.draw.rect(world, (110, 114, 150), r, 3)
        for i in range(3):
            top, bottom, door = gate_rects(i)
            for r in (top, bottom):
                pygame.draw.rect(world, (64, 68, 92), r)
                pygame.draw.rect(world, (110, 114, 150), r, 3)
            if not self.gate_open[i]:
                pygame.draw.rect(world, (190, 60, 70), door)
                pygame.draw.rect(world, (255, 140, 140), door, 2)
                W.text(world, f"GATE {i + 1}", (door.centerx, door.y - 14), 22, S.TEXT, anchor="midbottom", bold=True)
            else:
                pygame.draw.rect(world, (52, 160, 110), door.inflate(-12, 0))
        for b in self.beam_rects():
            glow = pygame.Surface((b.w + 30, b.h + 30), pygame.SRCALPHA)
            pygame.draw.rect(glow, (255, 60, 60, 70), glow.get_rect(), border_radius=14)
            world.blit(glow, (b.x - 15, b.y - 15))
            pygame.draw.rect(world, (255, 70, 70), b, border_radius=5)
            pygame.draw.rect(world, (255, 220, 220), b.inflate(0, -6), border_radius=3)
        pygame.draw.rect(world, (70, 140, 100), EXIT_RECT, border_radius=8)
        pygame.draw.rect(world, S.ACCENT_2, EXIT_RECT, 3, border_radius=8)
        W.text(world, "EXIT", EXIT_RECT.center, 24, S.TEXT, anchor="center", bold=True)
        if not self.chest_used:
            r = pygame.Rect(0, 0, 40, 30)
            r.center = CHEST_POS
            pygame.draw.rect(world, (110, 80, 40), r, border_radius=4)
            pygame.draw.rect(world, S.GOLD, r, 3, border_radius=4)
        # countdown bar
        frac = max(0.0, self.time_left / TIME_LIMIT_S)
        col = S.ACCENT_2 if frac > 0.4 else (S.WARN if frac > 0.17 else S.DANGER)
        W.bar(world, (260, 10, 580, 18), frac, col)
        W.text(world, "VAULT COLLAPSE", (550, 38), 20, S.TEXT_DIM, anchor="midtop")

    def draw_overlay(self, world: pygame.Surface) -> None:
        if not self.chest_used and self.dist_to(CHEST_POS) < 55 and self.modal is None:
            W.key_hint(world, "E", (CHEST_POS[0] - 8, CHEST_POS[1] - 44), 24)
