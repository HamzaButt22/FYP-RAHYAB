/**
 * Durable session log + outbox + checkpoint.
 *
 * Every committed game action writes, in ONE multiSet call:
 *   ve:<sid>:evt:<seq>   the event (with a `sent` flag)       -> outbox + local log used for the summary
 *   ve:<sid>:journey     the JourneyState checkpoint          -> resume point
 *   ve:<sid>:meta        { nextSeq, activeMs, studentId }     -> clock + sequence counter
 * so an app kill can never leave an event without its checkpoint or vice versa (on stores whose
 * multiSet is transactional, which AsyncStorage on Android is).
 *
 * After the summary has been delivered and every event is acknowledged by the server, purge() removes
 * the session's data from the device (data minimisation).
 */
import type { AssessmentEvent } from '../contract/events';
import type { JourneyState } from '../core/progress';
import type { KeyValueStore } from './storage';

export const ACTIVE_KEY = 've:active';
const evtKey = (sid: string, seq: number) => `ve:${sid}:evt:${String(seq).padStart(6, '0')}`;
const journeyKey = (sid: string) => `ve:${sid}:journey`;
const metaKey = (sid: string) => `ve:${sid}:meta`;

export interface SessionMeta {
  sessionId: string;
  studentId: string;
  nextSeq: number;
  activeMs: number;
}

interface Stored {
  e: AssessmentEvent;
  sent: boolean;
}

export class EventStore {
  constructor(private kv: KeyValueStore) {}

  async activeSessionId(): Promise<string | null> {
    return this.kv.getItem(ACTIVE_KEY);
  }

  async loadMeta(sid: string): Promise<SessionMeta | null> {
    const v = await this.kv.getItem(metaKey(sid));
    return v ? (JSON.parse(v) as SessionMeta) : null;
  }

  async loadJourney(sid: string): Promise<JourneyState | null> {
    const v = await this.kv.getItem(journeyKey(sid));
    return v ? (JSON.parse(v) as JourneyState) : null;
  }

  /** Atomically persist new events (possibly none) together with the checkpoint and meta. */
  async commit(meta: SessionMeta, journey: JourneyState, events: AssessmentEvent[]): Promise<void> {
    const pairs: [string, string][] = events.map((e) => [evtKey(meta.sessionId, e.seq), JSON.stringify({ e, sent: false } satisfies Stored)]);
    pairs.push([journeyKey(meta.sessionId), JSON.stringify(journey)], [metaKey(meta.sessionId), JSON.stringify(meta)], [ACTIVE_KEY, meta.sessionId]);
    await this.kv.multiSet(pairs);
  }

  private async eventKeys(sid: string): Promise<string[]> {
    const prefix = `ve:${sid}:evt:`;
    return (await this.kv.getAllKeys()).filter((k) => k.startsWith(prefix)).sort();
  }

  private async loadStored(sid: string): Promise<Stored[]> {
    const rows = await this.kv.multiGet(await this.eventKeys(sid));
    return rows.filter(([, v]) => v).map(([, v]) => JSON.parse(v as string) as Stored);
  }

  async loadEvents(sid: string): Promise<AssessmentEvent[]> {
    return (await this.loadStored(sid)).map((s) => s.e).sort((a, b) => a.seq - b.seq);
  }

  async unsent(sid: string, limit = 50): Promise<AssessmentEvent[]> {
    return (await this.loadStored(sid)).filter((s) => !s.sent).map((s) => s.e).sort((a, b) => a.seq - b.seq).slice(0, limit);
  }

  async countUnsent(sid: string): Promise<number> {
    return (await this.loadStored(sid)).filter((s) => !s.sent).length;
  }

  async markSent(sid: string, events: AssessmentEvent[]): Promise<void> {
    if (!events.length) return;
    await this.kv.multiSet(events.map((e) => [evtKey(sid, e.seq), JSON.stringify({ e, sent: true } satisfies Stored)]));
  }

  /** Remove all local data for a session (only after delivery). */
  async purge(sid: string): Promise<void> {
    const keys = [...(await this.eventKeys(sid)), journeyKey(sid), metaKey(sid)];
    if ((await this.activeSessionId()) === sid) keys.push(ACTIVE_KEY);
    await this.kv.multiRemove(keys);
  }

  /** Cosmetic preferences (avatar look, last position). Not assessment evidence; never uploaded. */
  async getPrefs<T>(studentId: string): Promise<T | null> {
    const v = await this.kv.getItem(`ve:prefs:${studentId}`);
    return v ? (JSON.parse(v) as T) : null;
  }

  async setPrefs(studentId: string, prefs: unknown): Promise<void> {
    await this.kv.multiSet([[`ve:prefs:${studentId}`, JSON.stringify(prefs)]]);
  }

  /** Forget the active pointer (e.g. student chose "start again"); keeps unsent events for upload. */
  async clearActive(): Promise<void> {
    await this.kv.multiRemove([ACTIVE_KEY]);
  }
}
