/**
 * Screen orientation for the game. Valley Explorer plays in landscape by default (wider view of the world,
 * thumbs on both sides); students can switch to portrait with the rotate button in the valley.
 * The host app's previous orientation lock is restored when the game closes.
 */
import { useEffect, useRef } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export type GameOrientation = 'landscape' | 'portrait';

const LOCKS: Record<GameOrientation, ScreenOrientation.OrientationLock> = {
  landscape: ScreenOrientation.OrientationLock.LANDSCAPE,
  portrait: ScreenOrientation.OrientationLock.PORTRAIT_UP,
};

export function useGameOrientation(mode: GameOrientation) {
  const previous = useRef<ScreenOrientation.OrientationLock | null>(null);
  useEffect(() => {
    let alive = true;
    ScreenOrientation.getOrientationLockAsync()
      .then((l) => { if (alive && previous.current === null) previous.current = l; })
      .catch(() => {});
    return () => {
      alive = false;
      const back = previous.current ?? ScreenOrientation.OrientationLock.DEFAULT;
      ScreenOrientation.lockAsync(back).catch(() => {});
    };
  }, []);
  useEffect(() => {
    // not supported everywhere (e.g. some browsers); the layout adapts to whatever the screen is
    ScreenOrientation.lockAsync(LOCKS[mode]).catch(() => {});
  }, [mode]);
}
