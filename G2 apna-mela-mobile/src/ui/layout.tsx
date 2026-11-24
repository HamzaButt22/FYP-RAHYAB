/**
 * Resolution independence. Every screen is laid out in LOGICAL units on a canvas that is always at least
 * 1280 x 720 (the desktop design size). On a 20:9 phone the canvas is about 1600 x 720, so layouts use the
 * extra width instead of letterboxing. `s` converts logical units to device-independent pixels.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Layout {
  s: number; // dp per logical unit
  W: number; // logical width of the screen
  H: number; // logical height of the screen
  cx: number; // logical centre x
  cy: number;
  /** safe-area insets in logical units (camera cut-outs, gesture bar) */
  sl: number; sr: number; st: number; sb: number;
  /** left / right edges of the safe area, with a small margin */
  left: number; right: number;
  portrait: boolean;
  /** absolute box in logical units -> RN style */
  box: (x: number, y: number, w?: number, h?: number) => ViewStyle;
  /** like box() but relative to a positioned parent (no tablet centring offset) */
  rbox: (x: number, y: number, w?: number, h?: number) => ViewStyle;
  u: (n: number) => number;
}

const Ctx = createContext<Layout | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  const value = useMemo<Layout>(() => {
    const s = Math.max(0.2, Math.min(width / 1280, height / 720));
    const W = width / s;
    const H = height / s;
    const sl = ins.left / s, sr = ins.right / s, st = ins.top / s, sb = ins.bottom / s;
    const u = (n: number) => n * s;
    return {
      s, W, H, cx: W / 2, cy: H / 2, sl, sr, st, sb,
      left: Math.max(sl, 0) + 20,
      right: W - Math.max(sr, 0) - 20,
      portrait: height > width,
      u,
      // On screens taller than 16:9 (tablets) the 720-high design band is centred vertically.
      box: (x, y, w, h): ViewStyle => ({
        position: 'absolute', left: x * s, top: (y + Math.max(0, (H - 720) / 2)) * s,
        ...(w !== undefined ? { width: w * s } : null),
        ...(h !== undefined ? { height: h * s } : null),
      }),
      rbox: (x, y, w, h): ViewStyle => ({
        position: 'absolute', left: x * s, top: y * s,
        ...(w !== undefined ? { width: w * s } : null),
        ...(h !== undefined ? { height: h * s } : null),
      }),
    };
  }, [width, height, ins.left, ins.right, ins.top, ins.bottom]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useL(): Layout {
  const v = useContext(Ctx);
  if (!v) throw new Error('LayoutProvider missing');
  return v;
}
