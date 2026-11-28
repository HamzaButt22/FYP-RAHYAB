import React from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { BuildingDef, Detail } from '@/game/world/buildings';
import { Pt, mix, poly, shade, up, wallQuad, lerp } from './iso';

const GREY = '#9C948C';
const W = 25; // half width of footprint
const D = 12.5; // half depth of footprint

interface Props { def: BuildingDef; stage: 0 | 1 | 2 | 3 | 4; cx: number; cy: number; season?: 1 | 2 | 3 | 4; night?: boolean }

/**
 * One building in isometric view at a given construction stage.
 * 0 damaged · 1 foundations · 2 walls going up + workers · 3 nearly done · 4 open
 */
export function Building({ def, stage, cx, cy, night }: Props) {
  const L: Pt = { x: cx - W, y: cy };
  const R: Pt = { x: cx + W, y: cy };
  const T: Pt = { x: cx, y: cy - D };
  const B: Pt = { x: cx, y: cy + D };
  const fullH = def.height;
  const hFactor = [0.55, 0.28, 0.7, 1, 1][stage];
  const h = def.roof === 'open' ? fullH * (stage === 0 ? 0.6 : stage === 1 ? 0.4 : 1) : fullH * hFactor;
  const damaged = stage === 0;
  const pal = damaged
    ? { wall: mix(def.palette.wall, GREY, 0.42), side: mix(def.palette.side, GREY, 0.45), roof: mix(def.palette.roof, GREY, 0.5), trim: mix(def.palette.trim, GREY, 0.4) }
    : def.palette;

  const wallL = poly([L, B, up(B, h), up(L, h)]);
  const wallR = poly([B, R, up(R, h), up(B, h)]);
  const top = poly([up(T, h), up(R, h), up(B, h), up(L, h)]);

  const shadow = <Ellipse cx={cx + 4} cy={cy + 3} rx={W + 8} ry={D + 5} fill="#000" opacity={0.13} />;

  if (stage === 1) {
    return (
      <G>
        {shadow}
        <Path d={poly([{ x: L.x - 3, y: L.y }, { x: T.x, y: T.y - 2 }, { x: R.x + 3, y: R.y }, { x: B.x, y: B.y + 2 }])} fill="#C9B9A0" />
        <Path d={wallL} fill={pal.wall} opacity={0.9} />
        <Path d={wallR} fill={pal.side} opacity={0.9} />
        <Path d={top} fill={shade(pal.wall, -0.15)} />
        {brickRows(L, B, h)}
        <Scaffold L={L} B={B} R={R} h={fullH * 0.8} />
        <MaterialPile x={cx + W - 4} y={cy + D - 2} />
        <Worker x={cx - 10} y={cy + 9} colour="#E9873A" />
      </G>
    );
  }

  return (
    <G>
      {shadow}
      {def.roof === 'open' ? (
        <OpenStructure def={def} L={L} R={R} T={T} B={B} h={h} pal={pal} stage={stage} />
      ) : (
        <G>
          <Path d={wallL} fill={pal.wall} />
          <Path d={wallR} fill={pal.side} />
          {/* plinth */}
          <Path d={wallQuad(L, B, 0, 1, 0, 4)} fill={shade(pal.wall, -0.25)} />
          <Path d={wallQuad(B, R, 0, 1, 0, 4)} fill={shade(pal.side, -0.25)} />
          {windows(L, B, R, h, pal, stage, night, def)}
          <Door B={B} R={R} pal={pal} arch={def.details.includes('arch')} />
          {stage >= 3 ? <Roof def={def} L={L} R={R} T={T} B={B} h={h} pal={pal} /> : <Path d={top} fill={shade(pal.wall, -0.12)} />}
          {damaged ? <Damage L={L} B={B} R={R} h={h} /> : null}
          {stage === 4 ? def.details.map((d) => <DetailArt key={d} d={d} L={L} B={B} R={R} T={T} h={h} pal={pal} />) : null}
          {stage === 4 ? <Sign L={L} B={B} h={h} colour={pal.roof} /> : null}
        </G>
      )}
      {stage === 2 ? <G><Scaffold L={L} B={B} R={R} h={fullH} /><Worker x={cx + 8} y={cy + 8} colour="#5B8DEF" /><Worker x={cx - 14} y={cy + 5} colour="#E2589B" /><MaterialPile x={cx - W + 2} y={cy + D} /></G> : null}
      {stage === 3 ? <Scaffold L={L} B={B} R={R} h={fullH} sideOnly /> : null}
      {damaged ? <Rubble x={cx + W - 6} y={cy + D} /> : null}
    </G>
  );
}

function brickRows(L: Pt, B: Pt, h: number) {
  const rows = [];
  for (let v = 4; v < h; v += 5) rows.push(<Path key={v} d={`M${L.x} ${L.y - v} L${B.x} ${B.y - v}`} stroke="#00000022" strokeWidth={1} />);
  return <G>{rows}</G>;
}

function windows(L: Pt, B: Pt, R: Pt, h: number, pal: Props['def']['palette'], stage: number, night: boolean | undefined, def: BuildingDef) {
  if (h < 14) return null;
  const glass = stage === 0 ? '#5C5650' : night ? '#FFD87A' : '#BFE3F2';
  const rows = h > 34 ? [0.35, 0.72] : [0.5];
  const out: React.ReactNode[] = [];
  rows.forEach((r, ri) => {
    const v0 = h * r - 5, v1 = h * r + 4;
    [0.18, 0.55].forEach((u, i) => {
      out.push(<Path key={`l${ri}${i}`} d={wallQuad(L, B, u, u + 0.2, v0, v1)} fill={glass} stroke={pal.trim} strokeWidth={1.4} />);
    });
    if (!(ri === 0 && def.roof !== 'open')) {
      out.push(<Path key={`r${ri}`} d={wallQuad(B, R, 0.55, 0.78, v0, v1)} fill={glass} stroke={pal.trim} strokeWidth={1.4} />);
    } else {
      out.push(<Path key={`r${ri}b`} d={wallQuad(B, R, 0.62, 0.84, v0, v1)} fill={glass} stroke={pal.trim} strokeWidth={1.4} />);
    }
    if (stage === 0 && ri === 0) out.push(<Path key="crack" d={wallQuad(L, B, 0.2, 0.36, v0, v1)} fill="#3B3632" />);
  });
  return <G>{out}</G>;
}

function Door({ B, R, pal, arch }: { B: Pt; R: Pt; pal: Props['def']['palette']; arch: boolean }) {
  const a = lerp(B, R, 0.14), b = lerp(B, R, 0.36);
  const hgt = 13;
  const d = arch
    ? `M${a.x} ${a.y} L${a.x} ${a.y - hgt + 3} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - hgt - 4} ${b.x} ${b.y - hgt + 3} L${b.x} ${b.y} Z`
    : poly([a, b, up(b, hgt), up(a, hgt)]);
  return <Path d={d} fill={shade(pal.roof, -0.2)} stroke={pal.trim} strokeWidth={1.4} />;
}

function Roof({ def, L, R, T, B, h, pal }: { def: BuildingDef; L: Pt; R: Pt; T: Pt; B: Pt; h: number; pal: Props['def']['palette'] }) {
  const tL = up(L, h), tR = up(R, h), tT = up(T, h), tB = up(B, h);
  if (def.roof === 'sloped') {
    const apex = up({ x: B.x, y: (T.y + B.y) / 2 }, h + 18);
    const eave = 3;
    return (
      <G>
        <Path d={poly([{ x: tL.x - eave, y: tL.y + 1 }, { x: tB.x, y: tB.y + eave }, apex])} fill={pal.roof} />
        <Path d={poly([{ x: tB.x, y: tB.y + eave }, { x: tR.x + eave, y: tR.y + 1 }, apex])} fill={shade(pal.roof, -0.2)} />
        <Path d={`M${tL.x - eave} ${tL.y + 1} L${tB.x} ${tB.y + eave} L${tR.x + eave} ${tR.y + 1}`} stroke={shade(pal.roof, -0.35)} strokeWidth={1.5} fill="none" />
      </G>
    );
  }
  const roofTop = <Path d={poly([tT, tR, tB, tL])} fill={shade(pal.roof, 0.15)} />;
  const rim = (k: number) => (
    <G>
      <Path d={poly([tL, tB, up(tB, k), up(tL, k)])} fill={pal.trim} />
      <Path d={poly([tB, tR, up(tR, k), up(tB, k)])} fill={shade(pal.trim, -0.12)} />
    </G>
  );
  if (def.roof === 'parapet') return <G>{roofTop}<Path d={poly([lerp(tT, tB, 0.15), lerp(tR, tL, 0.15), lerp(tB, tT, 0.15), lerp(tL, tR, 0.15)])} fill={shade(pal.roof, -0.05)} />{rim(4)}</G>;
  if (def.roof === 'tower') {
    const c = { x: tB.x, y: (tT.y + tB.y) / 2 };
    const w = 9, d = 4.5, th = 16;
    const l = { x: c.x - w, y: c.y }, r = { x: c.x + w, y: c.y }, b = { x: c.x, y: c.y + d }, t = { x: c.x, y: c.y - d };
    return (
      <G>
        {roofTop}{rim(3)}
        <Path d={poly([l, b, up(b, th), up(l, th)])} fill={pal.wall} />
        <Path d={poly([b, r, up(r, th), up(b, th)])} fill={pal.side} />
        <Path d={poly([up(t, th), up(r, th), up(b, th), up(l, th)])} fill={pal.roof} />
        <Path d={poly([up(l, th), up(b, th), up({ x: c.x, y: c.y }, th + 9)])} fill={pal.roof} />
        <Path d={poly([up(b, th), up(r, th), up({ x: c.x, y: c.y }, th + 9)])} fill={shade(pal.roof, -0.2)} />
      </G>
    );
  }
  if (def.roof === 'awning') {
    return <G>{roofTop}{rim(2)}</G>;
  }
  return <G>{roofTop}{rim(2)}</G>;
}

function OpenStructure({ def, L, R, T, B, h, pal, stage }: { def: BuildingDef; L: Pt; R: Pt; T: Pt; B: Pt; h: number; pal: Props['def']['palette']; stage: number }) {
  if (def.details.includes('mural')) {
    // a long freestanding painted wall
    const a = lerp(L, B, 0.05), b = lerp(B, R, 0.95);
    const mid = B;
    const paint = stage >= 4;
    return (
      <G>
        <Path d={poly([a, mid, up(mid, h), up(a, h)])} fill={pal.wall} />
        <Path d={poly([mid, b, up(b, h), up(mid, h)])} fill={pal.side} />
        <Path d={poly([up(a, h), up(mid, h), up(mid, h + 3), up(a, h + 3)])} fill={pal.trim} />
        <Path d={poly([up(mid, h), up(b, h), up(b, h + 3), up(mid, h + 3)])} fill={shade(pal.trim, -0.1)} />
        {paint ? (
          <G>
            <Path d={wallQuad(a, mid, 0.1, 0.45, 3, h - 3)} fill="#5B8DEF" />
            <Circle cx={lerp(a, mid, 0.3).x} cy={lerp(a, mid, 0.3).y - h * 0.55} r={4} fill="#FFD166" />
            <Path d={wallQuad(a, mid, 0.55, 0.9, 3, h * 0.5)} fill="#3FAE6A" />
            <Path d={wallQuad(mid, b, 0.1, 0.5, 3, h - 3)} fill="#E2589B" />
            <Path d={wallQuad(mid, b, 0.55, 0.9, 3, h * 0.6)} fill="#F4A340" />
          </G>
        ) : stage >= 2 ? <Path d={wallQuad(a, mid, 0.1, 0.4, 3, h * 0.6)} fill="#5B8DEF" opacity={0.5} /> : null}
      </G>
    );
  }
  // bridge / arch structure
  const deckH = Math.max(6, h * 0.6);
  const l2 = lerp(L, T, 0.3), r2 = lerp(R, B, 0.3);
  return (
    <G>
      <Path d={poly([up(l2, deckH), up(lerp(T, R, 0.3), deckH), up(r2, deckH), up(lerp(B, L, 0.3), deckH)])} fill={pal.roof} />
      <Path d={`M${l2.x} ${l2.y} Q${(l2.x + r2.x) / 2} ${(l2.y + r2.y) / 2 - deckH - 6} ${r2.x} ${r2.y}`} stroke={pal.wall} strokeWidth={5} fill="none" />
      <Path d={poly([lerp(B, L, 0.3), r2, up(r2, deckH), up(lerp(B, L, 0.3), deckH)])} fill={pal.side} />
      {stage >= 3 ? <Path d={`M${lerp(B, L, 0.3).x} ${lerp(B, L, 0.3).y - deckH - 5} L${r2.x} ${r2.y - deckH - 5}`} stroke={pal.trim} strokeWidth={2} /> : null}
      {stage === 0 ? <Path d={`M${(l2.x + r2.x) / 2 - 3} ${(l2.y + r2.y) / 2 - deckH} l5 6 l-4 4 l6 5`} stroke="#3B3632" strokeWidth={2} fill="none" /> : null}
    </G>
  );
}

function Damage({ L, B, R, h }: { L: Pt; B: Pt; R: Pt; h: number }) {
  const p = lerp(L, B, 0.7), q = lerp(B, R, 0.3);
  return (
    <G>
      <Path d={`M${p.x} ${p.y - h} l-3 6 l4 4 l-3 7`} stroke="#3B3632" strokeWidth={1.6} fill="none" />
      <Path d={`M${q.x} ${q.y - h + 2} l3 5 l-2 5 l4 6`} stroke="#3B3632" strokeWidth={1.6} fill="none" />
      <Path d={poly([up(lerp(L, B, 0.1), h), up(lerp(L, B, 0.4), h + 4), up(lerp(L, B, 0.55), h - 2)])} fill="#8B6F5A" />
    </G>
  );
}

function Rubble({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path d={`M${x - 6} ${y} l5 -4 l6 2 l3 4 z`} fill="#8E8378" />
      <Path d={`M${x + 2} ${y + 2} l4 -3 l5 1 l1 3 z`} fill="#A39787" />
      <Rect x={x - 2} y={y - 3} width={4} height={3} fill="#B9573E" transform={`rotate(20 ${x} ${y})`} />
    </G>
  );
}

function Scaffold({ L, B, R, h, sideOnly }: { L: Pt; B: Pt; R: Pt; h: number; sideOnly?: boolean }) {
  const pts = sideOnly ? [lerp(B, R, 0.1), lerp(B, R, 0.9)] : [lerp(L, B, 0.05), lerp(L, B, 0.95), lerp(B, R, 0.9)];
  const off = (p: Pt): Pt => ({ x: p.x + (p.x > B.x ? 3 : -3), y: p.y + 4 });
  const c = '#B07A3A';
  return (
    <G>
      {pts.map((p, i) => <Line key={i} x1={off(p).x} y1={off(p).y} x2={off(p).x} y2={off(p).y - h} stroke={c} strokeWidth={1.6} />)}
      {[0.35, 0.7].map((f) => (
        <Path key={f} d={`M${pts.map((p) => `${off(p).x} ${off(p).y - h * f}`).join(' L')}`} stroke={c} strokeWidth={2.2} fill="none" />
      ))}
    </G>
  );
}

function MaterialPile({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path d={`M${x - 7} ${y} l7 -3.5 l7 3.5 l-7 3.5z`} fill="#C1563C" />
      <Path d={`M${x - 7} ${y} l0 -4 l7 -3.5 l7 3.5 l0 4 l-7 -3.5z`} fill="#D9694D" opacity={0.9} />
      <Path d={`M${x - 7} ${y - 4} l7 -3.5 l7 3.5 l-7 3.5z`} fill="#E58466" />
    </G>
  );
}

export function Worker({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 1} rx={4} ry={1.6} fill="#000" opacity={0.2} />
      <Rect x={x - 2.5} y={y - 9} width={5} height={8} rx={2} fill={colour} />
      <Circle cx={x} cy={y - 11.5} r={2.8} fill="#B98256" />
      <Path d={`M${x - 3.3} ${y - 12} a3.3 3 0 0 1 6.6 0 z`} fill="#FFD166" />
    </G>
  );
}

function Sign({ L, B, h, colour }: { L: Pt; B: Pt; h: number; colour: string }) {
  return <Path d={wallQuad(L, B, 0.25, 0.75, h - 7, h - 2)} fill={colour} stroke="#FFFFFF" strokeWidth={0.8} />;
}

function DetailArt({ d, L, B, R, T, h, pal }: { d: Detail; L: Pt; B: Pt; R: Pt; T: Pt; h: number; pal: Props['def']['palette'] }) {
  const tB = up(B, h), tT = up(T, h), tR = up(R, h);
  const roofC = { x: (tB.x + tT.x) / 2, y: (tB.y + tT.y) / 2 };
  switch (d) {
    case 'solar': {
      const a = lerp(tT, tR, 0.2), b = lerp(tT, tR, 0.75);
      return <G>{[0, 7].map((o) => <Path key={o} d={poly([{ x: a.x - 8 + o * 0.8, y: a.y + 4 + o * 0.6 }, { x: b.x - 8 + o * 0.8, y: b.y + 4 + o * 0.6 }, { x: b.x - 12 + o, y: b.y + 1 + o * 0.6 }, { x: a.x - 12 + o, y: a.y + 1 + o * 0.6 }])} fill="#2F4F7F" stroke="#9EC1F0" strokeWidth={0.8} />)}</G>;
    }
    case 'chimney': {
      const c = lerp(tT, tR, 0.55);
      return <G><Rect x={c.x - 3} y={c.y - 12} width={6} height={12} fill={shade(pal.roof, -0.2)} /><Rect x={c.x - 4} y={c.y - 14} width={8} height={3} fill={shade(pal.roof, -0.35)} /></G>;
    }
    case 'antenna':
      return <G><Line x1={roofC.x} y1={roofC.y} x2={roofC.x} y2={roofC.y - 26} stroke="#5D5468" strokeWidth={1.6} /><Line x1={roofC.x - 6} y1={roofC.y - 18} x2={roofC.x + 6} y2={roofC.y - 18} stroke="#5D5468" strokeWidth={1.4} /><Circle cx={roofC.x} cy={roofC.y - 27} r={2.2} fill="#E35D5D" /></G>;
    case 'anemometer':
      return <G><Line x1={roofC.x} y1={roofC.y - 20} x2={roofC.x} y2={roofC.y - 42} stroke="#5D5468" strokeWidth={1.6} /><Line x1={roofC.x - 7} y1={roofC.y - 42} x2={roofC.x + 7} y2={roofC.y - 42} stroke="#5D5468" strokeWidth={1.4} />{[-7, 7].map((o) => <Circle key={o} cx={roofC.x + o} cy={roofC.y - 42} r={2.3} fill="#F4A340" />)}</G>;
    case 'clock': {
      const p = up(lerp(B, R, 0.62), h * 0.72);
      return <G><Circle cx={p.x} cy={p.y} r={5.5} fill="#FFFBF3" stroke="#5D5468" strokeWidth={1.2} /><Line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 3.5} stroke="#2B2433" strokeWidth={1.2} /><Line x1={p.x} y1={p.y} x2={p.x + 2.5} y2={p.y} stroke="#2B2433" strokeWidth={1.2} /></G>;
    }
    case 'tank': {
      const c = lerp(roofC, tT, 0.3);
      return <G><Rect x={c.x - 5} y={c.y - 10} width={10} height={9} fill="#2B2433" /><Ellipse cx={c.x} cy={c.y - 10} rx={5} ry={2} fill="#4A4262" /></G>;
    }
    case 'flag': {
      const p = up(lerp(T, L, 0.2), h);
      return <G><Line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 22} stroke="#5D5468" strokeWidth={1.4} /><Path d={`M${p.x} ${p.y - 22} l12 3 l-12 4 z`} fill="#3FAE6A" /></G>;
    }
    case 'awning': {
      const a = up(lerp(B, R, 0.05), h * 0.52), b = up(lerp(B, R, 0.95), h * 0.52);
      const stripes = [];
      for (let i = 0; i < 6; i++) {
        const p0 = lerp(a, b, i / 6), p1 = lerp(a, b, (i + 1) / 6);
        stripes.push(<Path key={i} d={poly([p0, p1, { x: p1.x + 3, y: p1.y + 6 }, { x: p0.x + 3, y: p0.y + 6 }])} fill={i % 2 ? '#FFFFFF' : pal.roof} />);
      }
      return <G>{stripes}</G>;
    }
    case 'cross': {
      const p = up(lerp(L, B, 0.5), h * 0.85);
      return <G><Circle cx={p.x} cy={p.y} r={5.5} fill="#FFFFFF" stroke="#4E9F9A" strokeWidth={1.2} /><Path d={`M${p.x - 3} ${p.y} h6 M${p.x} ${p.y - 3} v6`} stroke="#4E9F9A" strokeWidth={2.2} /></G>;
    }
    case 'books': {
      const p = up(lerp(L, B, 0.5), h * 0.2);
      return <G>{['#E35D5D', '#5B8DEF', '#3FAE6A', '#FFD166'].map((col, i) => <Rect key={i} x={p.x - 8 + i * 4} y={p.y - 10} width={3.5} height={10} fill={col} />)}</G>;
    }
    case 'pipes': {
      const a = lerp(B, R, 0.95);
      return <G><Path d={`M${a.x + 2} ${a.y - 2} v${-h * 0.6} h6`} stroke="#5D7A8C" strokeWidth={3} fill="none" /><Circle cx={a.x + 2} cy={a.y - 2} r={2.5} fill="#3E5C76" /></G>;
    }
    case 'bus': {
      const p = { x: R.x + 6, y: R.y + 8 };
      return <G><Path d={`M${p.x - 12} ${p.y} l12 -6 l10 5 l-12 6z`} fill="#E3B23C" /><Path d={`M${p.x - 12} ${p.y} v-7 l12 -6 v7z`} fill="#F4C452" /><Path d={`M${p.x} ${p.y - 6} v-7 l10 5 v7z`} fill="#D9A02B" /></G>;
    }
    case 'mailbox': {
      const p = { x: R.x + 2, y: R.y + 6 };
      return <G><Rect x={p.x - 2.5} y={p.y - 12} width={5} height={12} rx={2} fill="#C0392B" /><Rect x={p.x - 2} y={p.y - 9} width={4} height={1.2} fill="#2B2433" /></G>;
    }
    case 'columns': {
      return <G>{[0.2, 0.45, 0.7].map((u) => { const p = lerp(B, R, u); return <Rect key={u} x={p.x - 1.5} y={p.y - h * 0.9} width={3} height={h * 0.9} fill="#FFFFFF" opacity={0.85} />; })}</G>;
    }
    case 'pot': {
      const p = { x: L.x + 2, y: L.y + 6 };
      return <G><Path d={`M${p.x - 4} ${p.y - 6} q4 9 8 0 z`} fill="#C1563C" /><Circle cx={p.x} cy={p.y - 9} r={4} fill="#3FAE6A" /></G>;
    }
    case 'easel': {
      const p = { x: L.x - 2, y: L.y + 8 };
      return <G><Path d={`M${p.x - 4} ${p.y} l4 -14 l4 14 M${p.x} ${p.y - 14} v14`} stroke="#8B5E3C" strokeWidth={1.3} fill="none" /><Rect x={p.x - 5} y={p.y - 15} width={10} height={8} fill="#FFFBF3" stroke="#8B5E3C" strokeWidth={0.8} /><Circle cx={p.x - 1} cy={p.y - 11} r={2} fill="#E2589B" /></G>;
    }
    case 'arch':
    case 'mural':
      return null;
  }
}
