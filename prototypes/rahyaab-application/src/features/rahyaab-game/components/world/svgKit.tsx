/** Tiny SVG helpers mirroring game/ui/widgets.py (text anchors, stations, shadows) in world coordinates. */
import React from 'react';
import { Ellipse, G, Rect as SvgRect, Text as SvgText } from 'react-native-svg';
import { Rect } from '../../game-engine/rect';

export const c = (rgb: readonly number[], a?: number) => (a === undefined ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
export const TEXT = 'rgb(234,238,248)';
export const TEXT_DIM = 'rgb(150,160,186)';

type Anchor = 'topleft' | 'midtop' | 'center' | 'midbottom' | 'bottomleft' | 'midleft' | 'topright';

/** pygame-style anchored text; `size` is the desktop font size in pixels (world units). */
export function T({
  x,
  y,
  size,
  children,
  color = TEXT,
  anchor = 'topleft',
  bold = false,
}: {
  x: number;
  y: number;
  size: number;
  children: string;
  color?: string;
  anchor?: Anchor;
  bold?: boolean;
}) {
  const fs = size * 0.72; // pygame's default font renders smaller than its nominal size
  const textAnchor = anchor === 'midtop' || anchor === 'center' || anchor === 'midbottom' ? 'middle' : anchor === 'topright' ? 'end' : 'start';
  let by = y;
  if (anchor === 'topleft' || anchor === 'midtop' || anchor === 'topright') by = y + fs * 0.85;
  else if (anchor === 'center' || anchor === 'midleft') by = y + fs * 0.35;
  else if (anchor === 'midbottom' || anchor === 'bottomleft') by = y - fs * 0.15;
  return (
    <SvgText x={x} y={by} fontSize={fs} fill={color} textAnchor={textAnchor} fontWeight={bold ? 'bold' : 'normal'}>
      {children}
    </SvgText>
  );
}

export function wrapWords(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function Shadow({ x, y, r, alpha = 0.22 }: { x: number; y: number; r: number; alpha?: number }) {
  return <Ellipse cx={x} cy={y} rx={r} ry={r * 0.45} fill={`rgba(0,0,0,${alpha})`} />;
}

/** game/levels/common.py draw_station */
export function Station({ rect, label, color, size = 22 }: { rect: Rect; label: string; color: readonly number[]; size?: number }) {
  const maxChars = Math.max(4, Math.floor((rect.w - 8) / (size * 0.42)));
  const lines = wrapWords(label, maxChars);
  const lh = size - 4;
  const y0 = rect.centery - (lines.length * lh) / 2;
  return (
    <G>
      <Shadow x={rect.centerx} y={rect.bottom - 4} r={Math.max(10, rect.w / 6)} />
      <SvgRect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={10} fill={c(color)} stroke="rgb(20,22,30)" strokeWidth={3} />
      {lines.map((ln, i) => (
        <T key={i} x={rect.centerx} y={y0 + i * lh} size={size} anchor="midtop" bold>
          {ln}
        </T>
      ))}
    </G>
  );
}

export function GridLines({ step, color, w = 1100, h = 604 }: { step: number; color: string; w?: number; h?: number }) {
  const out: React.ReactElement[] = [];
  for (let x = 0; x < w; x += step) out.push(<SvgRect key={`x${x}`} x={x} y={0} width={1} height={h} fill={color} />);
  for (let y = 0; y < h; y += step) out.push(<SvgRect key={`y${y}`} x={0} y={y} width={w} height={1} fill={color} />);
  return <G>{out}</G>;
}

/** A filled bar like widgets.bar(): background track + fraction. */
export function WBar({ x, y, w, h, frac, color, radius = 6 }: { x: number; y: number; w: number; h: number; frac: number; color: string; radius?: number }) {
  const f = Math.max(0, Math.min(1, frac));
  return (
    <G>
      <SvgRect x={x} y={y} width={w} height={h} rx={radius} fill="rgb(36,42,62)" />
      {f > 0 ? <SvgRect x={x} y={y} width={Math.max(radius, w * f)} height={h} rx={radius} fill={color} /> : null}
    </G>
  );
}
