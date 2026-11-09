/**
 * Level 5 - Strategic Expedition. Port of game/levels/level5_expedition.py.
 *
 * Lead a day-long expedition from Base Camp to the Summit Observatory: three routes with cross-links, clock hours,
 * energy, rations and a pack limit; optional preparation; a fair washout surprise; optional discoveries; a porter who
 * needs help; plan revision through the Expedition Notebook (desktop TAB, mobile "Notebook" button).
 * The level cannot be failed - every plan reaches the Observatory.
 */
import { CountItem, CountPanel } from '../game-engine/dialogs';
import {
  CAT_HELP,
  CAT_PLANNING,
  CAT_RISK,
  CAT_SOCIAL,
  EventType as E,
  KIND_CHECK,
  KIND_EXIT,
  KIND_IGNORE,
  KIND_NEUTRAL,
  KIND_PROSOCIAL,
  KIND_RISKY,
  KIND_SAFE,
} from '../game-engine/events';
import { InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw, Meta } from '../game-engine/logger';
import { fmtG, pad2, pyRound, pyRoundInt } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';
import { nearestStation } from './common';

export const START_CLOCK = 6.0;
export const DUSK_AT = 18.0;
export const STORM_AT = 14.0;
export const START_ENERGY = 100.0;
export const TIRED_BELOW = 25.0;
export const CAPACITY = 6;
export const ITEMS: CountItem[] = [
  { key: 'ration', label: 'Ration packs', weight: 1, max: 3, note: '+18 energy each' },
  { key: 'rope', label: 'Climbing rope', weight: 2, max: 1, note: 'eases the washout' },
  { key: 'lantern', label: 'Lantern', weight: 1, max: 1, note: 'dusk is easier' },
  { key: 'mapkit', label: 'Trail-map kit', weight: 1, max: 1, note: 'shows exact route costs' },
];
export type RouteKey = 'north' | 'central' | 'south';
export const ROUTE_KEYS: RouteKey[] = ['north', 'central', 'south'];
export const ROUTES: Record<RouteKey, { name: string; hours: number; energy: number; y: number; blurb: string }> = {
  north: { name: 'North Ridge', hours: 1.5, energy: 18.0, y: 95, blurb: 'Short but exposed ridge. Fast, tiring.' },
  central: { name: 'Central Forest', hours: 2.5, energy: 12.0, y: 300, blurb: 'Unmapped forest trail. Costs unknown until scouted.' },
  south: { name: 'South River', hours: 3.5, energy: 7.0, y: 500, blurb: 'Long riverside path. Slow, gentle.' },
};
export type AscentKey = 'steep' | 'switchback';
export const ASCENT: Record<AscentKey, { name: string; hours: number; energy: number }> = {
  steep: { name: 'Steep Trail', hours: 1.5, energy: 28.0 },
  switchback: { name: 'Switchbacks', hours: 3.5, energy: 10.0 },
};
export const SLICK_EXTRA: [number, number] = [1.0, 10.0];
export const WASHOUT = { hours: 2.0, energy: 6.0 };
export const WASHOUT_ROPE = { hours: 0.5, energy: 2.0 };
export const RATION_ENERGY = 18.0;
export const RATION_HOURS = 0.25;
export const REST_ENERGY = 10.0;
export const REST_HOURS = 1.0;
export const CROSSLINK_HOURS = 0.5;
export const DISCOVERY_HOURS = 0.5;
export const PORTER_HELP: [number, number] = [1.0, 8.0];
export const MIRA_LEG_EXTRA = 0.5;

export const BAND: Record<RouteKey, [number, number]> = { north: [40, 150], central: [230, 370], south: [450, 550] };
export const SOLIDS = [
  R(215, 0, 665, 40),
  R(215, 150, 285, 80),
  R(560, 150, 320, 80),
  R(215, 370, 285, 80),
  R(560, 370, 320, 80),
  R(215, 550, 665, 54),
  R(975, 140, 30, 320),
];
export const LEG_ZONES: [RouteKey, number, Rect][] = [];
for (const r of ROUTE_KEYS) {
  for (const [i, x] of [
    [1, 300],
    [2, 640],
  ] as [number, number][]) {
    LEG_ZONES.push([r, i, R(x, BAND[r][0], 60, BAND[r][1] - BAND[r][0])]);
  }
}
export const FORK_ZONES: [RouteKey, Rect][] = ROUTE_KEYS.map((r) => [r, R(580, BAND[r][0], 30, BAND[r][1] - BAND[r][0])]);
export const CROSSLINKS: [string, Rect][] = [
  ['north_central', R(500, 150, 60, 80)],
  ['central_south', R(500, 370, 60, 80)],
];
export const DISCOVERIES: [string, { rect: Rect; name: string; route: RouteKey }][] = [
  ['eagle_overlook', { rect: R(430, 48, 80, 46), name: 'Eagle Overlook', route: 'north' }],
  ['ancient_shrine', { rect: R(400, 236, 80, 44), name: 'Ancient Shrine', route: 'central' }],
  ['herb_grove', { rect: R(700, 324, 80, 40), name: 'Herb Grove', route: 'central' }],
  ['fishing_camp', { rect: R(400, 462, 80, 44), name: 'Fishing Camp', route: 'south' }],
];
const DISCOVERY = Object.fromEntries(DISCOVERIES);
export const ASCENT_ZONES: [AscentKey, Rect][] = [
  ['steep', R(985, 0, 20, 140)],
  ['switchback', R(985, 460, 20, 144)],
];
export const JUNCTION_X = 957;
export const OBSERVATORY = R(1040, 270, 50, 60);
export const STATIONS: Record<string, Rect> = {
  supply: R(40, 215, 72, 50),
  board: R(130, 215, 72, 50),
  tent: R(40, 340, 72, 50),
  mira: R(130, 340, 52, 50),
  tariq: R(890, 170, 44, 50),
  rest: R(890, 400, 46, 40),
  cairn: R(895, 262, 36, 36),
};
export const STATION_LABEL: Record<string, string> = {
  supply: 'Supplies',
  board: 'Route Board',
  tent: 'Planning Tent',
  mira: 'Scout Mira',
  tariq: 'Porter',
  rest: 'Rest Camp',
  cairn: 'Cairn',
};
export const STATION_COLOR: Record<string, [number, number, number]> = {
  supply: [150, 110, 70],
  board: [60, 100, 80],
  tent: [80, 90, 150],
  mira: [120, 80, 140],
  tariq: [150, 90, 60],
  rest: [70, 120, 120],
  cairn: [110, 110, 120],
};
const SOLID_STATIONS = ['supply', 'board', 'tent', 'tariq', 'rest', 'cairn'];

export function fmtClock(h: number): string {
  let hh = Math.trunc(h);
  let mm = Math.trunc(pyRoundInt((h - hh) * 60));
  if (mm === 60) {
    hh += 1;
    mm = 0;
  }
  return `${pad2(hh)}:${pad2(mm)}`;
}

interface Plan {
  route: RouteKey;
  ascent: AscentKey;
  rests: number;
}
const planSig = (p: Plan | null) => (p ? JSON.stringify([['ascent', p.ascent], ['rests', p.rests], ['route', p.route]]) : '[]');
const samePlan = (a: Plan | null, b: Plan | null) => planSig(a) === planSig(b) && (a === null) === (b === null);

export class ExpeditionLevel extends Level {
  readonly levelId = 5;
  readonly name = 'Strategic Expedition';
  readonly scenario = 'expedition';
  readonly objective = 'Lead the expedition to the Summit Observatory. Plan, pack, adapt - there is more than one good way.';
  readonly taskName = 'lead_expedition';
  readonly startPos: [number, number] = [100, 300];
  readonly hasNotebook = true;
  readonly controlsHint = 'Move with the joystick, tap the action button at stations, and open the Notebook any time to review or revise your plan.';

  clockH!: number;
  energy!: number;
  rations!: number;
  pack!: Record<string, number>;
  withMira!: boolean;
  departed!: boolean;
  chargedLegs!: Set<string>;
  routeTaken!: RouteKey | null;
  routeLog!: string[];
  inZone!: string | null;
  washoutDone!: boolean;
  washoutPending!: RouteKey | null;
  duskDone!: boolean;
  discovered!: Set<string>;
  knowsCosts!: boolean;
  knowsStorm!: boolean;
  knowsWashout!: boolean;
  plan!: Plan | null;
  prepDone!: Set<string>;
  infoSincePlan!: boolean;
  lastNbSig!: string | null;
  notebookOpens!: number;
  helpedPorter!: boolean;
  crossings!: number;
  stage!: string;
  ascentTaken!: AscentKey | null;
  talked!: Set<string>;

  build(): void {
    this.clockH = START_CLOCK;
    this.energy = START_ENERGY;
    this.rations = 0;
    this.pack = Object.fromEntries(ITEMS.map((i) => [i.key, 0]));
    this.withMira = false;
    this.departed = false;
    this.chargedLegs = new Set();
    this.routeTaken = null;
    this.routeLog = [];
    this.inZone = null;
    this.washoutDone = false;
    this.washoutPending = null;
    this.duskDone = false;
    this.discovered = new Set();
    this.knowsCosts = false;
    this.knowsStorm = false;
    this.knowsWashout = false;
    this.plan = null;
    this.prepDone = new Set();
    this.infoSincePlan = false;
    this.lastNbSig = null;
    this.notebookOpens = 0;
    this.helpedPorter = false;
    this.crossings = 0;
    this.stage = 'prep';
    this.ascentTaken = null;
    this.talked = new Set();
  }

  levelStartMetadata(): Kw {
    return {
      capacity: CAPACITY,
      start_clock: START_CLOCK,
      start_energy: START_ENERGY,
      routes: [...ROUTE_KEYS],
      discoveries_total: DISCOVERIES.length,
      prep_actions_total: 5,
      npcs_total: 2,
      social_opportunities_total: 3,
    };
  }

  solids(): Rect[] {
    return [...SOLIDS, ...SOLID_STATIONS.map((k) => STATIONS[k])];
  }

  private _log(etype: string, action: string | null, kw: Kw = {}) {
    const k: Kw = { ...kw };
    if (!('stage' in k)) k.stage = this.stage;
    if (!('actor' in k)) k.actor = 'player';
    return this.log.log(etype, { action, ...k });
  }

  spend(hours: number, energy: number, reason: string): void {
    const tired = this.energy < TIRED_BELOW;
    if (tired && hours > 0) hours += 0.5;
    this.clockH += hours;
    this.energy -= energy;
    if (this.clockH >= DUSK_AT && !this.duskDone) {
      this.duskDone = true;
      this.log.log(E.ENV_EVENT, {
        action: 'dusk',
        actor: 'engine',
        stage: this.stage,
        clock: pyRound(this.clockH, 2),
        lantern: !!this.pack.lantern,
      });
      this.say('Dusk falls. ' + (this.pack.lantern ? 'Your lantern helps.' : 'Without a lantern, everything is harder.'), 3200);
      this.bump();
    }
    if (this.duskDone && energy > 0) this.energy -= this.pack.lantern ? 1.0 : 4.0;
    if (this.energy <= 0) {
      this.clockH += 2.0;
      this.energy = 25.0;
      this.log.log(E.ENV_EVENT, { action: 'exhausted_rest', actor: 'engine', stage: this.stage, clock: pyRound(this.clockH, 2) });
      this.say('Exhausted! The party rests for two hours.', 3000);
    }
    this.log.log(E.RESOURCE_USED, {
      action: 'spend',
      actor: 'engine',
      reason,
      hours: pyRound(hours, 2),
      energy: pyRound(energy, 1),
      clock: pyRound(this.clockH, 2),
      energy_left: pyRound(this.energy, 1),
      rations: this.rations,
      stage: this.stage,
    });
  }

  get capacity(): number {
    return CAPACITY + (this.withMira ? 2 : 0);
  }

  onUpdate(_dt: number, inp: InputState): void {
    if (inp.tab && this.modal === null) {
      this.openNotebook();
      return;
    }
    const p = this.player;
    if (!this.departed && p.x > 235) {
      this.departed = true;
      this.stage = 'route';
      this._log(E.PLAYER_INTERACTION, 'depart', {
        object_id: 'base_camp',
        novel: false,
        prep_actions: Array.from(this.prepDone).sort(),
        planned: this.plan !== null,
        packed: { ...this.pack },
        clock: pyRound(this.clockH, 2),
      });
    }
    this.checkZones();
    if (OBSERVATORY.collidepoint(p.x, p.y) && this.departed) {
      this.complete({
        clock: pyRound(this.clockH, 2),
        energy_left: pyRound(this.energy, 1),
        route: this.routeTaken,
        ascent: this.ascentTaken,
        discoveries: this.discovered.size,
        helped_porter: this.helpedPorter,
        with_mira: this.withMira,
        crossings: this.crossings,
      });
    }
  }

  private zoneAt(): string | null {
    const [x, y] = this.player.pos;
    for (const [r, i, z] of LEG_ZONES) if (z.collidepoint(x, y)) return `leg:${r}:${i}`;
    for (const [r, z] of FORK_ZONES) if (z.collidepoint(x, y)) return `fork:${r}`;
    for (const [k, z] of CROSSLINKS) if (z.collidepoint(x, y)) return `cross:${k}`;
    for (const [k, d] of DISCOVERIES) if (d.rect.collidepoint(x, y)) return `disc:${k}`;
    for (const [k, z] of ASCENT_ZONES) if (z.collidepoint(x, y)) return `ascent:${k}`;
    return null;
  }

  private checkZones(): void {
    const z = this.zoneAt();
    if (z === this.inZone) return;
    this.inZone = z;
    if (z === null) return;
    const [kind, ...rest] = z.split(':');
    if (kind === 'leg') this.enterLeg(rest[0] as RouteKey, parseInt(rest[1], 10));
    else if (kind === 'fork') this.enterFork(rest[0] as RouteKey);
    else if (kind === 'cross') this.cross(rest[0]);
    else if (kind === 'disc') this.discover(rest[0]);
    else if (kind === 'ascent') this.enterAscent(rest[0] as AscentKey);
  }

  private enterLeg(route: RouteKey, leg: number): void {
    const key = `${route}:${leg}`;
    if (this.chargedLegs.has(key)) return;
    this.chargedLegs.add(key);
    if (this.routeTaken === null) {
      this.routeTaken = route;
      this.stage = 'route';
    }
    this.routeLog.push(`${route}${leg}`);
    const r = ROUTES[route];
    let hours = r.hours + (this.withMira ? MIRA_LEG_EXTRA : 0);
    let energy = r.energy;
    let extraNote = '';
    if (leg === 2 && this.washoutPending === route) {
      const w = this.pack.rope ? WASHOUT_ROPE : WASHOUT;
      const f = this.withMira ? 0.5 : 1.0;
      hours = hours + w.hours * f;
      energy = energy + w.energy * f;
      extraNote = ' (washout)';
      this.washoutPending = null;
    }
    this._log(E.EXPLORATION, 'enter_leg', {
      zone_id: `${route}_leg${leg}`,
      route,
      leg,
      optional: false,
      clock: pyRound(this.clockH, 2),
      energy: pyRound(this.energy, 1),
    });
    this.spend(hours, energy, `leg ${route}${leg}${extraNote}`);
    this.say(`${r.name}, leg ${leg}: ${fmtClock(this.clockH)}, energy ${Math.max(0, pyRoundInt(this.energy))}.`, 2200);
  }

  private enterFork(route: RouteKey): void {
    if (this.washoutDone) return;
    this.washoutDone = true;
    this.washoutPending = route;
    const w = this.pack.rope ? WASHOUT_ROPE : WASHOUT;
    this.log.log(E.ENV_EVENT, {
      action: 'washout',
      actor: 'engine',
      stage: 'event',
      route,
      warned: this.knowsWashout,
      extra_hours: w.hours,
      extra_energy: w.energy,
      rope: !!this.pack.rope,
      mira: this.withMira,
      clock: pyRound(this.clockH, 2),
    });
    this.infoSincePlan = true;
    this.stage = 'event';
    const f = this.withMira ? 0.5 : 1;
    const fx = `+${fmtG(w.hours * f)}h and +${fmtG(w.energy * f)} energy`;
    const opts: DecisionOption[] = [
      { key: 'push_through', label: `Push through the washed-out leg (${fx})`, kind: KIND_RISKY, risk_level: 0.6 },
      {
        key: 'detour',
        label: `Take the cross-link to the next trail (+${fmtG(CROSSLINK_HOURS)}h; walk back to the gap in the rock wall)`,
        kind: KIND_NEUTRAL,
        risk_level: 0.2,
      },
      { key: 'camp_wait', label: 'Camp and wait for the water to drop (+2h, +12 energy; the leg is then clear)', kind: KIND_SAFE, risk_level: 0.0 },
    ];
    const body =
      'A stream has swept across the trail ahead. ' +
      (this.knowsWashout ? 'You were warned about this. ' : 'Nobody mentioned this. ') +
      'Decide how to deal with it.';
    const chosen = (o: DecisionOption) => {
      this._log(E.PLAYER_INTERACTION, 'washout_response', {
        object_id: 'washout',
        novel: false,
        choice: o.key,
        warned: this.knowsWashout,
        prepared: !!this.pack.rope,
        outcome: 'chosen',
      });
      if (o.key === 'camp_wait') {
        this.washoutPending = null;
        this.spend(2.0, -12.0, 'wait out washout');
      } else if (o.key === 'detour') {
        this.say('Head back to the gap in the rock wall (middle of the map) and cross over.', 3500);
      } else {
        this.say('You press on through the water.', 2200);
      }
      this.stage = 'route';
      this.maybeReplanPrompt();
    };
    this.openChoice('l5_washout', CAT_RISK, 'Unexpected: washout!', body, opts, chosen, {
      context: { route, warned: this.knowsWashout },
    });
  }

  private maybeReplanPrompt(): void {
    if (this.plan) this.say('New information! Open the Notebook to review or revise your plan.', 3200);
  }

  private cross(key: string): void {
    this.crossings += 1;
    this.spend(CROSSLINK_HOURS, 2.0, 'cross-link');
    if (this.washoutPending !== null) this.washoutPending = null;
    const [a, b] = key.split('_') as [RouteKey, RouteKey];
    this._log(E.EXPLORATION, 'cross_link', { zone_id: key, optional: true, clock: pyRound(this.clockH, 2) });
    this.say(`Crossing between ${ROUTES[a].name} and ${ROUTES[b].name}.`, 2000);
  }

  private discover(key: string): void {
    if (this.discovered.has(key)) return;
    this.discovered.add(key);
    this.bump();
    const d = DISCOVERY[key];
    this._log(E.EXPLORATION, 'enter_optional_area', { zone_id: key, zone_name: d.name, optional: true, clock: pyRound(this.clockH, 2) });
    this.spend(DISCOVERY_HOURS, 0.0, `discovery ${key}`);
    const msg = {
      eagle_overlook: 'From the overlook you spot storm clouds: the steep trail will be slippery after 14:00.',
      ancient_shrine: "Carvings in the shrine map every route's exact cost.",
      herb_grove: 'The herbs are refreshing: +10 energy.',
      fishing_camp: 'The fishers give you two ration packs.',
    }[key] as string;
    if (key === 'eagle_overlook') this.knowsStorm = true;
    else if (key === 'ancient_shrine') this.knowsCosts = true;
    else if (key === 'herb_grove') this.energy = Math.min(100.0, this.energy + 10);
    else if (key === 'fishing_camp') this.rations += 2;
    this.infoSincePlan = true;
    this._log(E.ITEM_COLLECTED, 'discovery_reward', { object_id: key, outcome: msg.slice(0, 40) });
    this.openMessage(d.name, msg);
  }

  private enterAscent(which: AscentKey): void {
    if (this.ascentTaken !== null) return;
    this.ascentTaken = which;
    this.stage = 'final';
    const a = ASCENT[which];
    let hours = a.hours;
    let energy = a.energy;
    const slick = which === 'steep' && this.clockH >= STORM_AT;
    if (slick) {
      hours = hours + SLICK_EXTRA[0];
      energy = energy + SLICK_EXTRA[1];
      this.log.log(E.ENV_EVENT, { action: 'storm_slick', actor: 'engine', stage: 'final', warned: this.knowsStorm, clock: pyRound(this.clockH, 2) });
      this.say('The storm has made the steep trail slippery!', 2800);
    }
    this._log(E.PLAYER_INTERACTION, 'choose_ascent', {
      object_id: which,
      novel: false,
      slick,
      warned: this.knowsStorm,
      clock: pyRound(this.clockH, 2),
      energy: pyRound(this.energy, 1),
      planned: this.plan ? this.plan.ascent : null,
    });
    if (which === 'steep') this._log(E.RISK_ACTION, 'steep_trail', { risk_level: 0.6, success: true, p_success: 1.0 });
    this.spend(hours, energy, `ascent ${which}`);
  }

  interactHint(): string | null {
    const st = nearestStation(this.player, STATIONS);
    return st ? STATION_LABEL[st] : null;
  }

  onInteract(): void {
    const st = nearestStation(this.player, STATIONS);
    if (st === 'supply') this.openPack();
    else if (st === 'board') this.readBoard();
    else if (st === 'tent') this.openTent();
    else if (st === 'mira') this.talkMira();
    else if (st === 'tariq') this.talkTariq();
    else if (st === 'rest') this.restCamp();
    else if (st === 'cairn') {
      this.openMessage('Old Cairn', 'Travellers have left small stones here for generations. You add one. Nothing else happens.');
      this._log(E.PLAYER_INTERACTION, 'cairn', { object_id: 'cairn', novel: true });
    }
  }

  private prep(name: string): void {
    if (this.stage === 'prep') this.prepDone.add(name);
  }

  readBoard(): void {
    const first = !this.talked.has('board');
    this.talked.add('board');
    this.prep('board');
    this.infoSincePlan = true;
    this._log(E.INFO_SEEKING, 'read_board', { source: 'board', first_time: first });
    const lines: string[] = [];
    for (const k of ROUTE_KEYS) {
      const r = ROUTES[k];
      const known = this.knowsCosts || !!this.pack.mapkit || k !== 'central' || this.chargedLegs.has(`${k}:1`);
      const cost = known ? `${fmtG(r.hours * 2)}h, ${fmtG(r.energy * 2)} energy` : 'cost unknown';
      lines.push(`${r.name}: ${r.blurb}  [${cost}]`);
    }
    lines.push(
      `Final ascent - Steep Trail: ${fmtG(ASCENT.steep.hours)}h, ${fmtG(ASCENT.steep.energy)} energy.  ` +
        `Switchbacks: ${fmtG(ASCENT.switchback.hours)}h, ${fmtG(ASCENT.switchback.energy)} energy.`,
    );
    lines.push('Cross-links join the trails halfway. Rations restore energy, rest takes time. Dusk is at 18:00.');
    this.openMessage('Route Board', '', { lines });
  }

  openPack(): void {
    this.prep('pack');
    this._log(E.PLAYER_INTERACTION, 'open_pack', { object_id: 'supply', novel: false });
    const weightOf = (counts: Record<string, number>) => ITEMS.reduce((s, i) => s + i.weight * counts[i.key], 0);
    const ev = (kind: string, key: string, counts: Record<string, number>) => {
      this._log(E.PLAYER_INTERACTION, 'pack_' + kind, { object_id: key, novel: false, counts, weight: weightOf(counts) });
    };
    const closed = (counts: Record<string, number>) => {
      this.rations = Math.max(0, this.rations + counts.ration - this.pack.ration);
      this.pack = { ...counts };
      this._log(E.PLAYER_INTERACTION, 'pack_confirm', {
        object_id: 'supply',
        novel: false,
        counts: { ...counts },
        weight: weightOf(counts),
        capacity: this.capacity,
        outcome: 'packed',
      });
      this.bump();
    };
    this.modal = new CountPanel('Pack supplies', `Choose what to carry. Capacity ${this.capacity}.`, ITEMS, this.capacity, ev, closed, this.pack);
  }

  openTent(): void {
    this.prep('tent');
    this._log(E.PLAYER_INTERACTION, 'open_planner', { object_id: 'tent', novel: false });
    this.planDialog('tent');
  }

  private planDialog(source: string): void {
    const mode = this.plan ? 'revise' : 'create';
    const known = this.knowsCosts || !!this.pack.mapkit;
    const ropts: DecisionOption[] = ROUTE_KEYS.map((k) => ({
      key: k,
      label: `${ROUTES[k].name} - ${ROUTES[k].blurb}`,
      kind: k === 'central' ? KIND_RISKY : KIND_NEUTRAL,
    }));

    const routeChosen = (o: DecisionOption) => {
      const route = o.key as RouteKey;
      const aopts: DecisionOption[] = (Object.keys(ASCENT) as AscentKey[]).map((k) => ({
        key: k,
        label: `${ASCENT[k].name} (${fmtG(ASCENT[k].hours)}h, ${fmtG(ASCENT[k].energy)} energy)`,
        kind: k === 'steep' ? KIND_RISKY : KIND_SAFE,
      }));
      const ascChosen = (a: DecisionOption) => {
        const ropts2: DecisionOption[] = [0, 1, 2].map((n) => ({ key: String(n), label: `${n} planned rest / ration stop(s)`, kind: KIND_NEUTRAL }));
        const restChosen = (rr: DecisionOption) => {
          const nw: Plan = { route, ascent: a.key as AscentKey, rests: parseInt(rr.key, 10) };
          const trig = mode === 'revise' && this.infoSincePlan ? 'new_info' : mode === 'create' ? 'initial' : 'none';
          this._log(E.PLAN_ACTION, mode, {
            task_id: 'expedition_plan',
            source,
            previous: this.plan ? ({ ...this.plan } as unknown as Meta) : null,
            new: { ...nw },
            trigger: trig,
            changed: !samePlan(this.plan, nw),
            clock: pyRound(this.clockH, 2),
            prepared_items: { ...this.pack },
            outcome: 'committed',
          });
          this.plan = nw;
          this.infoSincePlan = false;
          this.say(`Plan ${mode === 'revise' ? 'revised' : 'committed'}: ${ROUTES[route].name}, ${ASCENT[nw.ascent].name}.`, 2600);
        };
        this.openChoice('l5_plan_rest', CAT_PLANNING, 'Plan: rest stops', 'How many planned stops to eat or rest?', ropts2, restChosen);
      };
      this.openChoice('l5_plan_ascent', CAT_PLANNING, 'Plan: final ascent', 'Which way will you climb at the end?', aopts, ascChosen);
    };

    let body = 'Which route will you lead the party along?' + (known ? '' : ' (Central Forest costs are unknown.)');
    if (this.plan) body = `Current plan: ${ROUTES[this.plan.route].name} then ${ASCENT[this.plan.ascent].name}. ` + body;
    this.openChoice('l5_plan_route', CAT_PLANNING, mode === 'create' ? 'Expedition plan' : 'Revise plan', body, ropts, routeChosen, {
      context: { mode },
    });
  }

  openNotebook(): void {
    const sig = JSON.stringify([
      pyRound(this.clockH, 2),
      pyRound(this.energy, 1),
      this.rations,
      Array.from(this.discovered).sort(),
      this.knowsStorm,
      this.knowsCosts,
      this.knowsWashout,
      this.washoutPending,
      planSig(this.plan),
    ]);
    const redundant = sig === this.lastNbSig;
    this.lastNbSig = sig;
    this.notebookOpens += 1;
    this._log(E.INFO_SEEKING, redundant ? 'recheck_notebook' : 'open_notebook', {
      source: 'notebook',
      redundant,
      n_opens: this.notebookOpens,
    });
    const plan = this.plan
      ? `${ROUTES[this.plan.route].name} -> ${ASCENT[this.plan.ascent].name}, ${this.plan.rests} stop(s)`
      : 'no plan committed';
    const body =
      `Time ${fmtClock(this.clockH)} (dusk 18:00)   Energy ${Math.max(0, pyRoundInt(this.energy))}/100   Rations ${this.rations}\n` +
      `Plan: ${plan}\n` +
      `Known: storm ${this.knowsStorm ? 'yes' : 'no'}, exact costs ${this.knowsCosts || this.pack.mapkit ? 'yes' : 'no'}`;
    const opts: DecisionOption[] = [
      { key: 'revise', label: 'Revise the plan', kind: KIND_NEUTRAL },
      { key: 'eat', label: `Eat a ration (+${fmtG(RATION_ENERGY)} energy, ${fmtG(RATION_HOURS * 60)} min)`, kind: KIND_SAFE },
      { key: 'rest', label: `Rest an hour (+${fmtG(REST_ENERGY)} energy)`, kind: KIND_SAFE },
      { key: 'close', label: 'Close the notebook', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'revise') this.planDialog('notebook');
      else if (k === 'eat') {
        if (this.rations <= 0) {
          this._log(E.PLAYER_INTERACTION, 'invalid_attempt', { object_id: 'eat', novel: false, reason: 'no_rations' });
          this.say('You have no rations left.', 2000);
        } else {
          this.rations -= 1;
          this.energy = Math.min(100.0, this.energy + RATION_ENERGY);
          this.clockH += RATION_HOURS;
          this._log(E.RESOURCE_USED, 'eat_ration', {
            energy: RATION_ENERGY,
            energy_before: pyRound(this.energy - RATION_ENERGY, 1),
            rations_left: this.rations,
            clock: pyRound(this.clockH, 2),
          });
        }
      } else if (k === 'rest') {
        this.energy = Math.min(100.0, this.energy + REST_ENERGY);
        this.clockH += REST_HOURS;
        this._log(E.RESOURCE_USED, 'rest', {
          energy: REST_ENERGY,
          energy_before: pyRound(this.energy - REST_ENERGY, 1),
          clock: pyRound(this.clockH, 2),
        });
      }
    };
    this.openChoice('l5_notebook', CAT_PLANNING, 'Expedition Notebook', body, opts, chosen);
  }

  restCamp(): void {
    this._log(E.PLAYER_INTERACTION, 'visit_rest_camp', { object_id: 'rest', novel: false });
    const opts: DecisionOption[] = [
      { key: 'rest_camp', label: 'Rest properly (+25 energy, 1.5h)', kind: KIND_SAFE },
      { key: 'move_on', label: 'Keep moving', kind: KIND_RISKY },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.key === 'rest_camp') {
        this.energy = Math.min(100.0, this.energy + 25);
        this.clockH += 1.5;
        this._log(E.RESOURCE_USED, 'rest', { energy: 25, hours: 1.5, clock: pyRound(this.clockH, 2), at: 'rest_camp' });
      }
    };
    this.openChoice('l5_restcamp', CAT_RISK, 'Rest Camp', 'A sheltered camp. Time passes while you rest.', opts, chosen);
  }

  talkMira(): void {
    const first = !this.talked.has('mira');
    this.talked.add('mira');
    if (first) {
      this.prep('scout');
      this.log.log(E.NPC_INTERACTION, { action: 'initiated_by_player', encounter_id: 'mira', npc: 'mira', actor: 'player', stage: this.stage });
    }
    this.miraTurn(1);
  }

  private miraTurn(turn: number): void {
    const opts: DecisionOption[] = [];
    if (!this.knowsWashout) opts.push({ key: 'mira_ask', label: 'Ask about trail conditions', kind: KIND_CHECK });
    if (!this.withMira) {
      opts.push({ key: 'mira_join', label: 'Ask her to come along (+2 pack space, but she slows each leg)', kind: KIND_PROSOCIAL });
    }
    opts.push({ key: 'mira_bye', label: 'Say goodbye', kind: KIND_EXIT });
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k !== 'mira_bye') {
        this.log.log(E.NPC_INTERACTION, { action: 'dialogue_turn', encounter_id: 'mira', npc: 'mira', actor: 'player', stage: this.stage });
      }
      if (k === 'mira_ask') {
        this.knowsWashout = true;
        this.infoSincePlan = true;
        this._log(E.INFO_SEEKING, 'ask_scout_conditions', { source: 'mira', first_time: true });
        const box = this.openMessage(
          'Scout Mira',
          'A stream sometimes washes out the second half of a trail. Rope helps, and you can cross between trails at the gaps in the rock wall.',
          { speaker: 'Mira' },
        );
        box.onClose = () => this.miraTurn(turn + 1);
      } else if (k === 'mira_join') {
        this.withMira = true;
        this._log(E.COOPERATION_ACTION, 'invite_scout', { npc: 'mira', mode: 'accept_help', capacity: this.capacity });
        this.say('Mira joins the expedition.', 2400);
        this.bump();
        this.miraTurn(turn + 1);
      }
    };
    this.openChoice(`l5_mira_t${turn}`, CAT_SOCIAL, 'Scout Mira', turn === 1 ? 'Mira knows these mountains well.' : 'Anything else?', opts, chosen, {
      speaker: 'Mira',
      context: { npc: 'mira', turn },
    });
  }

  talkTariq(): void {
    if (this.talked.has('tariq')) {
      this.say('Tariq is already on his way.', 1800);
      return;
    }
    this.talked.add('tariq');
    this.log.log(E.NPC_INTERACTION, { action: 'initiated_by_player', encounter_id: 'tariq', npc: 'tariq', actor: 'player', stage: this.stage });
    const opts: DecisionOption[] = [
      {
        key: 'tariq_help',
        label: `Help carry his cart over the stream (-${fmtG(PORTER_HELP[0])}h, -${fmtG(PORTER_HELP[1])} energy)`,
        kind: KIND_PROSOCIAL,
      },
      { key: 'tariq_share', label: 'Give him one of your ration packs', kind: KIND_PROSOCIAL },
      { key: 'tariq_pass', label: 'Wish him luck and keep going', kind: KIND_IGNORE },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'tariq_help') {
        this.helpedPorter = true;
        this.spend(PORTER_HELP[0], PORTER_HELP[1], 'help porter');
        this._log(E.HELP_ACTION, 'help_porter', { npc: 'tariq', cost_hours: PORTER_HELP[0], cost_energy: PORTER_HELP[1], outcome: 'helped' });
      } else if (k === 'tariq_share') {
        if (this.rations > 0) {
          this.rations -= 1;
          this._log(E.SHARE_ACTION, 'share_ration', { npc: 'tariq', outcome: 'shared' });
        } else {
          this._log(E.PLAYER_INTERACTION, 'invalid_attempt', { object_id: 'share', novel: false, reason: 'no_rations' });
          this.say('You have no rations to give.', 2000);
        }
      }
    };
    this.openChoice(
      'l5_tariq',
      CAT_HELP,
      'Porter Tariq',
      "Tariq's cart is stuck at the stream. He looks tired and worried about getting it across before dark. Whatever you do, he is grateful - there is no reward.",
      opts,
      chosen,
      { speaker: 'Tariq', context: { npc: 'tariq' } },
    );
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'clock', value: fmtClock(this.clockH) },
      { label: 'energy', value: String(Math.max(0, pyRoundInt(this.energy))) },
      { label: 'rations', value: String(this.rations) },
    ];
  }
}
