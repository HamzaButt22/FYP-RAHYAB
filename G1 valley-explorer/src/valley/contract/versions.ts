/**
 * Version identifiers. Every event and every derived result carries these so that results
 * produced by an older build stay interpretable after scoring rules change.
 *
 * Bump rules:
 *  - EVENT_SCHEMA_VERSION: any change to the envelope or to an event_data shape (semver).
 *  - GAME_VERSION: any change to level content, item banks or mechanics.
 *  - RIASEC_SCORING_VERSION / ABILITY_SCORING_VERSION: any change to a scoring rule or parameter.
 */
export const EVENT_SCHEMA_VERSION = '1.1.0';
export const GAME_ID = 'valley_explorer';
export const GAME_VERSION = 've-2.2.0';
export const RIASEC_SCORING_VERSION = 'riasec-0.3-prototype';
export const ABILITY_SCORING_VERSION = 'ability-0.1-prototype';
export const BIGFIVE_SCORING_VERSION = 'bigfive-0.1-mini-ipip';
export const ITEM_BANK_VERSION = 'items-2026.11';
