import { Level } from '../../types';
import { ChoicePuzzle } from '../puzzleTypes';

const q = (n: number, level: Level, story: string, prompt: string, options: string[], answer: number): ChoicePuzzle => ({
  id: `VRB-${String(n).padStart(2, '0')}`, family: 'VRB', level, kind: 'choice', story, prompt, options, answer,
});

export const VRB_BANK: ChoicePuzzle[] = [
  // Level 1
  q(1, 1, 'The radio station needs a flood warning.', 'Which warning is the clearest?',
    ['Water is rising. Move to high ground now.', 'Some water things may be happening soon, maybe.', 'Rising is the water, the ground high to go.', 'Please think about water at some time.'], 0),
  q(2, 1, 'Ustad Rafiq says the old bridge is fragile.', 'What does “fragile” mean?',
    ['Very strong', 'Easily broken', 'Very old', 'Freshly painted'], 1),
  q(3, 1, 'After the flood, clean water was scarce.', 'Which word means the OPPOSITE of “scarce”?',
    ['Rare', 'Dirty', 'Plentiful', 'Cold'], 2),
  q(4, 1, 'A poster at the health unit says: “Wash your hands before eating and after using the toilet.”', 'When should you wash your hands?',
    ['Only before eating', 'Only after using the toilet', 'Before eating and after using the toilet', 'Once a day'], 2),
  // Level 2
  q(5, 2, 'Zoya is making a word game for the school.', 'Brush is to painter as stethoscope is to ___.',
    ['Teacher', 'Doctor', 'Driver', 'Farmer'], 1),
  q(6, 2, 'The library needs a notice about returning books.', 'Which notice is clear AND polite?',
    ['BOOKS. FRIDAY. NOW.', 'Please return your books by Friday. Thank you!', 'Return books whenever, or not.', 'You never return books on time!'], 1),
  q(7, 2, 'Ayesha is checking the school newsletter.', 'Which sentence is written correctly?',
    ['The students left there bags in class.', 'The students left their bags in class.', 'The students left they’re bags in class.', 'The students left theirs bags in class.'], 1),
  q(8, 2, 'Read this: “The new solar pump uses sunlight, so it does not need fuel. Farmers now save money every month.”', 'What is the main idea?',
    ['Farmers dislike pumps.', 'The solar pump saves farmers money.', 'Sunlight is hot.', 'Fuel is easy to find.'], 1),
  // Level 3
  q(9, 3, 'Dr Hina is teaching word pairs.', 'Drought is to rain as darkness is to ___.',
    ['Night', 'Light', 'Shadow', 'Cold'], 1),
  q(10, 3, 'Kamran closed his shop early and took his umbrella.', 'What did Kamran most likely expect?',
    ['A busy evening', 'Rain', 'A holiday', 'A delivery'], 1),
  q(11, 3, 'The town hall is writing about the new bus route.', 'Choose the best word: “The new route will ___ travel time for students.”',
    ['reduce', 'reducing', 'reduction', 'reduced to'], 0),
  q(12, 3, 'Baji Saima writes: “Bilal gave Kamran his keys after he locked the shop.” Ayesha says this is unclear.', 'Which sentence is the clearest?',
    ['Bilal gave Kamran his keys after he locked it.', 'After Kamran locked the shop, Bilal gave Kamran his own keys back.', 'He gave him his keys after he locked the shop.', 'Keys were given after locking by him.'], 1),
  // Level 4
  q(13, 4, 'Read this: “Most families in the town now have clean water, although a few homes near the canal are still waiting for new pipes.”', 'Which statement is true according to the text?',
    ['Every home has clean water.', 'No home has clean water yet.', 'Some homes near the canal still need pipes.', 'The canal has no homes nearby.'], 2),
  q(14, 4, 'Zoya’s hardest word pair.', 'Seed is to harvest as plan is to ___.',
    ['Paper', 'Result', 'Idea', 'Field'], 1),
  q(15, 4, 'The radio wants to share facts, not opinions.', 'Which sentence is a FACT?',
    ['The Mela is the best festival ever.', 'Everyone will love the new stage.', 'The Mela will be held on Saturday at the town hall.', 'The lanterns are too beautiful to describe.'], 2),
  q(16, 4, 'These sentences are mixed up: (1) Then they mixed the cement. (2) First the workers cleared the rubble. (3) Finally they laid the new bricks.', 'Which order makes sense?',
    ['1, 2, 3', '2, 1, 3', '3, 1, 2', '2, 3, 1'], 1),
];
