import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useApp } from './AppContext';

/**
 * Android back button. The most recently mounted handler runs first, so an open overlay handles Back before
 * the screen underneath. Return false to let older handlers run.
 */
export function useBack(fn: () => boolean | void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => ref.current() !== false);
    return () => sub.remove();
  }, []);
}

export function useMusic(name: string | null | undefined) {
  const app = useApp();
  useEffect(() => {
    app.audio.playMusic(name);
  }, [app.audio, name]);
}

/** Run once when the screen mounts. */
export function useOnce(fn: () => void) {
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) {
      done.current = true;
      fn();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
