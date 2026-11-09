/**
 * Key-value storage used for session persistence.
 *
 * The module depends only on this tiny interface. By default it uses @react-native-async-storage/async-storage (the
 * React Native standard, also bundled with Expo); a host app that already has its own storage (MMKV, encrypted
 * storage, ...) passes an adapter instead.
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  /** Test hook: make the next N writes fail (e.g. quota exceeded). */
  failWrites = 0;

  async getItem(key: string): Promise<string | null> {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.failWrites > 0) {
      this.failWrites -= 1;
      throw new Error('storage write failed (simulated)');
    }
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }
}

let defaultStorage: KeyValueStorage | null = null;

/** Lazily resolves AsyncStorage so tests and hosts with their own adapter never load the native module. */
export function getDefaultStorage(): KeyValueStorage {
  if (defaultStorage) return defaultStorage;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-async-storage/async-storage');
  const AsyncStorage = (mod.default ?? mod) as KeyValueStorage;
  defaultStorage = {
    getItem: (k) => AsyncStorage.getItem(k),
    setItem: (k, v) => AsyncStorage.setItem(k, v),
    removeItem: (k) => AsyncStorage.removeItem(k),
  };
  return defaultStorage;
}

export const STORAGE_PREFIX = 'rahyaab/v1/';
export const ACTIVE_KEY = `${STORAGE_PREFIX}active`;
export const sessionKey = (localId: string) => `${STORAGE_PREFIX}session/${localId}`;
