/** Isometric 2:1 projection helpers. */
export const TW = 64;
export const TH = 32;
export const HW = TW / 2;
export const HH = TH / 2;

export interface Pt { x: number; y: number }

/** Centre of tile (gx, gy) in map pixels. */
export const tileCenter = (gx: number, gy: number, ox: number, oy: number): Pt => ({
  x: ox + (gx - gy) * HW,
  y: oy + (gx + gy) * HH + HH,
});

export const diamond = (cx: number, cy: number, w = HW, h = HH) =>
  `M${cx} ${cy - h} L${cx + w} ${cy} L${cx} ${cy + h} L${cx - w} ${cy} Z`;

export const poly = (pts: Pt[]) => `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} Z`;

/** Linear interpolation between two points. */
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const up = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });

/** Mix a hex colour toward another (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
export const shade = (c: string, t: number) => (t >= 0 ? mix(c, '#FFFFFF', t) : mix(c, '#1A1020', -t));

/** Wall quad on the left (L→B) or right (B→R) face, from u0..u1 along, v0..v1 up. */
export function wallQuad(a: Pt, b: Pt, u0: number, u1: number, v0: number, v1: number) {
  const p0 = lerp(a, b, u0), p1 = lerp(a, b, u1);
  return poly([up(p0, v0), up(p1, v0), up(p1, v1), up(p0, v1)]);
}
