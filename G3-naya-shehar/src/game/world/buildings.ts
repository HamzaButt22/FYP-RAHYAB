import { DistrictId } from './districts';

export type BuildingId =
  | 'workshop' | 'solar_shop' | 'bridge' | 'pump_station'
  | 'school_lab' | 'weather_station' | 'bhu_lab' | 'research_center'
  | 'mural_wall' | 'printing_shop' | 'art_studio' | 'radio_station'
  | 'school' | 'bhu' | 'community_kitchen' | 'community_center'
  | 'general_store' | 'town_hall' | 'transport_office' | 'bazaar_shops'
  | 'post_office' | 'bank' | 'library' | 'records_office';

export type RoofStyle = 'flat' | 'parapet' | 'sloped' | 'tower' | 'awning' | 'open';
export type Detail =
  | 'solar' | 'chimney' | 'antenna' | 'anemometer' | 'clock' | 'tank' | 'flag'
  | 'awning' | 'mural' | 'cross' | 'books' | 'pipes' | 'arch' | 'bus' | 'mailbox' | 'columns' | 'pot' | 'easel';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  district: DistrictId;
  /** Grid position on the town map. */
  gx: number;
  gy: number;
  /** Wall height in px at stage 4. */
  height: number;
  palette: { wall: string; side: string; roof: string; trim: string };
  roof: RoofStyle;
  details: Detail[];
  /** What the finished building does — shown on the building card. */
  purpose: string;
}

const B = (
  id: BuildingId, name: string, district: DistrictId, gx: number, gy: number, height: number,
  palette: BuildingDef['palette'], roof: RoofStyle, details: Detail[], purpose: string,
): BuildingDef => ({ id, name, district, gx, gy, height, palette, roof, details, purpose });

export const BUILDINGS: BuildingDef[] = [
  // Workshop Lane (zone x0-4, y6-10)
  B('workshop', 'Ustad Rafiq’s Workshop', 'workshop_lane', 1, 7, 34, { wall: '#E9A66B', side: '#C9824A', roof: '#7A4E2D', trim: '#FFF1DC' }, 'sloped', ['chimney', 'pipes'], 'Repairs tools, bicycles and machines for the whole town.'),
  B('solar_shop', 'Solar Equipment Shop', 'workshop_lane', 3, 7, 30, { wall: '#F3C77A', side: '#D9A757', roof: '#3E5C76', trim: '#FFFFFF' }, 'flat', ['solar', 'awning'], 'Sells and fixes solar panels so homes have power.'),
  B('bridge', 'Canal Bridge Site', 'workshop_lane', 1, 9, 14, { wall: '#C9B79C', side: '#A8957A', roof: '#8C7B62', trim: '#F2E6D3' }, 'open', ['arch'], 'A safe crossing over the canal to the fields.'),
  B('pump_station', 'Water Pump Station', 'workshop_lane', 3, 9, 30, { wall: '#9ED3E8', side: '#76B3CC', roof: '#2F6F8F', trim: '#FFFFFF' }, 'tower', ['tank', 'pipes'], 'Pumps clean water from the canal to every street.'),
  // Science Corner (zone x0-4, y0-4)
  B('school_lab', 'School Laboratory', 'science_corner', 1, 1, 32, { wall: '#BFD4F6', side: '#97B2DE', roof: '#3D5A99', trim: '#FFFFFF' }, 'parapet', ['tank'], 'Where students try experiments and test ideas.'),
  B('weather_station', 'Weather Station', 'science_corner', 3, 1, 26, { wall: '#E3EEF9', side: '#BCCDE0', roof: '#5B8DEF', trim: '#FFFFFF' }, 'tower', ['anemometer'], 'Measures rain, wind and heat to warn the town early.'),
  B('bhu_lab', 'Health Unit Laboratory', 'science_corner', 1, 3, 30, { wall: '#F2F6FA', side: '#CBD6E2', roof: '#4E9F9A', trim: '#E35D5D' }, 'flat', ['cross'], 'Tests water and samples to keep people healthy.'),
  B('research_center', 'Research Centre', 'science_corner', 3, 3, 40, { wall: '#C8D9F2', side: '#A0B6D8', roof: '#334E7E', trim: '#FFFFFF' }, 'parapet', ['antenna', 'solar'], 'Studies the canal, crops and weather to plan for the future.'),
  // Rang Bazaar (zone x6-9, y0-4)
  B('mural_wall', 'Mural Wall', 'rang_bazaar', 6, 1, 22, { wall: '#F7D9E6', side: '#E0B0C6', roof: '#E2589B', trim: '#FFF5E0' }, 'open', ['mural'], 'A big wall of paintings that tell the town’s story.'),
  B('printing_shop', 'Printing Shop', 'rang_bazaar', 8, 1, 30, { wall: '#F9C9A9', side: '#E2A884', roof: '#A3446E', trim: '#FFFFFF' }, 'flat', ['awning'], 'Prints posters, notices and school books.'),
  B('art_studio', 'Art Studio', 'rang_bazaar', 6, 3, 32, { wall: '#FBE1A6', side: '#E4C27C', roof: '#C34A7F', trim: '#FFFFFF' }, 'sloped', ['easel', 'pot'], 'A bright studio for painting, crafts and music.'),
  B('radio_station', 'Radio Naya Shehar', 'rang_bazaar', 8, 3, 34, { wall: '#E6D4F5', side: '#C3ACDB', roof: '#7B4FB5', trim: '#FFFFFF' }, 'tower', ['antenna'], 'Shares news, stories and safety updates with everyone.'),
  // Records House (zone x11-14, y0-4)
  B('post_office', 'Post Office', 'records_house', 11, 1, 28, { wall: '#F4D8A8', side: '#DDB97F', roof: '#B5473A', trim: '#FFFFFF' }, 'parapet', ['mailbox'], 'Sends letters and parcels across Pakistan.'),
  B('bank', 'Town Bank', 'records_house', 13, 1, 36, { wall: '#E7E2D6', side: '#C7BFAE', roof: '#5E6A71', trim: '#E3B23C' }, 'parapet', ['columns'], 'Keeps savings safe and helps small businesses grow.'),
  B('library', 'Public Library', 'records_house', 11, 3, 34, { wall: '#D9CBF0', side: '#B7A5D6', roof: '#5A4A8F', trim: '#FFFFFF' }, 'sloped', ['books', 'arch'], 'Books, newspapers and a quiet place to study.'),
  B('records_office', 'Records Office', 'records_house', 13, 3, 32, { wall: '#ECE3CF', side: '#CEC2A6', roof: '#6E5B3E', trim: '#FFFFFF' }, 'flat', ['tank'], 'Keeps land, birth and school records in order.'),
  // Community Square (zone x6-9, y6-10)
  B('school', 'Government School', 'community_square', 6, 7, 34, { wall: '#F6E7B8', side: '#DDC98E', roof: '#3FAE6A', trim: '#FFFFFF' }, 'parapet', ['flag'], 'Classes 1 to 10 for children from every street.'),
  B('bhu', 'Basic Health Unit', 'community_square', 8, 7, 30, { wall: '#FFFFFF', side: '#D9DEE4', roof: '#4E9F9A', trim: '#E35D5D' }, 'flat', ['cross', 'tank'], 'Dr Hina’s clinic for check-ups and medicine.'),
  B('community_kitchen', 'Community Kitchen', 'community_square', 6, 9, 26, { wall: '#FBD3A0', side: '#E3B27A', roof: '#B8562F', trim: '#FFF5E0' }, 'sloped', ['chimney', 'pot'], 'Cooks hot meals for families who need them.'),
  B('community_center', 'Youth Office & Community Centre', 'community_square', 8, 9, 32, { wall: '#CDEBD2', side: '#A6CFAE', roof: '#2E8B57', trim: '#FFFFFF' }, 'parapet', ['flag', 'arch'], 'Baji Saima’s office, where volunteers plan every project.'),
  // Market Road (zone x11-14, y6-10)
  B('general_store', 'General Store', 'market_road', 11, 7, 26, { wall: '#FBE3A1', side: '#E3C57A', roof: '#D2691E', trim: '#FFFFFF' }, 'awning', ['awning'], 'Rice, flour, soap and everything a home needs.'),
  B('town_hall', 'Town Hall', 'market_road', 13, 7, 42, { wall: '#F1DEC0', side: '#D6BE98', roof: '#9C3D2E', trim: '#FFFFFF' }, 'tower', ['clock', 'flag'], 'Where the town council meets and plans together.'),
  B('transport_office', 'Transport Office', 'market_road', 11, 9, 26, { wall: '#D7E7C4', side: '#B5CC9C', roof: '#4C7A3A', trim: '#FFFFFF' }, 'flat', ['bus'], 'Runs the town buses and rickshaw stand.'),
  B('bazaar_shops', 'Bazaar Shops', 'market_road', 13, 9, 24, { wall: '#F8C58C', side: '#DFA466', roof: '#C0392B', trim: '#FFF5E0' }, 'awning', ['awning', 'chimney'], 'Family shops: a chai stall, a tailor and a cobbler.'),
];

export const buildingById = (id: BuildingId) => BUILDINGS.find((b) => b.id === id)!;
export const buildingsInDistrict = (d: DistrictId) => BUILDINGS.filter((b) => b.district === d);

/** Construction stages, shown to the player with words + icon, never colour alone. */
export const STAGES = ['Damaged', 'Work begins', 'Workers busy', 'Nearly done', 'Open!'] as const;
export const STAGE_THRESHOLDS = [0, 20, 45, 70, 100];
export const MAX_PROGRESS = 100;

export function stageOf(progress: number): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) if (progress >= STAGE_THRESHOLDS[i]) s = i;
  return s as 0 | 1 | 2 | 3 | 4;
}
