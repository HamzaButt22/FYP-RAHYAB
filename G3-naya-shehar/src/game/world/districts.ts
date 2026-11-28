import { Week } from '@/assessment/types';

export type DistrictId = 'workshop_lane' | 'science_corner' | 'rang_bazaar' | 'community_square' | 'market_road' | 'records_house';

export interface District {
  id: DistrictId;
  name: string;
  tagline: string;
  description: string;
  /** First week in which the district is open. */
  unlockWeek: Week;
  /** Grid zone (inclusive) on the town map. */
  zone: { x0: number; y0: number; x1: number; y1: number };
  /** Accent colour used for the district's ground tint and banner. */
  accent: string;
  icon: 'gear' | 'flask' | 'brush' | 'hands' | 'stall' | 'ledger';
  host: 'rafiq' | 'hina' | 'zoya' | 'saima' | 'kamran';
}

/** Player-facing districts. No RIASEC labels are shown anywhere in the UI. */
export const DISTRICTS: District[] = [
  { id: 'science_corner', name: 'Science Corner', tagline: 'Find out how things work',
    description: 'Labs, a weather station and a research centre where the town asks questions and tests ideas.',
    unlockWeek: 2, zone: { x0: 0, y0: 0, x1: 4, y1: 4 }, accent: '#5B8DEF', icon: 'flask', host: 'hina' },
  { id: 'rang_bazaar', name: 'Rang Bazaar', tagline: 'Colours, stories and sound',
    description: 'Painted walls, a printing shop, an art studio and the town radio.',
    unlockWeek: 2, zone: { x0: 6, y0: 0, x1: 9, y1: 4 }, accent: '#E2589B', icon: 'brush', host: 'zoya' },
  { id: 'records_house', name: 'Records House', tagline: 'Keeping the town in order',
    description: 'The post office, bank, library and records office keep everything safe and sorted.',
    unlockWeek: 3, zone: { x0: 11, y0: 0, x1: 14, y1: 4 }, accent: '#8A6FD1', icon: 'ledger', host: 'kamran' },
  { id: 'workshop_lane', name: 'Workshop Lane', tagline: 'Build it, fix it, make it go',
    description: 'Workshops, a solar shop, the canal bridge and the water pump station.',
    unlockWeek: 1, zone: { x0: 0, y0: 6, x1: 4, y1: 10 }, accent: '#E9873A', icon: 'gear', host: 'rafiq' },
  { id: 'community_square', name: 'Community Square', tagline: 'The heart of the town',
    description: 'The school, the Basic Health Unit, the community kitchen and the Youth Office.',
    unlockWeek: 0, zone: { x0: 6, y0: 6, x1: 9, y1: 10 }, accent: '#3FAE6A', icon: 'hands', host: 'saima' },
  { id: 'market_road', name: 'Market Road', tagline: 'Busy shops and big plans',
    description: 'General stores, the town hall, the transport office and small family businesses.',
    unlockWeek: 3, zone: { x0: 11, y0: 6, x1: 14, y1: 10 }, accent: '#E3B23C', icon: 'stall', host: 'kamran' },
];

export const districtById = (id: DistrictId) => DISTRICTS.find((d) => d.id === id)!;

export function isDistrictUnlocked(id: DistrictId, currentWeek: Week): boolean {
  return districtById(id).unlockWeek <= currentWeek;
}
