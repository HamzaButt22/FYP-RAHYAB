import { CharacterId, Expression } from '../characters/characters';
import { ScoredWeek } from '@/assessment/types';

export interface Line { speaker: CharacterId | 'narrator'; text: string; mood?: Expression }

/** `{nick}` is replaced with the player's chosen nickname. Plain English, about Grade 6 level. */
export const SCRIPTS: Record<string, Line[]> = {
  prologue_intro: [
    { speaker: 'narrator', text: 'Last year, a big flood swept through the little town of Naya Shehar.' },
    { speaker: 'narrator', text: 'Now the town has a grant to rebuild — and it needs young volunteers.' },
    { speaker: 'saima', text: 'Assalam-o-Alaikum, {nick}! Welcome to the Youth Development Office.', mood: 'happy' },
    { speaker: 'saima', text: 'I am Saima, but everyone calls me Baji Saima. You will be one of our volunteers.', mood: 'talk' },
    { speaker: 'bilal', text: 'Hi! I am Bilal. This is Ayesha. We volunteer here too.', mood: 'happy' },
    { speaker: 'ayesha', text: 'We will help you learn everything. It is going to be fun!', mood: 'proud' },
    { speaker: 'saima', text: 'Every week, we will fix one part of town. You choose how you want to help.', mood: 'talk' },
    { speaker: 'saima', text: 'There are no wrong choices here. Just pick what you would really like to do.', mood: 'happy' },
  ],
  prologue_outro: [
    { speaker: 'saima', text: 'Well done, {nick}! You already made the Youth Office look better.', mood: 'proud' },
    { speaker: 'saima', text: 'Your first real week starts now: Spring! The canal and the fields need us.', mood: 'talk' },
    { speaker: 'ayesha', text: 'After each week, the town needs time to grow. Come back next week for more!', mood: 'happy' },
  ],
  w1_intro: [
    { speaker: 'saima', text: 'Spring is here, {nick}! But the canal is full of mud and the fields are empty.', mood: 'talk' },
    { speaker: 'rafiq', text: 'And my old water pump is broken. Without water, nothing will grow.', mood: 'think' },
    { speaker: 'saima', text: 'Let us plan your week. Pick the three jobs you most want to do.', mood: 'happy' },
  ],
  w1_outro: [
    { speaker: 'rafiq', text: 'Listen! That is the sound of the pump running again!', mood: 'surprised' },
    { speaker: 'saima', text: 'The fields are planted and water flows to every street. Shabash, {nick}!', mood: 'proud' },
  ],
  w2_intro: [
    { speaker: 'zoya', text: 'The new school term starts soon, but our school is a mess after the flood.', mood: 'think' },
    { speaker: 'hina', text: 'The science lab and the Weather Station need help too.', mood: 'talk' },
    { speaker: 'saima', text: 'Science Corner and Rang Bazaar are open now. Plan your summer week!', mood: 'happy' },
  ],
  w2_outro: [
    { speaker: 'zoya', text: 'Look at the school! Bright walls, new desks and happy students.', mood: 'proud' },
    { speaker: 'saima', text: 'The children will remember this summer for a long time. Thank you, {nick}.', mood: 'happy' },
  ],
  w3_intro: [
    { speaker: 'narrator', text: 'The monsoon rains are heavy this year. Water is rising in the streets.' },
    { speaker: 'kamran', text: 'The road to my shop is flooded, and the bridge is cracked!', mood: 'surprised' },
    { speaker: 'saima', text: 'Market Road and Records House are open now. Let us keep the town safe.', mood: 'talk' },
  ],
  w3_outro: [
    { speaker: 'rafiq', text: 'The bridge is strong again. Buses can cross, even in heavy rain.', mood: 'proud' },
    { speaker: 'hina', text: 'Everyone is safe and healthy. That is the best news of all.', mood: 'happy' },
  ],
  w4_intro: [
    { speaker: 'saima', text: 'Winter is here, {nick}. The town is ready to celebrate — the Great Town Mela!', mood: 'happy' },
    { speaker: 'kamran', text: 'Stalls, lights, music and food. There is so much to plan!', mood: 'talk' },
    { speaker: 'saima', text: 'The whole town is open. Plan your last week with us.', mood: 'proud' },
  ],
  w4_outro: [
    { speaker: 'narrator', text: 'The lanterns glow. Music fills the air. The whole town has come to the Mela.' },
    { speaker: 'saima', text: 'A year ago this town was under water. Look at it now — because of you.', mood: 'proud' },
    { speaker: 'bilal', text: 'Best. Mela. Ever!', mood: 'happy' },
  ],
};

export const SEASONS: Record<ScoredWeek, { name: string; theme: string; problem: string; sky: [string, string]; ground: string }> = {
  1: { name: 'Spring', theme: 'A Fresh Beginning', problem: 'The canal needs cleaning and the fields need planting.', sky: ['#BFE6FF', '#FFF2D6'], ground: '#9ED27A' },
  2: { name: 'Summer', theme: 'A Better School', problem: 'The government school needs repairs before the new term.', sky: ['#FFD58A', '#FFF4DA'], ground: '#C9D66A' },
  3: { name: 'Monsoon', theme: 'Protect Our Town', problem: 'Heavy rain has damaged roads and flooded parts of the town.', sky: ['#8FA6BF', '#D9E3EC'], ground: '#7FB56B' },
  4: { name: 'Winter', theme: 'The Great Town Mela', problem: 'The town wants to celebrate its recovery with a festival.', sky: ['#E8D5F2', '#FFF0E6'], ground: '#A8C88A' },
};

export const fillNick = (s: string, nick: string) => s.replace(/\{nick\}/g, nick);
