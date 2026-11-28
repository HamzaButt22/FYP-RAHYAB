'use strict';
/** Turns stored device rows and events into view models for the dashboard. */

const TYPES = ['R', 'I', 'A', 'S', 'E', 'C'];
const TYPE_NAMES = { R: 'Builder', I: 'Investigator', A: 'Creator', S: 'Helper', E: 'Leader', C: 'Organiser' };
const TYPE_LONG = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
const FAMILIES = ['SPA', 'ABS', 'NUM', 'LOG', 'PLN', 'VRB'];
const FAMILY_NAMES = { SPA: 'Shapes & space', ABS: 'Patterns', NUM: 'Numbers', LOG: 'Clues & logic', PLN: 'Planning', VRB: 'Words' };
const CLUES = { high: 'Lots of clues', medium: 'Some clues', low: 'Few clues' };
const BANDS = { strong: 'Strong', steady: 'Steady', developing: 'Developing' };
const GROUPS = { science_biology: 'Science (Biology)', science_computer: 'Science (Computer)', humanities: 'Arts / Humanities', olevel: 'O-Levels', not_yet: 'Not chosen yet' };
const STALE_DAYS = 10;
const PATH_SHORT = { fsc_pre_medical: 'Pre-Medical', fsc_pre_engineering: 'Pre-Engineering', ics: 'ICS', icom: 'I.Com', fa: 'FA', olevel_alevel: 'A-Levels', dae: 'DAE', dcom: 'D.Com', tevta_trades: 'Trades' };
const shortDate = (sql) => { const t = Date.parse(String(sql).replace(' ', 'T') + 'Z'); return Number.isFinite(t) ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }) : String(sql); };

const parse = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };

function daysSince(sqlTime) {
  const t = Date.parse(String(sqlTime).replace(' ', 'T') + 'Z');
  return Number.isFinite(t) ? (Date.now() - t) / 86400e3 : 0;
}

function status(d) {
  const p = d.progress, done = p.weeksCompleted || [];
  if (p.finished && d.student && d.results.recommendation) return { key: 'ready', text: 'Results ready', icon: 'ok' };
  if (p.finished) return { key: 'details', text: 'Waiting for study details', icon: 'warn' };
  if (daysSince(d.last_sync) > STALE_DAYS) return { key: 'stale', text: `No update for ${Math.floor(daysSince(d.last_sync))} days`, icon: 'alert' };
  const scored = done.filter((w) => w > 0).length;
  if (p.inSession && p.currentWeek !== null && p.currentWeek !== undefined) return { key: 'playing', text: p.currentWeek === 0 ? 'Playing the prologue' : `Playing week ${p.currentWeek}`, icon: 'clock' };
  if (scored) return { key: 'playing', text: `${scored} of 4 weeks done`, icon: 'clock' };
  if (done.includes(0)) return { key: 'playing', text: 'Prologue done', icon: 'clock' };
  return { key: 'joined', text: 'Joined', icon: 'clock' };
}

function device(row) {
  const d = {
    deviceId: row.device_id, roll: row.roll, nickname: row.nickname || '—', classId: row.class_id,
    progress: parse(row.progress, {}), results: parse(row.results, {}), student: parse(row.student, null), avatar: parse(row.avatar, null),
    appVersion: row.app_version, firstSeen: row.first_seen, last_sync: row.last_sync, archived: !!row.archived,
  };
  d.status = status(d);
  const ints = (d.results.interests || []).slice().sort((a, b) => b.theta - a.theta);
  d.topInterests = ints.slice(0, 3);
  d.hasInterestEvidence = (d.results.comparisons || 0) >= 8;
  d.rec = d.results.recommendation || null;
  d.weeksDone = (d.progress.weeksCompleted || []).filter((w) => w > 0).length;
  return d;
}

function classSummary(devices) {
  const active = devices.filter((d) => !d.archived);
  const topCount = Object.fromEntries(TYPES.map((t) => [t, 0]));
  for (const d of active) if (d.hasInterestEvidence && d.topInterests[0]) topCount[d.topInterests[0].category]++;
  const pathCount = {};
  for (const d of active) if (d.rec && d.rec.top[0]) { const k = PATH_SHORT[d.rec.top[0].id] || d.rec.top[0].name; pathCount[k] = (pathCount[k] || 0) + 1; }
  const funnel = [0, 1, 2, 3, 4].map((w) => active.filter((d) => (d.progress.weeksCompleted || []).includes(w)).length);
  const rolls = {};
  for (const d of active) rolls[d.roll] = (rolls[d.roll] || 0) + 1;
  return {
    total: active.length,
    finished: active.filter((d) => d.progress.finished).length,
    ready: active.filter((d) => d.status.key === 'ready').length,
    attention: active.filter((d) => d.status.key === 'stale' || d.status.key === 'details').length,
    avgWeeks: active.length ? active.reduce((s, d) => s + d.weeksDone, 0) / active.length : 0,
    topCount, pathCount, funnel,
    duplicateRolls: Object.keys(rolls).filter((r) => rolls[r] > 1).map(Number),
  };
}

/** Evidence detail for one student, rebuilt from the raw events. */
function evidence(events) {
  const measured = events.filter((e) => e.measured && e.week >= 1);
  const chosen = Object.fromEntries(TYPES.map((t) => [t, { shown: 0, chosen: 0 }]));
  const plans = [];
  const reactions = { loved: 0, okay: 0, meh: 0 };
  const stairs = Object.fromEntries(FAMILIES.map((f) => [f, []]));
  for (const e of events.filter((x) => x.week >= 1)) {
    const p = e.payload;
    if (e.type === 'task_result') stairs[p.family]?.push({ itemId: p.itemId, level: p.level, correct: !!p.firstAttemptCorrect, measured: !!e.measured, week: p.week });
  }
  for (const e of measured) {
    const p = e.payload;
    if (e.type === 'choice_made') { for (const t of p.presented) chosen[t].shown++; chosen[p.chosen].chosen++; }
    if (e.type === 'plan_committed') plans.push({ week: p.week, ranked: p.ranked });
    if (e.type === 'reaction') reactions[p.value]++;
  }
  return { chosen, plans: plans.sort((a, b) => a.week - b.week), reactions, stairs, eventCount: events.length, measuredCount: measured.length };
}

const CSV_HEAD = ['roll', 'nickname', 'status', 'weeks_completed', 'measured_weeks', 'top_interest_1', 'top_interest_2', 'top_interest_3',
  ...TYPES.map((t) => `interest_${TYPE_NAMES[t].toLowerCase()}_pct`), ...FAMILIES.map((f) => `ability_${f.toLowerCase()}`),
  'path_1', 'path_2', 'path_3', 'plan_b', 'evidence', 'repeat_consistency', 'class_level', 'matric_group', 'last_update_utc'];

function csvRow(d) {
  const rel = Object.fromEntries((d.results.interests || []).map((i) => [i.category, i.relative]));
  const ab = Object.fromEntries((d.results.abilities || []).map((a) => [a.family, a.items ? a.band : '']));
  const c = d.results.consistency?.rate;
  return [d.roll, d.nickname, d.status.text, d.weeksDone, d.progress.measuredWeeks ?? '',
    ...[0, 1, 2].map((i) => (d.hasInterestEvidence && d.topInterests[i] ? TYPE_NAMES[d.topInterests[i].category] : '')),
    ...TYPES.map((t) => rel[t] ?? ''), ...FAMILIES.map((f) => ab[f] ?? ''),
    ...[0, 1, 2].map((i) => d.rec?.top[i]?.name ?? ''), d.rec?.planB?.name ?? '', d.rec ? CLUES[d.rec.confidence] : '',
    c === null || c === undefined ? '' : Math.round(c * 100) + '%', d.student?.classLevel ?? '', d.student ? GROUPS[d.student.matricGroup] : '', d.last_sync];
}

const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = "'" + s; // spreadsheet formula injection guard
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

module.exports = { PATH_SHORT, shortDate, TYPES, TYPE_NAMES, TYPE_LONG, FAMILIES, FAMILY_NAMES, CLUES, BANDS, GROUPS, device, classSummary, evidence, CSV_HEAD, csvRow, toCsv };
