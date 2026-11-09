// Radar (spider) chart geometry: n axes, the first pointing up, going clockwise; score 0 = centre, 100 = edge.
export function radarPoints(scores, cx, cy, r) {
  const n = scores.length;
  return scores.map((s, k) => {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
    const d = (Math.max(0, Math.min(100, s ?? 0)) / 100) * r;
    return {x: cx + d * Math.cos(a), y: cy + d * Math.sin(a)};
  });
}
