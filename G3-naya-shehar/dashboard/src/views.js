'use strict';
const { hbar, staircase, esc } = require('./charts');
const R = require('./report');

const ICON = {
  ok: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--good)"/><path d="M4.5 8.2l2.3 2.3 4.7-4.8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l7 12.5H1z" fill="var(--warning)"/><path d="M8 6v4M8 12v.5" stroke="#3A2207" stroke-width="2" stroke-linecap="round"/></svg>',
  alert: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--critical)"/><path d="M8 4.5v4.5M8 11v.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--text-secondary)" stroke-width="1.8"/><path d="M8 4.5V8l2.5 1.5" stroke="var(--text-secondary)" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
};
const statusHtml = (s) => `<span class="status">${ICON[s.icon]}${esc(s.text)}</span>`;
const dots = (d) => `<span class="dots" aria-label="${d.weeksDone} of 4 weeks complete">${[1, 2, 3, 4].map((w) => {
  const done = (d.progress.weeksCompleted || []).includes(w);
  const un = (d.progress.unmeasuredWeeks || []).includes(w);
  return `<i class="${done ? (un ? 'u' : 'd') : ''}" title="Week ${w}${done ? (un ? ': done, not measured' : ': done') : ''}"></i>`;
}).join('')}</span>`;

function layout({ title, user, csrf, body, active }) {
  const nav = user ? `<nav class="no-print">
      <a href="/classes" class="${active === 'classes' ? 'on' : ''}">Classes</a>
      ${user.role === 'admin' ? `<a href="/admin/users" class="${active === 'users' ? 'on' : ''}">Teachers</a>` : ''}
      <span class="faint" style="color:var(--brand-ink);padding:0 8px">${esc(user.name)}</span>
      <form method="post" action="/logout" style="margin:0"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button type="submit">Log out</button></form>
    </nav>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Naya Shehar Dashboard</title><link rel="icon" href="/static/logo.png"><link rel="stylesheet" href="/static/styles.css"></head>
<body><header class="top"><div class="in"><a class="brand" href="/classes"><img src="/static/logo.png" alt="">Naya Shehar <span style="font-size:14px;font-family:Nunito;font-weight:700;color:var(--brand-ink);text-shadow:none">Results dashboard</span></a>${nav}</div></header>
<main>${body}</main><script src="/static/app.js"></script></body></html>`;
}

function login({ error, next }) {
  return layout({ title: 'Log in', body: `<div class="login"><div class="card stack">
    <h1>Teacher log in</h1><p class="muted">See your students' Naya Shehar progress and career guidance results.</p>
    ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ''}
    <form method="post" action="/login" class="stack">
      <input type="hidden" name="next" value="${esc(next || '')}">
      <label class="f">Username<input name="username" autocomplete="username" required autofocus></label>
      <label class="f">Password<input name="password" type="password" autocomplete="current-password" required></label>
      <button class="btn" type="submit">Log in</button>
    </form></div></div>` });
}

function classes({ user, csrf, rows, teachers, created }) {
  const list = rows.length ? `<div class="tablewrap"><table class="data"><thead><tr><th>Class</th><th>Class code</th>${user.role === 'admin' ? '<th>Teacher</th>' : ''}<th class="num">Students</th><th class="num">Finished</th><th class="num">Results ready</th><th></th></tr></thead><tbody>
    ${rows.map((c) => `<tr class="link" data-href="/classes/${c.id}"><td><a href="/classes/${c.id}"><b>${esc(c.name)}</b></a>${c.school ? `<div class="faint">${esc(c.school)}</div>` : ''}</td>
      <td><span class="code">${esc(c.code)}</span></td>${user.role === 'admin' ? `<td>${esc(c.teacher)}</td>` : ''}
      <td class="num">${c.students}</td><td class="num">${c.finished}</td><td class="num">${c.ready}</td><td><a class="btn small ghost" href="/classes/${c.id}">Open</a></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">No classes yet. Create one below and give its code to your students.</p>';
  return layout({ title: 'Classes', user, csrf, active: 'classes', body: `
    <div class="head"><div class="grow"><h1>Your classes</h1><p class="muted">Students join a class in the game with its 6-digit code and their roll number.</p></div></div>
    ${created ? `<div class="banner ok" role="status">${ICON.ok}<div>Class created. Its code is <span class="code">${esc(created)}</span>. Give this code to your students.</div></div>` : ''}
    <div class="card">${list}</div>
    <div class="card" style="margin-top:16px"><h2>Create a class</h2>
      <form method="post" action="/classes" class="inline"><input type="hidden" name="_csrf" value="${esc(csrf)}">
        <label class="f">Class name<input name="name" required maxlength="60" placeholder="e.g. 9 Blue"></label>
        <label class="f">School (optional)<input name="school" maxlength="80" placeholder="Govt. High School, Rawalpindi"></label>
        ${user.role === 'admin' ? `<label class="f">Teacher<select name="teacher_id">${teachers.map((t) => `<option value="${t.id}" ${t.id === user.id ? 'selected' : ''}>${esc(t.display_name)}</option>`).join('')}</select></label>` : ''}
        <button class="btn" type="submit">Create class</button></form></div>` });
}

function classView({ user, csrf, cls, devices, filter }) {
  const sum = R.classSummary(devices);
  const shown = devices.filter((d) => !d.archived).filter((d) => filter === 'ready' ? d.status.key === 'ready' : filter === 'playing' ? d.status.key === 'playing' || d.status.key === 'joined' : filter === 'attention' ? d.status.key === 'stale' || d.status.key === 'details' : true);
  const withEvidence = devices.filter((d) => !d.archived && d.hasInterestEvidence).length;
  const interestChart = withEvidence
    ? hbar(R.TYPES.map((t) => ({ label: R.TYPE_NAMES[t], value: sum.topCount[t] })), { label: 'Strongest interest across the class', width: 340, labelW: 96 })
    : '<p class="muted">Appears once students have completed at least one week.</p>';
  const paths = Object.entries(sum.pathCount).sort((a, b) => b[1] - a[1]);
  const pathChart = paths.length ? hbar(paths.map(([k, v]) => ({ label: k, value: v })), { label: 'First suggested path', width: 340, labelW: 110 }) : '<p class="muted">Appears when students finish all four weeks.</p>';
  const funnel = hbar(['Prologue', 'Week 1', 'Week 2', 'Week 3', 'Week 4'].map((l, i) => ({ label: l, value: sum.funnel[i] })), { label: 'Students who completed each chapter', max: Math.max(1, sum.total), width: 340, labelW: 80 });
  const f = (k, l) => `<a class="btn small ${filter === k ? '' : 'ghost'}" href="/classes/${cls.id}${k ? `?show=${k}` : ''}">${l}</a>`;
  const rows = shown.sort((a, b) => a.roll - b.roll).map((d) => `<tr class="link" data-href="/students/${esc(d.deviceId)}">
      <td class="num"><a href="/students/${esc(d.deviceId)}"><b>${d.roll}</b></a>${sum.duplicateRolls.includes(d.roll) ? ' <span class="chip" title="Two phones use this roll number">2 phones</span>' : ''}</td>
      <td>${esc(d.nickname)}</td><td>${dots(d)}</td><td>${statusHtml(d.status)}</td>
      <td>${d.hasInterestEvidence ? d.topInterests.map((i, k) => `<span class="chip ${k === 0 ? 'lead' : ''}">${esc(R.TYPE_NAMES[i.category])}</span>`).join('') : '<span class="faint">Not enough yet</span>'}</td>
      <td>${d.rec?.top[0] ? esc(d.rec.top[0].name) : '<span class="faint">—</span>'}</td>
      <td class="faint" style="white-space:nowrap">${esc(R.shortDate(d.last_sync))}</td></tr>`).join('');
  return layout({ title: cls.name, user, csrf, active: 'classes', body: `
    <div class="crumbs"><a href="/classes">Classes</a> › ${esc(cls.name)}</div>
    <div class="head"><div class="grow"><h1>${esc(cls.name)}</h1><p class="muted">${esc(cls.school || '')}${cls.school ? ' · ' : ''}Class code <span class="code">${esc(cls.code)}</span> · Teacher: ${esc(cls.teacher)}</p></div>
      <a class="btn ghost no-print" href="/classes/${cls.id}/export.csv">Download CSV</a></div>
    <div class="tiles">
      <div class="tile"><div class="n">${sum.total}</div><div class="l">Students joined</div></div>
      <div class="tile"><div class="n">${sum.avgWeeks.toFixed(1)}</div><div class="l">Average weeks done (of 4)</div></div>
      <div class="tile"><div class="n">${sum.finished}</div><div class="l">Finished all 4 weeks</div></div>
      <div class="tile"><div class="n">${sum.ready}</div><div class="l">Results ready</div></div>
      <div class="tile"><div class="n">${sum.attention}</div><div class="l">Need attention</div></div>
    </div>
    <div class="grid3">
      <div class="card"><h2>Progress</h2><p class="faint">Students who completed each chapter</p>${funnel}</div>
      <div class="card"><h2>Strongest interest</h2><p class="faint">Students whose top interest is each type (${withEvidence} with enough evidence)</p>${interestChart}</div>
      <div class="card"><h2>First suggested path</h2><p class="faint">Among students with results ready</p>${pathChart}</div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="head" style="margin-bottom:10px"><div class="grow"><h2 style="margin:0">Students</h2></div>
        <div class="no-print" style="display:flex;gap:6px;flex-wrap:wrap">${f('', 'All')}${f('ready', 'Results ready')}${f('playing', 'In progress')}${f('attention', 'Need attention')}</div></div>
      ${rows ? `<div class="tablewrap"><table class="data"><thead><tr><th>Roll no.</th><th>Nickname</th><th>Weeks</th><th>Status</th><th>Top interests</th><th>First suggested path</th><th>Last update</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<p class="muted">${sum.total ? 'No students match this filter.' : `No students yet. Students join in the game: Settings › Join a class, code <span class="code">${esc(cls.code)}</span>.`}</p>`}
      <p class="faint">Weeks: filled = completed and measured · striped = completed in accessible mode (not measured) · empty = not done.</p>
    </div>` });
}

function student({ user, csrf, cls, d, ev }) {
  const p = d.progress, res = d.results;
  const ints = (res.interests || []).slice().sort((a, b) => b.theta - a.theta);
  const interestChart = hbar(ints.map((i) => ({ label: R.TYPE_NAMES[i.category], value: i.relative, note: R.CLUES[i.confidence] })), { label: 'Interest profile, relative strength', fmt: (v) => v, unit: '%', max: Math.max(...ints.map((i) => i.relative), 1) });
  const chapter = (w) => {
    const done = (p.weeksCompleted || []).includes(w);
    const now = p.inSession && p.currentWeek === w;
    const un = (p.unmeasuredWeeks || []).includes(w);
    return `<div class="st ${done ? 'done' : now ? 'now' : ''}"><b>${w === 0 ? 'Prologue' : `Week ${w}`}</b>${done ? `${ICON.ok.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} Done${un ? ' · not measured' : ''}` : now ? 'Playing now' : 'Not yet'}</div>`;
  };
  const path = (x, i, b) => x ? `<div class="path ${b ? 'b' : ''}"><div><span class="rk">${b ? 'B' : i + 1}</span><b>${esc(x.name)}</b> <span class="faint">${x.track === 'technical' ? 'Hands-on / technical route' : 'Academic route'}</span></div>
     <ul>${x.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
     ${x.eligibility?.status === 'needs_group' ? `<p class="faint" style="margin:6px 0 0">Needs Matric group: ${x.eligibility.groups.map((g) => esc(R.GROUPS[g] || g)).join(' or ')}</p>` : ''}</div>` : '';
  const stairs = R.FAMILIES.map((f) => staircase(ev.stairs[f], { title: R.FAMILY_NAMES[f] })).join('');
  const choiceRows = R.TYPES.map((t) => `<tr><td>${R.TYPE_NAMES[t]} <span class="faint">(${R.TYPE_LONG[t]})</span></td><td class="num">${ev.chosen[t].chosen} / ${ev.chosen[t].shown}</td><td class="num">${ev.chosen[t].shown ? Math.round((100 * ev.chosen[t].chosen) / ev.chosen[t].shown) + '%' : '—'}</td></tr>`).join('');
  const c = res.consistency;
  const banner = d.status.key === 'ready'
    ? `<div class="banner ok">${ICON.ok}<div><b>Results ready.</b> Based on ${p.measuredWeeks} of 4 measured weeks. Evidence overall: <b>${esc(R.CLUES[d.rec.confidence])}</b>.</div></div>`
    : `<div class="banner warn">${ICON.warn}<div><b>${esc(d.status.text)}.</b> ${p.finished ? 'The student needs to choose their class and Matric group in the game to see pathway suggestions.' : 'Everything below is provisional and will change as the student plays more weeks.'}</div></div>`;
  return layout({ title: `Roll ${d.roll}`, user, csrf, active: 'classes', body: `
    <div class="crumbs"><a href="/classes">Classes</a> › <a href="/classes/${cls.id}">${esc(cls.name)}</a> › Roll ${d.roll}</div>
    <div class="head"><div class="grow"><h1>Roll no. ${d.roll} · ${esc(d.nickname)}</h1>
      <p class="muted">${esc(cls.name)}${d.student ? ` · Class ${esc(d.student.classLevel)} · ${esc(R.GROUPS[d.student.matricGroup] || '')}` : ''} · Last update ${esc(R.shortDate(d.last_sync))} (Pakistan time)</p></div>
      <button class="btn ghost no-print" data-print>Print report</button></div>
    ${banner}
    <div class="card" style="margin-bottom:16px"><h2>Progress</h2><div class="timeline">${[0, 1, 2, 3, 4].map(chapter).join('')}</div>
      <p class="faint" style="margin:10px 0 0">${p.buildingsOpen ?? 0} buildings opened · ${p.homes ?? 0} homes rebuilt in their town${p.clockAnomalies ? ` · <b>${p.clockAnomalies} phone clock change(s) detected</b>` : ''}</p></div>
    <div class="grid2">
      <div class="card"><h2>Interests</h2><p class="faint">Relative strength of each interest compared with the student's other interests (not with other students). The note shows how much evidence there is.</p>
        ${res.comparisons ? interestChart : '<p class="muted">No measured choices yet.</p>'}
        <p class="faint">Repeated choices matched: ${c && c.rate !== null && c.rate !== undefined ? `${c.agreements} of ${c.repeatedPairs} (${Math.round(c.rate * 100)}%)` : 'not available yet'}</p>
        <details class="tbl"><summary>Show as table</summary><table class="data"><thead><tr><th>Interest</th><th class="num">Relative</th><th>Evidence</th><th class="num">Score (θ ± SE)</th></tr></thead><tbody>
          ${ints.map((i) => `<tr><td>${R.TYPE_NAMES[i.category]} <span class="faint">(${R.TYPE_LONG[i.category]})</span></td><td class="num">${i.relative}%</td><td>${esc(R.CLUES[i.confidence])}</td><td class="num">${i.theta.toFixed(2)} ± ${i.se.toFixed(2)}</td></tr>`).join('')}</tbody></table></details>
      </div>
      <div class="card"><h2>Suggested paths</h2>
        ${d.rec ? `${d.rec.top.map((x, i) => path(x, i)).join('')}${d.rec.planB ? `<h3 style="margin:14px 0 8px">Plan B</h3>${path(d.rec.planB, 0, true)}` : ''}
          ${d.rec.notes.map((n) => `<p class="faint">${esc(n)}</p>`).join('')}
          <p class="faint">${d.rec.unverifiedRules ? 'Admission rules in the game are a draft guide (version ' + esc(d.rec.rulesetVersion) + ') and have not been checked against this year’s official rules. Confirm with the BISE board or college.' : ''}</p>`
          : '<p class="muted">Pathway suggestions appear when the student finishes Week 4 and enters their class and Matric group.</p>'}
        ${(res.recap || []).length ? `<h3 style="margin:14px 0 6px">What the student was told</h3><ul>${res.recap.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      </div>
    </div>
    <div class="card" style="margin-top:16px"><h2>Puzzle strengths</h2>
      <div class="tablewrap"><table class="data"><thead><tr><th>Area</th><th>Result</th><th>Evidence</th><th class="num">First try right</th></tr></thead><tbody>
        ${(res.abilities || []).map((a) => `<tr><td>${esc(R.FAMILY_NAMES[a.family])}</td><td>${a.items ? `<b>${esc(R.BANDS[a.band])}</b>` : '<span class="faint">No puzzles yet</span>'}</td><td>${a.items ? esc(R.CLUES[a.confidence]) : ''}</td><td class="num">${a.firstAttemptCorrect} / ${a.items}</td></tr>`).join('')}
      </tbody></table></div>
      <h3 style="margin:16px 0 0">Difficulty path</h3>
      <div class="legend"><span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="var(--good)"/></svg>Right on first try (next one harder)</span><span><svg width="14" height="14"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="var(--critical)" stroke-width="2.5" stroke-linecap="round"/></svg>Wrong on first try (next one easier)</span><span>L1 easiest · L4 hardest</span></div>
      <div class="minis">${stairs}</div>
    </div>
    <div class="grid2" style="margin-top:16px">
      <div class="card"><h2>Choices made</h2><p class="faint">How often the student picked each kind of work when it was one of the two options (measured weeks only).</p>
        <table class="data"><thead><tr><th>Kind of work</th><th class="num">Picked / shown</th><th class="num">Rate</th></tr></thead><tbody>${choiceRows}</tbody></table></div>
      <div class="card"><h2>Weekly plans</h2><p class="faint">The three jobs the student chose to do first each week, in order.</p>
        ${ev.plans.length ? `<table class="data"><thead><tr><th>Week</th><th>1st</th><th>2nd</th><th>3rd</th></tr></thead><tbody>${ev.plans.map((pl) => `<tr><td>Week ${pl.week}</td>${pl.ranked.map((t) => `<td>${R.TYPE_NAMES[t]}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="muted">No plans yet.</p>'}
        <p class="faint">Optional reactions: Loved it ${ev.reactions.loved} · Okay ${ev.reactions.okay} · Meh ${ev.reactions.meh}</p>
        <p class="faint">${ev.eventCount} records received (${ev.measuredCount} measured) · app ${esc(d.appVersion || '')} · scoring ${esc(res.model || '')}</p></div>
    </div>
    <div class="card no-print" style="margin-top:16px"><h2>Manage</h2>
      <p class="faint">Archive hides this entry from the class (for example a duplicate after a student reinstalled the game). Nothing is deleted.</p>
      <form method="post" action="/students/${esc(d.deviceId)}/archive" data-confirm="${d.archived ? 'Restore this student to the class list?' : 'Hide this student from the class list?'}"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="btn ghost small" type="submit">${d.archived ? 'Restore' : 'Archive'}</button></form></div>
    <p class="faint">Results come from a game and are guidance only: not a test score, a diagnosis or a prediction. Discuss them with the student and their family.</p>` });
}

function users({ user, csrf, rows, msg }) {
  return layout({ title: 'Teachers', user, csrf, active: 'users', body: `
    <div class="head"><div class="grow"><h1>Teacher accounts</h1><p class="muted">Each teacher sees only their own classes. Admins see everything.</p></div></div>
    ${msg ? `<div class="banner ok" role="status">${ICON.ok}<div>${esc(msg)}</div></div>` : ''}
    <div class="card"><table class="data"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Classes</th><th>Reset password</th></tr></thead><tbody>
      ${rows.map((u) => `<tr><td><b>${esc(u.display_name)}</b></td><td>${esc(u.username)}</td><td>${esc(u.role)}</td><td class="num">${u.classes}</td>
        <td><form method="post" action="/admin/users/${u.id}/password" class="inline"><input type="hidden" name="_csrf" value="${esc(csrf)}"><input name="password" type="password" minlength="8" placeholder="New password" required style="min-width:140px"><button class="btn small ghost" type="submit">Set</button></form></td></tr>`).join('')}
    </tbody></table></div>
    <div class="card" style="margin-top:16px"><h2>Add a teacher</h2>
      <form method="post" action="/admin/users" class="inline"><input type="hidden" name="_csrf" value="${esc(csrf)}">
        <label class="f">Name<input name="display_name" required maxlength="60"></label>
        <label class="f">Username<input name="username" required maxlength="40" pattern="[A-Za-z0-9._-]+"></label>
        <label class="f">Password (8+ characters)<input name="password" type="password" minlength="8" required></label>
        <label class="f">Role<select name="role"><option value="teacher">Teacher</option><option value="admin">Admin</option></select></label>
        <button class="btn" type="submit">Add</button></form></div>` });
}

const notFound = (user, csrf) => layout({ title: 'Not found', user, csrf, body: '<div class="card"><h1>Not found</h1><p class="muted">This page does not exist, or you do not have access to it.</p><a class="btn" href="/classes">Back to classes</a></div>' });

module.exports = { layout, login, classes, classView, student, users, notFound };
