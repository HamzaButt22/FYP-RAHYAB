/**
 * Level 1 - The Whispering Valley (exploration / novelty). Port of game/levels/level1_exploration.py.
 *
 * A signposted road leads straight to the exit gate. Around it: six optional areas, eight unusual objects, a
 * rickety-bridge shortcut and a mystery chest. Nothing forces the player to explore.
 */
import { CAT_REWARD, CAT_RISK, EventType as E, KIND_NOVEL, KIND_RISKY, KIND_SAFE } from '../game-engine/events';
import { InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw } from '../game-engine/logger';
import { PyRandom } from '../game-engine/pyrandom';
import { pyRoundInt } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';

export const ROAD: [number, number][] = [[40, 300], [300, 300], [420, 380], [780, 380], [900, 330], [1040, 300]];
export const EXIT_RECT = R(1030, 240, 60, 120);
export const CHEST_POS: [number, number] = [930, 410];
export const BRIDGE_TRIGGER = R(590, 345, 50, 70);
export const BRIDGE_DECK = R(640, 360, 60, 40);
export const RAVINE = [R(640, 200, 60, 160), R(640, 400, 60, 160)];
export const LAKE = R(460, 170, 160, 80);
export const ROCKS = [R(520, 296, 44, 36), R(330, 190, 40, 40), R(880, 250, 46, 38), R(740, 480, 50, 40)];

export interface Zone {
  id: string;
  name: string;
  rect: Rect;
  color: [number, number, number];
}
export const ZONES: Zone[] = [
  { id: 'mushroom_grove', name: 'Mushroom Grove', rect: R(120, 70, 220, 150), color: [167, 139, 250] },
  { id: 'crystal_cave', name: 'Crystal Cave', rect: R(400, 40, 200, 130), color: [96, 165, 250] },
  { id: 'old_ruins', name: 'Old Ruins', rect: R(760, 60, 240, 150), color: [251, 191, 36] },
  { id: 'hidden_pond', name: 'Hidden Pond', rect: R(140, 440, 220, 130), color: [52, 211, 153] },
  { id: 'windmill_hill', name: 'Windmill Hill', rect: R(400, 470, 200, 110), color: [244, 114, 182] },
  { id: 'whispering_cliffs', name: 'Whispering Cliffs', rect: R(780, 440, 250, 130), color: [248, 113, 113] },
];

export interface ValleyObject {
  id: string;
  name: string;
  pos: [number, number];
  msg: string;
  payout: number | null;
}
export const OBJECTS: ValleyObject[] = [
  { id: 'glowing_mushroom', name: 'Glowing mushroom', pos: [230, 150], msg: 'The mushroom hums softly and releases a cloud of sparkling spores.', payout: null },
  { id: 'crystal_resonator', name: 'Crystal resonator', pos: [510, 100], msg: 'You tap the crystal. A pure note echoes through the cave.', payout: null },
  { id: 'ancient_lever', name: 'Ancient lever', pos: [820, 120], msg: 'You pull the lever. A stone slab slides open: a hidden stash!', payout: 5 },
  { id: 'stone_tablet', name: 'Stone tablet', pos: [940, 150], msg: "'Those who wander find more than those who hurry.' - the tablet reads.", payout: null },
  { id: 'frog_statue', name: 'Frog statue', pos: [250, 520], msg: 'You press the frog. It spits out a shiny coin.', payout: 2 },
  { id: 'windmill_crank', name: 'Windmill crank', pos: [500, 520], msg: 'You turn the crank. The old windmill creaks into motion.', payout: null },
  { id: 'cliff_echo', name: 'Echo stone', pos: [900, 500], msg: 'You shout into the canyon. The cliffs whisper your words back.', payout: null },
  { id: 'odd_signpost', name: 'Odd signpost', pos: [350, 352], msg: "A crooked sign points away from the road: 'Beyond the trees, curious things wait.'", payout: null },
];
export const COINS: [number, number][] = [[150, 300], [260, 300], [480, 372], [560, 380], [790, 380], [900, 330]];

export type Tree = [number, number, number, [number, number, number]];

/** Decorative trees, generated exactly like the desktop (random.Random(11)) so the valley looks the same. */
export function makeDecor(): Tree[] {
  const r = new PyRandom(11);
  const trees: Tree[] = [];
  const blockers = [...ZONES.map((z) => z.rect.inflate(10, 10)), R(0, 270, 1100, 140)];
  const palette: [number, number, number][] = [[34, 120, 74], [40, 138, 84], [28, 104, 66]];
  for (let i = 0; i < 70; i++) {
    const x = r.randint(10, 1090);
    const y = r.randint(10, 590);
    if (blockers.some((b) => b.collidepoint(x, y))) continue;
    const rad = r.randint(14, 24);
    trees.push([x, y, rad, r.choice(palette)]);
  }
  return trees;
}

type Hit = { kind: 'object'; o: ValleyObject } | { kind: 'chest'; o: null };

export class ExplorationLevel extends Level {
  readonly levelId = 1;
  readonly name = 'The Whispering Valley';
  readonly scenario = 'exploration';
  readonly objective = 'Reach the Valley Gate. The road is marked - the rest of the valley is up to you.';
  readonly taskName = 'reach_valley_gate';
  readonly startPos: [number, number] = [60, 300];

  currentZone!: string | null;
  zoneEnterMs!: number;
  zoneVisits!: Record<string, number>;
  visitedOptional!: Set<string>;
  interacted!: Record<string, number>;
  coinTaken!: Set<number>;
  coins!: number;
  bridgeResolved!: boolean;
  bridgeOpen!: boolean;
  chestUsed!: boolean;
  walkableBridgeBlock!: Rect;
  decor!: Tree[];

  build(): void {
    this.currentZone = null;
    this.zoneEnterMs = 0.0;
    this.zoneVisits = {};
    this.visitedOptional = new Set();
    this.interacted = {};
    this.coinTaken = new Set();
    this.coins = 0;
    this.bridgeResolved = false;
    this.bridgeOpen = true;
    this.chestUsed = false;
    this.walkableBridgeBlock = BRIDGE_DECK.copy();
    this.decor = makeDecor();
    this.session.strategies.adopt('direct_route', 'level1_start', { level_id: 1 });
    this.session.coins = 0;
  }

  levelStartMetadata(): Kw {
    return { optional_areas_total: ZONES.length, grid_cells_total: 77, novel_objects_total: OBJECTS.length };
  }

  solids(): Rect[] {
    const s = [...RAVINE, LAKE, ...ROCKS];
    if (!this.bridgeOpen) s.push(this.walkableBridgeBlock);
    return s;
  }

  zoneAt(pos: [number, number]): Zone | null {
    for (const z of ZONES) if (z.rect.collidepoint(pos[0], pos[1])) return z;
    return null;
  }

  onUpdate(_dt: number, _inp: InputState): void {
    const now = this.session.clock.ms;
    const z = this.zoneAt(this.player.pos);
    const zid = z ? z.id : null;
    if (zid !== this.currentZone) {
      if (this.currentZone !== null) {
        this.log.log(E.EXPLORATION, {
          action: 'leave_area',
          zone_id: this.currentZone,
          dwell_ms: pyRoundInt(now - this.zoneEnterMs),
          optional: true,
        });
      }
      if (z !== null && zid !== null) {
        this.zoneVisits[zid] = (this.zoneVisits[zid] ?? 0) + 1;
        const first = !this.visitedOptional.has(zid);
        this.visitedOptional.add(zid);
        this.zoneEnterMs = now;
        this.log.log(E.EXPLORATION, {
          action: 'enter_optional_area',
          zone_id: zid,
          zone_name: z.name,
          visit_number: this.zoneVisits[zid],
          first_visit: first,
          optional: true,
        });
        if (first) {
          this.say(`You discovered: ${z.name}!`);
          this.session.strategies.adopt('explore_optional', 'entered_optional_area', { level_id: 1, zone_id: zid });
          this.bump();
        }
      }
      this.currentZone = zid;
    }

    COINS.forEach((c, i) => {
      if (!this.coinTaken.has(i) && this.distTo(c) < 22) {
        this.coinTaken.add(i);
        this.addCoins(1, 'road_coin', false);
        this.bump();
      }
    });

    if (!this.bridgeResolved && BRIDGE_TRIGGER.collidepoint(this.player.x, this.player.y)) {
      this.bridgeResolved = true;
      this.bridgeDialog();
    }

    if (EXIT_RECT.collidepoint(this.player.x, this.player.y)) {
      let novel = 0;
      for (const v of Object.values(this.interacted)) if (v) novel += 1;
      this.complete({ coins: this.coins, optional_areas_visited: this.visitedOptional.size, novel_objects: novel });
    }
  }

  onEnd(): void {
    if (this.currentZone !== null) {
      this.log.log(E.EXPLORATION, {
        action: 'leave_area',
        zone_id: this.currentZone,
        dwell_ms: pyRoundInt(this.session.clock.ms - this.zoneEnterMs),
        optional: true,
      });
      this.currentZone = null;
    }
    this.session.coins += this.coins;
  }

  private addCoins(n: number, item: string, novel: boolean): void {
    this.coins = Math.max(0, this.coins + n);
    if (n > 0) this.log.log(E.ITEM_COLLECTED, { action: 'collect', item, value: n, novel });
  }

  nearest(): Hit | null {
    let best: Hit | null = null;
    let bestD = 52;
    const cands: [Hit, [number, number]][] = OBJECTS.map((o) => [{ kind: 'object', o }, o.pos]);
    if (!this.chestUsed) cands.push([{ kind: 'chest', o: null }, CHEST_POS]);
    for (const [hit, pos] of cands) {
      const d = this.distTo(pos);
      if (d < bestD) {
        best = hit;
        bestD = d;
      }
    }
    return best;
  }

  interactHint(): string | null {
    const hit = this.nearest();
    if (!hit) return null;
    return hit.kind === 'chest' ? 'Open chest' : `Inspect ${hit.o.name.toLowerCase()}`;
  }

  onInteract(): void {
    const hit = this.nearest();
    if (!hit) return;
    if (hit.kind === 'chest') {
      this.chestDialog();
      return;
    }
    const o = hit.o;
    const times = this.interacted[o.id] ?? 0;
    this.interacted[o.id] = times + 1;
    const novel = times === 0;
    this.log.log(E.PLAYER_INTERACTION, {
      action: 'inspect',
      object_id: o.id,
      object_name: o.name,
      novel,
      times: times + 1,
      zone_id: this.currentZone,
    });
    this.say(o.msg, 3600);
    if (novel && o.payout) this.addCoins(o.payout, o.id, true);
    this.bump();
  }

  private bridgeDialog(): void {
    const opts: DecisionOption[] = [
      { key: 'cross_bridge', label: 'Cross the rickety bridge (shortcut, planks look rotten)', kind: KIND_RISKY, risk_level: 0.6 },
      { key: 'walk_around', label: 'Walk around the ravine (longer but safe)', kind: KIND_SAFE, risk_level: 0.05 },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.key === 'cross_bridge') {
        const held = this.rng.random() < 0.55;
        this.log.log(E.RISK_ACTION, { action: 'cross_rickety_bridge', risk_level: 0.6, success: held, p_success: 0.55 });
        this.session.strategies.adopt('risk_shortcut', 'bridge', { level_id: 1 });
        if (held) {
          this.say('The bridge holds! Shortcut bonus: +3 coins.');
          this.addCoins(3, 'shortcut_bonus', false);
        } else {
          this.log.log(E.FAILURE, { action: 'bridge_fall', freeze_ms: 2500, coins_lost: Math.min(5, this.coins) });
          this.player.freeze(2500);
          this.addCoins(-5, 'bridge_fall', false);
          this.bridgeOpen = false;
          this.say('The planks snap! You tumble down and lose 5 coins. Take the long way.', 3600);
        }
      } else {
        this.log.log(E.PLAYER_INTERACTION, { action: 'avoid_bridge', object_id: 'bridge', novel: false });
        this.bridgeOpen = false;
        this.say('You decide to walk around the ravine.');
      }
      this.bump();
    };
    this.openChoice(
      'l1_bridge',
      CAT_RISK,
      'The Rickety Bridge',
      'A rope bridge crosses the ravine. The planks creak in the wind. The long way around is slower but safe.',
      opts,
      chosen,
      { context: { level: 1 } },
    );
  }

  private chestDialog(): void {
    const opts: DecisionOption[] = [
      { key: 'take_coins', label: 'Take the 10 coins (guaranteed)', kind: KIND_SAFE, risk_level: 0.0 },
      { key: 'open_mystery', label: 'Open the mystery box (could be much more... or less)', kind: KIND_NOVEL, risk_level: 0.5 },
    ];
    const chosen = (o: DecisionOption) => {
      this.chestUsed = true;
      const gain = o.key === 'take_coins' ? 10 : this.rng.choice([0, 5, 15, 30]);
      this.log.log(E.REWARD_SELECTED, { action: o.key, chosen_kind: o.kind, reward_value: gain, risk_level: o.risk_level ?? null });
      this.addCoins(gain, 'chest_reward', o.key === 'open_mystery');
      this.say(gain ? `You received ${gain} coins.` : 'The mystery box was empty!');
      this.bump();
    };
    this.openChoice('l1_chest', CAT_REWARD, 'Treasure Chest', "A chest sits near the valley gate. A note says: 'Choose your reward.'", opts, chosen);
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'coins', value: String(this.coins) },
      { label: 'areas found', value: `${this.visitedOptional.size}/${ZONES.length}` },
    ];
  }
}
