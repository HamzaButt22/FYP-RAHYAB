/** Avatar options. No option is tied to a gender, job or ability. */
export const SKIN_TONES = ['#F1C9A5', '#E0AC86', '#C98E64', '#A8714A', '#8A5A3B', '#6B4430'] as const;
export const FACES = ['round', 'oval', 'square'] as const;
export const HAIR_STYLES = ['short', 'curly', 'ponytail', 'long', 'bun', 'dupatta', 'cap', 'beanie'] as const;
export const HAIR_COLOURS = ['#1E140E', '#3B2416', '#5A2E1A', '#7A4A2A'] as const;
export const OUTFITS = ['kurta', 'kameez', 'hoodie', 'uniform', 'waistcoat'] as const;
export const OUTFIT_COLOURS = ['#2E8B57', '#5B8DEF', '#E2589B', '#E9873A', '#8A6FD1', '#E3B23C', '#3E5C76', '#C0392B'] as const;
export const ACCESSORIES = ['none', 'glasses', 'scarf', 'badge', 'backpack'] as const;

/** Pre-approved nicknames: friendly, neutral, no personal information. */
export const NICKNAMES = [
  'Sitara', 'Toofan', 'Chamak', 'Bulbul', 'Shaheen', 'Jugnu', 'Kiran', 'Badal',
  'Moti', 'Chanda', 'Dhanak', 'Patang', 'Sabz', 'Noor', 'Tara', 'Hawa',
] as const;

export interface Avatar {
  skin: (typeof SKIN_TONES)[number];
  face: (typeof FACES)[number];
  hair: (typeof HAIR_STYLES)[number];
  hairColour: (typeof HAIR_COLOURS)[number];
  outfit: (typeof OUTFITS)[number];
  outfitColour: (typeof OUTFIT_COLOURS)[number];
  accessory: (typeof ACCESSORIES)[number];
  nickname: (typeof NICKNAMES)[number];
}

export const DEFAULT_AVATAR: Avatar = {
  skin: '#C98E64', face: 'round', hair: 'short', hairColour: '#1E140E',
  outfit: 'kurta', outfitColour: '#2E8B57', accessory: 'none', nickname: 'Sitara',
};

export const LABELS: Record<string, string> = {
  round: 'Round', oval: 'Oval', square: 'Square',
  short: 'Short', curly: 'Curly', ponytail: 'Ponytail', long: 'Long', bun: 'Bun', dupatta: 'Dupatta', cap: 'Cap', beanie: 'Beanie',
  kurta: 'Kurta', kameez: 'Shalwar kameez', hoodie: 'Hoodie', uniform: 'School uniform', waistcoat: 'Waistcoat',
  none: 'None', glasses: 'Glasses', scarf: 'Scarf', badge: 'Volunteer badge', backpack: 'Backpack',
};
