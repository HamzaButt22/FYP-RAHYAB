/**
 * Cosmetic rewards, derived from stored events so they survive restarts and can never be "farmed".
 *
 * Fairness rule: rewards must not change the evidence. Coins are the SAME for every activity type
 * (so no interest area pays more), do NOT depend on optional/extra steps or bonus rounds (those are
 * engagement evidence), and do NOT depend on puzzle correctness (attempts are rewarded, not answers).
 */
import type { AssessmentEvent } from '../contract/events';

export const COIN_RULES = { stopCompleted: 20, activityEnded: 3, puzzleAttempted: 2 } as const;

export function coinsFromEvents(events: readonly AssessmentEvent[]): number {
  const levels = new Set<string>();
  const activities = new Set<string>();
  const puzzles = new Set<string>();
  for (const e of events) {
    const d = e.event_data as Record<string, unknown>;
    if (e.event_type === 'LEVEL_COMPLETE') levels.add(e.level_id);
    if (e.event_type === 'ACTIVITY_END') activities.add(`${e.level_id}:${d.task_id}:${d.round}`);
    if (e.event_type === 'ITEM_RESPONSE' && !d.practice) puzzles.add(String(d.item_id));
  }
  return levels.size * COIN_RULES.stopCompleted + activities.size * COIN_RULES.activityEnded + puzzles.size * COIN_RULES.puzzleAttempted;
}
