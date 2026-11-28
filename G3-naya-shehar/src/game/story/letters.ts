import { Riasec, ScoredWeek } from '@/assessment/types';
import { InterestProfile } from '@/assessment/scoring/riasec';

const FUTURE: Record<Riasec, string> = {
  R: 'I still love getting my hands on real tools and making broken things work again.',
  I: 'I still ask "why?" about everything, and I love finding the answer myself.',
  A: 'I still fill notebooks with drawings, stories and ideas for making things beautiful.',
  S: 'I still feel happiest when I am helping someone learn something or feel better.',
  E: 'I still enjoy bringing people together and leading a plan from start to finish.',
  C: 'I still like it when everything is neat, correct and in its right place.',
};

const SEASON_LINE: Record<ScoredWeek, string> = {
  1: 'Remember the spring when the canal ran clear again and the first fields turned green?',
  2: 'Remember the summer we fixed up the school before the new term?',
  3: 'Remember the monsoon, when the whole town worked together to stay safe?',
  4: 'Remember the Great Mela? The lanterns, the music, the whole town smiling?',
};

export interface Letter { greeting: string; paragraphs: string[]; signoff: string; clarity: 1 | 2 | 3 | 4 }

/**
 * The letter gets clearer as evidence builds up, and it only names a theme
 * when the evidence for it is not low-confidence and clearly ahead.
 * It never shows scores, letters or pathway names.
 */
export function writeLetter(week: ScoredWeek, profile: InterestProfile, measured: boolean, nickname: string): Letter {
  const greeting = `Dear ${nickname},`;
  const paragraphs = [SEASON_LINE[week]];
  const s = [...profile.scores].sort((a, b) => b.theta - a.theta);
  const lead = s[0];
  const second = s[1];
  const clearLead = lead && second && lead.confidence !== 'low' && lead.theta - second.theta > 0.25;
  const clearSecond = second && second.confidence !== 'low' && s[2] && second.theta - s[2].theta > 0.15;

  if (!measured) {
    paragraphs.push('This week I just enjoyed playing and helping the town my own way. That counts for a lot!');
  } else if (week === 1 || !lead || profile.comparisons < 8) {
    paragraphs.push('I am still finding out what I love most. Every choice I make in Naya Shehar is a small clue.');
  } else if (week === 2) {
    paragraphs.push(clearLead
      ? `I think I am starting to see a pattern. ${FUTURE[lead.category]}`
      : 'I tried many different kinds of work this week. The picture of my future is slowly getting sharper.');
  } else {
    if (clearLead) paragraphs.push(FUTURE[lead.category]);
    if (clearLead && clearSecond) paragraphs.push(`And ${FUTURE[second.category].charAt(0).toLowerCase()}${FUTURE[second.category].slice(1)}`);
    if (!clearLead) paragraphs.push('I enjoy many different things, and that is a strength. I can keep many doors open.');
  }
  paragraphs.push(week === 4
    ? 'Whatever I choose next, I know I can learn, build and help. See you in the future!'
    : 'Keep learning, keep trying new things. There is so much waiting ahead.');
  return { greeting, paragraphs, signoff: '— You, five years from now', clarity: week as 1 | 2 | 3 | 4 };
}
