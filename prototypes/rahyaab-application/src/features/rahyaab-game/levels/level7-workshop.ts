/**
 * Level 7 - Career Workshop Challenge (RIASEC interest exploration). Port of game/levels/level7_workshop.py.
 *
 * A makerspace open day: a fixed number of time blocks and six benches (repair, investigate, design, teach,
 * negotiate/organise, records). Rounds can be started, abandoned and revisited; hints are free but limited. The
 * activity -> RIASEC mapping lives in the backend's analytics/riasec_config.json, never in the telemetry.
 *
 * Activity panels are driven by numbered actions (desktop number keys, mobile buttons) through `InputState.number`.
 */
import { Modal } from '../game-engine/dialogs';
import { CAT_PLANNING, EventType as E, KIND_EXIT, KIND_NEUTRAL, KIND_SAFE } from '../game-engine/events';
import { InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw, Meta } from '../game-engine/logger';
import { pyRoundInt } from '../game-engine/pymath';
import { R, Rect } from '../game-engine/rect';
import { nearestStation } from './common';

export const TOTAL_BLOCKS = 14;
export const MAX_ROUNDS = 3;
export const MIN_ROUNDS_TO_END = 3;
export const HINTS_PER_ROUND = 2;
export const STATIONS: Record<string, Rect> = {
  pump: R(80, 90, 170, 90),
  lab: R(330, 90, 170, 90),
  studio: R(580, 90, 170, 90),
  learn: R(80, 430, 170, 90),
  event: R(330, 430, 170, 90),
  records: R(580, 430, 170, 90),
  board: R(840, 90, 150, 70),
  mentor: R(840, 440, 150, 70),
  door: R(1010, 240, 70, 120),
};
export const TASKS: Record<string, string> = {
  pump: 'repair_pump',
  lab: 'plant_lab',
  studio: 'poster_studio',
  learn: 'teach_timetable',
  event: 'open_day_stall',
  records: 'sort_records',
};
export const TASK_IDS = Object.values(TASKS);
export const TASK_NAME: Record<string, string> = {
  repair_pump: 'Repair Bay',
  plant_lab: 'Garden Lab',
  poster_studio: 'Design Studio',
  teach_timetable: 'Learning Corner',
  open_day_stall: 'Event Desk',
  sort_records: 'Records Office',
};
export const BLURB: Record<string, string> = {
  repair_pump: 'A village water pump is leaking. Pick the right parts and test it.',
  plant_lab: 'The bean plants are wilting and nobody knows why. Run experiments to find out.',
  poster_studio: 'Create a poster for the community fair: colours, shapes, a title style, extras.',
  teach_timetable: 'Noor is struggling to read a bus timetable. Help Noor learn it.',
  open_day_stall: 'Plan the food stall: get a fair price, win a sponsor and organise a team.',
  sort_records: 'Deliveries must be filed on the correct shelf following the rule sheet.',
};
export const EXPECTED_MS: Record<string, number> = {
  repair_pump: 120_000,
  plant_lab: 100_000,
  poster_studio: 110_000,
  teach_timetable: 100_000,
  open_day_stall: 130_000,
  sort_records: 100_000,
};
export const STEP_COUNTS: Record<string, [number, number]> = {
  repair_pump: [5, 2],
  plant_lab: [2, 4],
  poster_studio: [3, 6],
  teach_timetable: [3, 4],
  open_day_stall: [2, 3],
  sort_records: [3, 2],
};
export const BONUS_STEPS: Record<string, [string, string[], number][]> = {
  repair_pump: [
    ['Fit the pressure gauge: which tool?', ['Hammer', 'Wrench', 'Tape'], 1],
    ['Where should the gauge go?', ['On the handle', 'On the outlet pipe', 'Under the seal'], 1],
  ],
  plant_lab: [
    ['A new plot gets plenty of water and full sun. Prediction?', ['It wilts', 'It thrives', 'Cannot tell'], 1],
    ['Which extra measurement would be most useful next?', ['Soil moisture', 'Leaf colour of neighbours', 'Pot colour'], 0],
  ],
  poster_studio: [
    ['Add a second headline for the sign: which reads best from far away?', ['Thin pale text', 'Large high-contrast text', 'Small dark text'], 1],
    ['Where should the date go?', ['Hidden in the pattern', 'Bottom, clearly separate', 'Behind the motif'], 1],
  ],
  teach_timetable: [
    ["Noor's friend joins and is also confused. What first?", ['Give a worked example', 'Show the answer sheet', 'Skip it'], 0],
    ['How do you know the friend understood?', ['Ask them to explain it back', "Ask 'ok?'", 'Nothing'], 0],
  ],
  open_day_stall: [
    ['Set the ticket price to cover costs of 60 with 15 visitors:', ['2', '4', '10'], 1],
    ['A volunteer is late. Best response?', ['Re-plan the shifts calmly', 'Cancel the stall', 'Ignore it'], 0],
  ],
  sort_records: [
    ['A record fits two shelves. What do you do?', ['Guess', 'Check the rule sheet for the tie-break', 'Leave it'], 1],
    ['Best way to prevent filing errors tomorrow?', ['A short checklist at the door', 'Work faster', 'Nothing'], 0],
  ],
};

/** One numbered on-screen action of an activity panel. */
export interface PanelEntry {
  num: number;
  text: string;
  enabled: boolean;
}

// =========================================================================================== base panel
export abstract class ActivityPanel implements Modal {
  readonly kind = 'activity' as const;
  abstract readonly taskId: string;
  abstract readonly title: string;
  readonly hintLines: string[] = ['Look carefully at the information on the left.'];
  done = false;
  age = 0;
  flash = '';
  readonly t0: number;
  stage: 'main' | 'bonus' | 'confirm_leave' = 'main';
  prevStage: 'main' | 'bonus' | 'confirm_leave' = 'main';
  reqDone = 0;
  optTaken = 0;
  hints = 0;
  reqTotal = 0;
  optTotal = 0;
  completed = false;
  firstStep = false;
  bonusI = 0;
  bonusCorrect = 0;
  bonusTaken = false;
  perf: number | null = null;
  /** bumped on every state change so the UI can re-render */
  version = 0;

  constructor(
    readonly level: WorkshopLevel,
    readonly roundNo: number,
  ) {
    this.t0 = level.session.clock.ms;
  }

  /** Second construction phase (Python __init__ tail: step counts + setup()). */
  init(): this {
    [this.reqTotal, this.optTotal] = STEP_COUNTS[this.taskId];
    this.setup();
    return this;
  }

  abstract setup(): void;
  abstract entries(): [string, boolean][];
  abstract primary(n: number): void;

  get elapsedMs(): number {
    return this.level.session.clock.ms - this.t0;
  }

  step(action: string, required = true, correct: boolean | null = null, approach: string | null = null, meta: Meta = {}): void {
    const lv = this.level;
    if (!this.firstStep) {
      this.firstStep = true;
      if (approach) {
        lv.log.log(E.APPROACH_CHOICE, {
          action: approach,
          task_id: this.taskId,
          round: this.roundNo,
          actor: 'player',
          stage: 'approach',
          t_in_activity_ms: pyRoundInt(this.elapsedMs),
        });
      }
    }
    lv.log.log(E.ACTIVITY_STEP, {
      action,
      task_id: this.taskId,
      round: this.roundNo,
      required,
      correct,
      t_in_activity_ms: pyRoundInt(this.elapsedMs),
      actor: 'player',
      stage: 'activity',
      ...meta,
    });
    if (!required) this.optTaken += 1;
  }

  finishRequired(): void {
    if (this.completed) return;
    this.completed = true;
    this.level.onActivityCompleted(this);
  }

  update(inp: InputState): void {
    this.age += 1;
    if (inp.number !== null && this.age > 3) this.press(inp.number);
  }

  press(n: number): void {
    this.version += 1;
    this.flash = '';
    if (this.stage === 'confirm_leave') {
      if (n === 1) this.level.onActivityAbandoned(this);
      else if (n === 2) this.stage = this.prevStage;
      return;
    }
    if (this.stage === 'bonus') {
      this.bonusPress(n);
      return;
    }
    if (n === 8) this.hint();
    else if (n === 9) {
      this.prevStage = this.stage;
      this.stage = 'confirm_leave';
    } else if (n >= 1 && n <= 7) this.primary(n);
  }

  private hint(): void {
    if (this.hints >= HINTS_PER_ROUND) {
      this.flash = 'The mentor has no more hints for this round.';
      return;
    }
    this.hints += 1;
    this.step('ask_mentor', false, null, 'ask_first', { help: true, hint_no: this.hints });
    this.optTaken -= 1;
    this.flash = 'Mentor: ' + this.hintLines[Math.min(this.hints - 1, this.hintLines.length - 1)];
  }

  startBonus(): void {
    this.stage = 'bonus';
    this.bonusTaken = true;
    this.bonusI = 0;
    this.version += 1;
  }

  private bonusPress(n: number): void {
    if (n === 9) {
      this.prevStage = 'bonus';
      this.stage = 'confirm_leave';
      return;
    }
    const [, opts, correct] = BONUS_STEPS[this.taskId][this.bonusI];
    if (!(n >= 1 && n <= opts.length)) return;
    const ok = n - 1 === correct;
    this.bonusCorrect += ok ? 1 : 0;
    this.step('bonus_step', false, ok, null, { bonus: true, index: this.bonusI });
    this.bonusI += 1;
    this.flash = ok ? 'Good choice.' : "Hm - not the best option, but let's carry on.";
    if (this.bonusI >= BONUS_STEPS[this.taskId].length) this.level.finalizeActivity(this);
  }

  /** The numbered actions the UI should show right now (desktop draw(), minus the pixels). */
  menu(): { heading: string | null; prompt: string | null; entries: PanelEntry[] } {
    if (this.stage === 'confirm_leave') {
      return {
        heading: 'Step away from this activity?',
        prompt: null,
        entries: [
          { num: 1, text: 'Yes, leave it unfinished', enabled: true },
          { num: 2, text: 'No, keep going', enabled: true },
        ],
      };
    }
    if (this.stage === 'bonus') {
      const [prompt, opts] = BONUS_STEPS[this.taskId][this.bonusI];
      return {
        heading: `Bonus challenge ${this.bonusI + 1}/${BONUS_STEPS[this.taskId].length}`,
        prompt,
        entries: [...opts.map((o, i) => ({ num: i + 1, text: o, enabled: true })), { num: 9, text: 'Step away', enabled: true }],
      };
    }
    const ent: PanelEntry[] = this.entries().map(([t, en], i) => ({ num: i + 1, text: t, enabled: en }));
    ent.push({ num: 8, text: `Ask the mentor for a hint (${HINTS_PER_ROUND - this.hints} left)`, enabled: this.hints < HINTS_PER_ROUND });
    ent.push({ num: 9, text: 'Step away from this activity', enabled: true });
    return { heading: null, prompt: null, entries: ent };
  }
}

// ============================================================================================ 1. pump
export const SLOT_NAMES = ['Inlet pipe', 'Valve', 'Seal ring', 'Handle'];
export const PART_NAMES = [
  ['narrow', 'standard', 'wide'],
  ['brass', 'steel', 'plastic'],
  ['thin', 'medium', 'thick'],
  ['short', 'medium', 'long'],
];
export const PUMP_SOLUTIONS = [
  [1, 1, 2, 2],
  [2, 0, 1, 0],
  [0, 1, 0, 1],
];
export const PUMP_MANUAL = [
  ['Inlet pipe: not the narrow one, not the wide one.', 'Valve: neither brass nor plastic.', 'Seal ring: the thickest.', 'Handle: the longest.'],
  ['Inlet pipe: the widest available.', 'Valve: brass (it is the only one that fits the thread).', 'Seal ring: medium.', 'Handle: the shortest (tight space).'],
  ['Inlet pipe: the narrowest.', 'Valve: steel.', 'Seal ring: the thinnest.', 'Handle: medium length.'],
];

export class PumpPanel extends ActivityPanel {
  readonly taskId = 'repair_pump';
  readonly title = 'Fix the village water pump';
  readonly hintLines = ['The manual lists a clue for each part.', 'A test run tells you which parts are right - use it.'];
  sol!: number[];
  choice!: (number | null)[];
  mode!: 'slots' | 'parts';
  slot!: number;
  tests!: number;
  manualRead!: boolean;
  lastTest!: boolean[] | null;

  setup(): void {
    this.sol = PUMP_SOLUTIONS[this.roundNo % 3];
    this.choice = [null, null, null, null];
    this.mode = 'slots';
    this.slot = 0;
    this.tests = 0;
    this.manualRead = false;
    this.lastTest = null;
  }

  entries(): [string, boolean][] {
    if (this.mode === 'parts') return [...PART_NAMES[this.slot].map((p) => [p, true] as [string, boolean]), ['Back', true]];
    const out: [string, boolean][] = SLOT_NAMES.map((s, i) => [`${s}: ${this.choice[i] !== null ? PART_NAMES[i][this.choice[i] as number] : '-'}`, true]);
    out.push(['Run a test', true], ['Read the repair manual (optional)', !this.manualRead]);
    return out;
  }

  primary(n: number): void {
    if (this.mode === 'parts') {
      if (n >= 1 && n <= 3) {
        this.choice[this.slot] = n - 1;
        this.step('fit_part', true, null, 'hands_on_first', { slot: SLOT_NAMES[this.slot], part: PART_NAMES[this.slot][n - 1] });
        this.mode = 'slots';
      } else if (n === 4) {
        this.mode = 'slots';
      }
      return;
    }
    if (n >= 1 && n <= 4) {
      this.slot = n - 1;
      this.mode = 'parts';
    } else if (n === 5) {
      if (this.choice.some((c) => c === null)) {
        this.flash = 'Fit a part in every position before testing.';
        return;
      }
      this.tests += 1;
      const res = [0, 1, 2, 3].map((i) => this.choice[i] === this.sol[i]);
      this.lastTest = res;
      const nCorrect = res.filter(Boolean).length;
      const all = nCorrect === 4;
      this.step('test_run', true, all, 'hands_on_first', { n_correct: nCorrect, test_no: this.tests });
      this.reqDone = !all ? Math.min(this.reqTotal, 1 + Math.min(this.tests, 3) + Math.floor(nCorrect / 2)) : this.reqTotal;
      if (all) {
        this.perf = Math.max(0.0, 1.0 - (this.tests - 1) / 8.0);
        this.flash = 'The pump runs without a leak!';
        this.finishRequired();
      } else {
        this.flash = `Leaks remain: ${4 - nCorrect} part(s) are wrong.`;
      }
    } else if (n === 6 && !this.manualRead) {
      this.manualRead = true;
      this.step('read_manual', false, null, 'read_first');
      this.flash = PUMP_MANUAL[this.roundNo % 3].join(' ');
    }
  }
}

// ============================================================================================ 2. lab
export interface LabScenario {
  title: string;
  rows: [string, string, string, string, string][];
  experiments: [string, string][];
  causes: string[];
  correct: number;
}
export const LAB_SCENARIOS: LabScenario[] = [
  {
    title: 'Why are the bean plants wilting?',
    rows: [
      ['Plot 1', 'full sun', 'little water', 'sandy', 'wilting'],
      ['Plot 2', 'full sun', 'plenty of water', 'sandy', 'healthy'],
      ['Plot 3', 'shade', 'little water', 'clay', 'wilting'],
    ],
    experiments: [
      ['Water Plot 1 well', 'Plot 1 recovers within a day.'],
      ['Move Plot 3 into the sun', 'Plot 3 still wilts.'],
      ["Swap Plot 2's soil for clay", 'Plot 2 stays healthy.'],
      ['Measure the soil temperature', 'All plots are about the same.'],
    ],
    causes: ['Not enough water', 'Too much sun', 'The soil type', 'Cannot tell yet'],
    correct: 0,
  },
  {
    title: 'Why is the lamp circuit dim?',
    rows: [
      ['Circuit A', 'new battery', 'short wire', 'thin wire', 'dim'],
      ['Circuit B', 'new battery', 'short wire', 'thick wire', 'bright'],
      ['Circuit C', 'old battery', 'long wire', 'thick wire', 'dim'],
    ],
    experiments: [
      ["Replace A's wire with a thick one", 'Circuit A becomes bright.'],
      ['Put a new battery in C', 'Circuit C becomes a little brighter.'],
      ["Shorten C's wire", 'Circuit C stays dim.'],
      ['Swap the bulbs of A and B', 'The dimness stays with the circuit.'],
    ],
    causes: ['The bulb', 'A thin wire', 'The battery age', 'Cannot tell yet'],
    correct: 1,
  },
  {
    title: 'Why did the bread not rise?',
    rows: [
      ['Loaf 1', 'warm room', 'fresh yeast', 'no salt', 'flat'],
      ['Loaf 2', 'warm room', 'fresh yeast', 'salt', 'risen'],
      ['Loaf 3', 'cold room', 'fresh yeast', 'salt', 'flat'],
    ],
    experiments: [
      ["Add salt to Loaf 1's next batch", 'It still comes out flat.'],
      ['Move Loaf 3 to the warm room', 'Loaf 3 rises.'],
      ['Use old yeast in Loaf 2', 'Loaf 2 rises a bit less.'],
      ['Weigh all three doughs', 'The weights are equal.'],
    ],
    causes: ['Missing salt', 'A cold room', 'The yeast', 'Cannot tell yet'],
    correct: 1,
  },
];

export class LabPanel extends ActivityPanel {
  readonly taskId = 'plant_lab';
  readonly title = 'Investigate the problem';
  readonly hintLines = ['Compare the plots: which one differs from the healthy plot?', 'An experiment that changes only one thing tells you most.'];
  sc!: LabScenario;
  run!: number[];
  mode!: 'main' | 'conclude';
  concluded!: boolean;

  setup(): void {
    this.sc = LAB_SCENARIOS[this.roundNo % 3];
    this.run = [];
    this.mode = 'main';
    this.concluded = false;
  }

  entries(): [string, boolean][] {
    if (this.mode === 'conclude') return this.sc.causes.map((c) => [c, true]);
    const out: [string, boolean][] = this.sc.experiments.map((e, i) => [`Experiment: ${e[0]}`, !this.run.includes(i)]);
    out.push(['Draw a conclusion', true]);
    return out;
  }

  primary(n: number): void {
    if (this.mode === 'conclude') {
      if (n >= 1 && n <= 4) {
        const ok = n - 1 === this.sc.correct;
        this.step('conclude', true, ok, null, { choice: this.sc.causes[n - 1], n_experiments: this.run.length });
        this.perf = (ok ? 1.0 : 0.3) * (this.run.length >= 1 ? 1.0 : 0.7);
        this.reqDone = this.reqTotal;
        this.flash = ok ? 'That matches the evidence.' : 'The evidence points elsewhere - but you have finished the investigation.';
        this.finishRequired();
      }
      return;
    }
    if (n >= 1 && n <= 4 && !this.run.includes(n - 1)) {
      this.run.push(n - 1);
      this.step('experiment', this.run.length === 1, null, this.run.length === 1 ? 'hands_on_first' : null, {
        exp: this.sc.experiments[n - 1][0],
        n_run: this.run.length,
      });
      this.flash = 'Result: ' + this.sc.experiments[n - 1][1];
    } else if (n === 5) {
      if (!this.run.length) {
        this.flash = 'Run at least one experiment first.';
        return;
      }
      this.mode = 'conclude';
    }
  }
}

// ============================================================================================ 3. studio
export const BACKGROUNDS: [string, [number, number, number]][] = [
  ['sunrise', [250, 200, 120]],
  ['lagoon', [80, 170, 190]],
  ['plum', [120, 80, 150]],
  ['moss', [110, 150, 100]],
];
export const MOTIFS = ['circles', 'triangles', 'waves', 'stars'];
export const TITLES = ['bold block letters', 'tall thin letters', 'round friendly letters'];
export const EXTRAS = ['border', 'sparkles', 'stripes', 'shadow'];
export const BRIEFS = ['Harvest Fair', 'Science Night', 'Evening of Music'];

export class StudioPanel extends ActivityPanel {
  readonly taskId = 'poster_studio';
  readonly title = 'Design the fair poster';
  readonly hintLines = ['There is no right answer - try things and look at the preview.', 'Variations show other combinations you may not have tried.'];
  bg!: number;
  motif!: number;
  titleStyle!: number;
  extras!: Set<number>;
  changes!: number;
  variations!: Set<number>;
  changesKinds!: Set<string>;

  setup(): void {
    this.bg = 0;
    this.motif = 0;
    this.titleStyle = 0;
    this.extras = new Set();
    this.changes = 0;
    this.variations = new Set();
    this.changesKinds = new Set();
  }

  entries(): [string, boolean][] {
    const ex = Array.from(this.extras)
      .sort((a, b) => a - b)
      .map((i) => EXTRAS[i])
      .join(', ');
    return [
      [`Background: ${BACKGROUNDS[this.bg][0]}`, true],
      [`Motif: ${MOTIFS[this.motif]}`, true],
      [`Title style: ${TITLES[this.titleStyle]}`, true],
      ['Extras: ' + (ex || 'none') + ' (cycle)', true],
      ['Try a surprise variation', true],
      ['Finish the poster', true],
    ];
  }

  private changed(kind: string, required: boolean): void {
    this.changes += 1;
    this.changesKinds.add(kind);
    this.reqDone = Math.min(this.reqTotal, this.changes);
    this.step('design_change', required, null, this.changes === 1 ? 'try_first' : null, { kind, n_changes: this.changes });
  }

  primary(n: number): void {
    if (n === 1) {
      this.bg = (this.bg + 1) % BACKGROUNDS.length;
      this.changed('background', this.changes < 3);
    } else if (n === 2) {
      this.motif = (this.motif + 1) % MOTIFS.length;
      this.changed('motif', this.changes < 3);
    } else if (n === 3) {
      this.titleStyle = (this.titleStyle + 1) % TITLES.length;
      this.changed('title', this.changes < 3);
    } else if (n === 4) {
      const k = this.extras.size ? (Math.max(...this.extras) + 1) % EXTRAS.length : 0;
      if (this.extras.has(k)) this.extras.delete(k);
      else this.extras.add(k);
      this.changed('extra', false);
    } else if (n === 5) {
      const v = this.variations.size + 1;
      this.variations.add(v);
      this.bg = (this.bg + v) % 4;
      this.motif = (this.motif + 2 * v) % 4;
      this.titleStyle = (this.titleStyle + v) % 3;
      this.extras = new Set([v % 4]);
      this.step('variation', false, null, null, { n_variation: v });
    } else if (n === 6) {
      if (this.changes < 2) {
        this.flash = 'Make at least two changes before finishing.';
        return;
      }
      this.step('finish_poster', true, null, null, {
        n_changes: this.changes,
        distinct_kinds: this.changesKinds.size,
        variations: this.variations.size,
      });
      this.reqDone = this.reqTotal;
      this.perf = null;
      this.finishRequired();
    }
  }
}

// ============================================================================================ 4. learner
export const TEACH_ACTIONS: [string, number, number, string][] = [
  ['Explain it step by step', 25, 5, 'explain'],
  ['Show a worked example', 20, 10, 'example'],
  ['Ask Noor to try one while you watch', 15, 15, 'practice'],
  ['Just tell Noor the answer', 5, -10, 'tell'],
  ['Encourage Noor', 0, 20, 'encourage'],
  ['Check what Noor already understands', 5, 0, 'check'],
];
export const TOPICS = ['reading a bus timetable', 'adding fractions', 'reading a street map'];

export class LearnerPanel extends ActivityPanel {
  readonly taskId = 'teach_timetable';
  readonly title = 'Help Noor learn';
  readonly hintLines = ['Noor learns best when understanding and confidence both grow.', 'Practice works better once Noor understands the basics.'];
  und!: number;
  conf!: number;
  turns!: number;
  logLines!: string[];
  checked!: boolean;
  kinds!: string[];

  setup(): void {
    this.und = 20;
    this.conf = 30;
    this.turns = 0;
    this.logLines = ["Noor: I just don't get " + TOPICS[this.roundNo % 3] + '...'];
    this.checked = false;
    this.kinds = [];
  }

  entries(): [string, boolean][] {
    return TEACH_ACTIONS.map((t) => [t[0], this.turns < 8]);
  }

  primary(n: number): void {
    if (!(n >= 1 && n <= TEACH_ACTIONS.length) || this.turns >= 8) return;
    const [, du, dc0, kind] = TEACH_ACTIONS[n - 1];
    let dc = dc0;
    let reply: string;
    if (kind === 'practice' && this.und < 35) {
      dc = -5;
      reply = "Noor: I'm not ready to try it yet...";
    } else {
      reply = ({
        explain: 'Noor: Oh, so each row is a bus!',
        example: 'Noor: Ahh, I see how you read it now.',
        practice: 'Noor tries one and gets it mostly right.',
        tell: 'Noor: Okay... but why is that the answer?',
        encourage: 'Noor smiles and sits up straighter.',
        check: `Noor: I understand about ${this.und}% so far.`,
      } as Record<string, string>)[kind];
    }
    this.und = Math.min(100, this.und + du);
    this.conf = Math.max(0, Math.min(100, this.conf + dc));
    this.turns += 1;
    this.kinds.push(kind);
    this.logLines = [...this.logLines, reply].slice(-5);
    const required = this.reqDone < this.reqTotal;
    const approach = this.turns === 1 ? ({ explain: 'explain_first', example: 'example_first' } as Record<string, string>)[kind] ?? null : null;
    this.step('teach_turn', required, null, approach, {
      kind,
      understanding: this.und,
      confidence: this.conf,
      turn: this.turns,
    });
    if (kind === 'check') this.checked = true;
    this.reqDone = Math.min(this.reqTotal, this.turns);
    if ((this.und >= 80 && this.conf >= 50) || this.turns >= 8) {
      const goal = this.und >= 80 && this.conf >= 50;
      this.perf = (this.und + this.conf) / 200.0;
      this.flash = goal ? 'Noor can read it confidently now!' : 'The session is over - Noor made some progress.';
      this.reqDone = this.reqTotal;
      this.finishRequired();
    }
  }
}

// ============================================================================================ 5. stall
export const ARGUMENTS: [string, string][] = [
  ['Thousands of local families will see your name', 'reach'],
  ['Your logo will be on every banner', 'brand'],
  ['We have lots of volunteers', 'irrelevant'],
  ['The stall is fun', 'irrelevant'],
];
export const SPONSOR_WANTS: Set<string>[] = [new Set(['reach', 'brand']), new Set(['reach']), new Set(['brand'])];

export class DealPanel extends ActivityPanel {
  readonly taskId = 'open_day_stall';
  readonly title = 'Plan the food stall';
  readonly hintLines = ['The vendor may accept a counter-offer if it is fair.', 'The sponsor cares about two things: reach and brand.'];
  ask!: number;
  floor!: number;
  mode!: 'main' | 'vendor' | 'sponsor' | 'team';
  vendorDone!: boolean;
  sponsorDone!: boolean;
  teamDone!: boolean;
  price!: number | null;
  counters!: number;
  funding!: number;
  picked!: number[];
  teamStyle!: string | null;
  budget!: number;

  setup(): void {
    this.ask = 60 + 5 * (this.roundNo % 3);
    this.floor = 42 + 3 * (this.roundNo % 3);
    this.mode = 'main';
    this.vendorDone = false;
    this.sponsorDone = false;
    this.teamDone = false;
    this.price = null;
    this.counters = 0;
    this.funding = 0;
    this.picked = [];
    this.teamStyle = null;
    this.budget = 100;
  }

  entries(): [string, boolean][] {
    if (this.mode === 'vendor') {
      return [
        [`Accept ${this.ask}`, true],
        [`Counter with ${this.ask - 15}`, true],
        [`Counter with ${this.ask - 25}`, true],
        ['Back', true],
      ];
    }
    if (this.mode === 'sponsor') {
      return [
        ...ARGUMENTS.map((a, i) => [a[0] + (this.picked.includes(i) ? ' [chosen]' : ''), true] as [string, boolean]),
        ['Make the pitch', this.picked.length > 0],
      ];
    }
    if (this.mode === 'team') {
      return [
        ['Lead the team yourself and give orders', true],
        ['Let volunteers choose roles and check in', true],
        ['Share the leading with a volunteer', true],
        ['Back', true],
      ];
    }
    return [
      ['Negotiate with the vendor' + (this.vendorDone ? ' - done' : ''), !this.vendorDone],
      ['Pitch the sponsor' + (this.sponsorDone ? ' - done' : ''), !this.sponsorDone],
      ['Organise the volunteer team (optional)' + (this.teamDone ? ' - done' : ''), !this.teamDone],
      ['Finalise the plan', this.vendorDone && this.sponsorDone],
    ];
  }

  primary(n: number): void {
    if (this.mode === 'vendor') {
      if (n === 4) {
        this.mode = 'main';
        return;
      }
      const offer = ({ 1: this.ask, 2: this.ask - 15, 3: this.ask - 25 } as Record<number, number>)[n];
      if (offer === undefined) return;
      this.counters += offer < this.ask ? 1 : 0;
      if (offer >= this.floor) {
        this.price = offer;
        this.vendorDone = true;
        this.step('vendor_deal', true, null, null, {
          offer,
          accepted: true,
          counters: this.counters,
          mode: offer === this.ask ? 'accept' : 'counter',
        });
        this.flash = `Deal at ${offer}.`;
        this.mode = 'main';
      } else {
        this.step('vendor_counter', false, null, null, { offer, accepted: false });
        this.flash = 'The vendor shakes their head: too low. Try something fairer.';
      }
      return;
    }
    if (this.mode === 'sponsor') {
      if (n >= 1 && n <= 4) {
        this.picked = this.picked.includes(n - 1) ? this.picked.filter((x) => x !== n - 1) : [...this.picked, n - 1].slice(-2);
      } else if (n === 5 && this.picked.length) {
        const kinds = new Set(this.picked.map((i) => ARGUMENTS[i][1]));
        const want = SPONSOR_WANTS[this.roundNo % 3];
        let hit = 0;
        for (const k of kinds) if (want.has(k)) hit += 1;
        this.funding = hit >= 2 || (hit === want.size && hit > 0) ? 40 : hit === 1 ? 20 : 0;
        this.sponsorDone = true;
        this.step('sponsor_pitch', true, null, null, {
          args: this.picked.map((i) => ARGUMENTS[i][1]),
          funding: this.funding,
          persuasive: hit > 0,
        });
        this.flash = `The sponsor offers ${this.funding}.`;
        this.mode = 'main';
      }
      return;
    }
    if (this.mode === 'team') {
      if (n === 4) {
        this.mode = 'main';
        return;
      }
      if (n >= 1 && n <= 3) {
        this.teamStyle = ({ 1: 'directive', 2: 'delegating', 3: 'shared' } as Record<number, string>)[n];
        this.teamDone = true;
        this.step('organise_team', false, null, null, { style: this.teamStyle });
        this.flash = 'The volunteers get to work.';
        this.mode = 'main';
      }
      return;
    }
    if (n === 1 && !this.vendorDone) this.mode = 'vendor';
    else if (n === 2 && !this.sponsorDone) this.mode = 'sponsor';
    else if (n === 3 && !this.teamDone) this.mode = 'team';
    else if (n === 4 && this.vendorDone && this.sponsorDone) {
      this.budget = 100 - (this.price ?? 0) + this.funding;
      this.perf = Math.max(0.0, Math.min(1.0, (this.budget - 40) / 60.0));
      this.step('finalise_plan', true, null, null, { budget_left: this.budget });
      this.reqDone = this.reqTotal;
      this.finishRequired();
    }
  }
}

// ============================================================================================ 6. records
export const SHELVES = ['A', 'B', 'C'];
export const RECORD_SETS: { rule: string; items: [string, number][] }[] = [
  {
    rule: 'Codes starting 1 -> shelf A, starting 2 -> shelf B, starting 3 -> shelf C.',
    items: [['142', 0], ['317', 2], ['225', 1], ['108', 0], ['389', 2]],
  },
  {
    rule: 'Even codes -> shelf A, odd codes under 50 -> B, odd codes 50 or over -> C.',
    items: [['24', 0], ['37', 1], ['61', 2], ['80', 0], ['45', 1]],
  },
  {
    rule: 'Last letter: P -> shelf A, T -> shelf B, any other -> shelf C.',
    items: [['12P', 0], ['07T', 1], ['33K', 2], ['90T', 1], ['18P', 0]],
  },
];

export class RecordsPanel extends ActivityPanel {
  readonly taskId = 'sort_records';
  readonly title = 'File the deliveries';
  readonly hintLines = ['The rule sheet says exactly where each code goes.', 'After a check, only re-file the records that were wrong.'];
  rs!: { rule: string; items: [string, number][] };
  assign!: (number | null)[];
  ruleRead!: boolean;
  checks!: number;
  lastWrong!: number[];
  firstErrors!: number | null;

  setup(): void {
    this.rs = RECORD_SETS[this.roundNo % 3];
    this.assign = [null, null, null, null, null];
    this.ruleRead = false;
    this.checks = 0;
    this.lastWrong = [];
    this.firstErrors = null;
  }

  entries(): [string, boolean][] {
    const out: [string, boolean][] = this.rs.items.map((r, i) => [
      `Record ${r[0]}: shelf ${this.assign[i] !== null ? SHELVES[this.assign[i] as number] : '?'}`,
      true,
    ]);
    out.push(['Submit for checking', this.assign.every((a) => a !== null)], ['Read the rule sheet (optional)', !this.ruleRead]);
    return out;
  }

  primary(n: number): void {
    if (n >= 1 && n <= 5) {
      const cur = this.assign[n - 1];
      this.assign[n - 1] = cur === null ? 0 : (cur + 1) % 3;
      this.step('file_record', this.checks === 0, null, !this.ruleRead ? 'act_first' : null, {
        record: this.rs.items[n - 1][0],
        shelf: SHELVES[this.assign[n - 1] as number],
      });
    } else if (n === 6) {
      if (this.assign.some((a) => a === null)) {
        this.flash = 'File every record before submitting.';
        return;
      }
      this.checks += 1;
      const wrong = this.rs.items.map((it, i) => (this.assign[i] !== it[1] ? i : -1)).filter((i) => i >= 0);
      this.lastWrong = wrong;
      if (this.firstErrors === null) this.firstErrors = wrong.length;
      this.step('submit_check', true, wrong.length === 0, null, { n_wrong: wrong.length, check_no: this.checks });
      this.reqDone = Math.min(this.reqTotal, 1 + this.checks);
      if (!wrong.length) {
        this.perf = Math.max(0.0, 1.0 - (this.firstErrors ?? 0) / 5.0);
        this.flash = 'All records filed correctly.';
        this.reqDone = this.reqTotal;
        this.finishRequired();
      } else {
        this.flash = `${wrong.length} record(s) are on the wrong shelf. Fix them and submit again.`;
      }
    } else if (n === 7 && !this.ruleRead) {
      this.ruleRead = true;
      this.step('read_rules', false, null, 'read_first');
      this.flash = 'Rule sheet: ' + this.rs.rule;
    }
  }
}

export const PANELS: Record<string, new (level: WorkshopLevel, roundNo: number) => ActivityPanel> = {
  repair_pump: PumpPanel,
  plant_lab: LabPanel,
  poster_studio: StudioPanel,
  teach_timetable: LearnerPanel,
  open_day_stall: DealPanel,
  sort_records: RecordsPanel,
};

// ============================================================================================ the level
export class WorkshopLevel extends Level {
  readonly levelId = 7;
  readonly name = 'Career Workshop Challenge';
  readonly scenario = 'career_workshop';
  readonly objective = 'Open day! Try the benches that interest you. You have 14 time blocks and no wrong choices.';
  readonly taskName = 'open_day_workshop';
  readonly startPos: [number, number] = [900, 300];
  readonly controlsHint = 'Walk to a bench and tap the action button. Inside an activity, tap the numbered actions. Nothing is timed.';

  blocks!: number;
  rounds!: Record<string, number>;
  history!: { task: string; round: number; outcome: string }[];
  starts!: number;
  choiceNo!: number;
  active!: ActivityPanel | null;
  private intro!: boolean;
  dayOver!: boolean;
  peeked!: Set<string>;

  build(): void {
    this.blocks = TOTAL_BLOCKS;
    this.rounds = Object.fromEntries(TASK_IDS.map((t) => [t, 0]));
    this.history = [];
    this.starts = 0;
    this.choiceNo = 0;
    this.active = null;
    this.intro = true;
    this.dayOver = false;
    this.peeked = new Set();
  }

  levelStartMetadata(): Kw {
    const stepCounts: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(STEP_COUNTS)) stepCounts[k] = [...v];
    return {
      blocks_total: TOTAL_BLOCKS,
      tasks: [...TASK_IDS],
      max_rounds: MAX_ROUNDS,
      step_counts: stepCounts,
      expected_ms: { ...EXPECTED_MS },
      min_rounds_to_end: MIN_ROUNDS_TO_END,
      hints_per_round: HINTS_PER_ROUND,
    };
  }

  solids(): Rect[] {
    return Object.entries(STATIONS)
      .filter(([k]) => k !== 'door')
      .map(([, r]) => r);
  }

  private _log(etype: string, action: string | null, kw: Kw = {}) {
    const k: Kw = { ...kw };
    if (!('actor' in k)) k.actor = 'player';
    if (!('stage' in k)) k.stage = 'floor';
    return this.log.log(etype, { action, ...k });
  }

  onUpdate(_dt: number, _inp: InputState): void {
    if (this.intro) {
      this.intro = false;
      this.openMessage('Career Workshop open day', '', {
        lines: [
          'Welcome to the community makerspace! Six benches offer different kinds of work.',
          `You have ${TOTAL_BLOCKS} time blocks. Starting a round costs 1, finishing it 1 more, a bonus challenge 1 more.`,
          'You can look around a bench, try it, step away, come back for a new round, or ask the mentor for a hint.',
          'There are no right or wrong choices here. Spend your time on whatever you find worth doing.',
          `You can end the day at the door after trying at least ${MIN_ROUNDS_TO_END} rounds.`,
        ],
      });
    }
  }

  interactHint(): string | null {
    const st = nearestStation(this.player, STATIONS);
    if (!st) return null;
    if (st in TASKS) return TASK_NAME[TASKS[st]];
    return { board: 'Day Board', mentor: 'Mentor Priya', door: 'Exit' }[st] ?? null;
  }

  onInteract(): void {
    const st = nearestStation(this.player, STATIONS);
    if (st !== null && st in TASKS) this.bench(TASKS[st]);
    else if (st === 'board') {
      this.openMessage('Day Board', '', { lines: this.boardLines() });
      this._log(E.INFO_SEEKING, 'read_day_board', { source: 'board', redundant: false });
    } else if (st === 'mentor') {
      this.openMessage('Mentor Priya', 'Hints are available inside each activity (tap "Ask the mentor"). They are free, but limited.');
    } else if (st === 'door') this.door();
  }

  boardLines(): string[] {
    const lines = [`Time blocks left: ${this.blocks} of ${TOTAL_BLOCKS}`];
    for (const h of this.history) lines.push(`${TASK_NAME[h.task]} - round ${h.round + 1}: ${h.outcome}`);
    return lines.length > 1 ? lines : [...lines, 'Nothing tried yet.'];
  }

  bench(task: string): void {
    const r = this.rounds[task];
    if (r >= MAX_ROUNDS) {
      this.say(`You have done all three rounds of the ${TASK_NAME[task]}.`, 2400);
      return;
    }
    if (this.blocks < 1) {
      this.say('No time blocks left.', 2000);
      return;
    }
    const firstLook = !this.peeked.has(task);
    this.peeked.add(task);
    const opts: DecisionOption[] = [
      { key: 'start', label: `Start round ${r + 1} (uses 1 time block)`, kind: KIND_NEUTRAL },
      { key: 'not_now', label: 'Not now', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.key === 'start') this.beginActivity(task);
      else {
        this._log(E.ACTIVITY_CHOICE, 'decline', {
          task_id: task,
          round: r,
          selected: false,
          outcome: 'declined',
          first_look: firstLook,
          blocks_left: this.blocks,
        });
      }
    };
    this.openChoice(
      `l7_${task}_r${r}`,
      CAT_PLANNING,
      TASK_NAME[task],
      BLURB[task] + (r ? `\nYou have tried ${r} round(s) here already.` : ''),
      opts,
      chosen,
      { context: { task_id: task, round: r, blocks_left: this.blocks } },
    );
  }

  beginActivity(task: string): void {
    const r = this.rounds[task];
    this.rounds[task] += 1;
    this.blocks -= 1;
    this.starts += 1;
    this.choiceNo += 1;
    this._log(E.ACTIVITY_CHOICE, 'select', {
      task_id: task,
      round: r,
      selected: true,
      voluntary: true,
      revisit: r > 0,
      choice_no: this.choiceNo,
      blocks_left: this.blocks,
      options: [...TASK_IDS],
    });
    const panel = new PANELS[task](this, r).init();
    this.active = panel;
    this._log(E.ACTIVITY_START, 'start', {
      task_id: task,
      round: r,
      required_steps: panel.reqTotal,
      optional_steps: panel.optTotal,
      expected_ms: EXPECTED_MS[task],
      blocks_left: this.blocks,
    });
    this.modal = panel;
    this.bump();
  }

  onActivityCompleted(panel: ActivityPanel): void {
    if (this.blocks >= 1) this.blocks -= 1;
    this.modal = null;
    if (this.blocks >= 1) {
      const opts: DecisionOption[] = [
        { key: 'bonus_yes', label: 'Yes - take the bonus challenge (uses 1 time block)', kind: KIND_NEUTRAL },
        { key: 'bonus_no', label: "No thanks, I'm done here", kind: KIND_EXIT },
      ];
      const chosen = (o: DecisionOption) => {
        const taken = o.key === 'bonus_yes';
        this._log(E.ACTIVITY_STEP, 'bonus_offer', {
          task_id: panel.taskId,
          round: panel.roundNo,
          required: false,
          taken,
          outcome: taken ? 'taken' : 'declined',
          stage: 'activity',
        });
        if (taken) {
          this.blocks -= 1;
          panel.startBonus();
          this.modal = panel;
        } else {
          this.finalizeActivity(panel);
        }
      };
      this.openChoice(
        `l7_bonus_${panel.taskId}_${panel.roundNo}`,
        CAT_PLANNING,
        'Bonus challenge?',
        'You finished the main task. There is an optional extra challenge.',
        opts,
        chosen,
        { context: { task_id: panel.taskId, round: panel.roundNo } },
      );
    } else {
      this.finalizeActivity(panel);
    }
  }

  finalizeActivity(panel: ActivityPanel): void {
    this.endLog(panel, 'completed');
    this.history.push({ task: panel.taskId, round: panel.roundNo, outcome: 'completed' });
    this.active = null;
    this.modal = null;
    const box = this.openMessage(`${TASK_NAME[panel.taskId]} - round ${panel.roundNo + 1} finished`, panel.flash || 'Nicely done.');
    box.onClose = () => this.afterActivity();
    this.bump();
  }

  onActivityAbandoned(panel: ActivityPanel): void {
    this.endLog(panel, 'abandoned');
    this.history.push({ task: panel.taskId, round: panel.roundNo, outcome: 'stepped away' });
    this.active = null;
    this.modal = null;
    this.say('You stepped away. You can come back any time.', 2400);
    this.bump();
    this.afterActivity();
  }

  private endLog(panel: ActivityPanel, outcome: string): void {
    this._log(E.ACTIVITY_END, outcome, {
      task_id: panel.taskId,
      round: panel.roundNo,
      outcome,
      engaged_ms: pyRoundInt(panel.elapsedMs),
      expected_ms: EXPECTED_MS[panel.taskId],
      required_done: outcome !== 'completed' ? panel.reqDone : panel.reqTotal,
      required_total: panel.reqTotal,
      optional_taken: panel.optTaken,
      optional_total: panel.optTotal,
      hints: panel.hints,
      bonus_taken: panel.bonusTaken,
      bonus_correct: panel.bonusCorrect,
      performance: panel.perf,
      blocks_left: this.blocks,
      stage: 'activity',
    });
  }

  private afterActivity(): void {
    if (this.blocks <= 0 && !this.dayOver) {
      this.dayOver = true;
      const box = this.openMessage('The open day is over', 'The makerspace is closing. Thank you for taking part!');
      box.onClose = () =>
        this.complete({
          blocks_left: this.blocks,
          rounds_started: this.starts,
          tasks_tried: Object.values(this.rounds).filter((v) => v).length,
        });
    }
  }

  door(): void {
    if (this.starts < MIN_ROUNDS_TO_END) {
      this.say(`Try at least ${MIN_ROUNDS_TO_END} rounds before ending the day (you have tried ${this.starts}).`, 3200);
      return;
    }
    const opts: DecisionOption[] = [
      { key: 'end_day', label: `End the open day now (${this.blocks} blocks unused)`, kind: KIND_SAFE },
      { key: 'stay', label: 'Stay and keep exploring', kind: KIND_EXIT },
    ];
    const chosen = (o: DecisionOption) => {
      if (o.key === 'end_day') {
        this._log(E.PLAYER_INTERACTION, 'end_day', { object_id: 'door', novel: false, blocks_left: this.blocks, rounds: this.starts });
        this.complete({
          blocks_left: this.blocks,
          rounds_started: this.starts,
          tasks_tried: Object.values(this.rounds).filter((v) => v).length,
        });
      }
    };
    this.openChoice('l7_door', CAT_PLANNING, 'Exit', 'Ready to finish the open day?', opts, chosen);
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'time blocks', value: String(this.blocks) },
      { label: 'rounds tried', value: String(this.starts) },
    ];
  }
}
