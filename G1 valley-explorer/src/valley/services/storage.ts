/**
 * Storage abstraction. The game never talks to a database directly; it talks to this interface.
 *
 * SECURITY NOTE: the default AsyncStorage implementation is NOT encrypted. RahYaab's ethics plan requires
 * encrypted local storage for assessment data, so the host app should pass its own encrypted store
 * (e.g. its existing encrypted outbox) through the adapter. See docs/INTEGRATION.md.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  /** must apply all pairs together (one transaction) where the platform allows */
  multiSet(pairs: [string, string][]): Promise<void>;
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

/** AsyncStorage-backed store (Android: SQLite; multiSet runs in one transaction). Not encrypted. */
export const asyncStorageStore: KeyValueStore = {
  getItem: (k) => AsyncStorage.getItem(k),
  multiSet: (pairs) => AsyncStorage.multiSet(pairs),
  multiGet: async (keys) => AsyncStorage.multiGet([...keys]),
  multiRemove: (keys) => AsyncStorage.multiRemove([...keys]),
  getAllKeys: async () => AsyncStorage.getAllKeys(),
};

/** In-memory store for tests and the demo host. Optional failure injection simulates a full disk. */
export class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  failWrites = false;
  async getItem(k: string) { return this.data.get(k) ?? null; }
  async multiSet(pairs: [string, string][]) {
    if (this.failWrites) throw new Error('simulated storage failure');
    for (const [k, v] of pairs) this.data.set(k, v);
  }
  async multiGet(keys: readonly string[]) { return keys.map((k) => [k, this.data.get(k) ?? null] as const); }
  async multiRemove(keys: readonly string[]) { for (const k of keys) this.data.delete(k); }
  async getAllKeys() { return [...this.data.keys()]; }
}
