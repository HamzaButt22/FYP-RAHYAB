/* Tiny dependency-free SVG chart helpers (works offline). */
const RY = (() => {
  const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  const TRAIT_NAME = {openness: "Openness", conscientiousness: "Conscientiousness", extraversion: "Extraversion",
    agreeableness: "Agreeableness", neuroticism: "Neuroticism"};
  const TRAIT_COLOR = {openness: "#a78bfa", conscientiousness: "#34d399", extraversion: "#fbbf24",
    agreeableness: "#f472b6", neuroticism: "#60a5fa"};
  const LEVEL_COLOR = {1: "#34d399", 2: "#fbbf24", 3: "#f472b6", 4: "#60a5fa"};
  const LEVEL_NAME = {1: "Valley", 2: "Workshop", 3: "Harbor", 4: "Vault"};

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const fmtDur = ms => { if (ms == null) return "n/a"; const s = Math.round(ms / 1000); return Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s"; };
  const pct = v => v == null ? "n/a" : Math.round(v * 100) + "%";
  const get = async url => { const r = await fetch(url); if (!r.ok) throw new Error(url + " -> " + r.status); return r.json(); };
  const post = async (url, body) => { const r = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body || {})}); return r.json(); };

  function hbars(el, items, opts = {}) {
    // items: [{label, value, color?}]
    if (!items.length) { el.innerHTML = '<div class="empty">No data yet</div>'; return; }
    const w = opts.width || 560, rowH = 26, left = opts.left || 170, right = 54;
    const max = opts.max || Math.max(...items.map(i => i.value), 1);
    const h = items.length * rowH + 6;
    let s = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%" role="img">`;
    items.forEach((it, i) => {
      const y = i * rowH + 3, bw = Math.max(0, (w - left - right) * it.value / max);
      s += `<text class="lab" x="${left - 8}" y="${y + 15}" text-anchor="end">${esc(it.label)}</text>`;
      s += `<rect x="${left}" y="${y + 3}" width="${w - left - right}" height="14" rx="7" fill="#10162b"/>`;
      s += `<rect x="${left}" y="${y + 3}" width="${bw}" height="14" rx="7" fill="${it.color || "#60a5fa"}"/>`;
      s += `<text x="${w - right + 8}" y="${y + 15}">${esc(opts.fmt ? opts.fmt(it.value) : it.value)}</text>`;
    });
    el.innerHTML = s + "</svg>";
  }

  function radar(el, scores) {
    const size = 300, c = size / 2, R = 105, n = TRAITS.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return [c + R * v * Math.cos(a), c + R * v * Math.sin(a)]; };
    let s = `<svg class="chart" viewBox="0 0 ${size} ${size}" width="100%" style="max-width:320px">`;
    [0.25, 0.5, 0.75, 1].forEach(r => { s += `<polygon points="${TRAITS.map((_, i) => pt(i, r).join(",")).join(" ")}" fill="none" stroke="#2b365f"/>`; });
    TRAITS.forEach((t, i) => { const [x, y] = pt(i, 1); s += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="#2b365f"/>`;
      const [lx, ly] = pt(i, 1.23); s += `<text class="lab" x="${lx}" y="${ly + 4}" text-anchor="middle">${TRAIT_NAME[t].slice(0, 5)}.</text>`; });
    s += `<polygon points="${TRAITS.map((t, i) => pt(i, (scores[t] || 0) / 100).join(",")).join(" ")}" fill="rgba(96,165,250,.28)" stroke="#60a5fa" stroke-width="2"/>`;
    TRAITS.forEach((t, i) => { const [x, y] = pt(i, (scores[t] || 0) / 100); s += `<circle cx="${x}" cy="${y}" r="4" fill="${TRAIT_COLOR[t]}"/>`; });
    el.innerHTML = s + "</svg>";
  }

  function dotPlot(el, decisions) {
    // decision time (s) vs session time, coloured by level
    const pts = decisions.filter(d => d.decision_time_ms != null);
    if (!pts.length) { el.innerHTML = '<div class="empty">No decisions recorded</div>'; return; }
    const w = 620, h = 240, L = 44, B = 28, T = 10, Rr = 12;
    const xmax = Math.max(...pts.map(p => p.t_s), 1), ymax = Math.max(...pts.map(p => p.decision_time_ms / 1000), 1);
    const X = v => L + (w - L - Rr) * v / xmax, Y = v => h - B - (h - B - T) * v / ymax;
    let s = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%">`;
    for (let i = 0; i <= 4; i++) { const v = ymax * i / 4, y = Y(v); s += `<line x1="${L}" x2="${w - Rr}" y1="${y}" y2="${y}" stroke="#222c4f"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${v.toFixed(1)}s</text>`; }
    for (let i = 0; i <= 5; i++) { const v = xmax * i / 5; s += `<text x="${X(v)}" y="${h - 8}" text-anchor="middle">${Math.round(v)}s</text>`; }
    pts.forEach(p => { s += `<circle cx="${X(p.t_s)}" cy="${Y(p.decision_time_ms / 1000)}" r="5" fill="${LEVEL_COLOR[p.level] || "#97a3c6"}" fill-opacity=".85"><title>${esc(p.action)} (${p.decision_time_ms} ms, level ${p.level})</title></circle>`; });
    el.innerHTML = s + "</svg>" + '<div class="legend">' + [1, 2, 3, 4].map(l => `<span><i style="background:${LEVEL_COLOR[l]}"></i>L${l} ${LEVEL_NAME[l]}</span>`).join("") + "</div>";
  }

  function heatmap(el, grid) {
    const rows = grid.length, cols = grid[0].length, cs = 44, w = cols * cs, h = rows * cs;
    const max = Math.max(...grid.flat(), 1);
    let s = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px">`;
    grid.forEach((r, y) => r.forEach((v, x) => {
      const a = v ? 0.18 + 0.8 * v / max : 0;
      s += `<rect x="${x * cs + 1}" y="${y * cs + 1}" width="${cs - 2}" height="${cs - 2}" rx="5" fill="${v ? `rgba(52,211,153,${a})` : "#10162b"}"><title>cell ${x},${y}: ${v} samples</title></rect>`;
    }));
    el.innerHTML = s + "</svg>";
  }

  function histogram(el, values, color) {
    if (!values.length) { el.innerHTML = '<div class="empty">No results yet</div>'; return; }
    const bins = new Array(10).fill(0); values.forEach(v => bins[Math.min(9, Math.floor(v / 10))]++);
    const w = 300, h = 90, bw = w / 10, max = Math.max(...bins, 1);
    let s = `<svg class="chart" viewBox="0 0 ${w} ${h + 18}" width="100%">`;
    bins.forEach((b, i) => { const bh = (h - 6) * b / max; s += `<rect x="${i * bw + 2}" y="${h - bh}" width="${bw - 4}" height="${bh}" rx="3" fill="${color}"><title>${i * 10}-${i * 10 + 9}: ${b}</title></rect>`; });
    s += `<text x="0" y="${h + 13}">0</text><text x="${w}" y="${h + 13}" text-anchor="end">100</text>`;
    el.innerHTML = s + "</svg>";
  }

  function traitBars(el, scores, labels) {
    el.innerHTML = TRAITS.map(t => {
      const v = scores[t]; const lab = labels ? labels[t] : null;
      return `<div class="trait"><b>${TRAIT_NAME[t]}</b><div class="bar"><i style="width:${v}%;background:${TRAIT_COLOR[t]}"></i></div><span>${Math.round(v)} ${lab ? `<span class="pill ${lab}">${lab}</span>` : ""}</span></div>`;
    }).join("");
  }

  return {TRAITS, TRAIT_NAME, TRAIT_COLOR, LEVEL_COLOR, esc, fmtDur, pct, get, post, hbars, radar, dotPlot, heatmap, histogram, traitBars};
})();

/* Renders the per-session telemetry panels (shared by the player page and the telemetry page). */
function renderTelemetry(root, t) {
  const E = RY.esc, kv = (k, v) => `<tr><td>${E(k)}</td><td><b>${E(v)}</b></td></tr>`;
  root.innerHTML = `
  <div class="grid g2">
    <div class="card"><h2>Event counts</h2><div id="t-events"></div></div>
    <div class="card"><h2>Decision times</h2><div id="t-dt"></div>
      <h3>Average decision time per level</h3><div id="t-dtl"></div></div>
    <div class="card"><h2>Exploration behavior</h2><h3>Level 1 map coverage (movement samples per 100px cell)</h3><div id="t-heat"></div>
      <h3>Optional areas</h3><div id="t-zones"></div></div>
    <div class="card"><h2>Risk behavior</h2><div id="t-risk"></div></div>
    <div class="card"><h2>Social behavior</h2><div id="t-social"></div></div>
    <div class="card"><h2>Level timeline</h2><div id="t-levels"></div>
      <h3>Data cleaning report</h3><div id="t-clean" class="small muted"></div></div>
  </div>`;
  const $ = id => root.querySelector("#" + id);
  const ec = Object.entries(t.event_counts || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({label: k, value: v}));
  RY.hbars($("t-events"), ec, {left: 190});
  RY.dotPlot($("t-dt"), t.decision_times || []);
  RY.hbars($("t-dtl"), Object.entries(t.avg_decision_time_by_level_ms || {}).map(([l, v]) => ({label: `L${l} ${RY.esc(({1:"Valley",2:"Workshop",3:"Harbor",4:"Vault"})[l])}`, value: v / 1000, color: RY.LEVEL_COLOR[l]})), {fmt: v => v.toFixed(1) + "s", left: 120});
  const ex = t.exploration || {};
  if (ex.heatmap) RY.heatmap($("t-heat"), ex.heatmap); else $("t-heat").innerHTML = '<div class="empty">No exploration data</div>';
  const zones = Object.entries(ex.zones || {});
  $("t-zones").innerHTML = zones.length ? `<table><tr><th>Area</th><th>Visits</th><th>Time inside</th></tr>${zones.map(([id, z]) => `<tr><td>${E(z.name)}</td><td>${z.visits}</td><td>${(z.dwell_ms / 1000).toFixed(1)}s</td></tr>`).join("")}</table>
    <p class="small muted">Unusual objects tried: ${(ex.novel_objects || []).length} (${E((ex.novel_objects || []).join(", ") || "none")})</p>` : '<div class="empty">No optional area visited</div>';
  const rk = t.risk || {}, kinds = rk.choices_by_kind || {};
  RY.hbars($("t-risk"), Object.entries(kinds).map(([k, v]) => ({label: "chose: " + k, value: v, color: k === "risky" ? "#f87171" : k === "safe" ? "#34d399" : "#60a5fa"})), {left: 130});
  $("t-risk").insertAdjacentHTML("beforeend", `<table style="margin-top:10px">${kv("Risky actions taken", (rk.risk_actions || []).length)}${kv("Failures (setbacks)", (rk.failures || []).length)}${kv("Lock scans / re-scans", `${rk.scans || 0} / ${rk.rechecks || 0}`)}</table>`);
  const so = t.social || {}, enc = so.encounters || [];
  $("t-social").innerHTML = enc.length ? `<table><tr><th>Villager</th><th>Started by</th><th>Outcome</th><th>Chat turns</th></tr>${enc.map(e => `<tr><td>${E(e.npc)}</td><td>${E(e.initiated_by)}</td><td>${E(e.outcome)}</td><td>${e.turns}</td></tr>`).join("")}</table>
    <p class="small muted">Help ${so.counts.help} - Share ${so.counts.share} - Cooperate ${so.counts.cooperate} - Compete ${so.counts.compete}</p>` : '<div class="empty">No social encounters</div>';
  $("t-levels").innerHTML = (t.levels || []).length ? `<table><tr><th>Level</th><th>Outcome</th><th>Duration</th></tr>${t.levels.map(l => `<tr><td>${l.level_id} ${E(l.name)}</td><td>${E(l.outcome)}</td><td>${l.duration_s}s</td></tr>`).join("")}</table>` : '<div class="empty">No levels</div>';
  const c = t.cleaning || {};
  $("t-clean").textContent = `rows in ${c.rows_in}, out ${c.rows_out}; dropped ${c.dropped_missing_fields || 0} incomplete, ${c.dropped_unknown_type || 0} unknown, ${c.dropped_duplicates || 0} duplicate; capped ${c.capped_decision_times || 0} decision times.`;
}
