/**
 * The app controller: current screen, overlay stack, toasts, effects, audio, settings, session and the flow
 * rules (which screen comes next). Port of the desktop core/app.py + systems/flow.py.
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { content, Line } from '../logic/content';
import { Session } from '../logic/session';
import { Saves, SaveCorrupt } from '../logic/storage';
import { RiasecReport } from '../logic/riasec';
import { AudioManager } from './audio';
import { DEFAULT_SETTINGS, sanitizeSettings, Settings } from './settings';

export type ScreenSpec =
  | { name: 'menu' }
  | { name: 'beforeStart' }
  | { name: 'avatar'; consent: boolean }
  | { name: 'story' }
  | { name: 'dayIntro' }
  | { name: 'dialogue'; lines: Line[]; bg: string; onDone: () => void; music?: string; crowd?: boolean; gameplay?: boolean }
  | { name: 'map' }
  | { name: 'stall' }
  | { name: 'what'; id: string }
  | { name: 'loved'; id: string }
  | { name: 'how'; id: string }
  | { name: 'diary' }
  | { name: 'summary' }
  | { name: 'reveal' }
  | { name: 'results'; first?: boolean }
  | { name: 'ending' };

export interface ConfirmSpec {
  name: 'confirm'; title: string; body: string; yes: string; onYes: () => void; no?: string; danger?: boolean; delay?: number; onNo?: () => void;
}
export type OverlaySpec =
  | { name: 'pause' }
  | { name: 'settings' }
  | { name: 'howto' }
  | { name: 'about' }
  | ConfirmSpec
  | { name: 'stallSelect'; pre?: string | null }
  | { name: 'visitComplete' }
  | { name: 'board' }
  | { name: 'diaryPages' }
  | { name: 'explain'; rep: RiasecReport }
  | { name: 'saveError' };

export type Keyed<T> = T & { key: number };
export type FxKind = 'confetti' | 'sparkle' | 'firework';
export interface FxBurst { id: number; kind: FxKind; x: number; y: number; n: number }
export interface Toast { id: number; text: string; color: string; dur: number }

export interface App {
  ready: boolean;
  screen: Keyed<ScreenSpec>;
  overlays: Keyed<OverlaySpec>[];
  toasts: Toast[];
  bursts: FxBurst[];
  settings: Settings;
  session: Session;
  saves: Saves;
  audio: AudioManager;
  rev: number;
  init(): Promise<void>;
  replace(s: ScreenSpec): void;
  push(o: OverlaySpec): void;
  pop(key?: number): void;
  clearOverlays(): void;
  toast(text: string, color?: string, dur?: number): void;
  dropToast(id: number): void;
  fx(kind: FxKind, x: number, y: number, n?: number): void;
  dropFx(id: number): void;
  sfx(name: string, vol?: number): void;
  haptic(kind: 'tap' | 'select' | 'success' | 'warn'): void;
  setSettings(p: Partial<Settings>): void;
  resetSettings(): void;
  refresh(): void;
  route(): void;
  afterStep(visitsBefore: number): void;
  toMenu(): void;
  lines(raw: Line[]): Line[];
  continueGame(): void;
}

const Ctx = createContext<App | null>(null);
export const useApp = (): App => {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppProvider missing');
  return v;
};

let keyCounter = 1;
const nextKey = () => keyCounter++;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const savesRef = useRef<Saves>(new Saves(AsyncStorage));
  const sessionRef = useRef<Session>(new Session(content, savesRef.current));
  const settingsRef = useRef<Settings>({ ...DEFAULT_SETTINGS });
  const audioRef = useRef<AudioManager | null>(null);
  if (!audioRef.current) audioRef.current = new AudioManager(() => settingsRef.current);

  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Keyed<ScreenSpec>>({ name: 'menu', key: 0 });
  const [overlays, setOverlays] = useState<Keyed<OverlaySpec>[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bursts, setBursts] = useState<FxBurst[]>([]);
  const [settings, setSettingsState] = useState<Settings>(settingsRef.current);
  const [rev, setRev] = useState(0);

  const app = useRef<App>(null as unknown as App);

  const sfx = useCallback((name: string, vol = 1) => audioRef.current?.play(name, vol), []);
  const haptic = useCallback((kind: 'tap' | 'select' | 'success' | 'warn') => {
    if (!settingsRef.current.haptics) return;
    try {
      if (kind === 'tap') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      else if (kind === 'select') Haptics.selectionAsync().catch(() => undefined);
      else if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    } catch {
      /* not supported on this platform */
    }
  }, []);

  const replace = useCallback((s: ScreenSpec) => setScreen({ ...s, key: nextKey() } as Keyed<ScreenSpec>), []);
  const push = useCallback((o: OverlaySpec) => setOverlays((xs) => [...xs, { ...o, key: nextKey() } as Keyed<OverlaySpec>]), []);
  const pop = useCallback((key?: number) => setOverlays((xs) => (key === undefined ? xs.slice(0, -1) : xs.filter((x) => x.key !== key))), []);
  const clearOverlays = useCallback(() => setOverlays([]), []);
  const toast = useCallback((text: string, color = 'teal', dur = 2.2) => {
    setToasts((xs) => [...xs.slice(-2), { id: nextKey(), text, color, dur }]);
  }, []);
  const dropToast = useCallback((id: number) => setToasts((xs) => xs.filter((t) => t.id !== id)), []);
  const fx = useCallback((kind: FxKind, x: number, y: number, n = 20) => {
    if (settingsRef.current.reduce_motion) return;
    setBursts((xs) => [...xs.slice(-5), { id: nextKey(), kind, x, y, n }]);
  }, []);
  const dropFx = useCallback((id: number) => setBursts((xs) => xs.filter((b) => b.id !== id)), []);
  const refresh = useCallback(() => setRev((r) => r + 1), []);

  const setSettings = useCallback((p: Partial<Settings>) => {
    settingsRef.current = sanitizeSettings({ ...settingsRef.current, ...p });
    setSettingsState(settingsRef.current);
    savesRef.current.save('settings', settingsRef.current);
    audioRef.current?.apply();
  }, []);
  const resetSettings = useCallback(() => {
    settingsRef.current = { ...DEFAULT_SETTINGS };
    setSettingsState(settingsRef.current);
    audioRef.current?.apply();
  }, []);

  const lines = useCallback((raw: Line[]) => {
    const s = sessionRef.current;
    const name = s.active ? s.name : 'Volunteer';
    return raw.map((l) => ({ ...l, text: l.text.split('{name}').join(name) }));
  }, []);

  /** Decide which screen to show from the saved progress pointer (GAME_FLOW.md). */
  const route = useCallback(() => {
    const s = sessionRef.current;
    refresh();
    if (!s.active) {
      replace({ name: 'menu' });
      return;
    }
    const ph = s.phase;
    if (ph === 'story') replace({ name: 'story' });
    else if (ph === 'morning') replace({ name: 'dayIntro' });
    else if (ph === 'map') replace({ name: 'map' });
    else if (ph === 'visit') {
      const step = s.currentStep();
      if (!step) replace({ name: 'map' });
      else if (!s.progress.arrived && s.progress.step === 0 && step[0] === 'what') replace({ name: 'stall' });
      else replace({ name: step[0], id: step[1] } as ScreenSpec);
    } else if (ph === 'diary') {
      if (s.progress.diary_index === 0) {
        replace({
          name: 'dialogue', lines: lines(content.dialogues.days[String(s.day)].evening), bg: 'backgrounds/bg_mela_night',
          music: 'mus_diary_night', gameplay: true, onDone: () => replace({ name: 'diary' }),
        });
      } else replace({ name: 'diary' });
    } else if (ph === 'summary') replace({ name: 'summary' });
    else if (ph === 'finale') {
      replace({
        name: 'dialogue', lines: lines(content.dialogues.closing), bg: 'backgrounds/bg_mela_night', music: 'mus_mela_day5',
        crowd: true, gameplay: true, onDone: () => replace({ name: 'reveal' }),
      });
    } else replace({ name: 'results' });
  }, [lines, refresh, replace]);

  /** Called by card screens after a confirmed answer. */
  const afterStep = useCallback((visitsBefore: number) => {
    const s = sessionRef.current;
    refresh();
    if (s.progress.stalls_today.length > visitsBefore) push({ name: 'visitComplete' });
    else {
      const step = s.currentStep();
      if (step) replace({ name: step[0], id: step[1] } as ScreenSpec);
      else route();
    }
  }, [push, refresh, replace, route]);

  const toMenu = useCallback(() => {
    sessionRef.current.close();
    setOverlays([]);
    refresh();
    replace({ name: 'menu' });
  }, [refresh, replace]);

  const continueGame = useCallback(() => {
    try {
      if (sessionRef.current.load()) route();
    } catch (e) {
      if (e instanceof SaveCorrupt) push({ name: 'saveError' });
      else throw e;
    }
  }, [push, route]);

  const init = useCallback(async () => {
    try {
      await savesRef.current.init();
      try {
        settingsRef.current = sanitizeSettings(savesRef.current.load('settings'));
      } catch {
        settingsRef.current = { ...DEFAULT_SETTINGS };
      }
      setSettingsState(settingsRef.current);
      audioRef.current?.apply();
    } finally {
      setReady(true);
    }
  }, []);

  const value = useMemo<App>(() => ({
    ready, screen, overlays, toasts, bursts, settings, rev,
    session: sessionRef.current, saves: savesRef.current, audio: audioRef.current as AudioManager,
    init, replace, push, pop, clearOverlays, toast, dropToast, fx, dropFx, sfx, haptic, setSettings, resetSettings,
    refresh, route, afterStep, toMenu, lines, continueGame,
  }), [ready, screen, overlays, toasts, bursts, settings, rev, init, replace, push, pop, clearOverlays, toast, dropToast, fx,
    dropFx, sfx, haptic, setSettings, resetSettings, refresh, route, afterStep, toMenu, lines, continueGame]);
  app.current = value;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
