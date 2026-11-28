export type CharacterId = 'saima' | 'rafiq' | 'hina' | 'kamran' | 'zoya' | 'bilal' | 'ayesha';
export type Expression = 'happy' | 'talk' | 'think' | 'surprised' | 'proud';

export interface CharacterLook {
  skin: string;
  hair: string;
  /** Head covering / hair style used by the portrait renderer. */
  hairStyle: 'dupatta' | 'short' | 'grey_short' | 'bun' | 'curly' | 'cap' | 'ponytail';
  outfit: string;
  outfitAccent: string;
  glasses?: boolean;
  beard?: 'white' | 'dark';
  /** Signature prop drawn next to the portrait. */
  prop: 'clipboard' | 'wrench' | 'stethoscope' | 'ledger' | 'brush' | 'helmet' | 'tablet';
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  bio: string;
  look: CharacterLook;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  saima: { id: 'saima', name: 'Baji Saima', role: 'Head of the Youth Development Office',
    bio: 'Saima grew up in Naya Shehar. After the flood she started the Youth Office so young people could help rebuild.',
    look: { skin: '#C98E64', hair: '#2B1B14', hairStyle: 'dupatta', outfit: '#2E8B57', outfitAccent: '#F4D35E', prop: 'clipboard' } },
  rafiq: { id: 'rafiq', name: 'Ustad Rafiq', role: 'Retired mechanic',
    bio: 'Rafiq has fixed every engine in town for forty years. He loves teaching anyone who wants to learn.',
    look: { skin: '#B07A52', hair: '#DADADA', hairStyle: 'grey_short', outfit: '#3E5C76', outfitAccent: '#E9873A', beard: 'white', glasses: true, prop: 'wrench' } },
  hina: { id: 'hina', name: 'Dr Hina', role: 'Doctor at the Basic Health Unit',
    bio: 'Hina came back to her hometown to run the health unit. She is curious about everything.',
    look: { skin: '#D9A07A', hair: '#1E120C', hairStyle: 'bun', outfit: '#FFFFFF', outfitAccent: '#4E9F9A', glasses: true, prop: 'stethoscope' } },
  kamran: { id: 'kamran', name: 'Kamran', role: 'Shop owner',
    bio: 'Kamran runs the general store and always has a plan, a list and a cup of chai.',
    look: { skin: '#A8714A', hair: '#1B1B1B', hairStyle: 'short', outfit: '#D2691E', outfitAccent: '#F7E7C1', beard: 'dark', prop: 'ledger' } },
  zoya: { id: 'zoya', name: 'Zoya', role: 'Art teacher',
    bio: 'Zoya teaches art at the school and believes every wall can tell a story.',
    look: { skin: '#E0AC86', hair: '#5A2E1A', hairStyle: 'ponytail', outfit: '#E2589B', outfitAccent: '#FFD166', prop: 'brush' } },
  bilal: { id: 'bilal', name: 'Bilal', role: 'Student volunteer',
    bio: 'Bilal is in class 9. He likes cricket, cooking and finding out how radios work.',
    look: { skin: '#B98256', hair: '#1A120D', hairStyle: 'curly', outfit: '#5B8DEF', outfitAccent: '#FFFFFF', prop: 'tablet' } },
  ayesha: { id: 'ayesha', name: 'Ayesha', role: 'Student volunteer',
    bio: 'Ayesha is in class 10. She is great with tools, loves maths puzzles and wants to try everything.',
    look: { skin: '#C48B60', hair: '#1E140E', hairStyle: 'dupatta', outfit: '#E9873A', outfitAccent: '#3E5C76', prop: 'helmet' } },
};
