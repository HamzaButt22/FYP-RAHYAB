export interface Settings {
  music_volume: number;
  sfx_volume: number;
  music_on: boolean;
  sfx_on: boolean;
  text_scale: number;
  reduce_motion: boolean;
  high_contrast: boolean;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  music_volume: 0.6,
  sfx_volume: 0.8,
  music_on: true,
  sfx_on: true,
  text_scale: 1.0,
  reduce_motion: false,
  high_contrast: false,
  haptics: true,
};

/** Merge stored settings with defaults, dropping anything unknown or of the wrong type. */
export function sanitizeSettings(raw: unknown): Settings {
  const out = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      const v = (raw as any)[k];
      if (typeof v === typeof DEFAULT_SETTINGS[k]) (out as any)[k] = v;
    }
  }
  out.text_scale = [1, 1.15, 1.3].reduce((a, b) => (Math.abs(b - out.text_scale) < Math.abs(a - out.text_scale) ? b : a), 1);
  out.music_volume = Math.max(0, Math.min(1, out.music_volume));
  out.sfx_volume = Math.max(0, Math.min(1, out.sfx_volume));
  return out;
}
