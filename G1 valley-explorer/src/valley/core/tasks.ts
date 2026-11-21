/**
 * Activity catalogue for the three interest levels.
 *
 * The RIASEC category of each task lives ONLY in core/riasec/config.ts and is never shown to the student.
 * Every task has required steps (finishing them completes the activity) and optional "depth" steps.
 * Leaving early is always allowed. No step is timed and nothing can be failed.
 */
export type Glyph =
  | 'wheel' | 'lantern' | 'brush' | 'fire' | 'coins' | 'ledger'
  | 'pump' | 'flask' | 'poster' | 'book' | 'stall' | 'files'
  | 'wrench' | 'magnifier' | 'palette' | 'hands' | 'megaphone' | 'clipboard';

export interface Step {
  id: string;
  label: string;
  optional: boolean;
}

export interface TaskDef {
  id: string;
  place: string;
  blurb: string;
  glyph: Glyph;
  /** hue used for the card accent; colours are decorative and never the only cue */
  tint: string;
  steps: Step[];
  /** expected engaged time for one round, used only as a capped dwell ratio (speed is never scored) */
  expectedMs: number;
}

const req = (id: string, label: string): Step => ({ id, label, optional: false });
const opt = (id: string, label: string): Step => ({ id, label, optional: true });

// ---- Level 2: Crossroads Caravan (from the original level 10) ----------------------------------
export const CARAVAN_TASKS: TaskDef[] = [
  { id: 'wheel_workshop', place: 'Wainwright’s Yard', blurb: 'A wagon wheel is cracked. Timber, tools and grease are ready.', glyph: 'wheel', tint: '#C9874B', expectedMs: 30000,
    steps: [req('pull', 'Pull out the cracked spoke'), req('fit', 'Fit a new spoke'), req('spin', 'Spin-test the wheel'), opt('bolts', 'Tighten the bolts'), opt('grease', 'Grease the axle')] },
  { id: 'lantern_riddle', place: 'Observatory Hill', blurb: 'The lanterns burn dim and nobody knows why.', glyph: 'lantern', tint: '#5B8BC9', expectedMs: 30000,
    steps: [req('a', 'Test oil sample A'), req('b', 'Test oil sample B'), req('note', 'Write down what you found'), opt('c', 'Test a third sample'), opt('log', 'Read the old wick log')] },
  { id: 'mural_wall', place: 'The Painted Wall', blurb: 'A blank wall and a box of colours.', glyph: 'brush', tint: '#D2607F', expectedMs: 30000,
    steps: [req('t1', 'Paint the first tile'), req('t2', 'Paint the second tile'), req('t3', 'Paint the third tile'), opt('mix', 'Mix a brand-new colour'), opt('motif', 'Add your own motif')] },
  { id: 'fireside_circle', place: 'Fireside Camp', blurb: 'Travellers rest by a fire. Some look worn out.', glyph: 'fire', tint: '#E08A3C', expectedMs: 30000,
    steps: [req('listen', 'Listen to a tired traveller'), req('food', 'Share some food'), req('way', 'Show someone the way'), opt('more', 'Help two more travellers'), opt('wood', 'Fetch firewood for everyone')] },
  { id: 'market_square', place: 'The Bazaar', blurb: 'Stalls, hagglers and a crowd waiting to be persuaded.', glyph: 'coins', tint: '#C2A23A', expectedMs: 30000,
    steps: [req('greet', 'Greet a stall owner'), req('price', 'Agree a fair price'), req('deal', 'Close the deal'), opt('pitch', 'Pitch to the crowd'), opt('recruit', 'Recruit a helper')] },
  { id: 'ledger_tower', place: 'Ledger House', blurb: 'Crates are stacked in the wrong order.', glyph: 'ledger', tint: '#5E9C8E', expectedMs: 30000,
    steps: [req('sort', 'Sort the crates by number'), req('check', 'Check them against the list'), req('stamp', 'Stamp the ledger'), opt('recount', 'Recount once more'), opt('labels', 'Label the shelves')] },
];

// ---- Level 4: The Makers' Workshop (from the original level 7) ---------------------------------
export const WORKSHOP_TASKS: TaskDef[] = [
  { id: 'repair_pump', place: 'Pump bench', blurb: 'The village water pump squeaks and leaks.', glyph: 'pump', tint: '#C9874B', expectedMs: 25000,
    steps: [req('open', 'Open the pump casing'), req('seal', 'Replace the worn seal'), req('test', 'Test the water flow'), opt('oil', 'Oil the handle')] },
  { id: 'plant_lab', place: 'Garden lab', blurb: 'Two bean plants grow differently. Why?', glyph: 'flask', tint: '#5B8BC9', expectedMs: 25000,
    steps: [req('measure', 'Measure both plants'), req('soil', 'Test the soil'), req('conclude', 'Write a conclusion'), opt('repeat', 'Repeat the test to be sure')] },
  { id: 'poster_studio', place: 'Poster studio', blurb: 'The open day needs a poster.', glyph: 'poster', tint: '#D2607F', expectedMs: 25000,
    steps: [req('colours', 'Choose the colours'), req('draw', 'Sketch the picture'), req('letter', 'Letter the title'), opt('variant', 'Try a second design')] },
  { id: 'teach_timetable', place: 'Learning corner', blurb: 'A younger student is lost with their study timetable.', glyph: 'book', tint: '#E08A3C', expectedMs: 25000,
    steps: [req('ask', 'Ask what is hard'), req('explain', 'Explain one step'), req('practise', 'Practise it together'), opt('encourage', 'Write them an encouraging note')] },
  { id: 'open_day_stall', place: 'Event desk', blurb: 'The open day needs a sponsor and a team.', glyph: 'stall', tint: '#C2A23A', expectedMs: 25000,
    steps: [req('call', 'Call a local shop'), req('pitch', 'Pitch the idea'), req('team', 'Put a team together'), opt('stretch', 'Ask for a bigger sponsorship')] },
  { id: 'sort_records', place: 'Records office', blurb: 'Visitor forms are mixed up.', glyph: 'files', tint: '#5E9C8E', expectedMs: 25000,
    steps: [req('sort', 'Sort forms by date'), req('verify', 'Check against the rule sheet'), req('file', 'File them away'), opt('index', 'Make an index card')] },
];

// ---- Level 7: Riverside Park Day (simplified from the original level 8) --------------------------
export const PARK_TASKS: TaskDef[] = [
  { id: 'park_repair', place: 'Repair yard', blurb: 'The fountain and benches need fixing.', glyph: 'wrench', tint: '#C9874B', expectedMs: 15000,
    steps: [req('fix', 'Fix a broken bench'), opt('extra', 'Also fix the fountain tap')] },
  { id: 'park_survey', place: 'Survey hut', blurb: 'Is the pond water safe for the day?', glyph: 'magnifier', tint: '#5B8BC9', expectedMs: 15000,
    steps: [req('sample', 'Test a water sample'), opt('extra', 'Compare with last year’s data')] },
  { id: 'park_design', place: 'Design studio', blurb: 'The park needs signs and decorations.', glyph: 'palette', tint: '#D2607F', expectedMs: 15000,
    steps: [req('sign', 'Design a welcome sign'), opt('extra', 'Plan the flower colours')] },
  { id: 'park_volunteers', place: 'Community room', blurb: 'Neighbours want to help but need guidance.', glyph: 'hands', tint: '#E08A3C', expectedMs: 15000,
    steps: [req('guide', 'Guide a group of volunteers'), opt('extra', 'Check on an elderly neighbour')] },
  { id: 'park_sponsors', place: 'Business office', blurb: 'More funds would help the day.', glyph: 'megaphone', tint: '#C2A23A', expectedMs: 15000,
    steps: [req('pitch', 'Convince a sponsor'), opt('extra', 'Plan a small food stall')] },
  { id: 'park_permits', place: 'Records office', blurb: 'Forms and schedules must be in order.', glyph: 'clipboard', tint: '#5E9C8E', expectedMs: 15000,
    steps: [req('forms', 'Complete the permit forms'), opt('extra', 'Make the volunteer rota')] },
];

export interface RoleDef {
  id: string;
  label: string;
  description: string;
}

/** Park roles. A role is a light preference signal (role_vote_weight) and gives no gameplay advantage. */
export const PARK_ROLES: RoleDef[] = [
  { id: 'builder', label: 'Builder', description: 'Fix and make things with your hands.' },
  { id: 'researcher', label: 'Researcher', description: 'Find out facts and check what is true.' },
  { id: 'designer', label: 'Designer', description: 'Make the park look and feel special.' },
  { id: 'helper', label: 'Helper', description: 'Look after people and guide them.' },
  { id: 'organiser', label: 'Leader', description: 'Persuade people and lead the plan.' },
  { id: 'recordkeeper', label: 'Record keeper', description: 'Keep lists, forms and schedules right.' },
];

export const ALL_TASKS: Record<string, TaskDef> = Object.fromEntries(
  [...CARAVAN_TASKS, ...WORKSHOP_TASKS, ...PARK_TASKS].map((t) => [t.id, t]),
);
