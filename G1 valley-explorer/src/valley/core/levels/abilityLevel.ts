/**
 * One generic machine for the four ability levels (3, 5, 6, 8).
 *
 * Flow per item: ITEM_PRESENTED -> (optional HINT_USED, max 1) -> ITEM_RESPONSE -> feedback -> next.
 * - Correctness is computed HERE by the item bank's own checker, never passed in by the screen.
 * - Scored items allow ONE submission; practice items allow retries so students learn the controls.
 * - "Skip" is always available (counts as answered-not-correct; reported separately).
 * - The in-progress answer (draft) is saved in state so a killed app resumes with the same selection.
 */
import type { LevelId } from '../../contract/events';
import { ITEM_BANK_VERSION } from '../../contract/versions';
import { LOCK_ITEMS, isCorrectCode } from '../items/vaultLocks';
import { MAP_ITEMS, isCorrectMap } from '../items/mapRoom';
import { PATTERN_ITEMS, isCorrectPattern } from '../items/patternGate';
import { ORDERS_ITEMS, scoreOrders } from '../items/workshopOrders';
import type { AbilityFamily } from '../journey';
import { same, type LevelMachine } from './machine';

export interface AbilityItemMeta {
  id: string;
  version: number;
  practice: boolean;
  difficulty: number;
}

export interface AbilityState {
  index: number;
  phase: 'question' | 'feedback';
  presentedAt: number;
  hints: number;
  attempt: number;
  lastCorrect: boolean | null;
  lastSkipped: boolean;
  draft: unknown;
}

export type AbilityAction =
  | { type: 'DRAFT'; draft: unknown }
  | { type: 'HINT' }
  | { type: 'SUBMIT'; response: unknown }
  | { type: 'SKIP' }
  | { type: 'RETRY' }
  | { type: 'NEXT' };

interface Spec<R> {
  id: Exclude<LevelId, 'journey'>;
  index: number;
  family: AbilityFamily;
  items: AbilityItemMeta[];
  check: (itemIndex: number, response: R) => boolean;
  emptyDraft: (itemIndex: number) => unknown;
}

function abilityMachine<R>(spec: Spec<R>): LevelMachine<AbilityState, AbilityAction> & { spec: Spec<R> } {
  const item = (i: number) => spec.items[i];
  const presented = (i: number) => ({
    level: spec.id, type: 'ITEM_PRESENTED' as const, opportunity: item(i).id,
    data: { item_id: item(i).id, family: spec.family, item_version: item(i).version, item_bank: ITEM_BANK_VERSION, difficulty: item(i).difficulty, practice: item(i).practice, position: i },
  });
  return {
    id: spec.id,
    spec,
    init: (ctx) => ({
      state: { index: 0, phase: 'question', presentedAt: ctx.t, hints: 0, attempt: 1, lastCorrect: null, lastSkipped: false, draft: spec.emptyDraft(0) },
      events: [
        { level: spec.id, type: 'LEVEL_START', data: { level_index: spec.index, family: spec.family, items: spec.items.map((i) => i.id), item_bank: ITEM_BANK_VERSION } },
        presented(0),
      ],
    }),
    reduce(s, a, ctx) {
      const it = item(s.index);
      switch (a.type) {
        case 'DRAFT':
          return s.phase === 'question' ? { state: { ...s, draft: a.draft }, events: [] } : same(s);
        case 'HINT':
          if (s.phase !== 'question' || s.hints >= 1) return same(s);
          return { state: { ...s, hints: s.hints + 1 }, events: [{ level: spec.id, type: 'HINT_USED', opportunity: it.id, data: { item_id: it.id, family: spec.family, practice: it.practice } }] };
        case 'SUBMIT':
        case 'SKIP': {
          if (s.phase !== 'question') return same(s);
          const skipped = a.type === 'SKIP';
          const correct = skipped ? false : spec.check(s.index, a.response as R);
          return {
            state: { ...s, phase: 'feedback', lastCorrect: correct, lastSkipped: skipped },
            events: [{
              level: spec.id, type: 'ITEM_RESPONSE', opportunity: it.id,
              data: { item_id: it.id, family: spec.family, item_version: it.version, difficulty: it.difficulty, practice: it.practice,
                response: skipped ? null : (a as { response: unknown }).response, correct, skipped, attempt: s.attempt, hints_used: s.hints,
                response_time_ms: Math.max(0, Math.round(ctx.t - s.presentedAt)) },
            }],
          };
        }
        case 'RETRY':
          // only practice items may be retried; scored items keep their first answer
          if (s.phase !== 'feedback' || !it.practice || s.lastCorrect) return same(s);
          return { state: { ...s, phase: 'question', attempt: s.attempt + 1, lastCorrect: null, presentedAt: ctx.t }, events: [] };
        case 'NEXT': {
          if (s.phase !== 'feedback') return same(s);
          const next = s.index + 1;
          if (next >= spec.items.length)
            return { state: s, complete: true, events: [{ level: spec.id, type: 'LEVEL_COMPLETE', data: { level_index: spec.index } }] };
          return {
            state: { index: next, phase: 'question', presentedAt: ctx.t, hints: 0, attempt: 1, lastCorrect: null, lastSkipped: false, draft: spec.emptyDraft(next) },
            events: [presented(next)],
          };
        }
      }
    },
  };
}

export const workshopOrders = abilityMachine<string[]>({
  id: 'workshop_orders', index: 3, family: 'planning_numerical', items: ORDERS_ITEMS,
  check: (i, chosen) => Array.isArray(chosen) && scoreOrders(ORDERS_ITEMS[i], chosen).correct, emptyDraft: () => [],
});

export const mapRoom = abilityMachine<number>({
  id: 'map_room', index: 5, family: 'spatial', items: MAP_ITEMS,
  check: (i, choice) => isCorrectMap(MAP_ITEMS[i], choice), emptyDraft: () => null,
});

export const patternGate = abilityMachine<number>({
  id: 'pattern_gate', index: 6, family: 'abstract', items: PATTERN_ITEMS,
  check: (i, choice) => isCorrectPattern(PATTERN_ITEMS[i], choice), emptyDraft: () => null,
});

export const vaultLocks = abilityMachine<number[]>({
  id: 'vault_locks', index: 8, family: 'logical', items: LOCK_ITEMS,
  check: (i, code) => Array.isArray(code) && isCorrectCode(LOCK_ITEMS[i], code), emptyDraft: () => [1, 2, 3],
});
