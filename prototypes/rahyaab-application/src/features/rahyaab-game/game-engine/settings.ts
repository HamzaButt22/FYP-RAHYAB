/** Global game settings and colour palette (port of game/settings.py; values must stay identical). */
export const GAME_VERSION = '0.2.0';
/** Telemetry `game_version` sent for mobile sessions: same game logic, different client. */
export const MOBILE_CLIENT_VERSION = '0.2.0-mobile';

export const SCREEN_W = 1100;
export const SCREEN_H = 700;
export const HUD_H = 96;
export const WORLD_W = 1100;
export const WORLD_H = 604;
export const FPS = 60;

export const PLAYER_RADIUS = 12;
export const PLAYER_SPEED = 215.0;
export const INTERACT_RANGE = 62;
export const MAX_ATTEMPTS = 3;

export type RGB = readonly [number, number, number];

export const BG: RGB = [18, 22, 36];
export const PANEL: RGB = [30, 36, 56];
export const PANEL_LIGHT: RGB = [44, 52, 78];
export const TEXT: RGB = [234, 238, 248];
export const TEXT_DIM: RGB = [150, 160, 186];
export const ACCENT: RGB = [96, 165, 250];
export const ACCENT_2: RGB = [52, 211, 153];
export const WARN: RGB = [251, 191, 36];
export const DANGER: RGB = [248, 113, 113];
export const GOLD: RGB = [250, 204, 21];

export const TRAIT_COLORS: Record<string, RGB> = {
  openness: [167, 139, 250],
  conscientiousness: [52, 211, 153],
  extraversion: [251, 191, 36],
  agreeableness: [244, 114, 182],
  neuroticism: [96, 165, 250],
};

export const rgb = (c: RGB, a?: number) => (a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);
