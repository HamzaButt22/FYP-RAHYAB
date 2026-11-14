// Nickname ideas for S-03, like a mail service suggesting usernames, with one difference: an idea is never
// built from a real name, or from what the student typed, so suggestions can't nudge anyone towards their
// own name. Words are everyday things in English and Roman Urdu; every idea passes the same checks as a
// typed nickname (rules.ts), and nicknameIdeas.test.ts checks that no word is on the common-names list.
// When the server says a nickname is taken in the class, takenVariants() offers numbered versions of it.

import { NICKNAME_MAX, nicknameProblem } from './rules.ts';

export const ADJECTIVES: readonly string[] = [
  'Swift', 'Bright', 'Brave', 'Calm', 'Clever', 'Kind', 'Quick', 'Bold', 'Sunny', 'Lucky', 'Silent', 'Golden',
  'Silver', 'Teal', 'Crimson', 'Cosmic', 'Neela', 'Sunehra', 'Tez', 'Hara', 'Naya', 'Pyara',
];

export const NOUNS: readonly string[] = [
  'Falcon', 'Comet', 'River', 'Cedar', 'Rocket', 'Orbit', 'Pixel', 'Maple', 'Tiger', 'Panda', 'Eagle', 'Lotus',
  'Planet', 'Quill', 'Atlas', 'Summit', 'Harbor', 'Meteor', 'Badal', 'Pahar', 'Jugnu', 'Titli', 'Bulbul',
  'Hudhud', 'Qalam', 'Kitab', 'Darakht', 'Chiragh', 'Barish', 'Patang', 'Samandar', 'Mor', 'Hiran',
];

type Random = () => number;

const pick = <T,>(list: readonly T[], random: Random): T => list[Math.floor(random() * list.length)];
const twoDigits = (random: Random) => String(10 + Math.floor(random() * 90));

function oneIdea(random: Random): string {
  // Half "Swift_Falcon", half "Jugnu_27": both easy to say aloud in class.
  return random() < 0.5 ? `${pick(ADJECTIVES, random)}_${pick(NOUNS, random)}` : `${pick(NOUNS, random)}_${twoDigits(random)}`;
}

/** `count` different ideas that all pass the nickname rules. */
export function nicknameIdeas(count = 3, random: Random = Math.random): string[] {
  const ideas = new Set<string>();
  for (let tries = 0; ideas.size < count && tries < 100; tries += 1) {
    const idea = oneIdea(random);
    if (nicknameProblem(idea) === null) ideas.add(idea);
  }
  return [...ideas];
}

/** Numbered versions of a nickname someone in the class already uses: "Ali_10" -> "Ali_47", "Ali_83", ... */
export function takenVariants(nickname: string, count = 3, random: Random = Math.random): string[] {
  const base = nickname.replace(/[_\s]*\p{Nd}+$/u, '') || nickname;
  const variants = new Set<string>();
  for (let tries = 0; variants.size < count && tries < 100; tries += 1) {
    const suffix = `_${twoDigits(random)}`;
    const variant = [...base].slice(0, NICKNAME_MAX - suffix.length).join('') + suffix;
    if (variant.toLowerCase() !== nickname.toLowerCase() && nicknameProblem(variant) === null) variants.add(variant);
  }
  return [...variants];
}
