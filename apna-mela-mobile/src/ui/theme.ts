/** Colour and font tokens from docs/design/UI_STYLE_GUIDE.md (same values as the desktop palette). */
export const INK = '#26214A';
export const INK2 = '#5A537E';
export const CREAM = '#FFF6E6';
export const PARCH = '#FBE8C8';
export const LILAC = '#E7E1F0';
export const DISABLED = '#CFC8DA';
export const DISABLED_TXT = '#8C85A3';
export const WHITE = '#FFFFFF';
export const NIGHT = '#1F1A45';

export const COL: Record<string, [string, string]> = {
  pink: ['#E8336D', '#B81F51'],
  teal: ['#11998E', '#0B6F67'],
  yellow: ['#FFC93C', '#D99A0B'],
  orange: ['#FF8A3D', '#D9621A'],
  green: ['#6BB548', '#4A8A2E'],
  blue: ['#3B6FD8', '#274FA6'],
  purple: ['#6C3FB5', '#4D2A86'],
  red: ['#E23B3B', '#B02525'],
  cream: [CREAM, INK],
  disabled: [DISABLED, DISABLED_TXT],
  danger: ['#FFE3E3', '#B02525'],
};
export const c = (name: string) => (COL[name] ?? COL.pink)[0];
export const dark = (name: string) => (COL[name] ?? COL.pink)[1];

/** White text is only used on these fills (style guide 2.4). */
export const WHITE_TEXT_ON = new Set(['pink', 'teal', 'blue', 'purple', 'red']);

export const FONTS = {
  baloo: 'Baloo2-ExtraBold',
  baloo_b: 'Baloo2-Bold',
  nunito: 'Nunito-Bold',
  nunito_x: 'Nunito-ExtraBold',
  nunito_s: 'Nunito-SemiBold',
  nunito_r: 'Nunito-Regular',
} as const;
export type FontKey = keyof typeof FONTS;

export const NAME_COLOR: Record<string, string> = { zain: 'orange', hira: 'blue', bilal: 'green', sara: 'purple', karim: 'teal', hudhud: 'yellow' };
export const NAMES: Record<string, string> = { zain: 'Zain', hira: 'Hira', bilal: 'Bilal', sara: 'Sara', karim: 'Ustad Karim', hudhud: 'Hudhud' };
