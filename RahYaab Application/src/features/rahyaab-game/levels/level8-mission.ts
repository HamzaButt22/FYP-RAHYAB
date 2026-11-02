/**
 * Level 8 - Integrated Career Mission (RIASEC interest exploration). Port of game/levels/level8_mission.py.
 *
 * Reopen Riverside Park in three phases with a shared coin pool, 4 work shifts per phase, four requirements with
 * several routes each, six work sites, four teammates with different needs, information that arrives per phase and
 * role changes at any time. The mission always completes; the outcome describes the park, not the player.
 */
import { CAT_COOPERATION, CAT_PLANNING, EventType as E, KIND_EXIT, KIND_NEUTRAL, KIND_PROSOCIAL, KIND_SAFE } from '../game-engine/events';
import { InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw } from '../game-engine/logger';
import { capitalize, pyRound } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';
import { nearestStation } from './common';

export const PHASES = 3;
export const SHIFTS_PER_PHASE = 4;
export const START_COINS = 120;
export const METERS = ['safety', 'permit', 'appeal', 'turnout'] as const;
export type Meter = (typeof METERS)[number];
export const BASE_THRESHOLD: Record<Meter, number> = { safety: 50, permit: 50, appeal: 40, turnout: 40 };
export const RAIN_SAFETY = 60;

export const SITES: Record<string, Rect> = {
  yard: R(40, 90, 130, 80),
  survey: R(200, 90, 130, 80),
  design: R(360, 90, 130, 80),
  community: R(520, 90, 130, 80),
  business: R(680, 90, 130, 80),
  records: R(840, 90, 130, 80),
  hana: R(60, 430, 140, 80),
  okafor: R(260, 430, 140, 80),
  lin: R(460, 430, 140, 80),
  reyes: R(660, 430, 140, 80),
  board: R(860, 430, 170, 80),
};
export const SITE_LABEL: Record<string, string> = {
  yard: 'Repair Yard',
  survey: 'Survey Hut',
  design: 'Design Studio',
  community: 'Community Room',
  business: 'Business Office',
  records: 'Records Office',
  hana: 'Hana (volunteers)',
  okafor: 'Okafor (contractor)',
  lin: 'Dr. Lin (scientist)',
  reyes: 'Official Reyes',
  board: 'Mission Board',
};
export const SITE_COLOR: Record<string, [number, number, number]> = {
  yard: [150, 100, 70],
  survey: [70, 130, 100],
  design: [150, 90, 140],
  community: [90, 120, 170],
  business: [170, 120, 70],
  records: [100, 110, 130],
  hana: [150, 90, 110],
  okafor: [130, 100, 70],
  lin: [80, 120, 130],
  reyes: [110, 100, 150],
  board: [60, 110, 150],
};
export const ROLES: [string, [string, string]][] = [
  ['yard', ['Site Builder', 'hands-on repairs and construction']],
  ['survey', ['Field Researcher', 'tests, measurements and surveys']],
  ['design', ['Visual Planner', 'layouts, signs and murals']],
  ['community', ['Volunteer Host', 'workshops, recruiting and welcoming people']],
  ['business', ['Deal Maker', 'sponsors, permits and negotiation']],
  ['records', ['Records Keeper', 'paperwork, checklists and budgets']],
];
export const ROLE = Object.fromEntries(ROLES) as Record<string, [string, string]>;

export interface TaskDef {
  site: string;
  name: string;
  shifts: number;
  coins: number;
  fx: Partial<Record<Meter | 'coins', number>>;
  optional: boolean;
  flag?: string;
  delegated?: boolean;
}
export const TASKS: [string, TaskDef][] = [
  ['fix_fountain', { site: 'yard', name: 'Repair the fountain properly', shifts: 2, coins: 10, fx: { safety: 35 }, optional: false }],
  ['replace_benches', { site: 'yard', name: 'Replace the old benches', shifts: 2, coins: 20, fx: { safety: 15, appeal: 10 }, optional: true }],
  ['quick_patch', { site: 'yard', name: 'Quick patch of the worst hazards', shifts: 1, coins: 5, fx: { safety: 15 }, optional: false }],
  ['test_water_soil', { site: 'survey', name: 'Test the water and soil', shifts: 1, coins: 5, fx: { safety: 10 }, optional: false, flag: 'tested' }],
  ['count_visitors', { site: 'survey', name: 'Survey what visitors want', shifts: 1, coins: 0, fx: { appeal: 10 }, optional: true, flag: 'visitors' }],
  [
    'full_survey',
    { site: 'survey', name: 'Full survey (tests + visitors)', shifts: 2, coins: 10, fx: { safety: 10, appeal: 10 }, optional: false, flag: 'tested+visitors' },
  ],
  ['design_layout', { site: 'design', name: 'Design the park layout', shifts: 2, coins: 10, fx: { appeal: 35 }, optional: false }],
  ['paint_mural', { site: 'design', name: 'Paint a community mural', shifts: 2, coins: 15, fx: { appeal: 25, turnout: 10 }, optional: true }],
  ['simple_signs', { site: 'design', name: 'Make simple welcome signs', shifts: 1, coins: 5, fx: { appeal: 12 }, optional: false }],
  ['kids_workshop', { site: 'community', name: "Run a kids' workshop", shifts: 2, coins: 5, fx: { turnout: 30 }, optional: false }],
  [
    'recruit_volunteers',
    { site: 'community', name: 'Recruit neighbourhood volunteers', shifts: 1, coins: 0, fx: { turnout: 15 }, optional: false, flag: 'helper' },
  ],
  ['neighbour_letters', { site: 'community', name: 'Write letters to neighbours', shifts: 1, coins: 3, fx: { turnout: 12 }, optional: true }],
  [
    'sponsorship_pitch',
    { site: 'business', name: 'Pitch local businesses for sponsorship', shifts: 2, coins: 0, fx: { permit: 10, coins: 30 }, optional: false },
  ],
  ['negotiate_permit', { site: 'business', name: 'Negotiate the event permit', shifts: 2, coins: 0, fx: { permit: 40 }, optional: false }],
  [
    'hire_contractor',
    { site: 'business', name: 'Hire a contractor to do the repairs', shifts: 1, coins: 25, fx: { safety: 30 }, optional: false, delegated: true },
  ],
  ['file_paperwork', { site: 'records', name: 'File the permit paperwork', shifts: 1, coins: 0, fx: { permit: 30 }, optional: false, flag: 'paperwork' }],
  ['safety_checklist', { site: 'records', name: 'Complete the safety checklist', shifts: 1, coins: 0, fx: { safety: 10 }, optional: false, flag: 'checklist' }],
  ['budget_ledger', { site: 'records', name: 'Tidy the budget ledger', shifts: 1, coins: 0, fx: { coins: 10 }, optional: true }],
];
export const TASK = Object.fromEntries(TASKS) as Record<string, TaskDef>;
export const EFFECT_WORDS: Record<string, string> = { safety: 'safer', permit: 'permit', appeal: 'appeal', turnout: 'turnout', coins: 'coins' };

export interface NpcOption {
  key: string;
  label: string;
  mode: 'help' | 'collab' | 'accept' | 'counter' | 'decline' | 'info' | 'defer';
  shifts?: number;
  coins?: number;
  fx?: Partial<Record<Meter | 'coins', number>>;
  task?: string;
  flag?: string;
}
export const NPC: Record<string, Record<number, [string, NpcOption[]]>> = {
  hana: {
    1: [
      "Could you spare a shift to set up chairs for the kids' workshop? Families will come.",
      [
        { key: 'help_chairs', label: 'Help set up the chairs (1 shift)', mode: 'help', shifts: 1, coins: 0, fx: { turnout: 10 }, task: 'help_hana_chairs' },
        { key: 'ask_volunteers', label: 'Suggest the volunteers do it (free)', mode: 'defer' },
        { key: 'decline', label: 'Say you cannot this time', mode: 'decline' },
      ],
    ],
    2: [
      'The snack table needs 10 coins to look welcoming.',
      [
        { key: 'give_10', label: 'Give 10 coins', mode: 'help', shifts: 0, coins: 10, fx: { turnout: 10 }, task: 'help_hana_snacks' },
        { key: 'give_5', label: 'Offer 5 coins and some help from you', mode: 'counter', shifts: 0, coins: 5, fx: { turnout: 5 }, task: 'help_hana_snacks' },
        { key: 'decline', label: 'Say the budget is tight', mode: 'decline' },
      ],
    ],
    3: [
      'Could you thank the volunteers in person? It means a lot to them (1 shift).',
      [
        { key: 'thank', label: 'Spend a shift thanking them', mode: 'help', shifts: 1, coins: 0, fx: { turnout: 8 }, task: 'help_hana_thanks' },
        { key: 'decline', label: 'Send a short message instead', mode: 'decline' },
      ],
    ],
  },
  okafor: {
    1: [
      'I can repair the fountain properly for 20 coins, paid up front.',
      [
        { key: 'accept_20', label: 'Accept: 20 coins', mode: 'accept', shifts: 0, coins: 20, fx: { safety: 30 }, task: 'contractor_repair' },
        { key: 'counter_15', label: 'Counter with 15 coins', mode: 'counter', shifts: 0, coins: 15, fx: { safety: 30 }, task: 'contractor_repair' },
        { key: 'decline', label: 'Decline politely', mode: 'decline' },
      ],
    ],
    2: [
      "I have leftover timber: 10 coins and I'll build a shaded seating area.",
      [
        { key: 'accept_10', label: 'Accept: 10 coins', mode: 'accept', shifts: 0, coins: 10, fx: { appeal: 12 }, task: 'contractor_seating' },
        { key: 'decline', label: 'Decline', mode: 'decline' },
      ],
    ],
    3: ['Everything is wrapped up on my side. Anything else?', [{ key: 'decline', label: 'No, thank you', mode: 'decline' }]],
  },
  lin: {
    1: [
      'I can run the water and soil tests if you give me 1 shift for samples and 5 coins for kits.',
      [
        {
          key: 'collab_test',
          label: 'Work with Dr. Lin (1 shift, 5 coins)',
          mode: 'collab',
          shifts: 1,
          coins: 5,
          fx: { safety: 10, appeal: 10 },
          flag: 'tested+visitors',
          task: 'collab_water_test',
        },
        { key: 'ask_method', label: 'Ask how the tests work first (free)', mode: 'info' },
        { key: 'decline', label: "Say you'll test it yourself", mode: 'decline' },
      ],
    ],
    2: [
      'My results could help the school science club. Share them with the club (1 shift)?',
      [
        { key: 'share_results', label: 'Share the results with the club (1 shift)', mode: 'help', shifts: 1, coins: 0, fx: { turnout: 10 }, task: 'share_results' },
        { key: 'decline', label: 'Not now', mode: 'decline' },
      ],
    ],
    3: [
      'The data are ready to be signed off if you want a second look.',
      [
        { key: 'review_data', label: 'Review the data together (1 shift)', mode: 'collab', shifts: 1, coins: 0, fx: { safety: 8 }, task: 'review_data' },
        { key: 'decline', label: 'Trust the results', mode: 'decline' },
      ],
    ],
  },
  reyes: {
    1: [
      'Permit applications need complete paperwork. I can tell you exactly what is needed.',
      [
        { key: 'ask_rules', label: 'Ask what the permit requires (free)', mode: 'info' },
        { key: 'early_review', label: 'Request an early review (1 shift)', mode: 'collab', shifts: 1, coins: 0, fx: { permit: 10 }, task: 'early_review' },
        { key: 'decline', label: 'Come back later', mode: 'decline' },
      ],
    ],
    2: [
      'An inspection is planned for the final phase. I will check safety and paperwork.',
      [
        { key: 'ask_inspection', label: 'Ask what the inspection looks at (free)', mode: 'info' },
        { key: 'early_review', label: 'Request an early review (1 shift)', mode: 'collab', shifts: 1, coins: 0, fx: { permit: 10 }, task: 'early_review' },
        { key: 'decline', label: 'Leave it', mode: 'decline' },
      ],
    ],
    3: [
      'Final inspection. Make your case.',
      [
        { key: 'present', label: 'Present your records and plans (1 shift)', mode: 'accept', shifts: 1, coins: 0, fx: { permit: 15 }, task: 'inspection_case' },
        { key: 'persuade', label: 'Argue that the park deserves a chance (1 shift)', mode: 'counter', shifts: 1, coins: 0, fx: { permit: 10 }, task: 'inspection_case' },
        { key: 'decline', label: 'Accept the result as it stands', mode: 'decline' },
      ],
    ],
  },
};
export const NPC_NAME: Record<string, string> = { hana: 'Hana', okafor: 'Okafor', lin: 'Dr. Lin', reyes: 'Reyes' };
export const PHASE_NAME: Record<number, string> = { 1: 'Plan', 2: 'Build', 3: 'Finish' };

const fxSum = (fx: Partial<Record<string, number>>) => Object.values(fx).reduce((a: number, b) => a + (b ?? 0), 0);
const SITE_TEXT: Record<string, string> = {
  yard: 'Rusty fountain, wobbly benches and a cracked path. Fixing hazards is the biggest safety gain.',
  survey: 'Instruments for testing water and soil, and a clipboard for asking visitors what they want.',
  design: 'Sketches, paint and cardboard models. A good layout makes the park welcoming.',
  community: 'A room for workshops and a notice board for recruiting helpers.',
  business: 'Phones and a table for meeting shop owners and city officials. Paperwork makes meetings go further.',
  records: 'Filing cabinets, the permit forms and the budget ledger.',
};

export class MissionLevel extends Level {
  readonly levelId = 8;
  readonly name = 'Integrated Career Mission';
  readonly scenario = 'career_mission';
  readonly objective = 'Reopen Riverside Park for Community Day. Share a budget and time; there are many ways to get there.';
  readonly taskName = 'reopen_park';
  readonly startPos: [number, number] = [550, 300];
  readonly controlsHint = 'Walk to a work site, teammate or the Mission Board and tap the action button. Choose by tapping.';

  phase!: number;
  shifts!: number;
  coins!: number;
  m!: Record<Meter, number>;
  flags!: Set<string>;
  done!: Set<string>;
  role!: string | null;
  roleBonusUsed!: boolean;
  phaseEvents!: string[];
  safetyNeed!: number;
  npcDone!: Set<string>;
  contrib!: Record<string, { shifts: number; coins: number; tasks: number }>;
  helperPending!: boolean;
  met!: Set<string>;
  visits!: Record<string, number>;
  looked!: Set<string>;
  private intro!: boolean;
  finalLines!: string[];
  lastBoardSig!: string | null;
  pendingEnd!: boolean;

  build(): void {
    this.phase = 1;
    this.shifts = SHIFTS_PER_PHASE;
    this.coins = START_COINS;
    this.m = { safety: 0, permit: 0, appeal: 0, turnout: 0 };
    this.flags = new Set();
    this.done = new Set();
    this.role = null;
    this.roleBonusUsed = false;
    this.phaseEvents = [];
    this.safetyNeed = BASE_THRESHOLD.safety;
    this.npcDone = new Set();
    this.contrib = Object.fromEntries(Object.keys(SITES).map((s) => [s, { shifts: 0, coins: 0, tasks: 0 }]));
    this.helperPending = false;
    this.met = new Set();
    this.visits = {};
    this.looked = new Set();
    this.intro = true;
    this.finalLines = [];
    this.lastBoardSig = null;
    this.pendingEnd = false;
  }

  levelStartMetadata(): Kw {
    const tasks: Record<string, unknown> = {};
    for (const [k, v] of TASKS) tasks[k] = { site: v.site, shifts: v.shifts, coins: v.coins, optional: v.optional };
    const npcTasks = new Set<string>();
    for (const per of Object.values(NPC)) for (const [, opts] of Object.values(per)) for (const o of opts) if (o.task) npcTasks.add(o.task);
    return {
      phases: PHASES,
      shifts_per_phase: SHIFTS_PER_PHASE,
      start_coins: START_COINS,
      sites: Object.keys(SITES).filter((s) => s in ROLE),
      tasks,
      npcs: Object.keys(NPC_NAME),
      thresholds: { ...BASE_THRESHOLD },
      npc_tasks: Array.from(npcTasks).sort(),
    };
  }

  solids(): Rect[] {
    return Object.values(SITES);
  }

  private _log(etype: string, action: string | null, kw: Kw = {}) {
    const k: Kw = { ...kw };
    if (!('actor' in k)) k.actor = 'player';
    if (!('stage' in k)) k.stage = `phase${this.phase}`;
    return this.log.log(etype, { action, ...k });
  }

  onUpdate(_dt: number, _inp: InputState): void {
    if (this.intro) {
      this.intro = false;
      const box = this.openMessage('Reopen Riverside Park', '', {
        lines: [
          'The riverside park has been closed for a year. Community Day is in three phases: Plan, Build, Finish.',
          `You share ${START_COINS} coins and have ${SHIFTS_PER_PHASE} work shifts per phase (unused shifts are lost).`,
          'To open, four things must be good enough: Safety, Permit, Appeal and Turnout. The Mission Board shows the targets.',
          'Every requirement can be met in more than one way. Choose the work you want to do, ask teammates for help,',
          'change your role or your plan whenever new information arrives. There is no single right way.',
        ],
      });
      box.onClose = () => this.pickRole();
      return;
    }
    if (this.pendingEnd && this.modal === null) {
      this.pendingEnd = false;
      this.endPhase(true);
    }
  }

  private pickRole(): void {
    const opts: DecisionOption[] = ROLES.map(([k, [n, d]]) => ({ key: k, label: `${n} - ${d}`, kind: KIND_NEUTRAL }));
    const chosen = (o: DecisionOption) => {
      this.role = o.key;
      this._log(E.ROLE_SELECTED, o.key, { role: o.key, phase_no: this.phase, first: true, outcome: 'selected' });
      this.say(`Role: ${ROLE[o.key][0]} (small efficiency bonus for your first job at your site each phase).`, 3400);
      this.bump();
    };
    this.openChoice(
      'l8_role',
      CAT_PLANNING,
      'Your project role',
      'Which responsibility do you want to lead? You can change it later at the Mission Board.',
      opts,
      chosen,
    );
  }

  interactHint(): string | null {
    const st = nearestStation(this.player, SITES);
    return st ? SITE_LABEL[st] : null;
  }

  onInteract(): void {
    const st = nearestStation(this.player, SITES);
    if (st === null) return;
    this.visits[st] = (this.visits[st] ?? 0) + 1;
    if (st in ROLE) this.openSite(st);
    else if (st === 'board') this.openBoard();
    else this.openNpc(st);
  }

  private effectText(tid: string): string {
    return Object.entries(this.effectsPreview(tid))
      .map(([k, v]) => `+${v} ${EFFECT_WORDS[k]}`)
      .join(', ');
  }

  effectsPreview(tid: string): Record<string, number> {
    const t = TASK[tid];
    const fx: Record<string, number> = { ...(t.fx as Record<string, number>) };
    if (tid === 'design_layout' && this.flags.has('visitors')) fx.appeal += 10;
    if (tid === 'negotiate_permit' && !this.flags.has('paperwork')) fx.permit = 20;
    if (tid === 'sponsorship_pitch' && this.flags.has('paperwork')) fx.coins += 10;
    return fx;
  }

  openSite(site: string): void {
    const avail = TASKS.filter(([tid, t]) => t.site === site && !this.done.has(tid)).map(([tid]) => tid);
    const key = `${site}:${this.phase}`;
    const firstLook = !this.looked.has(key);
    const opts: DecisionOption[] = avail.map((tid) => {
      const t = TASK[tid];
      return { key: tid, label: `${t.name} - ${t.shifts} shift(s), ${t.coins} coins (${this.effectText(tid)})`, kind: KIND_NEUTRAL };
    });
    opts.push({ key: 'look', label: 'Look around (free)', kind: KIND_SAFE });
    opts.push({ key: 'leave', label: 'Not now', kind: KIND_EXIT });
    const body = `${SITE_LABEL[site]}.  Shifts left: ${this.shifts}   Coins: ${this.coins}` + (avail.length ? '' : '\nEverything here is done.');
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'leave') {
        this._log(E.ACTIVITY_CHOICE, 'decline', { task_id: site, site, selected: false, outcome: 'declined', phase_no: this.phase });
      } else if (k === 'look') {
        this.looked.add(key);
        this._log(E.INFO_SEEKING, 'look_around', { source: `site_${site}`, redundant: !firstLook, first_time: firstLook });
        const box = this.openMessage(SITE_LABEL[site], SITE_TEXT[site]);
        box.onClose = () => this.openSite(site);
      } else {
        this.confirmTask(k);
      }
    };
    this.openChoice(`l8_${site}_p${this.phase}_${this.visits[site] ?? 0}`, CAT_PLANNING, SITE_LABEL[site], body, opts, chosen, {
      context: { site, phase_no: this.phase, shifts_left: this.shifts, coins_left: this.coins },
    });
  }

  private confirmTask(tid: string): void {
    const t = TASK[tid];
    const short: string[] = [];
    if (t.shifts > this.shifts) short.push('shifts');
    if (t.coins > this.coins) short.push('coins');
    if (short.length) {
      this._log(E.PLAYER_INTERACTION, 'invalid_attempt', { object_id: tid, novel: false, reason: 'not_enough_' + short.join('_') });
      this.say('Not enough ' + short.join(' and ') + ' for that.', 2600);
      return;
    }
    const opts: DecisionOption[] = [
      { key: 'commit', label: `Commit: ${t.shifts} shift(s) and ${t.coins} coins`, kind: KIND_NEUTRAL },
      { key: 'change', label: 'Change my mind', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.key === 'commit') this.runTask(tid);
      else {
        this._log(E.ACTIVITY_CHOICE, 'decline', { task_id: tid, site: t.site, selected: false, outcome: 'changed_mind', phase_no: this.phase });
        this._log(E.ACTIVITY_END, 'declined', { task_id: tid, site: t.site, outcome: 'declined', shifts: 0, coins: 0, phase_no: this.phase });
      }
    };
    this.openChoice(`l8_confirm_${tid}_${this.phase}`, CAT_PLANNING, t.name, `Effect: ${this.effectText(tid)}.`, opts, chosen, {
      context: { task_id: tid, phase_no: this.phase },
    });
  }

  runTask(tid: string): void {
    const t = TASK[tid];
    const site = t.site;
    let revisit = (this.visits[site] ?? 0) > 1;
    if (!revisit) for (const d of this.done) if (TASK[d].site === site) revisit = true;
    const fx = this.effectsPreview(tid);
    let roleBonus = 0;
    if (this.role === site && !this.roleBonusUsed) {
      let main: string | null = null;
      for (const k of Object.keys(fx)) {
        if (!(METERS as readonly string[]).includes(k)) continue;
        if (main === null || fx[k] > fx[main]) main = k;
      }
      if (main) {
        fx[main] += 5;
        roleBonus = 5;
      }
      this.roleBonusUsed = true;
    }
    this.done.add(tid);
    this.shifts -= t.shifts;
    this.coins -= t.coins;
    this.contrib[site].shifts += t.shifts;
    this.contrib[site].coins += t.coins;
    this.contrib[site].tasks += 1;
    const gained = this.apply(fx, t.flag);
    const nominal = fxSum(t.fx) || 1;
    this._log(E.ACTIVITY_CHOICE, 'select', {
      task_id: tid,
      site,
      selected: true,
      voluntary: true,
      optional: t.optional,
      revisit,
      phase_no: this.phase,
      options: TASKS.filter(([x, d]) => (d.site === site && !this.done.has(x)) || x === tid).map(([x]) => x),
      shifts_left: this.shifts + t.shifts,
      role: this.role,
      via: 'site',
    });
    this._log(E.ACTIVITY_START, 'start', { task_id: tid, site, shifts: t.shifts, coins: t.coins, phase_no: this.phase });
    if (t.shifts) {
      this._log(E.RESOURCE_ALLOCATED, 'commit_shifts', {
        resource: 'shifts',
        amount: t.shifts,
        site,
        task_id: tid,
        phase_no: this.phase,
        delegated: !!t.delegated,
      });
    }
    if (t.coins) {
      this._log(E.RESOURCE_ALLOCATED, 'commit_coins', {
        resource: 'coins',
        amount: t.coins,
        site,
        task_id: tid,
        phase_no: this.phase,
        delegated: !!t.delegated,
      });
    }
    this._log(E.ACTIVITY_END, 'completed', {
      task_id: tid,
      site,
      outcome: 'completed',
      shifts: t.shifts,
      coins: t.coins,
      optional: t.optional,
      performance: pyRound(Math.min(1.5, gained / nominal), 3),
      phase_no: this.phase,
      role_bonus: roleBonus,
    });
    this._log(E.PLAN_ACTION, 'step', { task_id: 'mission_plan', phase_no: this.phase, chosen: tid, outcome: 'progress' });
    this.say(`Done: ${t.name}.  Shifts left ${this.shifts}.`, 3000);
    this.bump();
    this.afterSpend();
  }

  private apply(fx: Partial<Record<string, number>>, flag: string | undefined): number {
    let gained = 0.0;
    for (const [k, v0] of Object.entries(fx)) {
      const v = v0 ?? 0;
      if (k === 'coins') {
        this.coins += v;
        gained += v;
      } else {
        const mk = k as Meter;
        const before = this.m[mk];
        this.m[mk] = Math.min(100, this.m[mk] + v);
        gained += this.m[mk] - before;
      }
    }
    if (flag) {
      for (const f of flag.split('+')) this.flags.add(f);
      if (this.flags.has('helper')) this.helperPending = true;
    }
    return gained;
  }

  private afterSpend(): void {
    if (this.shifts <= 0) this.pendingEnd = true;
  }

  openNpc(npc: string): void {
    const first = !this.met.has(npc);
    if (first) {
      this.met.add(npc);
      this.log.log(E.NPC_INTERACTION, { action: 'initiated_by_player', encounter_id: npc, npc, actor: 'player', stage: `phase${this.phase}` });
    }
    let [text] = NPC[npc][this.phase];
    const options = NPC[npc][this.phase][1];
    const key = `${npc}:${this.phase}`;
    const opts: DecisionOption[] = [];
    for (const o of options) {
      if (this.npcDone.has(key) && o.mode !== 'decline' && o.mode !== 'info') continue;
      opts.push({ key: o.key, label: o.label, kind: o.mode === 'help' || o.mode === 'collab' ? KIND_PROSOCIAL : KIND_NEUTRAL });
    }
    if (!opts.some((o) => o.key === 'decline')) opts.push({ key: 'decline', label: 'Say goodbye', kind: KIND_EXIT });
    const lookup = Object.fromEntries(options.map((o) => [o.key, o])) as Record<string, NpcOption>;
    if (this.npcDone.has(key)) text = "Thanks again - we've already sorted this out for now.";

    const chosen = (o: DecisionOption) => {
      const spec: NpcOption = lookup[o.key] ?? { key: o.key, label: '', mode: 'decline' };
      const mode = spec.mode;
      this.log.log(E.NPC_INTERACTION, { action: 'dialogue_turn', encounter_id: npc, npc, actor: 'player', stage: `phase${this.phase}` });
      if (mode === 'decline') {
        this._log(E.NEGOTIATION, 'decline', { npc, mode: 'decline', outcome: 'declined', phase_no: this.phase });
        return;
      }
      if (mode === 'info') {
        this._log(E.INFO_SEEKING, o.key, { source: `npc_${npc}`, redundant: false, first_time: true });
        this.openMessage(NPC_NAME[npc], this.npcInfo(npc, o.key), { speaker: NPC_NAME[npc] });
        return;
      }
      if (mode === 'defer') {
        this._log(E.PLAYER_INTERACTION, 'defer_request', { object_id: npc, novel: false, outcome: 'deferred' });
        return;
      }
      const sShifts = spec.shifts ?? 0;
      const sCoins = spec.coins ?? 0;
      if (sShifts > this.shifts || sCoins > this.coins) {
        this._log(E.PLAYER_INTERACTION, 'invalid_attempt', { object_id: npc, novel: false, reason: 'not_enough_resources' });
        this.say('You do not have enough shifts or coins for that.', 2600);
        return;
      }
      this.npcDone.add(key);
      this.shifts -= sShifts;
      this.coins -= sCoins;
      const site = npc;
      this.contrib[site].shifts += sShifts;
      this.contrib[site].coins += sCoins;
      this.contrib[site].tasks += 1;
      const gained = this.apply(spec.fx ?? {}, spec.flag);
      const ev = ({ help: E.HELP_ACTION, collab: E.COOPERATION_ACTION, accept: E.NEGOTIATION, counter: E.NEGOTIATION } as Record<string, string>)[mode];
      this._log(ev, o.key, { npc, mode, outcome: 'agreed', phase_no: this.phase, shifts: sShifts, coins: sCoins });
      this._log(E.ACTIVITY_CHOICE, 'select', {
        task_id: spec.task,
        site: npc,
        selected: true,
        voluntary: true,
        optional: false,
        revisit: false,
        phase_no: this.phase,
        via: 'npc',
        mode,
        role: this.role,
      });
      this._log(E.ACTIVITY_START, 'start', { task_id: spec.task, site: npc, shifts: sShifts, coins: sCoins, phase_no: this.phase });
      if (sShifts) {
        this._log(E.RESOURCE_ALLOCATED, 'commit_shifts', {
          resource: 'shifts',
          amount: sShifts,
          site: npc,
          task_id: spec.task,
          phase_no: this.phase,
          delegated: false,
        });
      }
      if (sCoins) {
        this._log(E.RESOURCE_ALLOCATED, 'commit_coins', {
          resource: 'coins',
          amount: sCoins,
          site: npc,
          task_id: spec.task,
          phase_no: this.phase,
          delegated: npc === 'okafor',
        });
      }
      this._log(E.ACTIVITY_END, 'completed', {
        task_id: spec.task,
        site: npc,
        outcome: 'completed',
        shifts: sShifts,
        coins: sCoins,
        optional: false,
        performance: pyRound(Math.min(1.5, gained / (fxSum(spec.fx ?? {}) || 1)), 3),
        phase_no: this.phase,
      });
      this.say(`${NPC_NAME[npc]}: agreed. Shifts left ${this.shifts}.`, 2800);
      this.bump();
      this.afterSpend();
    };
    this.openChoice(`l8_npc_${npc}_p${this.phase}_${this.visits[npc] ?? 0}`, CAT_COOPERATION, NPC_NAME[npc], text, opts, chosen, {
      speaker: NPC_NAME[npc],
      context: { npc, phase_no: this.phase },
    });
  }

  private npcInfo(_npc: string, key: string): string {
    if (key === 'ask_method') return 'I sample water at three spots and test the soil for lead. If it is clean we save repair money later.';
    if (key === 'ask_rules') {
      return 'You need complete paperwork on file. With it, a negotiated permit is worth much more, and sponsors take you more seriously.';
    }
    return "I'll check the fountain, the paths and your paperwork. Without a soil test, a contamination alert in the last phase could cost you safety.";
  }

  openBoard(): void {
    const sig = JSON.stringify([this.phase, this.shifts, this.coins, METERS.map((k) => this.m[k]), Array.from(this.flags).sort()]);
    const redundant = sig === this.lastBoardSig;
    this.lastBoardSig = sig;
    this._log(E.INFO_SEEKING, redundant ? 'recheck_board' : 'read_board', { source: 'board', redundant, first_time: false });
    const opts: DecisionOption[] = [
      { key: 'status', label: 'Read the mission status', kind: KIND_SAFE },
      { key: 'role', label: 'Change my role', kind: KIND_NEUTRAL },
      {
        key: 'end',
        label: this.phase < PHASES ? `End phase ${this.phase} now (${this.shifts} shifts unused)` : `Open the park now (${this.shifts} shifts unused)`,
        kind: KIND_NEUTRAL,
      },
      { key: 'back', label: 'Back to work', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      const k = o.key;
      if (k === 'status') this.openMessage('Mission status', '', { lines: this.statusLines() });
      else if (k === 'role') this.changeRole();
      else if (k === 'end') this.endPhase(false);
    };
    this.openChoice(
      `l8_board_p${this.phase}_${this.visits.board ?? 0}`,
      CAT_PLANNING,
      'Mission Board',
      `Phase ${this.phase}/${PHASES}: ${PHASE_NAME[this.phase]}.  Shifts ${this.shifts}  Coins ${this.coins}`,
      opts,
      chosen,
    );
  }

  needs(): Record<Meter, number> {
    return { ...BASE_THRESHOLD, safety: this.safetyNeed };
  }

  statusLines(): string[] {
    const need = this.needs();
    const lines = [`Phase ${this.phase}/${PHASES} - ${PHASE_NAME[this.phase]}.   Shifts left ${this.shifts}.   Coins ${this.coins}.`];
    for (const k of METERS) lines.push(`${capitalize(k).padEnd(9)} ${String(this.m[k]).padStart(3)} / needs ${need[k]}`);
    return lines.concat(this.phaseEvents);
  }

  private changeRole(): void {
    const opts: DecisionOption[] = ROLES.map(([k, [n]]) => ({ key: k, label: `${n}` + (k === this.role ? ' (current)' : ''), kind: KIND_NEUTRAL }));
    const chosen = (o: DecisionOption) => {
      if (o.key !== this.role) {
        this._log(E.ROLE_CHANGED, o.key, {
          previous: this.role,
          role: o.key,
          phase_no: this.phase,
          outcome: 'changed',
          new_info: this.phaseEvents.length > 0,
        });
        this.role = o.key;
        this.roleBonusUsed = false;
        this.say(`New role: ${ROLE[o.key][0]}.`, 2600);
        this.bump();
      }
    };
    this.openChoice(
      `l8_role_p${this.phase}_${this.visits.board ?? 0}`,
      CAT_PLANNING,
      'Change role',
      'Which responsibility do you want to lead now?',
      opts,
      chosen,
    );
  }

  endPhase(auto: boolean): void {
    this._log(E.PLAN_ACTION, 'end_phase', {
      task_id: 'mission_plan',
      phase_no: this.phase,
      shifts_unused: this.shifts,
      coins: this.coins,
      auto,
      meters: { ...this.m },
      outcome: 'phase_end',
    });
    this.log.log(E.ENV_EVENT, { action: 'phase_end', actor: 'engine', stage: `phase${this.phase}`, shifts_unused: this.shifts });
    if (this.phase >= PHASES) {
      this.finish();
      return;
    }
    this.phase += 1;
    this.shifts = SHIFTS_PER_PHASE + (this.helperPending ? 1 : 0);
    const extra = this.helperPending ? 'Your recruited helper gives you an extra shift.' : '';
    this.helperPending = false;
    this.roleBonusUsed = false;
    this.phaseEvents = [];
    const lines = [`Phase ${this.phase}: ${PHASE_NAME[this.phase]}.  You have ${this.shifts} shifts.  ${extra}`.trim()];
    if (this.phase === 2) {
      this.safetyNeed = RAIN_SAFETY;
      const msg = `Weather forecast: rain is expected on Community Day. Paths get slippery - Safety must now reach ${RAIN_SAFETY}. Shade helps visitors (Appeal).`;
      this.phaseEvents.push(msg);
      lines.push(msg);
      this.log.log(E.ENV_EVENT, { action: 'rain_forecast', actor: 'engine', stage: 'phase2', new_safety_need: RAIN_SAFETY });
    }
    if (this.phase === 3) {
      let msg: string;
      if (this.flags.has('tested')) {
        msg = "Inspector's note: your soil test shows the ground is clean. The inspection is on track.";
        this.log.log(E.ENV_EVENT, { action: 'contamination_cleared', actor: 'engine', stage: 'phase3', tested: true });
      } else {
        this.m.safety = Math.max(0, this.m.safety - 20);
        msg = 'Contamination alert: untested soil near the playground must be covered. Safety -20 (a soil test would have cleared it).';
        this.log.log(E.ENV_EVENT, { action: 'contamination_alert', actor: 'engine', stage: 'phase3', tested: false });
      }
      this.phaseEvents.push(msg);
      lines.push(msg);
      lines.push('Official Reyes will hold the final inspection this phase.');
    }
    this.bump();
    const box = this.openMessage(`Phase ${this.phase} begins`, '', { lines });
    box.onClose = () => {
      this._log(E.PLAN_ACTION, 'phase_start', { task_id: 'mission_plan', phase_no: this.phase, outcome: 'started' });
    };
  }

  private finish(): void {
    const need = this.needs();
    const met: Record<string, boolean> = {};
    for (const k of METERS) met[k] = this.m[k] >= need[k];
    const nMet = Object.values(met).filter(Boolean).length;
    const tier =
      nMet === 4
        ? 'Community Day is a success!'
        : nMet === 3
          ? 'The park opens with one area closed.'
          : 'The park opens only partly; the team will finish the rest next month.';
    let lines = [tier, ''];
    lines = lines.concat(
      METERS.map((k) => `${capitalize(k).padEnd(9)} ${String(this.m[k]).padStart(3)} / ${need[k]}  ${met[k] ? 'met' : 'not yet'}`),
    );
    lines = lines.concat(['', `Coins left: ${this.coins}`, 'This describes the park, not you. There was no single right way to do this.']);
    for (const [site, c] of Object.entries(this.contrib)) {
      if (c.tasks) {
        this._log(E.CONTRIBUTION, 'site_contribution', {
          site,
          shifts: c.shifts,
          coins: c.coins,
          tasks: c.tasks,
          stage: 'final',
          outcome: 'summary',
        });
      }
    }
    this._log(E.CONTRIBUTION, 'mission_summary', {
      site: 'all',
      requirements_met: nMet,
      meters: { ...this.m },
      coins_left: this.coins,
      role_final: this.role,
      stage: 'final',
      outcome: tier,
    });
    this.finalLines = lines;
    const box = this.openMessage('Community Day', '', { lines });
    box.onClose = () => this.complete({ requirements_met: nMet, coins_left: this.coins, role: this.role, tasks_done: this.done.size });
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'phase', value: `${this.phase}/${PHASES}` },
      { label: 'shifts', value: String(this.shifts) },
      { label: 'coins', value: String(this.coins) },
    ];
  }
}
