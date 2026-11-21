/**
 * <ValleyExplorer adapter={...} /> — the single component RahYaab mounts on its assessment screen.
 *
 * Navigation inside the module is a small state machine (not a router) so the module works under any
 * host navigator (React Navigation, Expo Router, ...) without adding routes to RahYaab.
 */
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RahYaabHostAdapter } from './adapter';
import { JOURNEY, type LevelDef } from './core/journey';
import type { PlayableLevelId } from './core/progress';
import type { StudentSummary } from './core/summary';
import { CaravanLevel } from './levels/CaravanLevel';
import { MapRoomLevel } from './levels/MapRoomLevel';
import { OrdersLevel } from './levels/OrdersLevel';
import { ParkLevel } from './levels/ParkLevel';
import { PatternGateLevel } from './levels/PatternGateLevel';
import type { LevelProps } from './levels/types';
import { VaultLocksLevel } from './levels/VaultLocksLevel';
import { WorkshopLevel } from './levels/WorkshopLevel';
import { LevelIntro } from './screens/LevelIntro';
import { Reflection } from './screens/Reflection';
import { Results } from './screens/Results';
import { ConsentRequiredError, GameSession } from './services/session';
import type { SyncStatus } from './services/sync';
import { Button, Guide, Screen } from './ui/components';
import { AvatarCreator } from './game/AvatarCreator';
import { DEFAULT_LOOK, type AvatarLook } from './game/engine/Avatar';
import type { Dir, Pos } from './game/engine/tilemap';
import { VALLEY_INSIDE, VALLEY_START } from './game/maps';
import { coinsFromEvents } from './game/rewards';
import { ValleyWorld } from './game/ValleyWorld';
import { useGameOrientation, type GameOrientation } from './game/orientation';
import { Journal } from './game/Journal';
import { big5Event, pendingJournalPage, type JournalPage } from './core/bigfive/journal';
import { bigFiveAnswers } from './core/bigfive/scoring';
import { colors, space, type } from './ui/theme';

const LEVEL_SCREENS: Record<Exclude<PlayableLevelId, 'valley_gate'>, React.ComponentType<LevelProps>> = {
  crossroads_caravan: CaravanLevel,
  workshop_orders: OrdersLevel,
  career_workshop: WorkshopLevel,
  map_room: MapRoomLevel,
  pattern_gate: PatternGateLevel,
  park_mission: ParkLevel,
  vault_locks: VaultLocksLevel,
};

/** the only stop finished inside the valley itself is the gate; its message is shown after the journal page */
const GATE_OPEN_TEXT = 'The gate creaks open! Walk up the path to your first stop.';

type View_ =
  | { name: 'loading' }
  | { name: 'blocked'; message: string }
  | { name: 'error'; message: string }
  | { name: 'map'; welcome?: string; start: Pos; facing: Dir; visit: number }
  | { name: 'creator'; first: boolean }
  | { name: 'journal'; page: JournalPage; welcome?: string }
  | { name: 'intro'; level: LevelDef; resuming: boolean }
  | { name: 'level'; level: LevelDef }
  | { name: 'reflection' }
  | { name: 'results'; summary: StudentSummary };

function syncLine(s: SyncStatus | null): string {
  if (!s) return 'Your progress is saved on this phone.';
  if (s.syncing) return 'Saving to RahYaab…';
  if (s.pending === 0) return 'Progress saved on this phone and sent to RahYaab.';
  if (s.lastError) return 'Progress saved on this phone. It will be sent when you are online.';
  return 'Progress saved on this phone.';
}

export function ValleyExplorer({ adapter }: { adapter: RahYaabHostAdapter }) {
  return (
    <SafeAreaProvider>
      <ValleyExplorerInner adapter={adapter} />
    </SafeAreaProvider>
  );
}

function ValleyExplorerInner({ adapter }: { adapter: RahYaabHostAdapter }) {
  const [view, setView] = useState<View_>({ name: 'loading' });
  const [session, setSession] = useState<GameSession | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const [attempt, setAttempt] = useState(0);
  const [look, setLook] = useState<AvatarLook>(DEFAULT_LOOK);
  const [coins, setCoins] = useState(0);
  const where = useRef<{ pos: Pos | null; facing: Dir }>({ pos: null, facing: 'up' });

  /** Big Five journal statements already answered or skipped (from stored events; updated as the student answers) */
  const seen = useRef<Set<string>>(new Set());

  const visits = useRef(0);
  /** Build the valley view — or the journal page still owed for a finished stop. Reads refs only in handlers. */
  const mapView = useCallback((s: GameSession | null, welcome?: string): View_ => {
    const page = s ? pendingJournalPage(s.journey.completed, seen.current) : null;
    if (page) return { name: 'journal', page, welcome };
    return {
      name: 'map', welcome, visit: ++visits.current, facing: where.current.facing,
      start: where.current.pos ?? (s?.journey.completed.includes('valley_gate') ? VALLEY_INSIDE : VALLEY_START),
    };
  }, []);

  const refreshCoins = useCallback(async (s: GameSession) => { setCoins(coinsFromEvents(await s.events())); }, []);
  const [orientation, setOrientation] = useState<GameOrientation>('landscape');
  const orientRef = useRef<GameOrientation>('landscape');
  useGameOrientation(orientation);
  const savePrefs = useCallback((s: GameSession, l: AvatarLook) => s.store.setPrefs(adapter.studentId, { look: l, pos: where.current.pos, facing: where.current.facing, orientation: orientRef.current }), [adapter.studentId]);

  // Open (or resume) the session. Cancelled if the module unmounts before storage answers.
  useEffect(() => {
    let alive = true;
    GameSession.open(adapter, { onSync: setSync }).then(
      async ({ session: s }) => {
        if (!alive) { s.sync.stop(); return; }
        const prefs = await s.store.getPrefs<{ look: AvatarLook; pos: Pos | null; facing: Dir; orientation?: GameOrientation }>(adapter.studentId);
        if (!alive) { s.sync.stop(); return; }
        if (prefs?.look) setLook(prefs.look);
        seen.current = new Set(bigFiveAnswers(await s.events()).keys());
        where.current = { pos: prefs?.pos ?? null, facing: prefs?.facing ?? 'up' };
        if (prefs?.orientation) { orientRef.current = prefs.orientation; setOrientation(prefs.orientation); }
        setSession(s);
        void refreshCoins(s);
        const active = s.journey.activeLevel && s.journey.activeLevel !== 'valley_gate' ? JOURNEY.find((l) => l.id === s.journey.activeLevel) : undefined;
        setView(!prefs?.look ? { name: 'creator', first: true } : active ? { name: 'intro', level: active, resuming: true } : mapView(s));
      },
      (e) => {
        if (!alive) return;
        if (e instanceof ConsentRequiredError) setView({ name: 'blocked', message: 'Please finish the consent step in RahYaab first. Nothing has been recorded.' });
        else setView({ name: 'error', message: String((e as Error)?.message ?? e) });
      },
    );
    return () => { alive = false; };
  }, [adapter, attempt, refreshCoins, mapView]);

  // Re-render on every commit; when a stop is finished inside the valley (the gate), open its journal page.
  useEffect(() => (session ? session.subscribe(() => {
    rerender();
    if (viewRef.current.name === 'map' && pendingJournalPage(session.journey.completed, seen.current)) setView(mapView(session, GATE_OPEN_TEXT));
  }) : undefined), [session, mapView]);
  useEffect(() => () => session?.sync.stop(), [session]);

  // background / foreground: stop the clock, persist, try to upload
  useEffect(() => {
    if (!session) return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void session.resume('foreground');
      else void session.pause(st);
    });
    return () => sub.remove();
  }, [session]);

  const toMap = useCallback(async () => {
    if (session?.journey.activeLevel) {
      await session.commit({ events: [{ level: session.journey.activeLevel, type: 'LEVEL_EXIT', data: { reason: 'back_to_map' } }], actions: [{ type: 'CLOSE_LEVEL' }] });
    }
    if (session) void refreshCoins(session);
    setView(mapView(session));
  }, [session, refreshCoins, mapView]);

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const v = viewRef.current;
      if (v.name === 'level' || v.name === 'intro' || v.name === 'reflection' || (v.name === 'creator' && !v.first)) { void toMap(); return true; }
      if (v.name === 'journal') return true; // finish (or skip) the page with the on-screen buttons
      if (v.name === 'map' || v.name === 'results' || v.name === 'blocked' || v.name === 'error') { adapter.onExit(); return true; }
      return true; // swallow while loading
    });
    return () => sub.remove();
  }, [adapter, toMap]);

  if (view.name === 'loading' || (!session && view.name !== 'blocked' && view.name !== 'error')) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.parchment }}><ActivityIndicator size="large" color={colors.primary} /><Text style={[type.small, { marginTop: space.md }]}>Opening the valley…</Text></View>;
  }
  if (view.name === 'blocked' || view.name === 'error') {
    return (
      <Screen footer={<>{view.name === 'error' ? <Button label="Try again" onPress={() => { setView({ name: 'loading' }); setAttempt((n) => n + 1); }} /> : null}<Button label="Back to RahYaab" variant="secondary" onPress={adapter.onExit} /></>}>
        <View style={{ height: space.xl }} />
        <Guide>{view.name === 'blocked' ? view.message : 'Something went wrong while opening the game. Your saved progress is safe.'}</Guide>
        {view.name === 'error' ? <Text style={type.small}>{view.message}</Text> : null}
      </Screen>
    );
  }
  const s = session!;

  switch (view.name) {
    case 'journal': {
      const page = view.page;
      return <Journal key={page.level} items={page.items} first={page.first}
        onAnswer={async (id, answer, ms) => { seen.current.add(id); await s.commit({ events: [big5Event(page.level, id, answer, ms)] }); }}
        onDone={() => setView(mapView(s, view.welcome))} />;
    }
    case 'creator':
      return <AvatarCreator first={view.first} initial={look} stopsDone={s.journey.completed.length}
        onDone={(l) => { setLook(l); void savePrefs(s, l); setView(mapView(s)); }} />;
    case 'map': {
      return <ValleyWorld key={`visit-${view.visit}`} session={s} look={look} coins={coins} start={view.start} startFacing={view.facing}
        welcome={view.welcome} storageWarning={!!s.storageError}
        onMove={(p, f) => { where.current = { pos: p, facing: f }; }}
        onEnterStop={(l) => { void savePrefs(s, look); setView({ name: 'intro', level: l, resuming: s.journey.levelStates[l.id] !== undefined }); }}
        onReflection={() => setView({ name: 'reflection' })} onWardrobe={() => setView({ name: 'creator', first: false })}
        onRotate={() => { const o: GameOrientation = orientRef.current === 'landscape' ? 'portrait' : 'landscape'; orientRef.current = o; setOrientation(o); void savePrefs(s, look); }}
        onExit={() => { void savePrefs(s, look); adapter.onExit(); }} />;
    }
    case 'intro':
      return <LevelIntro level={view.level} resuming={view.resuming} onBack={toMap} onStart={() => setView({ name: 'level', level: view.level })} />;
    case 'level': {
      const LevelScreen = LEVEL_SCREENS[view.level.id as Exclude<PlayableLevelId, 'valley_gate'>];
      return <LevelScreen key={view.level.id} session={s} look={look} coins={coins} onBack={toMap}
        onComplete={() => { void refreshCoins(s); setView(mapView(s, `★ You finished ${view.level.title}! New stamp and +20 coins. ${s.journey.completed.length === JOURNEY.length ? 'Come and talk to me — your journey is complete!' : 'Follow the path to the next “!”.'}`)); }} />;
    }
    case 'reflection':
      return <Reflection onDone={async ({ favourite, feeling }) => {
        await s.commit({
          events: [
            { level: 'journey', type: 'REFLECTION_RESPONSE', data: { question_id: 'favourite_activity', answer: favourite, scored: false } },
            { level: 'journey', type: 'REFLECTION_RESPONSE', data: { question_id: 'journey_feeling', answer: feeling, scored: false } },
          ],
          actions: [{ type: 'COMPLETE_REFLECTION' }],
        });
        const out = await s.finish();
        setView({ name: 'results', summary: out.student_summary });
      }} />;
    case 'results':
      return <Results summary={view.summary} syncText={syncLine(sync)} onDone={async () => { await s.purgeIfDelivered(); adapter.onExit(); }} />;
  }
}
