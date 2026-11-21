/**
 * Public API of the Valley Explorer module. RahYaab should import ONLY from here.
 *
 *   import { ValleyExplorer, type RahYaabHostAdapter } from './valley';
 *   <ValleyExplorer adapter={adapter} />
 */
import { asyncStorageStore as defaultStore, type KeyValueStore as Store } from './services/storage';

export { ValleyExplorer } from './ValleyExplorer';
export type { RahYaabHostAdapter } from './adapter';
export type { AssessmentOutput, StudentSummary } from './core/summary';
export type { AssessmentEvent, EventType, LevelId } from './contract/events';
export { EventTypes, validateEvent } from './contract/events';
export * as Versions from './contract/versions';
export { JOURNEY } from './core/journey';
export type { EventSink } from './services/sinks';
export { MemoryEventSink, PrototypeBackendSink, SinkError, toPrototypeRow } from './services/sinks';
export type { KeyValueStore } from './services/storage';
export { MemoryStore, asyncStorageStore } from './services/storage';
export { EventStore } from './services/eventStore';

/** Delete every Valley Explorer record on this device (call on RahYaab logout on a shared phone). */
export async function purgeAllLocalData(store: Store = defaultStore) {
  const keys = (await store.getAllKeys()).filter((k) => k.startsWith('ve:'));
  if (keys.length) await store.multiRemove(keys);
}
