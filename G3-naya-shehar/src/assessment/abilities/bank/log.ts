import { Level } from '../../types';
import { ChoicePuzzle } from '../puzzleTypes';

const q = (n: number, level: Level, story: string, prompt: string, options: string[], answer: number, visual?: ChoicePuzzle['visual']): ChoicePuzzle => ({
  id: `LOG-${String(n).padStart(2, '0')}`, family: 'LOG', level, kind: 'choice', story, prompt, options, answer, visual,
});

export const LOG_BANK: ChoicePuzzle[] = [
  // Level 1
  q(1, 1, 'Ustad Rafiq paints every pump on Workshop Lane blue.', 'The new pump is on Workshop Lane. What colour is it?',
    ['Blue', 'Green', 'It could be any colour', 'We cannot know'], 0),
  q(2, 1, 'The volunteers arrive at the office one by one.', 'Bilal arrives before Ayesha. Ayesha arrives before Kamran. Who arrives first?',
    ['Ayesha', 'Kamran', 'Bilal', 'They arrive together'], 2),
  q(3, 1, 'Two switches are joined in a line to one bulb. The bulb lights only when BOTH switches are ON.', 'Nothing is broken. Switch A is ON, but the bulb is OFF. What must be true?',
    ['Switch B is ON', 'Switch B is OFF', 'The bulb is broken', 'Switch A is OFF'], 1, 'circuit-series'),
  q(4, 1, 'Every shop on Market Road closes at 8 pm.', 'The tailor’s shop stays open until 9 pm. What does this tell you?',
    ['The tailor is on Market Road', 'The tailor is not on Market Road', 'The tailor closes at 8 pm', 'Nothing at all'], 1),
  // Level 2
  q(5, 2, 'The water pump will not start at the pump station.', 'The same pump works perfectly when plugged in at the workshop. What is most likely broken?',
    ['The pump motor', 'The pump’s switch', 'The power socket at the pump station', 'The workshop socket'], 2),
  q(6, 2, 'Zoya, Bilal and Ayesha sit on one bench.', 'Bilal is not at either end. Zoya sits on the left end. Who sits on the right end?',
    ['Zoya', 'Bilal', 'Ayesha', 'We cannot tell'], 2),
  q(7, 2, 'Dr Hina says: “If it rains in the hills, the canal rises.”', 'This week the canal did not rise. What can we say?',
    ['It rained in the hills', 'It did not rain in the hills', 'The canal is blocked', 'It will rain soon'], 1),
  q(8, 2, 'Lamp 1 uses circuit X. Lamps 2 and 3 use circuit Y.', 'Lamps 2 and 3 are off. Lamp 1 works. Where is the fault most likely to be?',
    ['Circuit X', 'Circuit Y', 'Lamp 1', 'All the lamps'], 1, 'circuit-parallel'),
  // Level 3
  q(9, 3, 'Three shops are in houses 1, 2 and 3: a chai stall, a tailor and a cobbler.', 'The cobbler is in house 1. The tailor is not in house 2. The chai stall is next to the tailor. Which house is the chai stall in?',
    ['House 1', 'House 2', 'House 3', 'We cannot tell'], 1, 'houses'),
  q(10, 3, 'Some volunteers are painters. All painters wear aprons.', 'Which sentence MUST be true?',
    ['All volunteers wear aprons', 'Some volunteers wear aprons', 'No volunteers wear aprons', 'All apron-wearers are painters'], 1),
  q(11, 3, 'A bulb lights if switch A is ON or switch B is ON (or both).', 'Nothing is broken. The bulb is OFF. What must be true?',
    ['A is ON and B is OFF', 'A is OFF and B is ON', 'A and B are both OFF', 'A and B are both ON'], 2, 'circuit-parallel'),
  q(12, 3, 'A sign at the bridge says: “The bridge opens only on days with no rain.”', 'Today the bridge is open. What do you know for sure?',
    ['It is raining today', 'It is not raining today', 'It rained yesterday', 'The bridge is broken'], 1),
  // Level 4
  q(13, 4, 'Ayesha, Bilal, Kamran and Zoya live in houses 1 to 4 on one street.', 'Bilal lives in house 1. Ayesha does not live next to Bilal. Kamran lives next to Zoya. Who lives in house 4?',
    ['Ayesha', 'Kamran', 'Zoya', 'We cannot tell'], 0, 'houses'),
  q(14, 4, 'The radio needs its battery, wire and switch to all work. Bilal runs three tests:', 'Test 1: new battery, old wire, old switch → silent. Test 2: new battery, new wire, old switch → silent. Test 3: old battery, new wire, new switch → it plays! Which part MUST be broken?',
    ['The old battery', 'The old wire', 'The old switch', 'The battery and the wire'], 2),
  q(15, 4, 'The spare key is in the bank, the library or the post office. Only ONE of these signs is true.', 'Sign 1: “The key is in the bank.” Sign 2: “The key is not in the library.” Sign 3: “The key is not in the bank.” Where is the key?',
    ['The bank', 'The library', 'The post office', 'We cannot tell'], 1, 'signs'),
  q(16, 4, 'Five Mela jobs, A to E, must be done in order.', 'D comes before A. A comes before B. C comes after B. E is last. Which job is third?',
    ['A', 'B', 'C', 'D'], 1),
];
