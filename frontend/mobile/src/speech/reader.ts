// The app's one reader (FR-96): the phone's own text-to-speech through expo-speech, in English. Nothing is
// sent to a server. Only one text is read at a time; tapping the same text again stops it; reading stops
// when the app goes to the background (Android cannot pause speech, so it stops). Screens show which
// sentence is being read through useReading().

import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { chooseVoice, sentences } from './sentences';

export type Reading = { id: string | null; index: number };
export type ToggleResult = 'started' | 'stopped' | 'no_voice' | 'no_audio';

const IDLE: Reading = { id: null, index: -1 };
let current: Reading = IDLE;
let run = 0; // each new reading gets a number; callbacks from an older reading are ignored
let voice: { voice: string | undefined } | null | undefined; // undefined: not checked yet
let rate = 0.9; // a little slower than normal, for younger readers; FR-97 makes it a setting
const listeners = new Set<(r: Reading) => void>();

function set(next: Reading): void {
  current = next;
  for (const l of listeners) l(next);
}

async function englishVoice(): Promise<{ voice: string | undefined } | null> {
  if (voice !== undefined) return voice;
  try {
    voice = chooseVoice(await Speech.getAvailableVoicesAsync());
  } catch {
    voice = { voice: undefined }; // the list is not available: try the default voice
  }
  return voice;
}

export function setReadingRate(next: number): void {
  rate = Math.min(Math.max(next, 0.5), 1.5);
}

export function stopReading(): void {
  run += 1;
  void Speech.stop();
  set(IDLE);
}

/** Reads `text` aloud as the reading called `id`, or stops it if that reading is already going. */
export async function toggleReading(id: string, text: string): Promise<ToggleResult> {
  if (current.id === id) {
    stopReading();
    return 'stopped';
  }
  stopReading();
  const chosen = await englishVoice();
  if (chosen === null) return 'no_voice';
  const parts = sentences(text);
  if (parts.length === 0) return 'no_audio';
  const mine = ++run;
  return new Promise<ToggleResult>((resolve) => {
    const speakFrom = (i: number) => {
      if (mine !== run) return;
      if (i >= parts.length) {
        set(IDLE);
        return;
      }
      set({ id, index: i });
      Speech.speak(parts[i], {
        language: 'en',
        voice: chosen.voice,
        rate,
        onStart: () => resolve('started'),
        onStopped: () => resolve('stopped'),
        onDone: () => speakFrom(i + 1),
        onError: () => {
          if (mine === run) set(IDLE);
          resolve('no_audio');
        },
      });
    };
    speakFrom(0);
  });
}

/** Which sentence of reading `id` is being read (-1: none). Re-renders when it changes. */
export function useReading(id: string): number {
  const [reading, setReading] = useState<Reading>(current);
  useEffect(() => {
    listeners.add(setReading);
    return () => {
      listeners.delete(setReading);
    };
  }, []);
  return reading.id === id ? reading.index : -1;
}

/** Put once in the root layout: stops reading when the app leaves the screen. */
export function useStopReadingInBackground(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopReading();
    });
    return () => sub.remove();
  }, []);
}
