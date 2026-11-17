// Holds the accessibility settings (FR-97) for whoever uses the phone: saved per student in the encrypted
// local database (before joining, for the phone), applied at once without a restart, and combined with
// Android's own TalkBack and reduce-motion state, which can change while the app runs.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

import { setReadingRate } from '@/speech/reader';
import { getKv } from '@/sync/runtime';
import { DEFAULTS, effective, fitSettings, type Effective, type Settings, type SystemState } from './settings';

interface SettingsState {
  settings: Settings;
  effective: Effective;
  update: (change: Partial<Settings>) => void;
}

const fallback: SettingsState = {
  settings: DEFAULTS,
  effective: effective(DEFAULTS, { screenReader: false, reduceMotion: false }),
  update: () => undefined,
};

const SettingsContext = createContext<SettingsState>(fallback);

const keyFor = (studentId: string | null) => `settings:${studentId ?? 'phone'}`;

export function SettingsProvider({ studentId, children }: { studentId: string | null; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [system, setSystem] = useState<SystemState>({ screenReader: false, reduceMotion: false });

  // Each student on a shared phone has their own settings.
  useEffect(() => {
    let live = true;
    void getKv()
      .then((kv) => live && setSettings(fitSettings(kv.get(keyFor(studentId)))))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [studentId]);

  useEffect(() => {
    let live = true;
    void Promise.all([AccessibilityInfo.isScreenReaderEnabled(), AccessibilityInfo.isReduceMotionEnabled()])
      .then(([screenReader, reduceMotion]) => live && setSystem({ screenReader, reduceMotion }))
      .catch(() => undefined);
    const a = AccessibilityInfo.addEventListener('screenReaderChanged', (screenReader) =>
      setSystem((s) => ({ ...s, screenReader })),
    );
    const b = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduceMotion) =>
      setSystem((s) => ({ ...s, reduceMotion })),
    );
    return () => {
      live = false;
      a.remove();
      b.remove();
    };
  }, []);

  const now = useMemo(() => effective(settings, system), [settings, system]);
  useEffect(() => setReadingRate(now.speechRate), [now.speechRate]);

  const update = useCallback(
    (change: Partial<Settings>) => {
      setSettings((current) => {
        const next = fitSettings({ ...current, ...change });
        void getKv()
          .then((kv) => kv.set(keyFor(studentId), next))
          .catch(() => undefined);
        return next;
      });
    },
    [studentId],
  );

  const value = useMemo(() => ({ settings, effective: now, update }), [settings, now, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/** The settings in effect (defaults outside the provider, e.g. while the app starts). */
export function useSettings(): SettingsState {
  return useContext(SettingsContext);
}
