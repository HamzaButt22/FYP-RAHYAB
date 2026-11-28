import { Riasec, ScoredWeek } from '@/assessment/types';
import { BuildingId } from '../world/buildings';
import { CharacterId } from '../characters/characters';

export interface ChoiceOption {
  category: Riasec;
  title: string;
  text: string;
  /** Character who does this activity with the player. */
  partner: CharacterId;
}

export interface ChoiceScenario {
  id: string;
  week: ScoredWeek;
  host: CharacterId;
  building: BuildingId;
  setup: string;
  options: [ChoiceOption, ChoiceOption];
}

const o = (category: Riasec, partner: CharacterId, title: string, text: string): ChoiceOption => ({ category, partner, title, text });

/**
 * 30 forced-choice scenarios. Option order here is NOT the presentation
 * order — left/right comes from PAIR_SCHEDULE. Both options of a scenario
 * improve the same building by the same amount, so neither side is more
 * rewarding in game terms.
 */
export const CHOICE_SCENARIOS: ChoiceScenario[] = [
  // ───────────── WEEK 1 · SPRING ─────────────
  { id: 'FC-W1-01', week: 1, host: 'saima', building: 'pump_station',
    setup: 'The canal gate is stuck, and the seed store is in a muddle.',
    options: [
      o('C', 'kamran', 'Sort the seed store', 'Sort the seed sacks with Kamran and label each one by crop.'),
      o('R', 'rafiq', 'Fix the canal gate', 'Oil and repair the stuck canal gate with Ustad Rafiq.'),
    ] },
  { id: 'FC-W1-02', week: 1, host: 'saima', building: 'workshop',
    setup: 'The wheat in the east field is turning yellow.',
    options: [
      o('I', 'hina', 'Test the soil', 'Test the soil and water with Dr Hina to find the problem.'),
      o('E', 'kamran', 'Share the tractor', 'Convince the farmers to share one tractor and agree on turns.'),
    ] },
  { id: 'FC-W1-03', week: 1, host: 'saima', building: 'community_kitchen',
    setup: 'Families are coming back to their homes after the flood.',
    options: [
      o('A', 'zoya', 'Paint a welcome sign', 'Paint a bright welcome-home sign with Zoya for the main road.'),
      o('S', 'bilal', 'Welcome families back', 'Visit returning families with Bilal and help them settle in.'),
    ] },
  { id: 'FC-W1-04', week: 1, host: 'rafiq', building: 'solar_shop',
    setup: 'Nobody knows how much water the new solar pump gives each day.',
    options: [
      o('C', 'kamran', 'Keep the water log', 'Keep a neat daily log of the pump readings in a record book.'),
      o('I', 'ayesha', 'Measure the water flow', 'Measure the water flow with Ayesha and work out why it changes.'),
    ] },
  { id: 'FC-W1-05', week: 1, host: 'rafiq', building: 'pump_station',
    setup: 'The water pump station looks broken and grey.',
    options: [
      o('A', 'bilal', 'Design the wall pattern', 'Design a colourful pattern with Bilal for the pump station walls.'),
      o('R', 'rafiq', 'Fit the new pipes', 'Fit the new pipes and valves on the pump with Ustad Rafiq.'),
    ] },
  { id: 'FC-W1-06', week: 1, host: 'saima', building: 'school',
    setup: 'Spring planting needs many helping hands.',
    options: [
      o('S', 'ayesha', 'Teach the little ones', 'Teach young children how to plant seedlings in the school garden.'),
      o('E', 'bilal', 'Lead the planting team', 'Lead the volunteer team and decide which field each group plants.'),
    ] },
  { id: 'FC-W1-07', week: 1, host: 'saima', building: 'community_center',
    setup: 'The town wants to celebrate the first spring harvest.',
    options: [
      o('C', 'ayesha', 'Check the seed list', "Make a tidy list of every family's seed needs and check it twice."),
      o('A', 'zoya', 'Write a harvest song', 'Write and perform a short harvest song with Zoya for the town.'),
    ] },
  { id: 'FC-W1-08', week: 1, host: 'hina', building: 'bhu',
    setup: 'Some children who play near the canal have stomach aches.',
    options: [
      o('S', 'hina', 'Comfort the parents', 'Sit with worried parents at the health unit and help them feel calm.'),
      o('I', 'bilal', 'Check the canal water', 'Collect canal water samples with Bilal and study them closely.'),
    ] },

  // ───────────── WEEK 2 · SUMMER ─────────────
  { id: 'FC-W2-01', week: 2, host: 'rafiq', building: 'workshop',
    setup: 'The school needs new desks before the term starts.',
    options: [
      o('E', 'kamran', 'Get wood donated', 'Ask shop owners to donate wood and agree on a fair deal.'),
      o('R', 'ayesha', 'Build the desks', "Build and sand new wooden desks with Ayesha in the workshop."),
    ] },
  { id: 'FC-W2-02', week: 2, host: 'saima', building: 'school',
    setup: 'New students are joining the government school.',
    options: [
      o('C', 'kamran', 'Set up the files', "Set up a clear filing system for the new students' forms."),
      o('S', 'bilal', 'Show students around', 'Show new students around the school and help them make friends.'),
    ] },
  { id: 'FC-W2-03', week: 2, host: 'zoya', building: 'mural_wall',
    setup: 'The school wants to raise money for a new library shelf.',
    options: [
      o('E', 'kamran', 'Run a bake sale', 'Run a school bake sale with Kamran and keep the stall busy.'),
      o('A', 'zoya', 'Paint a big mural', 'Paint a big mural of the solar system on the school wall.'),
    ] },
  { id: 'FC-W2-04', week: 2, host: 'rafiq', building: 'school_lab',
    setup: 'The science lab equipment is old and dusty.',
    options: [
      o('R', 'bilal', 'Repair the lab benches', 'Repair the broken lab stools and wobbly benches with Bilal.'),
      o('I', 'hina', 'Test the lab lenses', 'Run a careful test to see which lab lenses still work well.'),
    ] },
  { id: 'FC-W2-05', week: 2, host: 'kamran', building: 'community_kitchen',
    setup: 'The school canteen is losing money every week.',
    options: [
      o('C', 'ayesha', 'Check the receipts', "Check the canteen's receipts line by line to see where money goes."),
      o('E', 'kamran', 'Pitch a new menu', 'Pitch a new healthy snack menu to the headteacher and staff.'),
    ] },
  { id: 'FC-W2-06', week: 2, host: 'saima', building: 'school',
    setup: 'The playground was damaged by last year’s flood.',
    options: [
      o('R', 'ayesha', 'Fix the swings', 'Fix the swings and repaint the goalposts with Ayesha.'),
      o('S', 'bilal', 'Teach playground games', 'Help the youngest children learn new games and play fairly.'),
    ] },
  { id: 'FC-W2-07', week: 2, host: 'hina', building: 'weather_station',
    setup: 'The weather station near the school stopped working.',
    options: [
      o('I', 'ayesha', 'Predict the hot days', "Study old weather records with Ayesha to predict summer's hot days."),
      o('A', 'zoya', 'Make a weather poster', 'Design a fun weather poster for the classroom with bright drawings.'),
    ] },

  // ───────────── WEEK 3 · MONSOON ─────────────
  { id: 'FC-W3-01', week: 3, host: 'rafiq', building: 'bazaar_shops',
    setup: 'Heavy rain has blocked the drains on Market Road.',
    options: [
      o('R', 'rafiq', 'Clear the drains', 'Clear the blocked drains with Ustad Rafiq and fit new metal grates.'),
      o('C', 'ayesha', 'Map the drains', 'Map every drain on the street and record which ones are blocked.'),
    ] },
  { id: 'FC-W3-02', week: 3, host: 'saima', building: 'town_hall',
    setup: 'The town needs a plan before the next big storm.',
    options: [
      o('E', 'ayesha', 'Lead the town meeting', 'Lead the town meeting and help everyone agree on a storm plan.'),
      o('I', 'hina', 'Study the rain data', 'Study the rain gauge data to find which streets flood first.'),
    ] },
  { id: 'FC-W3-03', week: 3, host: 'saima', building: 'community_center',
    setup: 'Some families are staying at the community center for a few days.',
    options: [
      o('S', 'ayesha', 'Serve hot food', 'Serve hot food in the kitchen and listen to families’ worries.'),
      o('A', 'zoya', 'Make a play corner', 'Make a cheerful play corner with puppets and drawings for children.'),
    ] },
  { id: 'FC-W3-04', week: 3, host: 'kamran', building: 'bank',
    setup: "The bank's records got wet in the flood.",
    options: [
      o('I', 'bilal', 'Find the leak', "Investigate why water leaked into the bank's back room."),
      o('C', 'kamran', 'Re-file the papers', 'Dry, sort and re-file the wet bank papers in the right order.'),
    ] },
  { id: 'FC-W3-05', week: 3, host: 'rafiq', building: 'bridge',
    setup: 'The bridge to the market is cracked.',
    options: [
      o('R', 'bilal', 'Fix the bridge beams', 'Help Bilal and the engineers fit strong new beams on the bridge.'),
      o('A', 'ayesha', 'Design safety signs', 'Design bright new safety signs with Ayesha for both ends of the bridge.'),
    ] },
  { id: 'FC-W3-06', week: 3, host: 'kamran', building: 'transport_office',
    setup: 'Buses cannot reach the far side of town.',
    options: [
      o('E', 'kamran', 'Win a new bus route', 'Talk with the transport office and convince them to add a route.'),
      o('S', 'ayesha', 'Help older neighbours', 'Walk older neighbours to the health unit and carry their shopping.'),
    ] },
  { id: 'FC-W3-07', week: 3, host: 'zoya', building: 'radio_station',
    setup: 'The radio station wants to share flood news with everyone.',
    options: [
      o('A', 'zoya', 'Record a radio story', "Write and record a short radio story about the town's helpers."),
      o('C', 'bilal', 'Plan the news timetable', "Prepare an exact timetable for the radio's daily safety updates."),
    ] },
  { id: 'FC-W3-08', week: 3, host: 'hina', building: 'bhu_lab',
    setup: 'Mosquitoes are spreading after the rain.',
    options: [
      o('I', 'ayesha', 'Find the breeding spots', 'Find where mosquitoes breed by checking puddles across the town.'),
      o('S', 'hina', 'Visit families', 'Visit homes with Dr Hina and explain how families can stay healthy.'),
    ] },

  // ───────────── WEEK 4 · WINTER MELA ─────────────
  { id: 'FC-W4-01', week: 4, host: 'saima', building: 'town_hall',
    setup: 'The Great Town Mela is only two weeks away!',
    options: [
      o('R', 'ayesha', 'Build the stage', 'Build the wooden stage for the Mela with Ayesha and Ustad Rafiq.'),
      o('E', 'kamran', 'Find Mela sponsors', 'Persuade local businesses to sponsor the Mela and run stalls.'),
    ] },
  { id: 'FC-W4-02', week: 4, host: 'saima', building: 'post_office',
    setup: 'Visitors from nearby villages will come to the Mela.',
    options: [
      o('S', 'bilal', 'Welcome the visitors', 'Welcome visitors at the gate and help lost children find family.'),
      o('C', 'ayesha', 'Keep the visitor count', 'Keep the visitor count and the stall list correct and up to date.'),
    ] },
  { id: 'FC-W4-03', week: 4, host: 'zoya', building: 'printing_shop',
    setup: 'The Mela needs something special that people will remember.',
    options: [
      o('A', 'bilal', 'Design the lanterns', "Design the Mela's banners and paper lanterns with Bilal and Zoya."),
      o('E', 'kamran', 'Plan a prize contest', 'Plan a prize contest with Kamran and get people to join in.'),
    ] },
  { id: 'FC-W4-04', week: 4, host: 'rafiq', building: 'solar_shop',
    setup: "The Mela's lights keep flickering.",
    options: [
      o('I', 'ayesha', 'Find the fault', 'Test each light circuit to find exactly what causes the flicker.'),
      o('R', 'rafiq', 'Rewire the lights', 'Replace the old wires and bulbs on the light poles with Ustad Rafiq.'),
    ] },
  { id: 'FC-W4-05', week: 4, host: 'kamran', building: 'general_store',
    setup: 'Many people want a stall at the Mela.',
    options: [
      o('E', 'bilal', 'Lead the stall committee', 'Lead the stall committee and decide how to share space fairly.'),
      o('C', 'kamran', 'Make the stall map', 'Make a neat numbered stall map and check every booking carefully.'),
    ] },
  { id: 'FC-W4-06', week: 4, host: 'hina', building: 'library',
    setup: 'Some older people find it hard to walk around the Mela.',
    options: [
      o('S', 'hina', 'Guide older visitors', 'Guide older visitors around the Mela and keep them company.'),
      o('R', 'ayesha', 'Build ramps and benches', 'Build wooden ramps and benches with Ayesha so everyone gets around.'),
    ] },
  { id: 'FC-W4-07', week: 4, host: 'saima', building: 'records_office',
    setup: 'The town wants to remember its year of recovery.',
    options: [
      o('A', 'zoya', 'Make a story wall', "Create a drawing wall that tells the story of the town's year."),
      o('I', 'bilal', 'Gather the facts', 'Collect facts and figures that show how much the town has improved.'),
    ] },
];

/** Unscored practice choice for the prologue. */
export const PRACTICE_CHOICE: Omit<ChoiceScenario, 'week'> & { week: 0 } = {
  id: 'PRAC-FC-01', week: 0, host: 'saima', building: 'community_center',
  setup: 'Practice: the Youth Office needs a little help today. Either choice is fine!',
  options: [
    o('S', 'bilal', 'Carry the chairs', 'Carry chairs into the office with Bilal for the welcome meeting.'),
    o('A', 'ayesha', 'Decorate the door', 'Decorate the office door with Ayesha using paper flowers.'),
  ],
};
