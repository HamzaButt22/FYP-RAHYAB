/**
 * Level 4 - The Crumbling Vault (pressure and uncertainty). Port of game/levels/level4_pressure.py.
 *
 * A countdown runs (also while a gate dialog is open). Three gates offer: scan for a noisy hint, a slow-but-safe
 * bypass, or forcing the lock. A sweeping-laser corridor, a surprise tremor and a timeout failure (retry allowed).
 */
import { ChoiceDialog } from '../game-engine/dialogs';
import { CAT_PRESSURE, CAT_REWARD, EventType as E, KIND_CHECK, KIND_RISKY, KIND_SAFE } from '../game-engine/events';
import { anyInput, InputState } from '../game-engine/input';
import { HudItem, Level, RUNNING } from '../game-engine/level-base';
import { DecisionOption, Kw } from '../game-engine/logger';
import { pyRound, pyRoundInt } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';

export const TIME_LIMIT_S = 120.0;
export const SCAN_COST_S = 3.0;
export const SAFE_COST_S = 10.0;
export const LOCKDOWN_COST_S = 15.0;
export const LASER_COST_S = 5.0;
export const TREMOR_AT_S = 30.0;
export const TREMOR_COST_S = 5.0;
export const TREMOR_LOCK_MS = 1000;

export const CORRIDOR_TOP = R(250, 0, 430, 150);
export const CORRIDOR_BOTTOM = R(250, 450, 430, 154);
export const WALLS_X = [230, 700, 880];
export const GATE_P = [0.7, 0.5, 0.35];
/** (slot x, width, period s, phase) */
export const BEAMS: [number, number, number, number][] = [
  [300, 70, 3.2, 0.0],
  [410, 70, 2.6, 1.5],
  [520, 70, 3.8, 3.0],
];
export const EXIT_RECT = R(1030, 250, 60, 100);
export const CHEST_POS: [number, number] = [960, 400];
export const ENTRY_RESPAWN: [number, number] = [275, 300];

export function gateRects(i: number): [Rect, Rect, Rect] {
  const x = WALLS_X[i];
  return [R(x, 0, 20, 250), R(x, 350, 20, 254), R(x, 250, 20, 100)];
}

export class PressureLevel extends Level {
  readonly levelId = 4;
  readonly name = 'The Crumbling Vault';
  readonly scenario = 'pressure';
  readonly objective = 'Escape before the vault collapses! Three locked gates, a laser corridor, and the clock.';
  readonly taskName = 'escape_vault';
  readonly startPos: [number, number] = [60, 300];

  timeLeft!: number;
  levelMs!: number;
  beamT!: number;
  beamMult!: number;
  gateOpen!: boolean[];
  gateStarted!: boolean[];
  scans!: number[];
  hint!: (string | null)[];
  tremorDone!: boolean;
  lockMs!: number;
  awaitingReaction!: boolean;
  reactionSince!: number;
  shakeMs!: number;
  chestUsed!: boolean;
  laserHits!: number;
  lockdowns!: number;

  build(): void {
    this.timeLeft = TIME_LIMIT_S;
    this.levelMs = 0.0;
    this.beamT = 0.0;
    this.beamMult = 1.0;
    this.gateOpen = [false, false, false];
    this.gateStarted = [false, false, false];
    this.scans = [0, 0, 0];
    this.hint = [null, null, null];
    this.tremorDone = false;
    this.lockMs = 0.0;
    this.awaitingReaction = false;
    this.reactionSince = 0.0;
    this.shakeMs = 0.0;
    this.chestUsed = false;
    this.laserHits = 0;
    this.lockdowns = 0;
  }

  levelStartMetadata(): Kw {
    return { time_limit_s: TIME_LIMIT_S, gates_total: 3, tremor_at_s: TREMOR_AT_S };
  }

  solids(): Rect[] {
    const s = [CORRIDOR_TOP, CORRIDOR_BOTTOM];
    for (let i = 0; i < 3; i++) {
      const [top, bottom, door] = gateRects(i);
      s.push(top, bottom);
      if (!this.gateOpen[i]) s.push(door);
    }
    return s;
  }

  beamRects(): Rect[] {
    return BEAMS.map(([slot, w, period, phase]) => {
      const y = 300 + 125 * Math.sin((2 * Math.PI * this.beamT) / period + phase);
      return R(slot, Math.trunc(y) - 6, w, 12);
    });
  }

  private tick(dt: number): void {
    this.levelMs += dt * 1000;
    this.timeLeft -= dt;
    this.beamT += dt * this.beamMult;
    if (this.shakeMs > 0) this.shakeMs -= dt * 1000;
    if (!this.tremorDone && this.levelMs >= TREMOR_AT_S * 1000) {
      this.tremorDone = true;
      this.timeLeft -= TREMOR_COST_S;
      this.beamMult = 1.35;
      this.lockMs = TREMOR_LOCK_MS;
      this.shakeMs = 1300;
      this.awaitingReaction = true;
      this.reactionSince = this.session.clock.ms + TREMOR_LOCK_MS;
      this.log.log(E.ENV_EVENT, {
        action: 'tremor',
        time_lost_s: TREMOR_COST_S,
        lock_ms: TREMOR_LOCK_MS,
        time_left_s: pyRound(this.timeLeft, 1),
      });
      this.say('The vault shakes! Rocks fall... -5s and the lasers speed up!', 3000);
    }
    if (this.timeLeft <= 0 && this.status === RUNNING) {
      this.timeLeft = 0.0;
      this.log.log(E.FAILURE, { action: 'time_expired', freeze_ms: 0 });
      this.fail('timeout', { laser_hits: this.laserHits, lockdowns: this.lockdowns, gates_open: this.gateOpen.filter(Boolean).length });
    }
  }

  update(dt: number, inp: InputState): void {
    if (this.status !== RUNNING) return;
    this.tick(dt);
    if (this.status !== RUNNING) return;
    if (this.lockMs > 0) {
      this.lockMs -= dt * 1000;
      this.elapsedMs += dt * 1000;
      return;
    }
    if (this.awaitingReaction && anyInput(inp)) {
      this.awaitingReaction = false;
      this.log.log(E.PLAYER_INTERACTION, {
        action: 'tremor_reaction',
        object_id: 'tremor',
        novel: false,
        reaction_ms: pyRoundInt(Math.max(0.0, this.session.clock.ms - this.reactionSince)),
      });
    }
    super.update(dt, inp);
  }

  onUpdate(_dt: number, _inp: InputState): void {
    if (!this.player.frozen) {
      const pr = this.player.rect;
      if (this.beamRects().some((b) => pr.colliderect(b))) this.laserHit();
    }
    for (let i = 0; i < 3; i++) {
      if (!this.gateOpen[i] && !this.gateStarted[i]) {
        const door = gateRects(i)[2];
        if (this.distTo(door.center) < 95) {
          this.gateStarted[i] = true;
          this.log.log(E.PLAYER_INTERACTION, {
            action: 'approach_gate',
            object_id: `gate${i + 1}`,
            novel: false,
            time_left_s: pyRound(this.timeLeft, 1),
          });
          this.gateDialog(i);
          return;
        }
      }
    }
    if (EXIT_RECT.collidepoint(this.player.x, this.player.y)) {
      this.complete({
        time_left_s: pyRound(this.timeLeft, 1),
        laser_hits: this.laserHits,
        lockdowns: this.lockdowns,
        scans: this.scans.reduce((a, b) => a + b, 0),
      });
    }
  }

  private laserHit(): void {
    this.laserHits += 1;
    this.timeLeft -= LASER_COST_S;
    this.log.log(E.FAILURE, {
      action: 'laser_hit',
      freeze_ms: 1500,
      time_lost_s: LASER_COST_S,
      hits: this.laserHits,
      time_left_s: pyRound(this.timeLeft, 1),
    });
    this.player.freeze(1500);
    this.player.teleport(ENTRY_RESPAWN[0], ENTRY_RESPAWN[1]);
    this.say('ZAP! Laser hit: -5 seconds.', 2200);
  }

  private gateDialog(i: number): void {
    const gid = `gate${i + 1}`;
    const p = GATE_P[i];

    const reading = () => {
      const noise = this.rng.uniform(-0.15, 0.15);
      return `${Math.max(5, Math.min(95, pyRoundInt(100 * (p + noise))))}%`;
    };
    const body = () => {
      let base = 'A glowing console guards the next chamber. Forcing the lock could save time... or trigger an alarm.';
      if (this.hint[i]) base += `\nScanner reading #${this.scans[i]}: forcing the lock looks about ${this.hint[i]} safe.`;
      else base += '\nYou have no scanner reading yet.';
      return base;
    };
    const onCheck = (_opt: DecisionOption, dlg: ChoiceDialog) => {
      this.scans[i] += 1;
      this.timeLeft -= SCAN_COST_S;
      this.hint[i] = reading();
      this.log.log(E.PLAYER_INTERACTION, {
        action: this.scans[i] === 1 ? 'scan' : 'recheck',
        object_id: gid,
        novel: false,
        n_scans: this.scans[i],
        hint: this.hint[i],
        time_left_s: pyRound(this.timeLeft, 1),
      });
      dlg.setBody(body());
    };
    const chosen = (o: DecisionOption) => {
      const scanned = this.scans[i] > 0;
      if (o.kind === KIND_SAFE) {
        this.timeLeft -= SAFE_COST_S;
        this.log.log(E.PLAYER_INTERACTION, { action: 'safe_bypass', object_id: gid, novel: false, time_lost_s: SAFE_COST_S });
        this.say(`Safe bypass: -${Math.trunc(SAFE_COST_S)} seconds.`, 2200);
      } else {
        const ok = this.rng.random() < p;
        this.log.log(E.RISK_ACTION, {
          action: 'force_lock',
          risk_level: 0.7,
          success: ok,
          p_success: p,
          gate_id: gid,
          scans_before: this.scans[i],
        });
        if (ok) {
          this.say('Click! The lock gives way.', 2200);
        } else {
          this.lockdowns += 1;
          this.timeLeft -= LOCKDOWN_COST_S;
          this.log.log(E.FAILURE, {
            action: 'gate_lockdown',
            freeze_ms: 2000,
            time_lost_s: LOCKDOWN_COST_S,
            gate_id: gid,
            time_left_s: pyRound(this.timeLeft, 1),
          });
          this.player.freeze(2000);
          this.say('ALARM! Lockdown: -15 seconds.', 2600);
        }
      }
      this.gateOpen[i] = true;
      this.bump();
      this.session.strategies.adopt(`${scanned ? 'scan' : 'blind'}_${o.kind === KIND_SAFE ? 'safe' : 'risky'}`, 'vault_gate', {
        level_id: 4,
        gate_id: gid,
      });
    };
    const opts: DecisionOption[] = [
      { key: 'scan', label: `Scan the lock for a hint (-${Math.trunc(SCAN_COST_S)}s each time)`, kind: KIND_CHECK, risk_level: 0.0 },
      { key: 'safe_bypass', label: `Take the safe bypass (-${Math.trunc(SAFE_COST_S)}s guaranteed)`, kind: KIND_SAFE, risk_level: 0.1 },
      {
        key: 'force_lock',
        label: `Force the lock (success unknown; failure costs -${Math.trunc(LOCKDOWN_COST_S)}s)`,
        kind: KIND_RISKY,
        risk_level: 0.7,
      },
    ];
    this.openChoice(`l4_${gid}`, CAT_PRESSURE, `Gate ${i + 1} of 3`, body(), opts, chosen, {
      onCheck,
      context: { gate_id: gid, time_left_s: pyRound(this.timeLeft, 1) },
      footer: 'The countdown keeps running while you decide!',
    });
  }

  private chestInReach(): boolean {
    return !this.chestUsed && this.distTo(CHEST_POS) < 55;
  }

  interactHint(): string | null {
    return this.chestInReach() ? 'Open treasure chest' : null;
  }

  onInteract(): void {
    if (!this.chestInReach()) return;
    const opts: DecisionOption[] = [
      { key: 'gold_bars', label: 'Take the gold bars (40 points, sure thing)', kind: KIND_SAFE, risk_level: 0.0 },
      { key: 'sealed_relic', label: 'Open the sealed relic case (0 to 120 points)', kind: KIND_RISKY, risk_level: 0.6 },
    ];
    const chosen = (o: DecisionOption) => {
      this.chestUsed = true;
      const gain = o.key === 'gold_bars' ? 40 : this.rng.choice([0, 20, 60, 120]);
      this.log.log(E.REWARD_SELECTED, { action: o.key, chosen_kind: o.kind, reward_value: gain, risk_level: o.risk_level });
      if (o.key === 'sealed_relic') {
        this.log.log(E.RISK_ACTION, { action: 'open_relic_case', risk_level: 0.6, success: gain >= 60, p_success: 0.5 });
      }
      this.session.coins += gain;
      this.say(`You secured ${gain} points of treasure.`, 2800);
      this.bump();
    };
    this.openChoice('l4_chest', CAT_REWARD, 'Vault Treasure', 'A glittering chest... but the ceiling is cracking.', opts, chosen, {
      footer: 'The countdown keeps running!',
    });
  }

  hudExtra(): HudItem[] {
    return [{ label: 'time left', value: `${Math.max(0, Math.ceil(this.timeLeft))}s` }];
  }
}
