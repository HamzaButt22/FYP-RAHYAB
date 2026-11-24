/**
 * Save storage. Mirrors the desktop SaveManager: profile, riasec and bigfive are kept as separate records,
 * so interest answers and optional research notes never share a file. Everything stays on the device.
 */
export type SaveName = 'profile' | 'riasec' | 'bigfive' | 'settings';

export const SCHEMAS = { profile: 1, riasec: 1, bigfive: 1, settings: 1 } as const;

export class SaveCorrupt extends Error {}

export interface KV {
  getItem(k: string): Promise<string | null>;
  setItem(k: string, v: string): Promise<void>;
  removeItem(k: string): Promise<void>;
}

const PREFIX = 'apna_mela.v1.';

export class Saves {
  private queue: Promise<unknown> = Promise.resolve();
  private cache: Partial<Record<SaveName, any>> = {};

  constructor(private kv: KV) {}

  /** Read every record into memory once at start-up (after this, reads are synchronous). */
  async init(): Promise<void> {
    for (const n of ['profile', 'riasec', 'bigfive', 'settings'] as SaveName[]) {
      const raw = await this.kv.getItem(PREFIX + n);
      if (raw == null) continue;
      try {
        this.cache[n] = JSON.parse(raw);
      } catch {
        this.cache[n] = { __corrupt: true };
      }
    }
  }

  exists(n: SaveName) {
    return this.cache[n] !== undefined;
  }

  load<T = any>(n: SaveName): T | null {
    const v = this.cache[n];
    if (v === undefined) return null;
    if (v && v.__corrupt) throw new SaveCorrupt(n);
    return JSON.parse(JSON.stringify(v));
  }

  /** Writes are serialised in call order, so a response record always lands before the progress pointer. */
  save(n: SaveName, data: unknown) {
    const json = JSON.stringify(data);
    this.cache[n] = JSON.parse(json);
    this.queue = this.queue.then(() => this.kv.setItem(PREFIX + n, json)).catch(() => undefined);
  }

  delete(n: SaveName) {
    delete this.cache[n];
    this.queue = this.queue.then(() => this.kv.removeItem(PREFIX + n)).catch(() => undefined);
  }

  deleteGame() {
    (['profile', 'riasec', 'bigfive'] as SaveName[]).forEach((n) => this.delete(n));
  }

  deleteAll() {
    (['profile', 'riasec', 'bigfive', 'settings'] as SaveName[]).forEach((n) => this.delete(n));
  }

  flush() {
    return this.queue;
  }
}

export class MemoryKV implements KV {
  data = new Map<string, string>();
  async getItem(k: string) {
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  async setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  async removeItem(k: string) {
    this.data.delete(k);
  }
}
