import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useReducedMotion } from 'react-native-reanimated';
import { GameEngine } from '@/game/engine/GameEngine';
import { SaveGame } from '@/game/engine/saveGame';
import { createStore } from '@/database/storeFactory';
import { ThemeColors, dark, light } from '@/ui/tokens';
import { audio } from '@/services/audio';
import { feedback, speech } from '@/services/feedback';
import { SyncOutcome, syncNow } from '@/services/sync';
import { syncDeps } from '@/services/syncRuntime';

interface GameCtx {
  engine: GameEngine;
  s: SaveGame;
  /** Run an engine action and re-render. Errors are reported, never crash the game. */
  act: <T>(fn: (e: GameEngine) => T) => T | undefined;
  /** Upload progress/results to the class dashboard (no-op if not linked or offline). */
  sync: () => Promise<SyncOutcome>;
  syncing: boolean;
}

interface ThemeCtx { c: ThemeColors; isDark: boolean; scale: number; reducedMotion: boolean }

const Game = createContext<GameCtx | null>(null);
const Theme = createContext<ThemeCtx>({ c: light, isDark: false, scale: 1, reducedMotion: false });

export function GameProvider({ children, engine: injected }: { children: React.ReactNode; engine?: GameEngine }) {
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) engineRef.current = injected ?? new GameEngine(createStore(), () => Date.now(), __DEV__, () => Crypto.randomUUID());
  const engine = engineRef.current;
  const [s, setS] = useState<SaveGame>(engine.state);

  const act = useCallback(<T,>(fn: (e: GameEngine) => T) => {
    try {
      const r = fn(engine);
      setS(engine.state);
      return r;
    } catch (err) {
      console.warn('[NayaShehar] action failed:', err);
      setS(engine.state);
      return undefined;
    }
  }, [engine]);

  const [syncing, setSyncing] = useState(false);
  const busy = useRef(false);
  const sync = useCallback(async (): Promise<SyncOutcome> => {
    if (busy.current) return { ok: false, reason: 'offline', message: 'Already sending.' };
    busy.current = true; setSyncing(true);
    try { return await syncNow(engine, syncDeps); }
    catch (err) { return { ok: false, reason: 'server_error', message: String(err) }; }
    finally { busy.current = false; setSyncing(false); setS(engine.state); }
  }, [engine]);

  // Automatic uploads: on start, when the app comes back to the foreground, and
  // whenever weeks are completed or the class link / study details change.
  const completedCount = Object.keys(s.schedule.completedAt).length;
  useEffect(() => { if (s.link) sync(); }, [s.link?.classCode, s.link?.roll, completedCount, s.student?.matricGroup, s.student?.classLevel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active' && engine.state.link) sync(); });
    return () => sub.remove();
  }, [engine, sync]);

  useEffect(() => { audio.setEnabled(s.settings.sound); }, [s.settings.sound]);
  useEffect(() => { feedback.setHaptics(s.settings.haptics); }, [s.settings.haptics]);
  useEffect(() => { feedback.setSpeechRate(s.settings.speechRate); }, [s.settings.speechRate]);
  useEffect(() => () => { speech.stop(); audio.dispose(); }, []);

  const scheme = useColorScheme();
  const systemReduced = useReducedMotion();
  const theme = useMemo<ThemeCtx>(() => {
    const isDark = s.settings.theme === 'dark' || (s.settings.theme === 'system' && scheme === 'dark');
    const reducedMotion = s.settings.reducedMotion === 'on' || (s.settings.reducedMotion === 'system' && systemReduced);
    return { c: isDark ? dark : light, isDark, scale: s.settings.textScale, reducedMotion };
  }, [s.settings.theme, s.settings.reducedMotion, s.settings.textScale, scheme, systemReduced]);

  const value = useMemo(() => ({ engine, s, act, sync, syncing }), [engine, s, act, sync, syncing]);
  return (
    <Game.Provider value={value}>
      <Theme.Provider value={theme}>{children}</Theme.Provider>
    </Game.Provider>
  );
}

export function useGame() {
  const g = useContext(Game);
  if (!g) throw new Error('useGame outside GameProvider');
  return g;
}

export const useTheme = () => useContext(Theme);
