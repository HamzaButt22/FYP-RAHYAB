/**
 * RahYaab game module - public API.
 *
 *   import { RahYaabGameScreen } from './src/features/rahyaab-game';
 *   <RahYaabGameScreen config={{ apiBaseUrl }} player={{ displayName }} onComplete={...} onExit={...} />
 *
 * See MOBILE_INTEGRATION.md.
 */
import { STORAGE_PREFIX, KeyValueStorage, getDefaultStorage } from './services/storage';

export { RahYaabGameScreen } from './navigation/RahYaabGameScreen';
export type {
  RahYaabGameProps,
  RahYaabGameConfig,
  RahYaabPlayerContext,
  RahYaabCompletion,
  RahYaabExitReason,
} from './types/public';
export type { AssessmentReport, BigFiveResult, RiasecResult, TelemetrySummary, Trait, RiasecCode } from './types/api';
export type { KeyValueStorage } from './services/storage';
export { MemoryStorage } from './services/storage';
export { ApiClient } from './services/apiClient';
export type { TrackKey } from './assessment/content';

const KNOWN_KEYS = ['active', 'prefs'];

/**
 * Remove every RahYaab record from this device (call on logout or when your retention policy says so).
 * Uploaded data stays on the server; anything not yet uploaded is lost.
 */
export async function clearRahYaabData(storage: KeyValueStorage = getDefaultStorage()): Promise<void> {
  const active = await storage.getItem(`${STORAGE_PREFIX}active`);
  if (active) await storage.removeItem(`${STORAGE_PREFIX}session/${active}`);
  for (const k of KNOWN_KEYS) await storage.removeItem(`${STORAGE_PREFIX}${k}`);
}
