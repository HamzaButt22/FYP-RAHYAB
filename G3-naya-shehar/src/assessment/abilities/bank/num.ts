import { Level } from '../../types';
import { NumericPuzzle } from '../puzzleTypes';

const q = (n: number, level: Level, story: string, prompt: string, answer: number, unit?: string): NumericPuzzle => ({
  id: `NUM-${String(n).padStart(2, '0')}`, family: 'NUM', level, kind: 'numeric', story, prompt, answer, unit,
});

/** Answers are worked out in the comments and checked again in tests/content. */
export const NUM_BANK: NumericPuzzle[] = [
  // Level 1 — one step
  q(1, 1, 'Ustad Rafiq needs cement for the pump station.', 'One bag of cement costs Rs 500. How much do 4 bags cost?', 2000, 'Rs'), // 4×500
  q(2, 1, 'Volunteers are cleaning the canal.', 'The canal is 50 metres long. 36 metres are clean. How many metres are left?', 14, 'metres'), // 50−36
  q(3, 1, 'Three teams are planting wheat.', 'Each team plants 12 rows. How many rows do the 3 teams plant in total?', 36, 'rows'), // 3×12
  q(4, 1, 'The new pump is working!', 'The pump fills 8 buckets every minute. How many buckets does it fill in 5 minutes?', 40, 'buckets'), // 8×5
  // Level 2 — two steps or division
  q(5, 2, 'Baji Saima is sharing out the grant.', 'Rs 9,000 is shared equally between 3 projects. How much does each project get?', 3000, 'Rs'), // 9000÷3
  q(6, 2, 'The school needs new desks.', 'Each desk costs Rs 1,200. The budget is Rs 6,000. How many desks can you buy?', 5, 'desks'), // 6000÷1200
  q(7, 2, 'Zoya is buying paint for the mural.', 'One tin of paint covers 6 square metres. The wall is 27 square metres. How many tins must you buy to cover it all?', 5, 'tins'), // ceil(27/6)
  q(8, 2, 'New notebooks for the school.', 'There are 4 classes with 35 students each. Every student gets 2 notebooks. How many notebooks are needed?', 280, 'notebooks'), // 4×35×2
  // Level 3 — percentages, ratios and rates
  q(9, 3, 'The town grant is being planned.', 'The grant is Rs 20,000. 25% of it goes to the school. How many rupees is that?', 5000, 'Rs'), // 0.25×20000
  q(10, 3, 'The community kitchen is making khichri.', 'Rice and lentils are mixed in the ratio 3 : 2. There are 40 kg in total. How many kg are rice?', 24, 'kg'), // 40×3/5
  q(11, 3, 'The new bus route is being tested.', 'The bus travels 30 km in 45 minutes. At the same speed, how many km will it travel in 1 hour?', 40, 'km'), // 30/45×60
  q(12, 3, 'Kamran has a sale on school bags.', 'A bag costs Rs 800. The price is cut by 15%. What is the new price?', 680, 'Rs'), // 800×0.85
  // Level 4 — multi-step
  q(13, 4, 'Rs 12,000 is left for three projects.', 'The park gets Rs 1,000 more than the library. The pump gets twice as much as the park. How much does the pump get?', 6500, 'Rs'), // L=x, P=x+1000, pump=2x+2000 → 4x+3000=12000 → x=2250 → 6500
  q(14, 4, 'Volunteers are filling sandbags before the rain.', '3 volunteers fill 18 bags in 2 hours. At the same rate, how many bags will 5 volunteers fill in 3 hours?', 45, 'bags'), // 3 bags/person/hour × 5 × 3
  q(15, 4, 'Ayesha is reading the rain gauge.', 'Monday had 12 mm of rain and Tuesday had 18 mm. The average for Monday, Tuesday and Wednesday was 20 mm. How much rain fell on Wednesday?', 30, 'mm'), // 60−30
  q(16, 4, 'Mela tickets are selling fast!', 'Adult tickets cost Rs 50 and child tickets cost Rs 20. 40 tickets were sold for Rs 1,400. How many adult tickets were sold?', 20, 'tickets'), // 50a+20(40−a)=1400 → a=20
];

export const NUM_PRACTICE: NumericPuzzle = {
  ...q(0, 1, 'Practice: Bilal is counting chairs for the welcome meeting.', 'There are 3 rows of 5 chairs. How many chairs are there?', 15, 'chairs'),
  id: 'PRAC-NUM-01',
  practice: true,
};
