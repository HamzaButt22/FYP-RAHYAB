/** Public integration contract of the RahYaab game module (what a host app passes in and gets back). */
import type { TrackKey } from '../assessment/content';
import type { KeyValueStorage } from '../services/storage';
import type { AssessmentReport } from './api';

export interface RahYaabGameConfig {
  /** Base URL of the RahYaab Flask backend, e.g. https://rahyaab.example.org (no trailing /api). */
  apiBaseUrl: string;
  /** Host authentication, added to every request (e.g. { Authorization: `Bearer ${token}` }). */
  getAuthHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Allow http:// for local-network demos only. Never in production builds. */
  allowInsecureHttp?: boolean;
  requestTimeoutMs?: number;
}

export interface RahYaabPlayerContext {
  /** Backend player id if the host already linked this student to a RahYaab player (returned in onComplete). */
  playerId?: number | null;
  /** Pre-fills the name screen (the player can still change it). */
  displayName?: string;
}

export interface RahYaabCompletion {
  /** Backend session id (use it with GET /api/sessions/<id>/report, /result, /riasec). */
  sessionId: string;
  /** Backend player id - store it to link the next assessment of the same student. */
  playerId: number | null;
  plan: number[];
  report: AssessmentReport;
}

export type RahYaabExitReason = 'completed' | 'closed' | 'finish-later';

export interface RahYaabGameProps {
  config: RahYaabGameConfig;
  player?: RahYaabPlayerContext;
  /** Storage adapter; defaults to @react-native-async-storage/async-storage. */
  storage?: KeyValueStorage;
  /** Skip the in-game menu and start this track directly (still shows name/consent). */
  initialTrack?: TrackKey;
  /** If set, a consent/assent screen with this text must be accepted before every new assessment. */
  consentText?: string;
  /** Called once when the backend returned the results of a completed assessment. */
  onComplete?: (result: RahYaabCompletion) => void;
  /** The player left the module. */
  onExit?: (reason: RahYaabExitReason) => void;
  /** Gameplay prefers landscape (whole map visible); the host may lock orientation (e.g. expo-screen-orientation). */
  onRequestOrientation?: (orientation: 'landscape' | 'default') => void;
  /** Label of the menu button that leaves the module. */
  exitLabel?: string;
}
