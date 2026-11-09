/**
 * Shared telemetry contract (port of analytics/event_schema.py).
 * The Flask backend validates every uploaded event against the same vocabulary.
 */
export const EventType = {
  SESSION_START: 'SESSION_START',
  SESSION_END: 'SESSION_END',
  LEVEL_START: 'LEVEL_START',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  LEVEL_FAILED: 'LEVEL_FAILED',
  PLAYER_MOVE: 'PLAYER_MOVE',
  PLAYER_INTERACTION: 'PLAYER_INTERACTION',
  DECISION: 'DECISION',
  DECISION_RESPONSE: 'DECISION_RESPONSE',
  EXPLORATION: 'EXPLORATION',
  NPC_INTERACTION: 'NPC_INTERACTION',
  HELP_ACTION: 'HELP_ACTION',
  SHARE_ACTION: 'SHARE_ACTION',
  COOPERATION_ACTION: 'COOPERATION_ACTION',
  COMPETITION_ACTION: 'COMPETITION_ACTION',
  RISK_ACTION: 'RISK_ACTION',
  ITEM_COLLECTED: 'ITEM_COLLECTED',
  RESOURCE_USED: 'RESOURCE_USED',
  ERROR: 'ERROR',
  FAILURE: 'FAILURE',
  RETRY: 'RETRY',
  STRATEGY_CHANGE: 'STRATEGY_CHANGE',
  TASK_START: 'TASK_START',
  TASK_COMPLETE: 'TASK_COMPLETE',
  TASK_ABANDON: 'TASK_ABANDON',
  REWARD_SELECTED: 'REWARD_SELECTED',
  GAME_PAUSED: 'GAME_PAUSED',
  GAME_RESUMED: 'GAME_RESUMED',
  ENV_EVENT: 'ENV_EVENT',
  PLAN_ACTION: 'PLAN_ACTION',
  INFO_SEEKING: 'INFO_SEEKING',
  NEGOTIATION: 'NEGOTIATION',
  ACTIVITY_CHOICE: 'ACTIVITY_CHOICE',
  ACTIVITY_START: 'ACTIVITY_START',
  ACTIVITY_STEP: 'ACTIVITY_STEP',
  ACTIVITY_END: 'ACTIVITY_END',
  APPROACH_CHOICE: 'APPROACH_CHOICE',
  ROLE_SELECTED: 'ROLE_SELECTED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  RESOURCE_ALLOCATED: 'RESOURCE_ALLOCATED',
  CONTRIBUTION: 'CONTRIBUTION',
} as const;

export type EventTypeName = (typeof EventType)[keyof typeof EventType];
export const ALL_EVENT_TYPES: ReadonlySet<string> = new Set(Object.values(EventType));

export const KIND_SAFE = 'safe';
export const KIND_RISKY = 'risky';
export const KIND_CHECK = 'check';
export const KIND_NOVEL = 'novel';
export const KIND_PROSOCIAL = 'prosocial';
export const KIND_SELFISH = 'selfish';
export const KIND_NEUTRAL = 'neutral';
export const KIND_IGNORE = 'ignore';
export const KIND_SOCIAL = 'social';
export const KIND_EXIT = 'exit';

export const CAT_RISK = 'risk';
export const CAT_REWARD = 'reward';
export const CAT_PRESSURE = 'pressure';
export const CAT_PLANNING = 'planning';
export const CAT_HELP = 'help';
export const CAT_SHARE = 'share';
export const CAT_COOPERATION = 'cooperation';
export const CAT_SOCIAL = 'social';
