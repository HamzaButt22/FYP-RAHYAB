/**
 * End-to-end through the real UI: menu -> level select -> name -> briefing -> intro -> walk (d-pad) -> answer the
 * villagers' dialogs by tapping -> merchant -> outcome -> upload -> server results -> onComplete.
 * Only the backend is faked (same semantics as Flask, see fakeServer.ts); time is driven by fake timers.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RahYaabGameScreen } from '../../navigation/RahYaabGameScreen';
import { MemoryStorage } from '../../services/storage';
import { FakeServer } from '../services/fakeServer';

let server: FakeServer;
const realFetch = global.fetch;
const realRaf = global.requestAnimationFrame;

beforeEach(() => {
  jest.useFakeTimers();
  server = new FakeServer();
  global.fetch = server.fetch;
  global.requestAnimationFrame = ((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16)) as unknown as typeof requestAnimationFrame;
  global.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as unknown as typeof cancelAnimationFrame;
});

afterEach(() => {
  jest.useRealTimers();
  global.fetch = realFetch;
  global.requestAnimationFrame = realRaf;
});

async function frames(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

async function until(check: () => boolean, maxMs = 20000, step = 100) {
  for (let t = 0; t <= maxMs; t += step) {
    if (check()) return;
    await frames(step);
  }
  throw new Error('condition not reached in time');
}

const has = (re: RegExp | string) => () => screen.queryAllByText(re).length > 0;

/** Answer whatever dialog is open with the option whose label matches `re` (tap = select, then Choose). */
async function choose(re: RegExp) {
  await until(() => screen.queryAllByRole('radio').length > 0);
  const opt = screen.getAllByRole('radio').find((r) => re.test(r.props.accessibilityLabel ?? ''));
  if (!opt) throw new Error(`no option ${re}`);
  await fireEvent.press(opt);
  await frames(50);
  await fireEvent.press(screen.getByTestId('choice-confirm'));
  await frames(80);
}

it('plays Harbor Village through the touch UI and receives the backend report', async () => {
  const storage = new MemoryStorage();
  const onComplete = jest.fn();
  const onExit = jest.fn();
  await render(
    <RahYaabGameScreen
      config={{ apiBaseUrl: 'https://fake.local' }}
      storage={storage}
      player={{ displayName: 'Zara' }}
      onComplete={onComplete}
      onExit={onExit}
    />,
  );
  await until(has('New Assessment'));

  // arrow buttons are easier to drive from a test than the joystick
  await fireEvent(screen.getByLabelText('Use arrow buttons instead of joystick'), 'valueChange', true);
  await fireEvent.press(screen.getByText('Level Select'));
  await fireEvent.press(screen.getByText('3.  Harbor Village'));
  await until(() => screen.queryByTestId('name-continue') !== null);
  expect(screen.getByDisplayValue('Zara')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('name-continue'));

  await until(has('Welcome, Zara!'));
  await fireEvent.press(screen.getByTestId('begin'));
  await until(has('Harbor Village'));
  await fireEvent.press(screen.getByTestId('start-level'));
  await until(() => screen.queryByLabelText('Move right') !== null);

  // walk east along the road; villagers come up to us
  const right = screen.getByLabelText('Move right');
  await fireEvent(right, 'pressIn');
  const answers: [RegExp, RegExp][] = [
    [/Baker Marta/, /hurry/],
    [/Captain Lena/, /together/],
    [/Lena/, /goodbye/i],
    [/Old Sailor Bashir/, /few coins/],
    [/Bashir/, /goodbye/i],
    [/Traveling Merchant/, /plain loaf/],
  ];
  for (const [who, pick] of answers) {
    await until(has(who), 30000);
    await choose(pick);
  }
  await fireEvent(right, 'pressOut');

  await until(() => screen.queryByTestId('outcome-0') !== null);
  expect(screen.getByText('LEVEL COMPLETE')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('outcome-0'));

  await until(has('BIG FIVE INDICATORS'), 20000);
  expect(onComplete).toHaveBeenCalledTimes(1);
  const done = onComplete.mock.calls[0][0];
  expect(done.sessionId).toBe('S1');
  expect(done.plan).toEqual([3]);

  // the server received the whole stream: SESSION_START ... SESSION_END, with our choices in it
  const evs = server.events.get('S1') as Record<string, unknown>[];
  expect(evs[0]).toMatchObject({ event_type: 'SESSION_START' });
  expect(evs[evs.length - 1]).toMatchObject({ event_type: 'SESSION_END', action: 'completed' });
  const responses = evs.filter((e) => e.event_type === 'DECISION_RESPONSE').map((e) => e.action);
  expect(responses).toEqual(['marta_ignore', 'lena_cooperate', 'lena_bye1', 'bashir_share_few', 'bashir_bye1', 'plain_bread']);
  // touch dialogs start with nothing highlighted: a single tap is a choice, not a "change of mind"
  for (const e of evs.filter((x) => x.event_type === 'DECISION_RESPONSE')) expect((e.metadata as { selection_changes: number }).selection_changes).toBe(0);
  expect(server.sessions.get('S1')?.game_version).toBe('0.2.0-mobile');

  await fireEvent.press(screen.getByTestId('results-done'));
  expect(onExit).toHaveBeenCalledWith('completed');
  expect([...storage.data.keys()].filter((k) => k.includes('session/'))).toEqual([]);
}, 60000);

it('resumes an interrupted assessment after the app was killed', async () => {
  const storage = new MemoryStorage();
  const first = await render(<RahYaabGameScreen config={{ apiBaseUrl: 'https://fake.local' }} storage={storage} />);
  await until(has('New Assessment'));
  await fireEvent.press(screen.getByText('Level Select'));
  await fireEvent.press(screen.getByText('1.  The Whispering Valley'));
  await until(() => screen.queryByTestId('name-continue') !== null);
  await fireEvent.changeText(screen.getByLabelText('Name or nickname'), 'Omar');
  await fireEvent.press(screen.getByTestId('name-continue'));
  await until(has('Welcome, Omar!'));
  await fireEvent.press(screen.getByTestId('begin'));
  await until(() => screen.queryByTestId('start-level') !== null);
  await fireEvent.press(screen.getByTestId('start-level'));
  await frames(3000); // play a bit (autosave runs every 2 s)
  await first.unmount(); // the process dies

  await render(<RahYaabGameScreen config={{ apiBaseUrl: 'https://fake.local' }} storage={storage} />);
  await until(has('Welcome back!'));
  expect(screen.getByText(/Omar has an unfinished assessment \(level 1: The Whispering Valley/)).toBeTruthy();
  await fireEvent.press(screen.getByTestId('resume-session'));
  await until(() => screen.queryByLabelText(/Action/) !== null);
  expect(screen.getByText('Level 1: The Whispering Valley')).toBeTruthy();
}, 60000);

it('abandoning from the pause menu requires confirmation and closes the session on the server', async () => {
  const storage = new MemoryStorage();
  await render(<RahYaabGameScreen config={{ apiBaseUrl: 'https://fake.local' }} storage={storage} />);
  await until(has('New Assessment'));
  await fireEvent.press(screen.getByText('Level Select'));
  await fireEvent.press(screen.getByText('4.  The Crumbling Vault'));
  await until(() => screen.queryByTestId('name-continue') !== null);
  await fireEvent.press(screen.getByTestId('name-continue'));
  await until(() => screen.queryByTestId('begin') !== null);
  await fireEvent.press(screen.getByTestId('begin'));
  await until(() => screen.queryByTestId('start-level') !== null);
  await fireEvent.press(screen.getByTestId('start-level'));
  await until(() => screen.queryByLabelText('Pause') !== null);
  await fireEvent.press(screen.getByLabelText('Pause'));
  await until(has('PAUSED'));
  await fireEvent.press(screen.getByText('Quit to menu (abandon assessment)'));
  expect(screen.getByText('Abandon this assessment?')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('confirm-abandon'));
  await until(has('New Assessment'));
  await until(() => server.sessions.get('S1')?.status === 'abandoned');
  const evs = server.events.get('S1') as Record<string, unknown>[];
  expect(evs.map((e) => e.event_type)).toEqual(expect.arrayContaining(['GAME_PAUSED', 'SESSION_END']));
  expect(evs[evs.length - 1]).toMatchObject({ event_type: 'SESSION_END', action: 'abandoned' });
}, 60000);
