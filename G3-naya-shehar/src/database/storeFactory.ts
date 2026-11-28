import { Store } from './store';
import { SqliteStore } from './sqliteStore';

/** Android / iOS: on-device SQLite. (Web uses storeFactory.web.ts.) */
export function createStore(): Store {
  return new SqliteStore();
}
