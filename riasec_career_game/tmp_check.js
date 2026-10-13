
    const APP = document.getElementById('app');

    function getGameSvg(code, size = 42, white = true) {
      const color = white ? '#ffffff' : '#0f172a';
      const icons = {
        R: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 42V22l10-10h22v22l-10 10z"/><path d="M26 22l10 10 10-10"/><path d="M16 42l10-10 8 8 14-14"/><path d="M44 14v10h-10"/></g></svg>`,
        I: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="28" cy="28" r="15"/><path d="M38 38l12 12"/><path d="M20 16l8 8"/><path d="M14 42c3-6 7-9 14-9"/><path d="M40 18c5 2 9 7 10 13"/></g></svg>`,
        A: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 42l7-20 13 14 9-24 8 32z"/><path d="M18 42h30"/><path d="M25 18c3-2 6-3 10-3 4 0 8 1 12 4"/><path d="M14 50h36"/></g></svg>`,
        S: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="24" r="8"/><circle cx="42" cy="22" r="7"/><circle cx="32" cy="40" r="10"/><path d="M12 48c3-6 7-9 12-9s9 3 12 9"/><path d="M32 50c0-6 4-9 10-9s10 3 10 9"/></g></svg>`,
        E: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 18h28v28H18z"/><path d="M18 46l14-10 12 10"/><path d="M22 24h20"/><path d="M26 30h12"/><path d="M14 12l6 6"/><path d="M50 12l-6 6"/></g></svg>`,
        C: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 20h36v26H14z"/><path d="M20 20v-6h24v6"/><path d="M22 30h20"/><path d="M22 38h14"/><path d="M44 38h2"/></g></svg>`
      };
      return icons[code] || icons.R;
    }

    const GAME_INFO = {
      R: { title: 'Forge', color: '#f59e0b', label: 'Build', desc: 'Repair a system by balancing control and speed.' },
      I: { title: 'Signal Lab', color: '#38bdf8', label: 'Probe', desc: 'Test clues, search for patterns, and commit when the evidence is strong enough.' },
      A: { title: 'Studio', color: '#8b5cf6', label: 'Create', desc: 'Create without a single right answer; explore colour, rhythm, and composition.' },
      S: { title: 'Guide', color: '#22c55e', label: 'Support', desc: 'Support several people at once and keep things stable under pressure.' },
      E: { title: 'Market', color: '#ef4444', label: 'Lead', desc: 'Decide how much to risk before the reward disappears.' },
      C: { title: 'Queue', color: '#475569', label: 'Order', desc: 'Sort work into the right bins while keeping errors low and procedures consistent.' }
    };

    const DOMAIN_RULES = {
      R: { name: 'Realistic', weights: { performance: 0.35, persistence: 0.2, precision: 0.25, consistency: 0.2 } },
      I: { name: 'Investigative', weights: { performance: 0.3, exploration: 0.25, persistence: 0.2, precision: 0.25 } },
      A: { name: 'Artistic', weights: { performance: 0.3, exploration: 0.25, novelty: 0.25, persistence: 0.2 } },
      S: { name: 'Social', weights: { performance: 0.25, support: 0.35, consistency: 0.2, persistence: 0.2 } },
      E: { name: 'Enterprising', weights: { performance: 0.25, risk: 0.35, reward: 0.2, persistence: 0.2 } },
      C: { name: 'Conventional', weights: { performance: 0.3, precision: 0.3, consistency: 0.2, persistence: 0.2 } }
    };

    const state = {
      sessionId: '',
      consented: false,
      guardianConsent: false,
      under18: false,
      ageBand: '18-24',
      telemetry: [],
      startTime: 0,
      endTime: 0,
      timerMs: 900000,
      timeLeftMs: 900000,
      layout: [],
      currentScreen: 'consent',
      currentGame: null,
      gameMode: 'forced',
      activeGameTimer: null,
      activeGame: null,
      games: {
        R: { forcedPlayed: false, freePlays: 0, attempts: 0, score: 0, dwellMs: 0, returns: 0 },
        I: { forcedPlayed: false, freePlays: 0, attempts: 0, score: 0, dwellMs: 0, returns: 0 },
        A: { forcedPlayed: false, freePlays: 0, attempts: 0, score: 0, dwellMs: 0, returns: 0 },
        S: { forcedPlayed: false, freePlays: 0, attempts: 0, score: 0, dwellMs: 0, returns: 0 },
        E: { forcedPlayed: false, freePlays: 0, attempts: 0, score: 0, dwellMs: 0, returns: 0 },
        C: { forcedPlayed: false, freePlays: 0, attempts: 0, score: 0, dwellMs: 0, returns: 0 }
      },
      profile: null,
      report: null,
      sessionStart: 0
    };

    function uid() {
      return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'sess-' + Math.random().toString(36).slice(2, 10);
    }

    function logEvent(eventName, details = {}) {
      const payload = {
        event: eventName,
        session_id: state.sessionId,
        timestamp: new Date().toISOString(),
        monotonic_ms: Math.round(performance.now() - state.startTime),
        ...details
      };
      state.telemetry.push(payload);
      return payload;
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function calculateBehaviourMetrics(code) {
      const g = state.games[code];
      const events = state.telemetry.filter((evt) => evt.game === code);
      const inputEvents = events.filter((evt) => evt.event === 'input');
      const inputActions = inputEvents.map((evt) => evt.action || 'none');
      const totalActions = Math.max(inputActions.length, 1);
      const actionCounts = {};
      inputActions.forEach((action) => {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      const entropy = Object.values(actionCounts).reduce((sum, count) => {
        const p = count / totalActions;
        return sum - (p * Math.log2(p || 1));
      }, 0);
      const maxEntropy = Math.log2(Math.max(Object.keys(actionCounts).length, 1));

      const successEvents = events.filter((evt) => evt.event === 'game_end' && evt.reason === 'success').length;
      const failureEvents = events.filter((evt) => evt.event === 'game_end' && ['fail', 'burst', 'cashout', 'time_up'].includes(evt.reason)).length;
      const riskActions = inputActions.filter((action) => ['pump', 'cash_out', 'submit_rule', 'burst'].includes(action)).length;
      const dwellSeconds = (g.dwellMs || 0) / 1000;
      const persistenceIndex = clamp(((g.attempts || 0) * 20) + ((g.freePlays || 0) * 18) + (dwellSeconds / 12), 0, 100);
      const successRate = clamp((successEvents / Math.max(g.attempts || 1, 1)) * 100, 0, 100);
      const actionEntropy = clamp((entropy / Math.max(maxEntropy, 1)) * 100, 0, 100);
      const riskRatio = clamp((riskActions / totalActions) * 100, 0, 100);

      return {
        dwell_time: Number(dwellSeconds.toFixed(1)),
        action_entropy: Number(actionEntropy.toFixed(1)),
        success_rate: Number(successRate.toFixed(1)),
        risk_ratio: Number(riskRatio.toFixed(1)),
        persistence_index: Number(persistenceIndex.toFixed(1)),
        attempts: g.attempts || 0,
        freePlays: g.freePlays || 0,
        successEvents,
        failureEvents,
        riskActions,
        actionCount: totalActions
      };
    }

    function formatMs(ms) {
      const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function resetHubLayout() {
      state.layout = [...Object.keys(GAME_INFO)].sort(() => Math.random() - 0.5);
      logEvent('hub_layout', { layout: state.layout, game_order: state.layout });
    }

    function beginSession() {
      if (!state.consented) {
        alert('Please confirm consent before starting.');
        return;
      }
      if (state.under18 && !state.guardianConsent) {
        alert('Guardian consent is required for under-18 participants.');
        return;
      }
      state.sessionId = uid();
      state.startTime = performance.now();
      state.sessionStart = state.startTime;
      state.timeLeftMs = state.timerMs;
      resetHubLayout();
      state.currentScreen = 'hub';
      logEvent('session_start', { consent: true, age_band: state.ageBand, under18: state.under18, device: navigator.userAgent });
      render();
      tickSessionTimer();
    }

    function tickSessionTimer() {
      if (state.currentScreen !== 'hub' && state.currentScreen !== 'game') return;
      const remaining = state.timerMs - (performance.now() - state.startTime);
      state.timeLeftMs = Math.max(0, remaining);
      const timerEl = document.getElementById('session-timer');
      if (timerEl) timerEl.textContent = formatMs(state.timeLeftMs);
      if (state.timeLeftMs <= 0) {
        finishSession();
        return;
      }
      requestAnimationFrame(tickSessionTimer);
    }

    function enterGame(code) {
      const game = state.games[code];
      const forcedMode = !game.forcedPlayed;
      state.currentGame = code;
      state.gameMode = forcedMode ? 'forced' : 'free';
      state.activeGame = code;
      state.currentScreen = 'game';
      state.activeGameTimer = { startedAt: performance.now(), totalMs: forcedMode ? 45000 : 60000 };
      logEvent('game_enter', { game: code, mode: state.gameMode, total_ms: state.activeGameTimer.totalMs });
      render();
      startGameBoard(code, state.gameMode);
    }

    function leaveGame(code, reason = 'hub') {
      if (!state.activeGameTimer) return;
      const game = state.games[code];
      const dwellMs = performance.now() - state.activeGameTimer.startedAt;
      game.dwellMs += dwellMs;
      logEvent('game_exit', { game: code, mode: state.gameMode, reason, dwell_ms: dwellMs, score: game.score });
      state.currentScreen = 'hub';
      state.currentGame = null;
      state.activeGame = null;
      state.gameMode = 'free';
      render();
    }

    function updateGameScore(code, amount) {
      state.games[code].score = clamp(Math.round(amount), 0, 100);
    }

    function finishSession() {
      state.currentScreen = 'report';
      state.endTime = performance.now();
      logEvent('session_end', { reason: 'time_budget_expired' });
      buildReport();
      render();
    }

    function computeBehaviourProfile() {
      const byCode = state.games;
      const signals = {};

      for (const code of Object.keys(GAME_INFO)) {
        const g = byCode[code];
        const allEvents = state.telemetry.filter((evt) => evt.game === code);
        const inputEvents = allEvents.filter((evt) => evt.event === 'input');
        const inputActions = inputEvents.map((evt) => evt.action || 'none');
        const uniqueActions = new Set(inputActions).size;
        const successEvents = allEvents.filter((evt) => evt.event === 'game_end' && evt.reason === 'success').length;
        const failureEvents = allEvents.filter((evt) => evt.event === 'game_end' && ['fail', 'burst', 'cashout', 'time_up'].includes(evt.reason)).length;
        const supportActions = inputActions.filter((action) => ['cheer', 'tip', 'pause'].includes(action)).length;
        const pumpActions = inputActions.filter((action) => action === 'pump').length;
        const riskActions = inputActions.filter((action) => ['pump', 'cash_out', 'submit_rule', 'burst'].includes(action)).length;
        const totalActionCount = Math.max(inputActions.length, 1);
        const metrics = calculateBehaviourMetrics(code);

        const performance = clamp((g.score || 0) * 0.6 + (metrics.success_rate * 0.4), 0, 100);
        const persistence = clamp((metrics.persistence_index * 0.7) + ((g.attempts || 0) * 12 + (g.freePlays || 0) * 10 + (g.dwellMs || 0) / 9000) * 0.3, 0, 100);
        const exploration = clamp((metrics.action_entropy * 0.8) + ((uniqueActions / totalActionCount) * 100) * 0.2, 0, 100);
        const precision = clamp((metrics.success_rate * 0.75) + (100 - failureEvents * 18) * 0.25, 0, 100);
        const consistency = clamp((successEvents * 18) + (Math.max(0, (g.attempts || 0) - failureEvents) * 8) + (metrics.persistence_index * 0.2), 0, 100);
        const novelty = clamp((metrics.action_entropy * 0.65) + ((inputActions.length * 2.5) + (g.freePlays || 0) * 6) * 0.35, 0, 100);
        const support = clamp((supportActions * 22) + (metrics.persistence_index * 0.2) + (g.score || 0) * 0.18, 0, 100);
        const risk = clamp((metrics.risk_ratio * 0.8) + ((pumpActions * 18) + (riskActions * 9) + (g.score || 0) * 0.25) * 0.2, 0, 100);
        const reward = clamp((g.score || 0) * 0.65 + (metrics.success_rate * 0.35), 0, 100);

        const domainSignals = {
          performance,
          persistence,
          exploration,
          precision,
          consistency,
          novelty,
          support,
          risk,
          reward,
          attempts: g.attempts || 0,
          freePlays: g.freePlays || 0,
          successEvents,
          failureEvents,
          supportActions,
          pumpActions,
          metrics
        };

        signals[code] = domainSignals;
      }

      const profileMap = {};
      for (const code of Object.keys(GAME_INFO)) {
        const d = DOMAIN_RULES[code];
        const s = signals[code];
        const domainScore = clamp(
          (d.weights.performance * s.performance) +
          (d.weights.persistence * s.persistence) +
          (d.weights.exploration || 0) * s.exploration +
          (d.weights.precision || 0) * s.precision +
          (d.weights.consistency || 0) * s.consistency +
          (d.weights.novelty || 0) * s.novelty +
          (d.weights.support || 0) * s.support +
          (d.weights.risk || 0) * s.risk +
          (d.weights.reward || 0) * s.reward,
          0,
          100
        );
        profileMap[code] = Number(domainScore.toFixed(1));
      }

      return profileMap;
    }

    function buildReport() {
      const profileMap = computeBehaviourProfile();
      const ordered = Object.entries(profileMap).sort((a, b) => b[1] - a[1]);
      const metricsByCode = {};
      Object.keys(GAME_INFO).forEach((code) => {
        metricsByCode[code] = calculateBehaviourMetrics(code);
      });
      const topStrongest = ordered[0] ? ordered[0][0] : 'R';
      const secondStrongest = ordered[1] ? ordered[1][0] : 'I';
      const confidence = clamp(Math.round((ordered[0][1] + (ordered[1] ? ordered[1][1] : 0)) / 2), 0, 100);

      state.profile = ordered.map(([code, value]) => ({ code, label: GAME_INFO[code].label, value, metrics: metricsByCode[code] }));
      state.report = {
        top: ordered.slice(0, 3),
        all: ordered,
        metricsByCode,
        psychometricEstimate: {
          primary: GAME_INFO[topStrongest].title,
          secondary: GAME_INFO[secondStrongest].title,
          confidence,
          summary: 'Exploratory behavioural estimate based on measurable play patterns and score-weighted behaviour.'
        }
      };
      logEvent('report_generated', { profile: state.profile, scoring_model: 'research_oriented_riasec_prototype', metric_snapshot: metricsByCode, psychometric_estimate: state.report.psychometricEstimate });
    }

    function render() {
      if (state.currentScreen === 'consent') {
        APP.innerHTML = `
          <div class="screen">
            <div class="topbar">
              <div>
                <div class="muted">Arcade-style career exploration</div>
                <div class="title">Pattern Studio</div>
              </div>
              <div class="timer-badge">Session budget: 15:00</div>
            </div>
            <div class="consent-box">
              <p>This game logs gameplay behaviour and timing only. It does not ask multiple-choice career questions, and it does not reveal the underlying mapping in the interface.</p>
              <p>Data is kept on this device by default. No names or contact details are captured. The result is a lightweight exploratory profile and not a validated test, diagnosis, or employment tool.</p>
              <div class="field-row">
                <label><input type="checkbox" id="consent-check" /> I consent to play and to local logging.</label>
              </div>
              <div class="field-row">
                <label>Age band <select id="age-select"><option>Under 18</option><option selected>18-24</option><option>25-34</option><option>35-44</option><option>45+</option></select></label>
                <label><input type="checkbox" id="guardian-check" /> Guardian consent on file</label>
              </div>
            </div>
            <div class="controls" style="margin-top:18px;">
              <button class="button primary" id="start-btn">Start session</button>
            </div>
          </div>
        `;
        document.getElementById('start-btn').addEventListener('click', () => {
          state.consented = document.getElementById('consent-check').checked;
          state.under18 = document.getElementById('age-select').value === 'Under 18';
          state.guardianConsent = document.getElementById('guardian-check').checked;
          state.ageBand = document.getElementById('age-select').value;
          beginSession();
        });
        return;
      }

      if (state.currentScreen === 'hub') {
        APP.innerHTML = `
          <div class="screen">
            <div class="topbar">
              <div>
                <div class="muted">Free-choice hub</div>
                <div class="title">Choose a challenge</div>
              </div>
              <div class="timer-badge" id="session-timer">${formatMs(state.timeLeftMs)}</div>
            </div>
            <div class="hub-grid">
              ${state.layout.map((code) => {
                const game = state.games[code];
                const info = GAME_INFO[code];
                const done = game.forcedPlayed ? 'Completed warm-up' : 'Standard round available';
                return `
                  <div class="game-card">
                    <div class="game-card-header" style="background:linear-gradient(135deg, ${info.color}, rgba(15,23,42,0.7));">
                      <div class="icon-shell">${getGameSvg(code, 46, true)}</div>
                    </div>
                    <div class="game-card-body">
                      <div class="pill" style="background:${info.color};">${info.label}</div>
                      <h3>${info.title}</h3>
                      <p>${info.desc}</p>
                      <div class="actions">
                        <span class="status">${done}</span>
                        <button class="button accent" onclick="enterGame('${code}')">Play</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="controls" style="margin-top:22px; justify-content:space-between;">
              <button class="button secondary" onclick="finishSession()">View report</button>
            </div>
          </div>
        `;
        return;
      }

      if (state.currentScreen === 'game') {
        APP.innerHTML = `
          <div class="screen">
            <div class="game-shell">
              <div class="game-main">
                <div id="game-board"></div>
              </div>
              <div class="game-side" id="game-side"></div>
            </div>
          </div>
        `;
        return;
      }

      if (state.currentScreen === 'report') {
        const top = state.profile || [{ code: 'R', label: 'Build', value: 50, metrics: { dwell_time: 60, action_entropy: 50, success_rate: 52, risk_ratio: 41, persistence_index: 58 } }, { code: 'I', label: 'Probe', value: 45, metrics: { dwell_time: 55, action_entropy: 55, success_rate: 48, risk_ratio: 39, persistence_index: 52 } }, { code: 'A', label: 'Create', value: 40, metrics: { dwell_time: 50, action_entropy: 60, success_rate: 46, risk_ratio: 44, persistence_index: 47 } }];
        const estimate = state.report?.psychometricEstimate || {
          primary: 'Forge',
          secondary: 'Signal Lab',
          confidence: 62,
          summary: 'Exploratory behavioural estimate based on measurable play patterns and score-weighted behaviour.'
        };
        APP.innerHTML = `
          <div class="screen">
            <div class="topbar">
              <div>
                <div class="muted">Exploratory profile</div>
                <div class="title">Likely pattern mix</div>
              </div>
              <div class="timer-badge">Saved locally</div>
            </div>
            <div class="report-grid">
              ${top.map((item) => `
                <div class="report-tile">
                  <div class="muted">${GAME_INFO[item.code].title}</div>
                  <div class="value" style="color:${GAME_INFO[item.code].color};">${Math.round(item.value)}</div>
                  <div class="muted">${item.label}</div>
                </div>
              `).join('')}
            </div>
            <div class="consent-box" style="margin-top:20px;">
              <strong>Psychometric estimate</strong>
              <div style="margin-top:10px; font-weight:700;">Primary: ${estimate.primary}</div>
              <div>Secondary: ${estimate.secondary}</div>
              <div>Confidence: ${estimate.confidence}/100</div>
              <p style="margin-top:10px;">${estimate.summary}</p>
            </div>
            <div class="consent-box" style="margin-top:20px;">
              <strong>Behaviour metrics</strong>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:12px; margin-top:12px;">
                ${top.slice(0, 3).map((item) => `
                  <div class="metric-box">
                    <div class="muted">${GAME_INFO[item.code].title}</div>
                    <div><strong>${Math.round(item.value)}</strong></div>
                    <div class="muted">dwell: ${item.metrics?.dwell_time ?? 0}s</div>
                    <div class="muted">entropy: ${item.metrics?.action_entropy ?? 0}</div>
                    <div class="muted">success: ${item.metrics?.success_rate ?? 0}%</div>
                    <div class="muted">risk: ${item.metrics?.risk_ratio ?? 0}%</div>
                    <div class="muted">persistence: ${item.metrics?.persistence_index ?? 0}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="consent-box" style="margin-top:20px;">
              <strong>Top three:</strong>
              <ul class="list">
                ${top.slice(0,3).map((item) => `<li>${GAME_INFO[item.code].title} · ${item.label} · ${Math.round(item.value)}/100</li>`).join('')}
              </ul>
              <p>This is an exploratory behavioural measure derived from dwell time, action entropy, success rate, risk ratio, and persistence. It is not a validated psychometric instrument, clinical assessment, or employment diagnosis.</p>
            </div>
            <div class="controls" style="margin-top:18px;">
              <button class="button secondary" onclick="downloadTelemetry()">Download telemetry</button>
              <button class="button primary" onclick="state.currentScreen='hub'; render();">Return to hub</button>
            </div>
          </div>
        `;
      }
    }

    function updateScore(code, value) {
      const el = document.getElementById('game-score');
      if (el) el.textContent = Math.round(value);
      state.games[code].score = clamp(Math.round(value), 0, 100);
    }

    function startGameBoard(code, mode) {
      const board = document.getElementById('game-board');
      const side = document.getElementById('game-side');
      if (!board || !side) return;

      const meta = GAME_INFO[code];
      const game = state.games[code];
      game.attempts += 1;
      game.freePlays += mode === 'free' ? 1 : 0;
      if (mode === 'forced') {
        game.forcedPlayed = true;
      }

      const standardSummary = (mode === 'forced' ? 'Standard round' : 'Free round');
      board.innerHTML = `
        <div class="hud-row">
          <div>
            <div class="muted">${meta.title}</div>
            <div style="font-size:1.3rem; font-weight:800;">${standardSummary}</div>
          </div>
          <div class="timer-badge" id="game-countdown">${(mode === 'forced' ? 45 : 60)}s</div>
        </div>
        <div class="progress"><div id="game-progress" style="width:100%"></div></div>
      `;

      const sideContent = document.createElement('div');
      sideContent.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div><div class="muted">Current pattern</div><strong>${meta.label}</strong></div>
          <span class="pill" style="background:${meta.color};">${meta.title}</span>
        </div>
        <div style="margin-top:12px;" class="muted">Hover, tap, and keep making choices. Repeated returns are a stronger signal than a single perfect run.</div>
        <div style="margin-top:18px; font-weight:800;">Session score: <span id="game-score">0</span></div>
        <div class="controls" style="margin-top:8px;">
          <button class="button secondary" onclick="leaveGame('${code}', 'quit')">Quit game</button>
        </div>
      `;
      side.innerHTML = '';
      side.appendChild(sideContent);

      if (code === 'R') startForgeGame(code, mode, board, side);
      if (code === 'I') startSignalGame(code, mode, board, side);
      if (code === 'A') startStudioGame(code, mode, board, side);
      if (code === 'S') startGuideGame(code, mode, board, side);
      if (code === 'E') startMarketGame(code, mode, board, side);
      if (code === 'C') startQueueGame(code, mode, board, side);

      let start = performance.now();
      const duration = mode === 'forced' ? 45000 : 60000;
      function tickGameLoop() {
        const elapsed = performance.now() - start;
        const remaining = Math.max(0, duration - elapsed);
        const progress = (remaining / duration) * 100;
        const timerEl = document.getElementById('game-countdown');
        const progressBar = document.getElementById('game-progress');
        if (timerEl) timerEl.textContent = `${Math.ceil(remaining / 1000)}s`;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (remaining <= 0) {
          finishCurrentGame(code, 'time_up');
          return;
        }
        requestAnimationFrame(tickGameLoop);
      }
      requestAnimationFrame(tickGameLoop);
    }

    function finishCurrentGame(code, reason) {
      if (!state.activeGame) return;
      const thisGame = state.games[code];
      const score = Number(document.getElementById('game-score')?.textContent || thisGame.score || 0);
      thisGame.score = clamp(score, 0, 100);
      logEvent('game_end', { game: code, mode: state.gameMode, reason, score: thisGame.score, free_plays: thisGame.freePlays });
      state.activeGame = null;
      state.currentScreen = 'hub';
      if (state.timeLeftMs <= 0) { finishSession(); return; }
      render();
    }

    function startForgeGame(code, mode, board, side) {
      const pieces = [0, 1, 2, 3].map((_, idx) => ({ id: idx, rotation: idx * 90 }));
      const target = [90, 0, 180, 270];
      board.className = 'board';
      board.innerHTML = `
        <div class="board-grid" style="grid-template-columns: repeat(2, minmax(100px, 1fr));">
          ${pieces.map((p, idx) => `
            <div class="pipe-piece" data-id="${idx}" style="transform: rotate(${p.rotation}deg);">
              <span class="core"></span>
              <span class="line left"></span>
              <span class="line right"></span>
              <span class="line top"></span>
              <span class="line bottom"></span>
            </div>
          `).join('')}
        </div>
      `;
      board.querySelectorAll('.pipe-piece').forEach((item) => {
        item.addEventListener('click', () => {
          const id = Number(item.dataset.id);
          pieces[id].rotation = (pieces[id].rotation + 90) % 360;
          item.style.transform = `rotate(${pieces[id].rotation}deg)`;
          logEvent('input', { game: code, action: 'rotate_pipe', item_id: id, rotation: pieces[id].rotation });
          const matches = pieces.filter((p, idx) => p.rotation === target[idx]).length;
          const nextScore = Math.round((matches / pieces.length) * 100);
          updateScore(code, nextScore);
          if (matches === pieces.length) {
            finishCurrentGame(code, 'success');
          }
        });
      });
      updateScore(code, 60);
    }

    function startSignalGame(code, mode, board, side) {
      const samples = [
        { label: 'A', color: '#2563eb', shape: 'circle', size: 'big' },
        { label: 'B', color: '#f97316', shape: 'triangle', size: 'small' },
        { label: 'C', color: '#2563eb', shape: 'triangle', size: 'big' },
        { label: 'D', color: '#10b981', shape: 'circle', size: 'small' },
        { label: 'E', color: '#2563eb', shape: 'circle', size: 'small' },
        { label: 'F', color: '#ef4444', shape: 'triangle', size: 'big' },
        { label: 'G', color: '#2563eb', shape: 'triangle', size: 'small' },
        { label: 'H', color: '#fbbf24', shape: 'circle', size: 'big' }
      ];
      let tested = 0;
      board.className = 'board';
      board.innerHTML = `
        <div class="sample-cards">
          ${samples.map((sample) => `
            <div class="sample-card" data-label="${sample.label}">
              <strong>${sample.label}</strong>
              <div><span class="sample-dot" style="background:${sample.color};"></span>${sample.color}</div>
              <div>${sample.shape}</div>
              <div>${sample.size}</div>
            </div>
          `).join('')}
        </div>
      `;
      const options = ['contains blue', 'is a circle', 'is big', 'is blue and circle'];
      side.innerHTML = `
        <div><div class="muted">Rule in play</div><strong>Investigate the pattern carefully</strong></div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
          ${options.map((option) => `<button class="button secondary" data-choice="${option}" style="width:100%;">${option}</button>`).join('')}
        </div>
      `;
      board.querySelectorAll('.sample-card').forEach((card) => {
        card.addEventListener('click', () => {
          card.classList.add('selected');
          tested += 1;
          logEvent('input', { game: code, action: 'inspect_sample', sample: card.dataset.label, tested_count: tested });
          updateScore(code, clamp(40 + tested * 10, 0, 100));
        });
      });
      side.querySelectorAll('[data-choice]').forEach((button) => {
        button.addEventListener('click', () => {
          const choice = button.dataset.choice;
          const correct = choice === 'is blue and circle' || choice === 'contains blue';
          logEvent('input', { game: code, action: 'submit_rule', choice, correct });
          updateScore(code, correct ? 95 : 60);
          finishCurrentGame(code, correct ? 'success' : 'fail');
        });
      });
      updateScore(code, 30);
    }

    function startStudioGame(code, mode, board, side) {
      const colors = ['#f97316', '#22c55e', '#2563eb', '#e11d48', '#8b5cf6', '#facc15', '#0f172a', '#ffffff'];
      let color = colors[0];
      let strokes = 0;
      let lastX = 0;
      let lastY = 0;
      let drawing = false;
      board.className = 'board';
      board.innerHTML = `<canvas class="art-canvas" id="studio-canvas" width="760" height="420"></canvas>`;
      const canvas = document.getElementById('studio-canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      side.innerHTML = `
        <div class="palette">
          ${colors.map((swatch) => `<button class="swatch ${swatch === color ? 'active' : ''}" style="background:${swatch};" data-color="${swatch}"></button>`).join('')}
        </div>
        <div class="controls">
          <button class="button secondary" id="clear-art">Clear</button>
          <button class="button secondary" id="shuffle-art">Shuffle palette</button>
        </div>
      `;
      side.querySelectorAll('.swatch').forEach((swatch) => {
        swatch.addEventListener('click', () => {
          color = swatch.dataset.color;
          side.querySelectorAll('.swatch').forEach((node) => node.classList.toggle('active', node.dataset.color === color));
          logEvent('input', { game: code, action: 'choose_color', color });
        });
      });
      document.getElementById('clear-art').addEventListener('click', () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        strokes = 0;
        updateScore(code, 60);
      });
      document.getElementById('shuffle-art').addEventListener('click', () => {
        colors.sort(() => Math.random() - 0.5);
        color = colors[0];
        side.querySelectorAll('.swatch').forEach((node, idx) => {
          node.dataset.color = colors[idx];
          node.style.background = colors[idx];
          node.classList.toggle('active', colors[idx] === color);
        });
        logEvent('input', { game: code, action: 'shuffle_palette' });
      });
      function getPos(evt) {
        const rect = canvas.getBoundingClientRect();
        const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
        const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
      }
      canvas.addEventListener('pointerdown', (evt) => {
        drawing = true;
        const pos = getPos(evt);
        lastX = pos.x; lastY = pos.y;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      });
      canvas.addEventListener('pointermove', (evt) => {
        if (!drawing) return;
        const pos = getPos(evt);
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x; lastY = pos.y;
        strokes += 1;
        updateScore(code, clamp(30 + strokes * 3, 0, 100));
      });
      canvas.addEventListener('pointerup', () => {
        drawing = false;
        logEvent('input', { game: code, action: 'paint_stroke', stroke_count: strokes });
      });
      updateScore(code, 60);
    }

    function startGuideGame(code, mode, board, side) {
      const moods = [72, 64, 80];
      board.className = 'board';
      board.innerHTML = `
        <div style="padding:20px; display:flex; flex-direction:column; gap:18px; position:relative; z-index:1;">
          ${['A', 'B', 'C'].map((label, idx) => `
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong>Person ${label}</strong>
                <span>${moods[idx]}%</span>
              </div>
              <div class="npc-bar"><div class="npc-fill" style="width:${moods[idx]}%"></div></div>
            </div>
          `).join('')}
        </div>
      `;
      side.innerHTML = `
        <div class="controls" style="flex-direction:column; align-items:stretch;">
          <button class="button secondary" data-help="cheer" style="width:100%;">Encourage</button>
          <button class="button secondary" data-help="tip" style="width:100%;">Give a tip</button>
          <button class="button secondary" data-help="pause" style="width:100%;">Pause and reset</button>
        </div>
      `;
      let tick = 0;
      const decay = () => {
        for (let i=0; i<moods.length; i++) moods[i] = clamp(moods[i] - 6, 0, 100);
        const fills = board.querySelectorAll('.npc-fill');
        fills.forEach((node, idx) => node.style.width = `${moods[idx]}%`);
        const total = moods.reduce((a, b) => a + b, 0) / moods.length;
        updateScore(code, total);
        const labels = board.querySelectorAll('span');
        labels.forEach((node) => {
          if (typeof node.textContent === 'string' && node.textContent.includes('%')) {
            const value = Number(node.textContent.replace('%',''));
            const index = Array.from(labels).indexOf(node);
            if (!isNaN(value) && index < moods.length) node.textContent = `${moods[index] || 0}%`;
          }
        });
        tick += 1;
        if (tick > 8) finishCurrentGame(code, 'success');
      };
      side.querySelectorAll('[data-help]').forEach((button) => button.addEventListener('click', () => {
        const boost = button.dataset.help === 'cheer' ? 20 : button.dataset.help === 'tip' ? 16 : 10;
        for (let i=0; i<moods.length; i++) moods[i] = clamp(moods[i] + boost, 0, 100);
        const total = moods.reduce((a, b) => a + b, 0) / moods.length;
        updateScore(code, total);
        logEvent('input', { game: code, action: button.dataset.help, levels: moods.slice() });
      }));
      setInterval(decay, 1100);
      updateScore(code, 76);
    }

    function startMarketGame(code, mode, board, side) {
      let value = 18;
      let risk = 12;
      let pumped = 0;
      board.className = 'board';
      board.innerHTML = `
        <div style="padding:24px; display:flex; flex-direction:column; gap:16px; height:100%; justify-content:center; position:relative; z-index:1;">
          <div class="deal-box">
            <button class="button primary" id="pump-btn">Pump</button>
            <button class="button secondary" id="cash-btn">Cash out</button>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <strong>Potential value</strong><span id="deal-value">${value}</span>
            </div>
            <div class="deal-meter"><div id="deal-risk" style="width:${risk}%"></div></div>
            <div class="muted" style="margin-top:6px;">Risk: <span id="deal-risk-label">${risk}%</span></div>
          </div>
        </div>
      `;
      const pump = () => {
        const added = Math.random() * 16 + 8;
        value += Math.round(added);
        risk = clamp(risk + Math.round(Math.random() * 18 + 8), 0, 100);
        pumped += 1;
        if (risk >= 100) {
          logEvent('input', { game: code, action: 'burst', risk, value, pumps: pumped });
          updateScore(code, 20);
          finishCurrentGame(code, 'burst');
          return;
        }
        document.getElementById('deal-value').textContent = value;
        document.getElementById('deal-risk').style.width = `${risk}%`;
        document.getElementById('deal-risk-label').textContent = `${risk}%`;
        logEvent('input', { game: code, action: 'pump', risk, value, pumps: pumped });
        updateScore(code, clamp(value, 0, 100));
      };
      document.getElementById('pump-btn').addEventListener('click', pump);
      document.getElementById('cash-btn').addEventListener('click', () => {
        const cashOut = value;
        logEvent('input', { game: code, action: 'cash_out', value: cashOut, risk, pumps: pumped });
        updateScore(code, clamp(cashOut, 0, 100));
        finishCurrentGame(code, 'cashout');
      });
      updateScore(code, 35);
    }

    function startQueueGame(code, mode, board, side) {
      const bins = { A: 'Line up', B: 'Check labels', C: 'Archive', D: 'Priority' };
      const items = [
        { id: 'A1', kind: 'A', label: 'Task A1' },
        { id: 'B2', kind: 'B', label: 'Task B2' },
        { id: 'C3', kind: 'C', label: 'Task C3' },
        { id: 'D4', kind: 'D', label: 'Task D4' },
        { id: 'A5', kind: 'A', label: 'Task A5' },
        { id: 'B6', kind: 'B', label: 'Task B6' }
      ];
      let correct = 0;
      let attempts = 0;
      board.className = 'board';
      board.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(2, minmax(160px, 1fr)); gap:18px; padding:20px; position:relative; z-index:1;">
          <div>
            <div class="muted" style="margin-bottom:8px;">Items to sort</div>
            <div id="item-pile">${items.map((item) => `<button class="queue-item" data-item="${item.id}" data-kind="${item.kind}">${item.label}</button>`).join('')}</div>
          </div>
          <div>
            <div class="muted" style="margin-bottom:8px;">Bins</div>
            <div style="display:grid; gap:10px;">
              ${Object.entries(bins).map(([key, label]) => `<div class="queue-bin" data-bin="${key}"><strong>${label}</strong></div>`).join('')}
            </div>
          </div>
        </div>
      `;
      let selectedItem = null;
      board.querySelectorAll('.queue-item').forEach((item) => {
        item.addEventListener('click', () => {
          selectedItem = item.dataset.item;
          item.style.borderColor = '#2563eb';
          logEvent('input', { game: code, action: 'select_item', item: selectedItem });
        });
      });
      board.querySelectorAll('.queue-bin').forEach((bin) => {
        bin.addEventListener('click', () => {
          if (!selectedItem) return;
          const item = items.find((entry) => entry.id === selectedItem);
          const isCorrect = item.kind === bin.dataset.bin;
          attempts += 1;
          if (isCorrect) correct += 1;
          logEvent('input', { game: code, action: 'sort_item', item: selectedItem, bin: bin.dataset.bin, correct: isCorrect });
          const totalScore = clamp(Math.round((correct / attempts) * 100), 0, 100);
          updateScore(code, totalScore);
          const node = board.querySelector(`[data-item="${selectedItem}"]`);
          if (node) node.remove();
          selectedItem = null;
          if (correct >= 5) finishCurrentGame(code, 'success');
        });
      });
      updateScore(code, 45);
    }

    function downloadTelemetry() {
      const text = state.telemetry.map((entry) => JSON.stringify(entry)).join('\n');
      const blob = new Blob([text + '\n'], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `telemetry_${state.sessionId || 'session'}.jsonl`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    render();
  