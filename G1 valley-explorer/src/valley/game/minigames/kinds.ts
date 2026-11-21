/**
 * Mini-game configurations. Each task step becomes one hands-on action. Required steps map to the
 * kind's `required` slots in order; extra steps map to `optional` slots. Tasks with a single required
 * step (Riverside Park) use the kind's `main` action.
 *
 * Every activity type has the same number and kind of actions (1 drag + 1 tap + 1 hold for its 3
 * required steps, where possible) so that no interest area is physically easier or more fun to finish.
 */
import type { ItemKey } from './items';

export type Kind = 'fix' | 'test' | 'create' | 'help' | 'trade' | 'organise';
export type Mode = 'drag' | 'tap' | 'hold' | 'paint';

export interface Action {
  mode: Mode;
  /** item to drag (drag mode) */
  item?: ItemKey;
  /** index into the kind's targets */
  target: number;
  /** taps needed (tap mode) */
  count?: number;
  /** very short instruction shown with an icon */
  hint: string;
}

export interface KindDef {
  targets: { key: string; label: string }[];
  required: [Action, Action, Action];
  optional: [Action, Action];
  main: Action;
  backdrop: string;
}

export const TASK_KIND: Record<string, Kind> = {
  wheel_workshop: 'fix', repair_pump: 'fix', park_repair: 'fix',
  lantern_riddle: 'test', plant_lab: 'test', park_survey: 'test',
  mural_wall: 'create', poster_studio: 'create', park_design: 'create',
  fireside_circle: 'help', teach_timetable: 'help', park_volunteers: 'help',
  market_square: 'trade', open_day_stall: 'trade', park_sponsors: 'trade',
  ledger_tower: 'organise', sort_records: 'organise', park_permits: 'organise',
};

const drag = (item: ItemKey, target: number, hint: string): Action => ({ mode: 'drag', item, target, hint });
const tap = (target: number, count: number, hint: string): Action => ({ mode: 'tap', target, count, hint });
const hold = (target: number, hint: string): Action => ({ mode: 'hold', target, hint });

export const KINDS: Record<Kind, KindDef> = {
  fix: {
    backdrop: '#F1E3CC',
    targets: [{ key: 'machine', label: 'the broken thing' }],
    required: [tap(0, 3, 'Tap it 3 times'), drag('part', 0, 'Drag the new part onto it'), hold(0, 'Press and hold to test it')],
    optional: [tap(0, 3, 'Tap 3 times to tighten'), drag('oil', 0, 'Drag the oil onto it')],
    main: drag('part', 0, 'Drag the new part onto it'),
  },
  test: {
    backdrop: '#E3EDF5',
    targets: [{ key: 'lab', label: 'the test stand' }, { key: 'notebook', label: 'the notebook' }],
    required: [drag('sampleA', 0, 'Drag sample A to the stand'), hold(0, 'Press and hold to test it'), tap(1, 2, 'Tap the notebook twice')],
    optional: [drag('sampleC', 0, 'Drag a third sample to the stand'), hold(1, 'Hold to read the old notes')],
    main: drag('sampleA', 0, 'Drag the sample to the stand'),
  },
  create: {
    backdrop: '#F7E6EC',
    targets: [{ key: 'tile0', label: 'tile 1' }, { key: 'tile1', label: 'tile 2' }, { key: 'tile2', label: 'tile 3' }, { key: 'bowl', label: 'the mixing bowl' }],
    required: [{ mode: 'paint', target: 0, hint: 'Pick a colour, then tap tile 1' }, { mode: 'paint', target: 1, hint: 'Pick a colour, then tap tile 2' }, { mode: 'paint', target: 2, hint: 'Pick a colour, then tap tile 3' }],
    optional: [hold(3, 'Hold the bowl to mix a new colour'), tap(1, 3, 'Tap a tile 3 times to add a pattern')],
    main: { mode: 'paint', target: 0, hint: 'Pick a colour, then tap the sign' },
  },
  help: {
    backdrop: '#FBE9D7',
    targets: [{ key: 'person', label: 'the traveller' }, { key: 'fire', label: 'the fire' }],
    required: [hold(0, 'Press and hold to listen'), drag('food', 0, 'Drag the food to them'), drag('map', 0, 'Drag the map to show the way')],
    optional: [tap(0, 2, 'Tap twice to help more people'), drag('log', 1, 'Drag wood onto the fire')],
    main: hold(0, 'Press and hold to guide them'),
  },
  trade: {
    backdrop: '#F6EDCF',
    targets: [{ key: 'merchant', label: 'the stall owner' }, { key: 'crowd', label: 'the crowd' }],
    required: [tap(0, 1, 'Tap to wave hello'), drag('coins', 0, 'Drag your offer to them'), hold(0, 'Hold to shake hands')],
    optional: [hold(1, 'Hold to speak to the crowd'), drag('flyer', 1, 'Drag a flyer to the crowd')],
    main: drag('coins', 0, 'Drag your offer to them'),
  },
  organise: {
    backdrop: '#E2F0EC',
    targets: [{ key: 'shelf', label: 'the shelf' }, { key: 'ledger', label: 'the ledger' }],
    required: [drag('crates', 0, 'Drag the boxes onto the shelf'), tap(0, 3, 'Tap 3 times to check each one'), drag('stamp', 1, 'Drag the stamp onto the ledger')],
    optional: [tap(0, 3, 'Tap 3 times to count again'), drag('label', 0, 'Drag a label onto the shelf')],
    main: drag('crates', 0, 'Drag the forms onto the shelf'),
  },
};

/** The action for one step of a task. */
export function actionFor(kind: Kind, requiredCount: number, optional: boolean, slot: number): Action {
  const k = KINDS[kind];
  if (optional) return k.optional[Math.min(slot, k.optional.length - 1)];
  if (requiredCount === 1) return k.main;
  return k.required[Math.min(slot, k.required.length - 1)];
}
