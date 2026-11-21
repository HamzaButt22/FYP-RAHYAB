/**
 * The ONLY surface between Valley Explorer and the RahYaab app.
 *
 * RahYaab's source was not available, so these responsibilities are left to the host instead of being
 * guessed: authentication, participant id, consent/assent, encrypted storage, the ingestion endpoint and
 * what happens after the game (pathway workflow). The module never reads a name, phone number or any
 * other identity field — only the pseudonymous studentId the host passes in.
 */
import type { EventSink } from './services/sinks';
import type { KeyValueStore } from './services/storage';
import type { AssessmentOutput } from './core/summary';

export interface RahYaabHostAdapter {
  /** pseudonymous participant id issued by RahYaab (never a name or CNIC/B-Form number) */
  studentId: string;
  /** the module refuses to start (and records nothing) unless the host confirms consent + assent */
  consentGranted: boolean;
  language: 'en' | 'ur';
  /** 'student' = normal use; 'research' = pilot study; 'demo' = supervisor demo, data flagged as demo */
  mode: 'student' | 'research' | 'demo';
  /** where events go; must be idempotent per event_id */
  eventSink: EventSink;
  /** strongly recommended: the host's ENCRYPTED store. Defaults to unencrypted AsyncStorage. */
  storage?: KeyValueStore;
  /** called once when the journey is finished and results are computed */
  onComplete: (output: AssessmentOutput) => void | Promise<void>;
  /** called when the student leaves the module (progress is already saved) */
  onExit: () => void;
  appVersion?: string;
  /** injectable for tests */
  newId?: () => string;
  now?: () => number;
}
