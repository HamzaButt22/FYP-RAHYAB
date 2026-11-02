/** Player-facing texts ported from game/app.py and game/ui/screens.py (touch-control wording adapted). */
export const INTRO_TEXT: Record<number, string> = {
  1: "You arrive in an unfamiliar valley. A road leads to the Valley Gate - but the valley is big, and nobody is watching the clock. Do whatever feels natural.",
  2: "The workshop has a limited stock of wood, metal and cloth, and a list of customer orders. Fill orders worth at least 100 coins and deliver them. Take your time or dive in - it's up to you.",
  3: 'You must deliver a letter to the ferry dock. The harbor is busy: villagers may stop you, or wait quietly in the side streets. Talk, help, trade... or just keep walking.',
  4: 'Alarms blare: the old vault is collapsing! Three locked gates and a laser corridor stand between you and the exit. The countdown is running - decide fast, and expect surprises.',
  5: 'A day-long mountain expedition. Pack supplies, plan a route, and decide what to do when conditions change. Several different plans can work. Scout Mira and Porter Tariq are around if you want to talk.',
  6: 'A river is rising over three stages. You have action points, sandbags, volunteers and vehicles, and four sites that need protection. Gather information, decide, and adapt. There is no single right plan.',
  7: 'A community makerspace open day. Six benches offer different hands-on work. You have a limited number of time blocks: choose what to try, how to approach it, and whether to come back. Nothing is required except trying a few.',
  8: 'Reopen Riverside Park for Community Day. Share a budget and work shifts across three phases, work with four teammates, and adapt as news arrives. Every requirement can be met in more than one way.',
};

export const LEVEL_BLURB: Record<number, string> = {
  1: 'Level 1  -  Exploration',
  2: 'Level 2  -  Planning with limited resources',
  3: 'Level 3  -  Social interaction',
  4: 'Level 4  -  Pressure and uncertainty',
  5: 'Level 5  -  Multi-stage planning and replanning',
  6: 'Level 6  -  Adaptive decisions with shared resources',
  7: 'Level 7  -  Career exploration: hands-on activities',
  8: 'Level 8  -  Career exploration: one mission, many roles',
};

export type TrackKey = 'full' | 'bigfive' | 'career' | 'original';

/** Desktop main menu: "New Assessment", three tracks, Level Select, Instructions. */
export const TRACKS: { key: TrackKey; label: string; detail: string }[] = [
  { key: 'full', label: 'New Assessment', detail: 'All eight levels: Big Five indicators and career interests (about 25-40 minutes)' },
  { key: 'bigfive', label: 'Big Five track (levels 1-6)', detail: 'Personality-related behaviour only' },
  { key: 'career', label: 'Career Interests track (levels 7-8)', detail: 'RIASEC career-interest profile only' },
  { key: 'original', label: 'Original game (levels 1-4)', detail: 'The four original scenarios (about 8-12 minutes)' },
];

export const INSTRUCTION_PAGES: { title: string; lines: string[] }[] = [
  {
    title: 'How to play',
    lines: [
      'Move your character with the joystick (or the arrow buttons - see Settings).',
      'Tap the action button next to objects, villagers and stations to interact. It shows what is in reach.',
      'When a choice appears, tap an option to select it, then tap "Choose" (or tap it again).',
      'Tap Pause at any time. Nothing is timed while the game is paused, and leaving the app pauses too.',
      'There are 8 levels. Levels 1-4 can be failed (try again up to 3 times, or move on); levels 5-8 cannot be failed.',
      'In workshop activities (level 7) tap the numbered actions; "Ask the mentor" gives hints, "Step away" leaves.',
    ],
  },
  {
    title: 'The eight levels',
    lines: [
      '1-4: Valley (exploration), Workshop (planning), Harbor Village (social), Crumbling Vault (pressure).',
      '5. Strategic Expedition - pack, choose a route, adapt when conditions change.',
      '6. Flood Response - action points, shared resources, neighbours with requests.',
      '7. Career Workshop - six hands-on benches; choose what to try, how, and for how long.',
      '8. Integrated Career Mission - one park, one budget, four teammates, many valid strategies.',
    ],
  },
  {
    title: 'What is recorded and how it is used',
    lines: [
      'Every meaningful action becomes a telemetry event that is sent to the RahYaab server.',
      'After the last level the server cleans the telemetry and calculates behavioral features.',
      'Transparent rule-based models (not machine learning) turn them into Big Five indicators (levels 1-6) and a RIASEC interest profile (levels 7-8).',
      'Weights and mappings are documented prototype assumptions - NOT validated instruments. Speed and skill are not read as personality or interest.',
      'If you are offline, everything is kept on this phone and uploaded later. Results appear once the upload is done.',
    ],
  },
];

export const PROTOTYPE_NOTICE = 'Prototype: exploratory indicators, not validated psychometric or career tests.';
