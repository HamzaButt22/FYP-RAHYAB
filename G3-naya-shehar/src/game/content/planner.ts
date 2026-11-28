import { Riasec, ScoredWeek } from '@/assessment/types';
import { CharacterId } from '../characters/characters';
import { BuildingId } from '../world/buildings';

export interface PlannerActivity {
  id: string;
  category: Riasec;
  title: string;
  text: string;
  partner: CharacterId;
  building: BuildingId;
}

export interface PlannerSet {
  id: string;
  week: ScoredWeek;
  activities: PlannerActivity[];
}

const a = (id: string, category: Riasec, partner: CharacterId, building: BuildingId, title: string, text: string): PlannerActivity =>
  ({ id, category, partner, building, title, text });

/** One planner per scored week; each offers exactly one activity per category. */
export const PLANNER_SETS: PlannerSet[] = [
  { id: 'PLAN-W1', week: 1, activities: [
    a('PLAN-W1-R', 'R', 'rafiq', 'workshop', 'Rebuild the pump motor', 'Take apart the old motor and put it back together so it runs.'),
    a('PLAN-W1-I', 'I', 'hina', 'bhu', 'Solve the muddy water', 'Find out why the canal water turns muddy after sunset.'),
    a('PLAN-W1-A', 'A', 'zoya', 'community_center', 'Paint the canal wall', 'Paint spring flowers and birds along the old canal wall.'),
    a('PLAN-W1-S', 'S', 'bilal', 'community_kitchen', 'Help carry the seeds', 'Help families carry seed bags and tools out to their fields.'),
    a('PLAN-W1-E', 'E', 'kamran', 'school', 'Run planting day', 'Organise the town planting day and give every team a job.'),
    a('PLAN-W1-C', 'C', 'ayesha', 'pump_station', 'Track the seed sharing', 'Keep the record of which family got which seeds and tools.'),
  ] },
  { id: 'PLAN-W2', week: 2, activities: [
    a('PLAN-W2-R', 'R', 'ayesha', 'school', 'Fix the classroom fans', 'Repair the broken ceiling fans before the hot days arrive.'),
    a('PLAN-W2-I', 'I', 'hina', 'school_lab', 'Set up a lab test', 'Plan a fair test to see which plant grows best in the heat.'),
    a('PLAN-W2-A', 'A', 'zoya', 'art_studio', 'Design the school logo', 'Design a new school logo that students can wear with pride.'),
    a('PLAN-W2-S', 'S', 'bilal', 'school', 'Start a reading buddies club', 'Pair older students with young readers for daily reading time.'),
    a('PLAN-W2-E', 'E', 'kamran', 'printing_shop', 'Raise money for books', 'Plan a book fund drive and convince families to support it.'),
    a('PLAN-W2-C', 'C', 'ayesha', 'school', 'Organise the timetable', 'Make a clear new class timetable with rooms and teachers.'),
  ] },
  { id: 'PLAN-W3', week: 3, activities: [
    a('PLAN-W3-R', 'R', 'rafiq', 'bridge', 'Raise the road with gravel', 'Spread gravel and pack it down so the road stays above water.'),
    a('PLAN-W3-I', 'I', 'ayesha', 'research_center', 'Trace the flood water', 'Follow the flood water to find where the drains are failing.'),
    a('PLAN-W3-A', 'A', 'zoya', 'radio_station', 'Draw safety comics', 'Draw a short comic that shows children how to stay safe in rain.'),
    a('PLAN-W3-S', 'S', 'hina', 'community_center', 'Care for flood families', 'Look after families at the shelter and make sure they feel safe.'),
    a('PLAN-W3-E', 'E', 'bilal', 'town_hall', 'Lead the rescue team', 'Lead a volunteer team and decide where help is needed first.'),
    a('PLAN-W3-C', 'C', 'kamran', 'records_office', 'Count the supplies', 'Count and record all emergency supplies so nothing runs out.'),
  ] },
  { id: 'PLAN-W4', week: 4, activities: [
    a('PLAN-W4-R', 'R', 'ayesha', 'solar_shop', 'Set up Mela lights', 'Put up solar lights and power for the whole Mela ground.'),
    a('PLAN-W4-I', 'I', 'bilal', 'weather_station', 'Check the Mela weather', 'Study the forecast and work out the best day for the Mela.'),
    a('PLAN-W4-A', 'A', 'zoya', 'mural_wall', 'Plan the Mela show', 'Plan the music, drama and dance show for the Mela stage.'),
    a('PLAN-W4-S', 'S', 'hina', 'bhu', 'Run the first-aid tent', 'Help Dr Hina run a first-aid and lost-child tent at the Mela.'),
    a('PLAN-W4-E', 'E', 'kamran', 'bazaar_shops', 'Manage the food street', 'Manage the food stalls and keep the food street busy and fair.'),
    a('PLAN-W4-C', 'C', 'ayesha', 'bank', 'Keep the Mela accounts', 'Keep the Mela money book neat, correct and ready to check.'),
  ] },
];

export const plannerForWeek = (w: ScoredWeek) => PLANNER_SETS.find((p) => p.week === w)!;
