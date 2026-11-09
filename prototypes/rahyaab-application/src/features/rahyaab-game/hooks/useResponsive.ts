/** Screen metrics and the gameplay layout (world scale + where the controls go). */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORLD_H, WORLD_W } from '../game-engine/settings';

export interface PlayLayout {
  landscape: boolean;
  /** world -> screen scale (whole map always visible, like the desktop) */
  scale: number;
  worldW: number;
  worldH: number;
  hudH: number;
  /** width of each side control column in landscape (0 in portrait) */
  sideW: number;
  /** height of the control strip under the world in portrait (0 in landscape) */
  bottomH: number;
  insets: { top: number; bottom: number; left: number; right: number };
  width: number;
  height: number;
}

export const SIDE_COLUMN = 104;

export function computePlayLayout(width: number, height: number, insets: { top: number; bottom: number; left: number; right: number }): PlayLayout {
  const W = Math.max(1, width - insets.left - insets.right);
  const H = Math.max(1, height - insets.top - insets.bottom);
  const landscape = W > H;
  if (landscape) {
    const hudH = 46;
    // Controls get their own columns so they never cover any part of the map (map visibility is part of what
    // levels 1, 3 and 5 measure).
    const scale = Math.max(0.2, Math.min((W - 2 * SIDE_COLUMN) / WORLD_W, (H - hudH) / WORLD_H));
    return {
      landscape,
      scale,
      worldW: WORLD_W * scale,
      worldH: WORLD_H * scale,
      hudH,
      sideW: (W - WORLD_W * scale) / 2,
      bottomH: 0,
      insets,
      width,
      height,
    };
  }
  const hudH = 72;
  const bottomH = Math.min(220, Math.max(150, H * 0.3));
  const scale = Math.max(0.2, Math.min(W / WORLD_W, (H - hudH - bottomH) / WORLD_H));
  return { landscape, scale, worldW: WORLD_W * scale, worldH: WORLD_H * scale, hudH, sideW: 0, bottomH, insets, width, height };
}

export function usePlayLayout(): PlayLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return computePlayLayout(width, height, insets);
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => alive && setReduced(!!v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReduced(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}
