/**
 * Level 6 - Flood Response Simulation (adaptive crisis). Port of game/levels/level6_crisis.py.
 *
 * Three stages with action points (AP), shared resources that carry forward, four NPC desks with competing requests,
 * a neighbouring town asking for help, forecasts that can be sought out and consequences that carry into later stages.
 * Completely deterministic; no real-time countdown; always completes (the final review is not used for scoring).
 */
import {
  CAT_COOPERATION,
  CAT_HELP,
  CAT_PLANNING,
  CAT_SOCIAL,
  EventType as E,
  KIND_CHECK,
  KIND_EXIT,
  KIND_NEUTRAL,
  KIND_PROSOCIAL,
  KIND_RISKY,
  KIND_SAFE,
  KIND_SELFISH,
  KIND_SOCIAL,
} from '../game-engine/events';
import { InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw } from '../game-engine/logger';
import { pyRoundInt } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';
import { nearestStation } from './common';

export const STAGES = 3;
export const AP_PER_STAGE = 10;
export const START = { sandbags: 8, volunteers: 6, vehicles: 2, medkits: 3 };
export const RESUPPLY: Record<number, number> = { 1: 0, 2: 2, 3: 4 };
export type Site = 'clinic' | 'school' | 'market' | 'farms';
export const SITE_KEYS: Site[] = ['clinic', 'school', 'market', 'farms'];
export const SITES: Record<Site, { name: string; people: number; label: string }> = {
  clinic: { name: 'Riverside Clinic', people: 12, label: 'Clinic' },
  school: { name: 'Hillview School', people: 40, label: 'School' },
  market: { name: 'Old Market', people: 20, label: 'Market' },
  farms: { name: 'Low Farms', people: 6, label: 'Farms' },
};
export const RISK: Record<number, Record<Site, number>> = {
  1: { clinic: 3, school: 3, market: 3, farms: 2 },
  2: { clinic: 5, school: 5, market: 5, farms: 4 },
  3: { clinic: 3, school: 4, market: 4, farms: 3 },
};
export const REPORTED_CLINIC_STAGE1 = 2;
interface Package {
  label: string;
  pts: number;
  sand?: number;
  vol?: number;
  once?: boolean;
}
export const PACKAGES: [string, Package][] = [
  ['sand2', { label: 'Sandbag crew: 2 sandbags (+2 protection)', pts: 2, sand: 2 }],
  ['sand4', { label: 'Sandbag wall: 4 sandbags (+4 protection)', pts: 4, sand: 4 }],
  ['crew2', { label: 'Volunteer team: 2 volunteers (+2 protection)', pts: 2, vol: 2 }],
  ['improv', { label: 'Improvised barrier: 1 volunteer + boards (+3, once per stage)', pts: 3, vol: 1, once: true }],
];
const PACKAGE = Object.fromEntries(PACKAGES) as Record<string, Package>;
export const EVAC: Record<Site, { vehicle?: number; medkit?: number; vol?: number }> = {
  clinic: { vehicle: 1, medkit: 1 },
  school: { vehicle: 1 },
  market: { vol: 2 },
  farms: { vehicle: 1, vol: 2 },
};
export const EVAC_LABEL: Record<Site, string> = {
  clinic: 'Evacuate patients (1 vehicle + 1 medkit)',
  school: 'Evacuate the school (1 vehicle)',
  market: 'Close the market early (2 volunteers)',
  farms: 'Move families and livestock (1 vehicle + 2 volunteers)',
};
export const STATIONS: Record<string, Rect> = {
  map: R(60, 90, 160, 80),
  radio: R(300, 90, 120, 80),
  yard: R(500, 90, 140, 80),
  depot: R(720, 90, 150, 80),
  board: R(940, 90, 130, 80),
  clinic: R(60, 430, 120, 80),
  school: R(260, 430, 120, 80),
  farms: R(460, 430, 120, 80),
  council: R(660, 430, 120, 80),
  hotline: R(860, 430, 140, 80),
};
export const LABEL: Record<string, string> = {
  map: 'Situation Map',
  radio: 'Radio',
  yard: 'Supply Yard',
  depot: 'Depot',
  board: 'Stage Board',
  clinic: 'Clinic Desk',
  school: 'School Desk',
  farms: 'Farm Desk',
  council: 'Councillor',
  hotline: 'Neighbour Town',
};
export const COLOR: Record<string, [number, number, number]> = {
  map: [60, 100, 90],
  radio: [90, 80, 140],
  yard: [140, 110, 60],
  depot: [150, 80, 70],
  board: [70, 110, 150],
  clinic: [160, 70, 90],
  school: [80, 120, 160],
  farms: [110, 130, 70],
  council: [120, 90, 120],
  hotline: [70, 130, 130],
};
export const NPC_OF: Record<string, string> = { clinic: 'rania', school: 'dawood', farms: 'sana', council: 'imran', hotline: 'aziz' };
export const PRIORITIES: [string, string][] = [
  ['people', 'People first (evacuate before protecting buildings)'],
  ['property', 'Protect buildings and livelihoods'],
  ['balanced', 'Balance both'],
  ['flexible', 'No fixed priority - I will decide as things develop'],
];
const INVALID_TEXT: Record<string, string> = {
  no_sand: 'Not enough sandbags.',
  no_vol: 'Not enough free volunteers.',
  no_vehicle: 'No vehicle is free.',
  no_medkit: 'No medkits left.',
  once: 'The improvised barrier was already built this stage.',
  already: 'That site is already evacuated.',
};

interface Assigned {
  sand: number;
  vol: number;
  pts: number;
  improv: boolean;
}
const sorted = (xs: Iterable<string>) => Array.from(xs).sort();

export class CrisisLevel extends Level {
  readonly levelId = 6;
  readonly name = 'Flood Response Simulation';
  readonly scenario = 'crisis';
  readonly objective = "Coordinate the town's flood response over three stages with limited action points.";
  readonly taskName = 'coordinate_flood_response';
  readonly startPos: [number, number] = [550, 300];
  readonly controlsHint = 'Walk to a desk and tap the action button. Nothing is timed in real time - only action points count.';

  stage!: number;
  ap!: number;
  res!: { sandbags: number; volunteers: number; vehicles: number; medkits: number };
  assigned!: Record<Site, Assigned>;
  vehiclesUsed!: number;
  vehiclesCap!: number;
  lentVehicle!: boolean;
  lentVolunteers!: number;
  bonusVol!: number;
  evacVolUsed!: number;
  improvUsed!: boolean;
  evacuated!: Set<string>;
  partial!: Record<string, number>;
  damaged!: Set<string>;
  heldLog!: Map<number, Record<string, boolean>>;
  knownClinicFixed!: boolean;
  known!: Set<string>;
  topicsUsed!: Record<string, number>;
  met!: Set<string>;
  requests!: Record<string, boolean>;
  aidRequested!: boolean;
  aidIncoming!: number;
  councilSupport!: number;
  councilCommit!: number | null;
  priority!: string | null;
  planStages!: Set<number>;
  lastMapSig!: string | null;
  lastActionMs!: number;
  afterReport!: boolean;
  afterReportSetback!: boolean;
  afterReportMs!: number;
  newInfoPending!: number;
  corrections!: number;
  stageFlooded!: boolean;
  azizAsked!: boolean;
  finalReview!: string[];
  private introPending!: boolean;

  build(): void {
    this.stage = 1;
    this.ap = AP_PER_STAGE;
    this.res = { ...START };
    this.assigned = {} as Record<Site, Assigned>;
    for (const s of SITE_KEYS) this.assigned[s] = { sand: 0, vol: 0, pts: 0, improv: false };
    this.vehiclesUsed = 0;
    this.vehiclesCap = START.vehicles;
    this.lentVehicle = false;
    this.lentVolunteers = 0;
    this.bonusVol = 0;
    this.evacVolUsed = 0;
    this.improvUsed = false;
    this.evacuated = new Set();
    this.partial = {};
    this.damaged = new Set();
    this.heldLog = new Map();
    this.knownClinicFixed = false;
    this.known = new Set();
    this.topicsUsed = {};
    this.met = new Set();
    this.requests = { clinic: true, school: true, farms: true, council: true, hotline: true };
    this.aidRequested = false;
    this.aidIncoming = 0;
    this.councilSupport = 0;
    this.councilCommit = null;
    this.priority = null;
    this.planStages = new Set();
    this.lastMapSig = null;
    this.lastActionMs = this.session.clock.ms;
    this.afterReport = true;
    this.afterReportSetback = false;
    this.afterReportMs = this.session.clock.ms;
    this.newInfoPending = 0;
    this.corrections = 0;
    this.stageFlooded = false;
    this.azizAsked = false;
    this.finalReview = [];
    this.introPending = true;
  }

  levelStartMetadata(): Kw {
    return {
      stages: STAGES,
      ap_per_stage: AP_PER_STAGE,
      sites: [...SITE_KEYS],
      npcs_total: 5,
      info_sources_total: 6,
      start_resources: { ...START },
      decision_stages: [1, 2, 3],
    };
  }

  solids(): Rect[] {
    return Object.values(STATIONS);
  }

  private _log(etype: string, action: string | null, kw: Kw = {}) {
    const k: Kw = { ...kw };
    if (!('stage' in k)) k.stage = `stage${this.stage}`;
    if (!('actor' in k)) k.actor = 'player';
    return this.log.log(etype, { action, ...k });
  }

  private noteAction(kind: string): void {
    const now = this.session.clock.ms;
    if (this.afterReport) {
      this.afterReport = false;
      this._log(E.PLAYER_INTERACTION, 'first_action_in_stage', {
        object_id: kind,
        novel: false,
        latency_ms: pyRoundInt(now - this.afterReportMs),
        setback: this.afterReportSetback,
        stage_no: this.stage,
      });
    } else {
      this._log(E.PLAYER_INTERACTION, 'action_gap', { object_id: kind, novel: false, gap_ms: pyRoundInt(now - this.lastActionMs) });
    }
    this.lastActionMs = now;
  }

  spendAp(n: number, reason: string): boolean {
    if (this.ap < n) {
      this._log(E.PLAYER_INTERACTION, 'invalid_attempt', { object_id: reason, novel: false, reason: 'not_enough_ap' });
      this.say('Not enough action points left in this stage.', 2200);
      return false;
    }
    this.ap -= n;
    this._log(E.RESOURCE_USED, 'spend_ap', { resource: 'ap', amount: n, ap_left: this.ap, reason });
    return true;
  }

  risk(site: Site): number {
    return RISK[this.stage][site] + (this.damaged.has(site) ? 1 : 0);
  }

  believedRisk(site: Site): number {
    if (this.stage === 1 && site === 'clinic' && !this.knownClinicFixed) return REPORTED_CLINIC_STAGE1;
    return this.risk(site);
  }

  volFree(): number {
    const lent = this.stage === 3 ? this.lentVolunteers : 0;
    let assignedVol = 0;
    for (const s of SITE_KEYS) assignedVol += this.assigned[s].vol;
    return this.res.volunteers - lent - assignedVol - this.evacVolUsed;
  }

  vehFree(): number {
    return this.vehiclesCap - this.vehiclesUsed - (this.lentVehicle && this.stage === 3 ? 1 : 0);
  }

  pts(site: Site): number {
    return this.assigned[site].pts;
  }

  onUpdate(_dt: number, _inp: InputState): void {
    if (this.introPending) {
      this.introPending = false;
      const box = this.openMessage('Flood warning', '', {
        lines: [
          'The river is rising and the town will be flooded in waves over three stages.',
          'Each stage you have 10 action points (AP). Radio checks, orders, calls and talks cost AP.',
          'Four places need protection: Clinic, School, Market, Farms. Protection points must reach the',
          'risk level shown on the map. Sandbags are used up; volunteers and vehicles return each stage.',
          'You may ask for information, change orders, talk to people and ask the neighbour town for help.',
          'Use the Stage Board to end a stage when you are ready. There is no real-time clock.',
        ],
      });
      box.onClose = () => this.afterReportClosed();
    }
  }

  interactHint(): string | null {
    const st = nearestStation(this.player, STATIONS);
    return st ? LABEL[st] : null;
  }

  onInteract(): void {
    const st = nearestStation(this.player, STATIONS);
    if (st === null) return;
    this.noteAction(st);
    if (st === 'map') this.openMap();
    else if (st === 'radio') this.openRadio();
    else if (st === 'yard') this.openYard();
    else if (st === 'depot') this.openDepot();
    else if (st === 'board') this.openBoard();
    else this.openNpc(st);
  }

  // ---- map
  openMap(): void {
    const sig = JSON.stringify([
      this.stage,
      this.ap,
      [...SITE_KEYS].sort().map((k) => [k, this.assigned[k].pts]),
      sorted(this.known),
      this.knownClinicFixed,
      sorted(this.damaged),
      sorted(this.evacuated),
    ]);
    const redundant = sig === this.lastMapSig;
    this.lastMapSig = sig;
    const first = !this.known.has('map');
    this.known.add('map');
    this._log(E.INFO_SEEKING, redundant ? 'recheck_map' : 'review_map', { source: 'map', redundant, first_time: first });
    const lines = [`STAGE ${this.stage} of ${STAGES}      AP left: ${this.ap}`];
    for (const k of SITE_KEYS) {
      const s = SITES[k];
      const tags: string[] = [];
      if (this.evacuated.has(k)) tags.push('evacuated');
      if (this.damaged.has(k)) tags.push('damaged (+1 risk)');
      if (this.stage === 1 && k === 'clinic' && !this.knownClinicFixed) tags.push('gauge reading may be out of date');
      lines.push(
        `${s.label.padEnd(8)} reported risk ${this.believedRisk(k)}   assigned ${this.pts(k)}   people ${s.people}  ` + tags.join(', '),
      );
    }
    lines.push(
      `Sandbags ${this.res.sandbags}  Volunteers free ${this.volFree()}  Vehicles free ${this.vehFree()}  Medkits ${this.res.medkits}`,
    );
    this.openMessage('Situation Map', '', { lines });
  }

  // ---- radio
  openRadio(): void {
    const opts: DecisionOption[] = [
      { key: 'forecast', label: 'River forecast (1 AP)', kind: KIND_CHECK },
      { key: 'roads', label: 'Road report (1 AP)', kind: KIND_CHECK },
      { key: 'gauge', label: 'Re-read the clinic gauge (1 AP)', kind: KIND_CHECK },
      { key: 'leave', label: 'Switch the radio off', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'leave') return;
      if (!this.spendAp(1, `radio_${k}`)) return;
      const n = this.topicsUsed[k] ?? 0;
      const redundant = n >= 1;
      this.topicsUsed[k] = n + 1;
      this.known.add('radio_' + k);
      const [text, nw] = this.radioText(k);
      this._log(E.INFO_SEEKING, redundant ? 'recheck_' + k : 'ask_' + k, {
        source: `radio_${k}`,
        redundant,
        first_time: !redundant,
        revealed_new: nw,
      });
      if (nw) this.newInfoPending += 1;
      const box = this.openMessage('Radio', text, { speaker: 'Control room' });
      box.onClose = this.ap > 0 ? () => this.openRadio() : null;
    };
    const used = Object.values(this.topicsUsed).reduce((a, b) => a + b, 0);
    this.openChoice(`l6_radio_s${this.stage}_${used}`, CAT_SOCIAL, 'Radio', `What do you want to find out? (${this.ap} AP left)`, opts, chosen, {
      context: { stage_no: this.stage },
    });
  }

  private radioText(k: string): [string, boolean] {
    if (k === 'forecast') {
      if (this.stage === 1) {
        this.known.add('dam');
        return [
          'The dam will release water before stage 2: every site\'s risk rises by 2, and the supply truck will be delayed (only 2 sandbags arrive). Evacuating or stockpiling now is possible.',
          true,
        ];
      }
      if (this.stage === 2) {
        this.known.add('recession');
        return ['After this stage the river starts to fall: risks drop by 2 in stage 3 compared with now.', true];
      }
      return ['The river is falling. This is the last stage.', false];
    }
    if (k === 'roads') {
      if (this.stage <= 2) {
        this.known.add('road');
        return [
          'A landslide will close one of the two routes at the start of stage 3: only one vehicle will be able to get through. Vehicle-based evacuations are easier before then.',
          true,
        ];
      }
      return ['One route is closed. Only one vehicle can pass this stage.', false];
    }
    if (this.stage === 1 && !this.knownClinicFixed) {
      this.knownClinicFixed = true;
      return ['The clinic gauge was misread: the water there is already higher. Its true risk is 3, not 2.', true];
    }
    return ['No new reading from the clinic gauge.', false];
  }

  // ---- supply yard
  openYard(): void {
    const opts: DecisionOption[] = [
      { key: 'fill', label: 'Fill sandbags yourself (+3 sandbags, 1 AP)', kind: KIND_NEUTRAL },
      { key: 'call', label: 'Call for community volunteers (+2 volunteers this stage, 1 AP)', kind: KIND_SOCIAL },
      { key: 'leave', label: 'Leave the yard', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'leave') return;
      if (!this.spendAp(1, `yard_${k}`)) return;
      if (k === 'fill') {
        this.res.sandbags += 3;
        this._log(E.RESOURCE_USED, 'fill_sandbags', { resource: 'sandbags', amount: 3, mode: 'solo', ap_cost: 1 });
        this.say('You fill 3 sandbags yourself.', 2000);
      } else {
        this.res.volunteers += 2;
        this.bonusVol += 2;
        this._log(E.COOPERATION_ACTION, 'call_volunteers', { mode: 'collaborate', resource: 'volunteers', amount: 2, ap_cost: 1 });
        this.say('Two more volunteers join for this stage.', 2000);
      }
      if (this.ap > 0) this.openYard();
    };
    this.openChoice(
      `l6_yard_s${this.stage}_${this.ap}`,
      CAT_PLANNING,
      'Supply Yard',
      `Do the work yourself or bring in others? (${this.ap} AP left)`,
      opts,
      chosen,
      { context: { stage_no: this.stage } },
    );
  }

  // ---- depot
  openDepot(): void {
    const opts: DecisionOption[] = SITE_KEYS.map((s) => ({
      key: s,
      label:
        `${SITES[s].label}: risk ${this.believedRisk(s)}, assigned ${this.pts(s)}` +
        (this.evacuated.has(s) ? '  [evacuated]' : '') +
        (this.damaged.has(s) ? '  [damaged]' : ''),
      kind: KIND_NEUTRAL,
    }));
    opts.push({ key: 'done', label: 'Done at the depot', kind: KIND_EXIT });
    const chosen = (o: DecisionOption) => {
      if (o.key === 'done') return;
      this.siteOrders(o.key as Site);
    };
    const totalPts = SITE_KEYS.reduce((a, s) => a + this.pts(s), 0);
    this.openChoice(
      `l6_depot_s${this.stage}_${this.ap}_${totalPts}`,
      CAT_PLANNING,
      'Depot',
      `Which site do you want to give orders for? (${this.ap} AP left; each order costs 1 AP)`,
      opts,
      chosen,
      { context: { stage_no: this.stage } },
    );
  }

  private siteOrders(site: Site): void {
    const a = this.assigned[site];
    const opts: DecisionOption[] = PACKAGES.map(([k, p]) => ({ key: k, label: p.label, kind: KIND_NEUTRAL }));
    opts.push({ key: 'evac', label: EVAC_LABEL[site], kind: KIND_SAFE });
    if (this.damaged.has(site)) opts.push({ key: 'repair', label: 'Repair crew: 1 volunteer, removes the damage', kind: KIND_NEUTRAL });
    if (a.pts > 0 || a.vol > 0) {
      opts.push({ key: 'recall', label: `Recall everything assigned here (${a.pts} protection) - change your mind`, kind: KIND_NEUTRAL });
    }
    opts.push({ key: 'back', label: 'Back', kind: KIND_EXIT });
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'back') {
        this.openDepot();
        return;
      }
      const why = this.whyNot(site, k);
      if (why) {
        this.invalid(k, why);
        this.openDepot();
        return;
      }
      if (!this.spendAp(1, `order_${k}`)) return;
      if (k === 'recall') {
        this.res.sandbags += a.sand;
        const reverts = a.pts;
        this._log(E.RESOURCE_ALLOCATED, 'recall', {
          site,
          resource: 'mixed',
          amount: reverts,
          ap_cost: 1,
          reverts_prior: true,
          after_new_info: this.newInfoPending > 0,
          buffer: 0,
        });
        if (this.newInfoPending > 0) this.corrections += 1;
        Object.assign(a, { sand: 0, vol: 0, pts: 0, improv: false });
        this.say(`Resources recalled from ${SITES[site].label}.`, 2000);
      } else if (k === 'evac') {
        this.applyEvac(site, 'depot');
      } else if (k === 'repair') {
        a.vol += 1;
        this.damaged.delete(site);
        this.corrections += 1;
        this._log(E.RESOURCE_ALLOCATED, 'repair', { site, resource: 'volunteers', amount: 1, ap_cost: 1, corrective: true });
      } else {
        this.dispatch(site, k);
      }
      this.bump();
      if (this.ap > 0) this.openDepot();
    };
    this.openChoice(
      `l6_orders_${site}_s${this.stage}_${this.ap}`,
      CAT_PLANNING,
      SITES[site].name,
      `Believed risk ${this.believedRisk(site)}; protection assigned ${a.pts}. (${this.ap} AP left)`,
      opts,
      chosen,
      { context: { stage_no: this.stage, site } },
    );
  }

  private whyNot(site: Site, key: string): string | null {
    if (key === 'back' || key === 'recall') return null;
    if (key === 'evac') {
      const need = EVAC[site];
      if (this.evacuated.has(site)) return 'already';
      if ((need.vehicle ?? 0) > this.vehFree()) return 'no_vehicle';
      if ((need.medkit ?? 0) > this.res.medkits) return 'no_medkit';
      if ((need.vol ?? 0) > this.volFree()) return 'no_vol';
      return null;
    }
    if (key === 'repair') return this.volFree() >= 1 ? null : 'no_vol';
    const p = PACKAGE[key];
    if ((p.sand ?? 0) > this.res.sandbags) return 'no_sand';
    if ((p.vol ?? 0) > this.volFree()) return 'no_vol';
    if (p.once && this.improvUsed) return 'once';
    return null;
  }

  private invalid(what: string, why: string): void {
    this._log(E.PLAYER_INTERACTION, 'invalid_attempt', { object_id: what, novel: false, reason: why });
    this.say(INVALID_TEXT[why] ?? 'That is not possible right now.', 2400);
  }

  private dispatch(site: Site, key: string): void {
    const p = PACKAGE[key];
    const a = this.assigned[site];
    this.res.sandbags -= p.sand ?? 0;
    a.sand += p.sand ?? 0;
    a.vol += p.vol ?? 0;
    a.pts += p.pts;
    if (p.once) this.improvUsed = true;
    const known = this.believedRisk(site);
    const buffer = Math.max(0, a.pts - Math.trunc(known));
    this._log(E.RESOURCE_ALLOCATED, 'dispatch', {
      site,
      package: key,
      resource: p.sand ? 'sand' : 'volunteers',
      amount: p.sand !== undefined ? p.sand : p.vol ?? 0,
      pts_added: p.pts,
      pts_after: a.pts,
      known_risk: known,
      buffer,
      novel: key === 'improv',
      ap_cost: 1,
      outcome: 'assigned',
    });
    this.say(`${SITES[site].label}: protection now ${a.pts} (believed risk ${known}).`, 2400);
  }

  private applyEvac(site: Site, via: string): void {
    const need = EVAC[site];
    this.vehiclesUsed += need.vehicle ?? 0;
    this.res.medkits -= need.medkit ?? 0;
    this.evacVolUsed += need.vol ?? 0;
    this.evacuated.add(site);
    this._log(E.RESOURCE_ALLOCATED, 'evacuate', {
      site,
      resource: 'vehicle',
      amount: need.vehicle ?? 0,
      ap_cost: 1,
      early_warning: this.known.has('dam') && this.stage === 1,
      outcome: 'evacuated',
      via,
    });
    this.say(`${SITES[site].label} evacuated: people are safe.`, 2600);
    this.bump();
  }

  private npcEvac(site: Site, npc: string, label: string): void {
    const why = this.whyNot(site, 'evac');
    if (why) {
      this.invalid('evac', why);
      return;
    }
    if (this.spendAp(1, `${npc}_evac`)) {
      this.applyEvac(site, 'npc_request');
      this._log(E.HELP_ACTION, label, { npc, outcome: 'helped', ap_cost: 1 });
    }
  }

  // ---- stage board
  openBoard(): void {
    const opts: DecisionOption[] = [
      { key: 'priority', label: "Set / change this stage's priority", kind: KIND_NEUTRAL },
      { key: 'end', label: `End stage ${this.stage} now (${this.ap} AP unused)`, kind: KIND_RISKY },
      { key: 'keep', label: 'Keep working', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.key === 'priority') this.priorityDialog();
      else if (o.key === 'end') this.endStage();
    };
    this.openChoice(
      `l6_board_s${this.stage}_${this.ap}`,
      CAT_PLANNING,
      'Stage Board',
      `Stage ${this.stage}/${STAGES}.  Unassigned: ${this.res.sandbags} sandbags, ${Math.max(0, this.volFree())} volunteers.`,
      opts,
      chosen,
      { context: { stage_no: this.stage } },
    );
  }

  private stageStartPrompt(): void {
    this.priorityDialog(true);
  }

  private priorityDialog(optional = false): void {
    const opts: DecisionOption[] = PRIORITIES.map(([k, v]) => ({ key: k, label: v, kind: KIND_NEUTRAL }));
    if (optional) opts.push({ key: 'skip', label: 'Skip - start working', kind: KIND_EXIT });
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'skip') {
        this._log(E.PLAN_ACTION, 'skip', { task_id: 'stage_priority', outcome: 'skipped', stage_no: this.stage });
        return;
      }
      const mode = this.priority === null ? 'create' : 'revise';
      const trig = mode === 'revise' && this.newInfoPending > 0 ? 'new_info' : mode === 'create' ? 'initial' : 'none';
      this._log(E.PLAN_ACTION, mode, {
        task_id: 'stage_priority',
        priority: k,
        previous: this.priority,
        trigger: trig,
        changed: k !== this.priority,
        stage_no: this.stage,
        outcome: 'committed',
      });
      if (mode === 'revise' && k !== this.priority && this.newInfoPending > 0) this.corrections += 1;
      this.priority = k;
      this.planStages.add(this.stage);
      this.newInfoPending = 0;
    };
    this.openChoice(
      `l6_priority_s${this.stage}_${this.planStages.size}`,
      CAT_PLANNING,
      `Stage ${this.stage}: your priority`,
      'What matters most to you right now? This is only a note to yourself - it does not change the rules.',
      opts,
      chosen,
      { context: { stage_no: this.stage } },
    );
  }

  // ---- NPC desks
  openNpc(desk: string): void {
    const npc = NPC_OF[desk];
    this.requests[desk] = false;
    this.bump();
    const first = !this.met.has(npc);
    if (first) {
      this.met.add(npc);
      this.log.log(E.NPC_INTERACTION, { action: 'initiated_by_player', encounter_id: npc, npc, actor: 'player', stage: `stage${this.stage}` });
    }
    if (npc === 'rania') this.npcRania();
    else if (npc === 'dawood') this.npcDawood();
    else if (npc === 'sana') this.npcSana();
    else if (npc === 'imran') this.npcImran();
    else if (npc === 'aziz') this.npcAziz();
  }

  private talkTurn(npc: string): void {
    this.log.log(E.NPC_INTERACTION, { action: 'dialogue_turn', encounter_id: npc, npc, actor: 'player', stage: `stage${this.stage}` });
  }

  private npcRania(): void {
    if (this.evacuated.has('clinic')) {
      this.openMessage('Nurse Rania', 'The patients are safe, thank you.', { speaker: 'Rania' });
      return;
    }
    const opts: DecisionOption[] = [
      { key: 'rania_evac', label: 'Send a vehicle and medkit now: evacuate patients (1 AP)', kind: KIND_PROSOCIAL },
      { key: 'rania_ask', label: 'Ask what she needs and how bad it is (free)', kind: KIND_CHECK },
      { key: 'rania_later', label: 'Promise help later this stage', kind: KIND_NEUTRAL },
      { key: 'rania_hold', label: 'Tell her the clinic must stay open and hold', kind: KIND_SELFISH },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      this.talkTurn('rania');
      if (k === 'rania_evac') this.npcEvac('clinic', 'rania', 'help_clinic');
      else if (k === 'rania_ask') {
        this._log(E.INFO_SEEKING, 'ask_rania', { source: 'npc_rania', redundant: false, first_time: true });
        this.known.add('npc_rania');
        const box = this.openMessage(
          'Nurse Rania',
          "Twelve patients, four can't walk. The water is already at the back door - the official gauge reading looks too low to me.",
          { speaker: 'Rania' },
        );
        box.onClose = () => this.npcRania();
      } else if (k === 'rania_hold') {
        this._log(E.PLAYER_INTERACTION, 'decline_request', { object_id: 'rania', novel: false, outcome: 'declined' });
      } else {
        this._log(E.PLAYER_INTERACTION, 'defer_request', { object_id: 'rania', novel: false, outcome: 'deferred' });
      }
    };
    this.openChoice(
      `l6_rania_s${this.stage}_${this.ap}`,
      CAT_HELP,
      'Nurse Rania',
      'We have twelve patients and the water is rising. Can you get us out?',
      opts,
      chosen,
      { speaker: 'Rania', context: { npc: 'rania', stage_no: this.stage } },
    );
  }

  private npcDawood(): void {
    if (this.evacuated.has('school')) {
      this.openMessage('Principal Dawood', 'The children are safe at the hill shelter.', { speaker: 'Dawood' });
      return;
    }
    const opts: DecisionOption[] = [
      { key: 'dawood_bags', label: 'Send 3 sandbags to the school (1 AP, uses your sandbags)', kind: KIND_PROSOCIAL },
      { key: 'dawood_evac', label: 'Evacuate the school with a vehicle (1 AP)', kind: KIND_PROSOCIAL },
      { key: 'dawood_parents', label: 'Ask parents to collect the children (free, only part will be collected)', kind: KIND_NEUTRAL },
      { key: 'dawood_no', label: 'Say you cannot help the school right now', kind: KIND_SELFISH },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      this.talkTurn('dawood');
      if (k === 'dawood_bags') {
        if (this.res.sandbags < 3) this.invalid('dawood_bags', 'no_sand');
        else if (this.spendAp(1, 'dawood_bags')) {
          this.res.sandbags -= 3;
          this.assigned.school.sand += 3;
          this.assigned.school.pts += 3;
          this._log(E.HELP_ACTION, 'help_school', { npc: 'dawood', outcome: 'helped', ap_cost: 1 });
          this._log(E.RESOURCE_ALLOCATED, 'dispatch', {
            site: 'school',
            package: 'sand3_request',
            resource: 'sand',
            amount: 3,
            pts_added: 3,
            pts_after: this.assigned.school.pts,
            known_risk: this.believedRisk('school'),
            buffer: Math.max(0, this.assigned.school.pts - Math.trunc(this.believedRisk('school'))),
            ap_cost: 1,
            via: 'npc_request',
          });
          this.bump();
        }
      } else if (k === 'dawood_evac') this.npcEvac('school', 'dawood', 'help_school');
      else if (k === 'dawood_parents') {
        this.partial.school = 0.6;
        this._log(E.HELP_ACTION, 'help_school_light', { npc: 'dawood', outcome: 'partial', ap_cost: 0 });
      } else {
        this._log(E.PLAYER_INTERACTION, 'decline_request', { object_id: 'dawood', novel: false, outcome: 'declined' });
      }
    };
    this.openChoice(
      `l6_dawood_s${this.stage}_${this.ap}`,
      CAT_HELP,
      'Principal Dawood',
      'Forty children are at school and the path to the hill is getting wet. What can you do for us?',
      opts,
      chosen,
      { speaker: 'Dawood', context: { npc: 'dawood', stage_no: this.stage } },
    );
  }

  private npcSana(): void {
    if (this.evacuated.has('farms')) {
      this.openMessage('Farmer Sana', 'Everyone and the animals are on high ground. Thank you.', { speaker: 'Sana' });
      return;
    }
    const opts: DecisionOption[] = [
      { key: 'sana_move', label: 'Send a vehicle and 2 volunteers to move families and livestock (1 AP)', kind: KIND_PROSOCIAL },
      { key: 'sana_advice', label: 'Tell them to lead the animals to high ground themselves (free)', kind: KIND_NEUTRAL },
      { key: 'sana_no', label: 'Explain the farms are the lowest priority', kind: KIND_SELFISH },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      this.talkTurn('sana');
      if (k === 'sana_move') this.npcEvac('farms', 'sana', 'help_farms');
      else if (k === 'sana_advice') {
        this.partial.farms = 0.5;
        this._log(E.HELP_ACTION, 'help_farms_light', { npc: 'sana', outcome: 'partial', ap_cost: 0 });
      } else {
        this._log(E.PLAYER_INTERACTION, 'decline_request', { object_id: 'sana', novel: false, outcome: 'declined' });
      }
    };
    this.openChoice(
      `l6_sana_s${this.stage}_${this.ap}`,
      CAT_HELP,
      'Farmer Sana',
      'The low fields flood first. We have six families and a lot of animals down here.',
      opts,
      chosen,
      { speaker: 'Sana', context: { npc: 'sana', stage_no: this.stage } },
    );
  }

  private npcImran(): void {
    const opts: DecisionOption[] = [
      { key: 'imran_comply', label: 'Agree: the market comes first this stage', kind: KIND_PROSOCIAL },
      { key: 'imran_compromise', label: 'Propose a compromise: the market gets at least 2 protection points', kind: KIND_PROSOCIAL },
      { key: 'imran_refuse', label: "Politely explain that people's safety must come first", kind: KIND_NEUTRAL },
      { key: 'imran_assert', label: 'Tell him you make the decisions and end the discussion', kind: KIND_SELFISH },
      { key: 'imran_input', label: 'Suggest bringing the clinic and school into the discussion (1 AP)', kind: KIND_CHECK },
    ];
    const MODE: Record<string, string> = {
      imran_comply: 'comply',
      imran_compromise: 'compromise',
      imran_refuse: 'refuse_polite',
      imran_assert: 'assert',
      imran_input: 'seek_input',
    };
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      this.talkTurn('imran');
      const mode = MODE[k];
      if (k === 'imran_input' && !this.spendAp(1, 'imran_input')) return;
      this._log(E.NEGOTIATION, mode, { npc: 'imran', stage_no: this.stage, outcome: mode });
      if (k === 'imran_comply') {
        this.councilCommit = Math.trunc(this.risk('market'));
        this.councilSupport += 2;
      } else if (k === 'imran_compromise') {
        this.councilCommit = 2;
        this.councilSupport += 1;
      } else if (k === 'imran_input') {
        this._log(E.INFO_SEEKING, 'seek_input', { source: 'npc_imran', redundant: false, first_time: true });
        this.newInfoPending += 1;
      }
      if (mode === 'comply' || mode === 'compromise') this._log(E.COOPERATION_ACTION, 'council_agreement', { npc: 'imran', mode });
      else if (mode === 'assert') this._log(E.COMPETITION_ACTION, 'override_council', { npc: 'imran', mode });
      if (k === 'imran_comply' || k === 'imran_compromise') this.say('Imran promises extra sandbags next stage in return.', 2800);
      this.requests.council = false;
    };
    this.openChoice(
      `l6_imran_s${this.stage}_${this.ap}`,
      CAT_COOPERATION,
      'Councillor Imran',
      "The Old Market is the town's livelihood. I expect it to be protected before anything else.",
      opts,
      chosen,
      { speaker: 'Imran', context: { npc: 'imran', stage_no: this.stage } },
    );
  }

  private npcAziz(): void {
    let opts: DecisionOption[] = [];
    if (this.stage === 1 && !this.aidRequested) {
      opts.push({ key: 'aziz_aid', label: 'Ask the neighbour town for sandbags (1 AP, they arrive next stage)', kind: KIND_SOCIAL });
    }
    if (this.stage >= 2 && !this.azizAsked) {
      this.azizAsked = true;
      this.log.log(E.ENV_EVENT, { action: 'neighbour_request', actor: 'engine', stage: `stage${this.stage}` });
    }
    if (this.azizAsked) {
      opts = opts.concat([
        { key: 'aziz_vehicle', label: 'Lend them one vehicle for stage 3 (they need it for their own evacuation)', kind: KIND_PROSOCIAL },
        { key: 'aziz_crew', label: 'Lend them two volunteers for stage 3 instead', kind: KIND_PROSOCIAL },
        { key: 'aziz_no', label: 'Explain you need everything you have', kind: KIND_SELFISH },
      ]);
    }
    opts.push({ key: 'aziz_bye', label: 'End the call', kind: KIND_EXIT });
    const body =
      'Mayor Aziz of the neighbouring town. ' +
      (this.azizAsked ? 'They ask for a vehicle for stage 3: their own road is cut off.' : 'They are watching the same river.');
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'aziz_bye') return;
      this.talkTurn('aziz');
      if (k === 'aziz_aid') {
        if (this.spendAp(1, 'aziz_aid')) {
          this.aidRequested = true;
          this.aidIncoming = 4;
          this._log(E.COOPERATION_ACTION, 'request_aid', { npc: 'aziz', mode: 'ask_help', resource: 'sandbags', amount: 4, ap_cost: 1 });
          this.say('Aziz promises 4 sandbags next stage.', 2400);
        }
      } else if (k === 'aziz_vehicle') {
        this.lentVehicle = true;
        this.requests.hotline = false;
        this._log(E.HELP_ACTION, 'lend_vehicle', { npc: 'aziz', outcome: 'helped', cost: 'vehicle' });
      } else if (k === 'aziz_crew') {
        this.lentVolunteers = 2;
        this.requests.hotline = false;
        this._log(E.HELP_ACTION, 'lend_crew', { npc: 'aziz', outcome: 'helped', cost: '2 volunteers' });
      } else if (k === 'aziz_no') {
        this.requests.hotline = false;
        this._log(E.PLAYER_INTERACTION, 'decline_request', { object_id: 'aziz', novel: false, outcome: 'declined' });
      }
    };
    this.openChoice(`l6_aziz_s${this.stage}_${this.ap}`, this.azizAsked ? CAT_HELP : CAT_SOCIAL, 'Neighbour Town', body, opts, chosen, {
      speaker: 'Aziz',
      context: { npc: 'aziz', stage_no: this.stage },
    });
  }

  // ---- stage end
  endStage(): void {
    const stage = this.stage;
    this._log(E.PLAYER_INTERACTION, 'end_stage', {
      object_id: 'board',
      novel: false,
      ap_left: this.ap,
      stage_no: stage,
      idle_sandbags: this.res.sandbags,
      idle_volunteers: Math.max(0, this.volFree()),
    });
    const held: Record<string, boolean> = {};
    const lines = [`Stage ${stage} report`];
    const flooded: string[] = [];
    for (const k of SITE_KEYS) {
      const s = SITES[k];
      const need = this.risk(k);
      const ok = this.pts(k) >= need;
      held[k] = ok;
      const shortfall = need - this.pts(k);
      const avoidable = !ok && this.res.sandbags + Math.max(0, this.volFree()) >= shortfall;
      const status = ok ? 'HELD' : 'FLOODED';
      let extra = '';
      if (this.evacuated.has(k)) extra = ' - people evacuated';
      else if (!ok) extra = ' - people in danger';
      lines.push(`${s.label}: ${status} (${this.pts(k)}/${need})${extra}` + (avoidable ? ' - resources were still unassigned' : ''));
      if (!ok) {
        flooded.push(k);
        this.damaged.add(k);
      }
      this._log(E.PLAYER_INTERACTION, 'site_result', {
        object_id: k,
        novel: false,
        held: ok,
        pts: this.pts(k),
        need,
        evacuated: this.evacuated.has(k),
        avoidable,
        stage_no: stage,
        outcome: ok ? 'held' : 'flooded',
      });
    }
    this.heldLog.set(stage, held);
    if (this.councilCommit !== null) {
      const met = this.pts('market') >= Math.min(this.councilCommit, this.risk('market'));
      lines.push('Councillor Imran: ' + (met ? 'market commitment kept' : 'market commitment NOT met'));
      this._log(E.PLAYER_INTERACTION, 'commitment_check', { object_id: 'imran', novel: false, kept: met, outcome: met ? 'kept' : 'broken' });
      this.councilCommit = null;
    }
    this.stageFlooded = flooded.length > 0;
    this.log.log(E.ENV_EVENT, { action: 'stage_end', actor: 'engine', stage: `stage${stage}`, flooded, ap_left: this.ap });
    this.bump();
    if (stage >= STAGES) {
      this.finalReviewMessage(held, lines);
      return;
    }
    for (const s of SITE_KEYS) Object.assign(this.assigned[s], { sand: 0, vol: 0, pts: 0, improv: false });
    this.vehiclesUsed = 0;
    this.evacVolUsed = 0;
    this.improvUsed = false;
    this.stage += 1;
    this.ap = AP_PER_STAGE;
    this.res.sandbags += RESUPPLY[this.stage] + this.aidIncoming + (this.stage === 2 ? this.councilSupport : 0);
    if (this.aidIncoming) lines.push(`The neighbour town's ${this.aidIncoming} sandbags arrive.`);
    if (this.councilSupport && this.stage === 2) lines.push(`The council releases ${this.councilSupport} extra sandbags.`);
    this.aidIncoming = 0;
    this.councilSupport = 0;
    this.res.volunteers -= this.bonusVol;
    this.bonusVol = 0;
    if (this.stage === 2) {
      lines.push("DAM RELEASE: every site's risk rose by 2" + (this.known.has('dam') ? ' (you expected this).' : ' (unexpected!).'));
      lines.push(`The supply truck is delayed: only ${RESUPPLY[2]} sandbags arrive.`);
      this.log.log(E.ENV_EVENT, { action: 'dam_release', actor: 'engine', stage: 'stage2', warned: this.known.has('dam') });
    }
    if (this.stage === 3) {
      this.vehiclesCap = 1;
      lines.push('LANDSLIDE: only one vehicle can reach the town now' + (this.known.has('road') ? ' (you expected this).' : ' (unexpected!).'));
      lines.push('The river begins to fall: risks are lower, but damaged sites are weaker.');
      this.log.log(E.ENV_EVENT, { action: 'road_closure', actor: 'engine', stage: 'stage3', warned: this.known.has('road') });
    }
    this.newInfoPending += 1;
    for (const k of Object.keys(this.requests)) if (k !== 'hotline') this.requests[k] = true;
    this.afterReport = true;
    this.afterReportSetback = this.stageFlooded;
    const box = this.openMessage(`Stage ${stage} complete`, '', { lines });
    box.onClose = () => this.afterReportClosed();
  }

  private afterReportClosed(): void {
    this.afterReportMs = this.session.clock.ms;
    this.lastActionMs = this.afterReportMs;
    this.stageStartPrompt();
  }

  private finalReviewMessage(_held: Record<string, boolean>, lines: string[]): void {
    const totalPeople = SITE_KEYS.reduce((a, k) => a + SITES[k].people, 0);
    let safe = 0.0;
    for (const k of SITE_KEYS) {
      const s = SITES[k];
      let allHeld = true;
      for (const st of this.heldLog.values()) if (!(st[k] ?? false)) allHeld = false;
      if (this.evacuated.has(k) || allHeld) safe += s.people;
      else safe += s.people * (this.partial[k] ?? 0.0);
    }
    let holds = 0;
    for (const st of this.heldLog.values()) for (const v of Object.values(st)) if (v) holds += 1;
    const pct = pyRoundInt((100 * safe) / totalPeople);
    const tier = pct >= 85 ? 'a strong response' : pct >= 60 ? 'a steady response' : 'a difficult response';
    lines.push(
      '',
      `Overall: ${pct}% of people safe, ${holds} of ${STAGES * SITE_KEYS.length} site-stages held - ${tier}.`,
      'This review describes the town\'s outcome only. It is not a judgement of you.',
    );
    this.finalReview = lines;
    const box = this.openMessage('Final review', '', { lines });
    box.onClose = () =>
      this.complete({
        people_safe_pct: pct,
        sites_held: holds,
        info_sources: this.known.size,
        npcs_met: this.met.size,
        ap_unused: this.ap,
        outcome_tier: tier,
      });
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'stage', value: `${this.stage}/${STAGES}` },
      { label: 'AP', value: String(this.ap) },
      { label: 'sandbags', value: String(this.res.sandbags) },
      { label: 'volunteers', value: String(Math.max(0, this.volFree())) },
      { label: 'vehicles', value: String(Math.max(0, this.vehFree())) },
    ];
  }

  /** Highest river risk this stage (for the water-level bar). */
  maxRisk(): number {
    return Math.max(...SITE_KEYS.map((s) => this.risk(s)));
  }
}
