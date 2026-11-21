/**
 * Big Five self-report items: the 20-item "Mini-IPIP" (Donnellan, Oswald, Baird & Lucas, 2006,
 * Psychological Assessment 18, 192–203), built from the public-domain International Personality Item Pool
 * (ipip.ori.org). Item wording and keying were checked against the IPIP key page (Nov 2026).
 *
 * Adaptations (documented in docs/BIG_FIVE.md; they need checking in the pilot):
 *  - "I" is added at the start of each statement so it reads naturally to a student.
 *  - Two items mention "parties"; the wording is kept, with a short gloss ("or family gatherings")
 *    shown under the statement for Pakistani students. The scored text is unchanged.
 *  - The two "abstract ideas" items get a gloss explaining "abstract".
 * The response scale is the usual 5-point accuracy scale, shown as words plus faces.
 * Urdu wording is NOT provided: it needs a proper translation and back-translation, not machine translation.
 */
import type { LevelId } from '../../contract/events';

export type Trait = 'O' | 'C' | 'E' | 'A' | 'N';
export const TRAITS: Trait[] = ['O', 'C', 'E', 'A', 'N'];

export interface BigFiveItem {
  id: string;
  trait: Trait;
  /** +1 = agreeing means more of the trait; -1 = reverse keyed (scored as 6 - answer) */
  key: 1 | -1;
  text: string;
  gloss?: string;
}

export const INSTRUMENT = 'mini-ipip-20';

export const BIG5_ITEMS: BigFiveItem[] = [
  { id: 'mi01', trait: 'E', key: 1, text: 'I am the life of the party.', gloss: 'A party can also be a family gathering or a wedding.' },
  { id: 'mi02', trait: 'A', key: 1, text: 'I sympathize with others’ feelings.' },
  { id: 'mi03', trait: 'C', key: 1, text: 'I get chores done right away.' },
  { id: 'mi04', trait: 'N', key: 1, text: 'I have frequent mood swings.' },
  { id: 'mi05', trait: 'O', key: 1, text: 'I have a vivid imagination.' },
  { id: 'mi06', trait: 'E', key: -1, text: 'I don’t talk a lot.' },
  { id: 'mi07', trait: 'A', key: -1, text: 'I am not really interested in others.' },
  { id: 'mi08', trait: 'C', key: -1, text: 'I often forget to put things back in their proper place.' },
  { id: 'mi09', trait: 'N', key: -1, text: 'I am relaxed most of the time.' },
  { id: 'mi10', trait: 'O', key: -1, text: 'I am not interested in abstract ideas.', gloss: 'Abstract ideas are ideas you cannot touch, like fairness, time or infinity.' },
  { id: 'mi11', trait: 'E', key: 1, text: 'I talk to a lot of different people at parties.', gloss: 'A party can also be a family gathering or a wedding.' },
  { id: 'mi12', trait: 'A', key: 1, text: 'I feel others’ emotions.' },
  { id: 'mi13', trait: 'C', key: 1, text: 'I like order.' },
  { id: 'mi14', trait: 'N', key: 1, text: 'I get upset easily.' },
  { id: 'mi15', trait: 'O', key: -1, text: 'I have difficulty understanding abstract ideas.', gloss: 'Abstract ideas are ideas you cannot touch, like fairness, time or infinity.' },
  { id: 'mi16', trait: 'E', key: -1, text: 'I keep in the background.' },
  { id: 'mi17', trait: 'A', key: -1, text: 'I am not interested in other people’s problems.' },
  { id: 'mi18', trait: 'C', key: -1, text: 'I make a mess of things.' },
  { id: 'mi19', trait: 'N', key: -1, text: 'I seldom feel blue.', gloss: '“Feel blue” means feel sad.' },
  { id: 'mi20', trait: 'O', key: -1, text: 'I do not have a good imagination.' },
];

export const BIG5_BY_ID: Record<string, BigFiveItem> = Object.fromEntries(BIG5_ITEMS.map((i) => [i.id, i]));

/**
 * One short journal page after each stop (2–3 statements), so the questionnaire never feels like a form.
 * Each page mixes traits and keying; every trait's four items are spread over at least three stops.
 */
export const JOURNAL_PAGES: Partial<Record<LevelId, string[]>> = {
  valley_gate: ['mi05', 'mi02'],
  crossroads_caravan: ['mi03', 'mi01', 'mi09'],
  workshop_orders: ['mi07', 'mi13'],
  career_workshop: ['mi11', 'mi20', 'mi14'],
  map_room: ['mi08', 'mi12'],
  pattern_gate: ['mi06', 'mi15', 'mi19'],
  park_mission: ['mi17', 'mi04', 'mi18'],
  vault_locks: ['mi10', 'mi16'],
};

export const ANSWER_LABELS = ['Not like me at all', 'Not much like me', 'In between', 'A bit like me', 'Very much like me'] as const;
