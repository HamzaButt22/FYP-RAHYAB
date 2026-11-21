import type { EventSpec, LevelId } from '../../contract/events';
import { INSTRUMENT, JOURNAL_PAGES } from './items';

export interface JournalPage { level: LevelId; items: string[]; first: boolean }

/**
 * The next journal page still owed: the earliest completed stop whose statements have not all been
 * answered or skipped. Derived from stored events, so a page interrupted by an app kill comes back.
 */
export function pendingJournalPage(completed: readonly LevelId[], seen: ReadonlySet<string>): JournalPage | null {
  for (const level of completed) {
    const items = (JOURNAL_PAGES[level] ?? []).filter((id) => !seen.has(id));
    if (items.length) return { level, items, first: seen.size === 0 };
  }
  return null;
}


/** The one place a journal answer becomes an event (answer null = skipped). */
export function big5Event(pageLevel: LevelId, itemId: string, answer: number | null, responseMs: number): EventSpec {
  return { level: pageLevel, type: 'BIG5_RESPONSE', opportunity: `B5_${itemId}`,
    data: { item_id: itemId, instrument: INSTRUMENT, answer, skipped: answer === null, page_level: pageLevel, response_time_ms: Math.round(responseMs) } };
}
