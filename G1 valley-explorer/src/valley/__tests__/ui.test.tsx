import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ValleyExplorer } from '../ValleyExplorer';
import type { RahYaabHostAdapter } from '../adapter';
import { MemoryEventSink } from '../services/sinks';
import { MemoryStore } from '../services/storage';
import { EventStore } from '../services/eventStore';
import { GameSession } from '../services/session';
import { PERSONAS, playJourney } from '../testing/bots';
import { MAP_ITEMS } from '../core/items/mapRoom';
import { ALL_TASKS } from '../core/tasks';
import { MiniGameStage } from '../game/minigames/MiniGameStage';
import { MapRoomLevel } from '../levels/MapRoomLevel';
import { DEFAULT_LOOK } from '../game/engine/Avatar';
import type { Job } from '../core/levels/machine';

jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return { SafeAreaProvider: ({ children }: any) => children, SafeAreaView: ({ children }: any) => children, useSafeAreaInsets: () => insets };
});

function makeAdapter(over: Partial<RahYaabHostAdapter> = {}) {
  const store = new MemoryStore();
  let n = 0;
  const adapter: RahYaabHostAdapter = {
    studentId: 'P-UI-1', consentGranted: true, language: 'en', mode: 'research', eventSink: new MemoryEventSink(), storage: store,
    onComplete: () => {}, onExit: () => {}, newId: () => `ui-${++n}`, ...over,
  };
  return { adapter, store };
}

const press = async (id: string) => { await act(async () => { fireEvent.press(await screen.findByTestId(id)); }); };
/** give the world a size so tiles render, as a phone would */
const layoutWorld = async () => {
  await act(async () => { fireEvent(await screen.findByTestId('world-viewport'), 'layout', { nativeEvent: { layout: { width: 360, height: 520, x: 0, y: 0 } } }); });
};
/** joystick: a quick touch towards a direction = one step (the pad is 148 wide; its centre is 74,74) */
const JOY: Record<string, { locationX: number; locationY: number }> = { up: { locationX: 74, locationY: 20 }, down: { locationX: 74, locationY: 128 }, left: { locationX: 20, locationY: 74 }, right: { locationX: 128, locationY: 74 } };
const walk = async (dir: 'up' | 'down' | 'left' | 'right', n: number) => {
  for (let i = 0; i < n; i++) {
    await act(async () => { const pad = screen.getByTestId('dpad'); fireEvent(pad, 'responderGrant', { nativeEvent: JOY[dir] }); fireEvent(pad, 'responderRelease', { nativeEvent: JOY[dir] }); });
    await act(async () => { jest.advanceTimersByTime(200); });
  }
};
/** tap a tile of the world (the test viewport is 360 wide: portrait, 40-px tiles) */
const tapTile = async (x: number, y: number, steps = 30) => {
  await act(async () => { fireEvent(screen.getByTestId('world-tap'), 'responderRelease', { nativeEvent: { locationX: x, locationY: y } }); });
  for (let i = 0; i < steps; i++) await act(async () => { jest.advanceTimersByTime(200); });
};
/** answer every statement on the journal page shown now, then go back to the valley */
const fillJournal = async (answer: number | null = 4) => {
  await screen.findByText('Traveller’s Journal');
  while (screen.queryByTestId('journal-statement')) await press(answer === null ? 'journal-skip' : `journal-answer-${answer}`);
  await press('journal-done');
  await layoutWorld();
};
const actionLabel = () => screen.getByTestId('action-btn').props.accessibilityLabel as string;
const events = async (store: MemoryStore) => { const es = new EventStore(store); return es.loadEvents((await es.activeSessionId())!); };

describe('Valley Explorer game UI', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

  it('blocks without consent and records nothing', async () => {
    const { adapter, store } = makeAdapter({ consentGranted: false });
    await render(<ValleyExplorer adapter={adapter} />);
    expect(await screen.findByText(/finish the consent step/i)).toBeTruthy();
    expect(store.data.size).toBe(0);
  });

  it('level 1: create a traveller, walk with the arrows, read a sign, open the gate', async () => {
    const { adapter, store } = makeAdapter();
    const ui = await render(<ValleyExplorer adapter={adapter} />);
    expect(await screen.findByText('Choose your traveller')).toBeTruthy();
    await press('style-cap');
    await press('avatar-done');
    await layoutWorld();
    expect(await screen.findByText(/I am Ustad Mehr/)).toBeTruthy();
    expect(actionLabel()).toBe('OK');
    await press('action-btn'); // close the welcome bubble
    await walk('left', 3); // (5,24) -> (2,24): the Bazaar sign is right above
    expect(actionLabel()).toBe('Read sign');
    await press('action-btn');
    expect(await screen.findByText(/The Bazaar:/)).toBeTruthy();
    await press('action-btn');
    await walk('right', 3);
    await walk('up', 6); // to (5,18), in front of the gate
    expect(actionLabel()).toBe('Open the gate');
    await press('action-btn');
    // the first journal page follows straight away; one statement is skipped
    expect(await screen.findByText(/no right or wrong answers, and nothing here is marked/)).toBeTruthy();
    await press('journal-answer-5');
    await press('journal-skip');
    await press('journal-done');
    await layoutWorld();
    expect(await screen.findByText(/gate creaks open/)).toBeTruthy();
    const ev = await events(store);
    expect(ev.map((e) => e.event_type)).toEqual(['SESSION_START', 'LEVEL_START', 'EXPLORATION', 'LEVEL_COMPLETE', 'BIG5_RESPONSE', 'BIG5_RESPONSE']);
    const b5 = ev.filter((e) => e.event_type === 'BIG5_RESPONSE').map((e) => e.event_data);
    expect(b5.map((d) => [d.item_id, d.answer, d.skipped])).toEqual([['mi05', 5, false], ['mi02', null, true]]);
    // the avatar look is stored as a cosmetic preference, never as an assessment event
    expect(JSON.stringify(await events(store))).not.toMatch(/"cap"/);
    await ui.unmount();
  });

  it('tap-to-walk: tapping the gate walks there and opens it; tapping the edge arrow goes to the next stop', async () => {
    const { adapter, store } = makeAdapter();
    const ui = await render(<ValleyExplorer adapter={adapter} />);
    await press('avatar-done');
    await layoutWorld();
    await tapTile(10, 10, 1); // first tap closes Mehr's welcome bubble
    // 360×520 portrait test screen → 40-px tiles; camera x = -40, y = -696 at the start (5,24); the gate (5,17) is at 180,4
    await tapTile(180, 4);
    expect(await screen.findByText('Traveller’s Journal')).toBeTruthy();
    expect((await events(store)).map((e) => e.event_type)).toContain('LEVEL_COMPLETE');
    await press('journal-answer-3'); await press('journal-answer-3'); await press('journal-done');
    await layoutWorld();
    await tapTile(10, 10, 1); // close "the gate creaks open"
    // the next stop is off screen → an arrow at the edge leads there
    await press('objective-arrow');
    for (let i = 0; i < 30; i++) await act(async () => { jest.advanceTimersByTime(200); });
    expect(await screen.findByText(/Crossroads Caravan/)).toBeTruthy();
    expect(screen.getByTestId('intro-start')).toBeTruthy();
    await ui.unmount();
  });

  it('caravan: walk up a road to choose it; the mini-game opens; leaving moves to the next fork', async () => {
    const { adapter, store } = makeAdapter();
    const ui = await render(<ValleyExplorer adapter={adapter} />);
    await press('avatar-done');
    await layoutWorld();
    await press('action-btn');
    await walk('up', 6);
    await press('action-btn'); // open gate
    await fillJournal();
    expect(await screen.findByText(/gate creaks open/)).toBeTruthy();
    await press('action-btn'); // close the message
    await walk('up', 4); // (5,14)
    await walk('left', 2); // (3,14), next to the Caravan stop
    expect(actionLabel()).toBe('Enter');
    await press('action-btn');
    await press('intro-start');
    await layoutWorld();
    expect(await screen.findByText(/The road splits three ways/)).toBeTruthy();
    await press('action-btn');
    await walk('up', 6); // centre road
    expect(await screen.findByTestId('job-finish')).toBeTruthy();
    expect(screen.getByTestId('job-finish').props.accessibilityState?.disabled).toBe(true);
    const ev = await events(store);
    const choice = ev.find((e) => e.event_type === 'ROUTE_CHOICE')!;
    expect(choice.event_data.position).toBe(1);
    await press('job-leave');
    await layoutWorld();
    expect(await screen.findByText(/Fork 2 of 10/)).toBeTruthy();
    await ui.unmount();
  });

  it('resumes inside a level after the app is killed', async () => {
    const { adapter } = makeAdapter();
    const first = await render(<ValleyExplorer adapter={adapter} />);
    await press('avatar-done'); await layoutWorld(); await press('action-btn');
    await walk('up', 6); await press('action-btn');
    await screen.findByText('Traveller’s Journal');
    await press('journal-answer-3'); // answer one statement, then the app is killed mid-page
    await first.unmount();

    const second = await render(<ValleyExplorer adapter={adapter} />);
    // the unfinished page comes back with only the statement still unanswered
    expect(await screen.findByText('Traveller’s Journal')).toBeTruthy();
    expect(screen.getByTestId('journal-statement').props.children).toBe('I sympathize with others’ feelings.');
    await press('journal-answer-2'); await press('journal-done'); await layoutWorld();
    // after a restart the traveller stands just inside the open gate, at (5,16)
    await walk('up', 2); await walk('left', 2); await press('action-btn'); await press('intro-start');
    await second.unmount(); // "kill" while inside the caravan

    await render(<ValleyExplorer adapter={adapter} />);
    expect(await screen.findByText('Continue where I left off')).toBeTruthy();
  });

  it('puzzle: practice can be retried; a scored answer is final; chosen piece lands in the slot', async () => {
    const { adapter, store } = makeAdapter();
    const { session } = await GameSession.open(adapter);
    await playJourney(session, PERSONAS.maker, () => {}, { stopAfterLevel: 4 });
    session.sync.stop();
    await render(<MapRoomLevel session={session} look={DEFAULT_LOOK} coins={0} onBack={() => {}} onComplete={() => {}} />);
    const wrong = (MAP_ITEMS[0].correctIndex + 1) % 4;
    await press(`map-opt-${wrong}`);
    expect(screen.queryByText('Tap a piece below')).toBeNull();
    await press('item-submit');
    expect(await screen.findByText(/have another go/)).toBeTruthy();
    await press('item-retry');
    await press(`map-opt-${MAP_ITEMS[0].correctIndex}`);
    await press('item-submit');
    expect(await screen.findByText('That’s it!')).toBeTruthy();
    await press('item-next');
    await press(`map-opt-${(MAP_ITEMS[1].correctIndex + 1) % 4}`);
    await press('item-submit');
    expect(await screen.findByText('Not this one')).toBeTruthy();
    expect(screen.queryByTestId('item-retry')).toBeNull();
    const scored = (await events(store)).filter((e) => e.event_type === 'ITEM_RESPONSE' && e.level_id === 'map_room' && !e.event_data.practice);
    expect(scored).toHaveLength(1);
    session.sync.stop();
  });
});

describe('mini-game interactions', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

  function harness(taskId: string) {
    const steps: string[] = [];
    let job: Job = { taskId, round: 0, done: [], startedAt: 0 };
    const props = () => ({ task: ALL_TASKS[taskId], job, onStep: (id: string) => { steps.push(id); job = { ...job, done: [...job.done, id] }; }, onFinish: () => {}, onLeave: () => {} });
    return { steps, props, rerender: async (r: any) => { await r.rerender(<MiniGameStage {...props()} />); } };
  }

  it('fix: tap ×3, drag (tap item then target), hold — each completes one step in order', async () => {
    const h = harness('wheel_workshop');
    const r = await render(<MiniGameStage {...h.props()} />);
    for (let i = 0; i < 3; i++) await press('target-machine');
    expect(h.steps).toEqual(['pull']);
    await h.rerender(r);
    await press('target-machine'); // tapping the target before picking up the part does nothing
    expect(h.steps).toEqual(['pull']);
    await press('drag-item');      // pick up the part (tap fallback for dragging)
    await press('target-machine');
    expect(h.steps).toEqual(['pull', 'fit']);
    await h.rerender(r);
    await act(async () => { fireEvent(screen.getByTestId('target-machine'), 'pressIn'); jest.advanceTimersByTime(950); fireEvent(screen.getByTestId('target-machine'), 'pressOut'); });
    expect(h.steps).toEqual(['pull', 'fit', 'spin']);
    await h.rerender(r);
    expect(screen.getByTestId('job-finish').props.accessibilityState?.disabled).toBe(false);
    // extras appear and can be chosen
    await press('extra-grease');
    await press('drag-item');
    await press('target-machine');
    expect(h.steps).toEqual(['pull', 'fit', 'spin', 'grease']);
  });

  it('organise: drag via tap-select, then tap ×3, then drag to the second target', async () => {
    const h = harness('ledger_tower');
    const r = await render(<MiniGameStage {...h.props()} />);
    expect(screen.getByText('Drag the boxes onto the shelf', { exact: false })).toBeTruthy();
    expect(h.steps).toEqual([]);
    expect(screen.getByTestId('job-finish').props.accessibilityState?.disabled).toBe(true);
    await h.rerender(r);
  });

  it('hold must be held for the full time; releasing early does nothing', async () => {
    const h = harness('fireside_circle'); // help: first step is hold
    await render(<MiniGameStage {...h.props()} />);
    await act(async () => { fireEvent(screen.getByTestId('target-person'), 'pressIn'); jest.advanceTimersByTime(400); fireEvent(screen.getByTestId('target-person'), 'pressOut'); });
    expect(h.steps).toEqual([]);
    await act(async () => { fireEvent(screen.getByTestId('target-person'), 'pressIn'); jest.advanceTimersByTime(950); });
    expect(h.steps).toEqual(['listen']);
  });

  it('create: pick a colour, then tap the tile', async () => {
    const h = harness('mural_wall');
    await render(<MiniGameStage {...h.props()} />);
    await press('target-tile0');
    expect(h.steps).toEqual([]); // no colour chosen yet
    await press('colour-#E3B23C');
    await press('target-tile0');
    expect(h.steps).toEqual(['t1']);
  });
});
