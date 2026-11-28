'use strict';
/**
 * Server-rendered SVG charts. Single-series charts use one validated hue
 * (--series-1); correct/incorrect markers use status colours AND shapes
 * (filled circle vs. cross) plus a legend, so colour is never the only cue.
 * Every mark carries data-tip for the hover/focus tooltip (public/app.js).
 */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Horizontal bar chart: categories down the side, one bar each, value labelled at the bar end. */
function hbar(items, { max, fmt = (v) => String(v), label = 'Chart', unit = '', width = 560, labelW = 128, valueW } = {}) {
  const rowH = 30, gap = 8, W = width;
  valueW = valueW ?? (items.some((i) => i.note) ? 140 : 44);
  const plotW = W - labelW - valueW;
  const top = Math.max(max ?? 0, ...items.map((i) => i.value), 1);
  const H = items.length * (rowH + gap) + 8;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const rows = items.map((it, i) => {
    const y = 4 + i * (rowH + gap);
    const w = Math.max(it.value > 0 ? 4 : 0, (it.value / top) * plotW);
    const tip = `${it.label}: ${fmt(it.value)}${unit}${it.note ? ` · ${it.note}` : ''}`;
    // 4px rounded data-end, square at the baseline.
    const r = Math.min(4, w);
    const bar = w > 0
      ? `<path d="M${labelW} ${y + 4} h${w - r} a${r} ${r} 0 0 1 ${r} ${r} v${rowH - 8 - 2 * r} a${r} ${r} 0 0 1 -${r} ${r} h-${w - r} z" class="bar"/>`
      : '';
    return `<g class="mark" tabindex="0" data-tip="${esc(tip)}">
      <rect x="0" y="${y}" width="${W}" height="${rowH}" class="hit"/>
      <text x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end" class="lbl">${esc(it.label)}</text>
      ${bar}
      <text x="${labelW + w + 8}" y="${y + rowH / 2 + 4}" class="val">${esc(fmt(it.value))}${esc(unit)}${it.note ? `<tspan class="note"> ${esc(it.note)}</tspan>` : ''}</text>
    </g>`;
  }).join('');
  const grid = ticks.map((t) => {
    const x = labelW + (t / top) * plotW;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${H - 4}" class="grid"/>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${grid}<line x1="${labelW}" y1="0" x2="${labelW}" y2="${H - 4}" class="axis"/>${rows}</svg>`;
}

/**
 * Staircase chart for one ability family: puzzle number (x) vs level presented (y).
 * 2px line; ≥8px markers; correct = filled circle (good), wrong first try = cross (critical).
 */
function staircase(points, { title }) {
  const W = 250, H = 132, padL = 28, padR = 10, padT = 22, padB = 22;
  const n = Math.max(points.length, 8);
  const x = (i) => padL + (i * (W - padL - padR)) / Math.max(1, n - 1);
  const y = (lvl) => padT + ((4 - lvl) * (H - padT - padB)) / 3;
  const grid = [1, 2, 3, 4].map((l) => `<line x1="${padL}" y1="${y(l)}" x2="${W - padR}" y2="${y(l)}" class="grid"/><text x="${padL - 8}" y="${y(l) + 4}" text-anchor="end" class="tick">L${l}</text>`).join('');
  const path = points.length > 1 ? `<path d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.level)}`).join(' ')}" class="line"/>` : '';
  const marks = points.map((p, i) => {
    const tip = `${title} · puzzle ${i + 1} (${p.itemId}): level ${p.level}, first try ${p.correct ? 'right' : 'wrong'}${p.measured ? '' : ' · not measured'}`;
    const cx = x(i), cy = y(p.level);
    const shape = p.correct
      ? `<circle cx="${cx}" cy="${cy}" r="5" class="ok"/>`
      : `<path d="M${cx - 4.5} ${cy - 4.5} L${cx + 4.5} ${cy + 4.5} M${cx + 4.5} ${cy - 4.5} L${cx - 4.5} ${cy + 4.5}" class="bad"/>`;
    return `<g class="mark" tabindex="0" data-tip="${esc(tip)}"><circle cx="${cx}" cy="${cy}" r="12" class="hit"/>${shape}</g>`;
  }).join('');
  const xt = Array.from({ length: n }, (_, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="tick">${i + 1}</text>`).join('');
  return `<figure class="mini"><figcaption>${esc(title)}</figcaption><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)} difficulty by puzzle">${grid}${xt}${path}${marks}</svg></figure>`;
}

module.exports = { hbar, staircase, esc };
