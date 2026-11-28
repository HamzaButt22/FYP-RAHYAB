import { StoredEvent } from '@/assessment/types';

/** Storage port. The game never talks to SQLite directly. */
export interface Store {
  getKV<T>(key: string): T | null;
  /** Writes all entries and appends all events in ONE transaction. */
  commit(kv: Record<string, unknown>, events?: Omit<StoredEvent, 'seq'>[]): void;
  listEvents(): StoredEvent[];
  schemaVersion(): number;
  /** Wipes all player data (Settings › Start over). */
  reset(): void;
}

/** In-memory store with optional persistence hook (used on web and in tests). */
export class MemoryStore implements Store {
  private kv = new Map<string, string>();
  private events: StoredEvent[] = [];
  private seq = 0;
  constructor(private persist?: { load(): string | null; save(s: string): void }) {
    const raw = persist?.load();
    if (raw) {
      const d = JSON.parse(raw) as { kv: [string, string][]; events: StoredEvent[]; seq: number };
      this.kv = new Map(d.kv); this.events = d.events; this.seq = d.seq;
    }
  }
  getKV<T>(key: string): T | null {
    const v = this.kv.get(key);
    return v === undefined ? null : (JSON.parse(v) as T);
  }
  commit(kv: Record<string, unknown>, events: Omit<StoredEvent, 'seq'>[] = []) {
    // Serialise first so a bad value cannot leave a half-written save.
    const entries = Object.entries(kv).map(([k, v]) => [k, JSON.stringify(v)] as const);
    for (const [k, v] of entries) this.kv.set(k, v);
    for (const e of events) this.events.push({ ...e, seq: ++this.seq });
    this.flush();
  }
  listEvents() { return this.events.map((e) => ({ ...e })); }
  schemaVersion() { return 2; }
  reset() { this.kv.clear(); this.events = []; this.seq = 0; this.flush(); }
  private flush() {
    this.persist?.save(JSON.stringify({ kv: [...this.kv.entries()], events: this.events, seq: this.seq }));
  }
}
