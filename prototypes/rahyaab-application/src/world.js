// Helpers for the RahYaab Adventure game module (src/features/rahyaab-game) and the server address.

// Each student gets their own namespace, so on a shared school phone one student never sees (or resumes) another's game.
export function scopedStorage(base, uid) {
  if (uid === undefined || uid === null || uid === '') throw new Error('scopedStorage needs a user id');
  const k = key => `rahyaab_user_${uid}/${key}`;
  return {
    getItem: key => base.getItem(k(key)),
    setItem: (key, value) => base.setItem(k(key), value),
    removeItem: key => base.removeItem(k(key)),
  };
}

// Server settings. Pass process.env.EXPO_PUBLIC_* values directly (Expo inlines them at build time).
// Returns null when no server is configured. Plain http is allowed only in development or with the explicit flag.
export function worldConfig(url, allowHttpFlag, isDev) {
  if (!url) return null;
  return {apiBaseUrl: url, allowInsecureHttp: !!isDev || allowHttpFlag === '1'};
}

// "http://192.168.1.7:5000/" -> "http://192.168.1.7:5000". Only a plain server address is accepted (no path, query,
// or user:password), so a typo cannot silently send students' data somewhere unexpected.
export function normalizeServerUrl(input) {
  const s = String(input ?? '').trim();
  const m = /^(https?):\/\/([A-Za-z0-9.-]+|\[[0-9A-Fa-f:]+\])(?::(\d{1,5}))?(?:\/api)?\/*$/i.exec(s);
  if (!m || (m[3] && +m[3] > 65535)) throw 'Enter the server address like http://192.168.1.7:5000 or https://rahyaab.example.org';
  return `${m[1].toLowerCase()}://${m[2].toLowerCase()}${m[3] ? ':' + m[3] : ''}`;
}

// Asks the server's /api/health. Never throws: returns {ok, msg} with a message a teacher can act on.
export async function checkServer(url, {fetchImpl = (u, i) => fetch(u, i), allowHttp = false, timeoutMs = 5000} = {}) {
  if (/^http:/i.test(url) && !allowHttp)
    return {ok: false, msg: 'This app build only connects to https:// addresses. Use an https server, or install a demo build that allows http (see ADVENTURE_INTEGRATION.md).'};
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(`${url}/api/health`, {headers: {Accept: 'application/json'}, signal: ctrl.signal});
  } catch (e) {
    clearTimeout(timer);
    if (ctrl.signal.aborted) return {ok: false, msg: `The server did not answer within ${Math.round(timeoutMs / 1000)} s.`};
    return {ok: false, msg: "Can't reach the server. Check: phone and laptop on the same Wi-Fi, the IP address is right, the server was started with host='0.0.0.0', and Windows Firewall allows Python."};
  }
  clearTimeout(timer);
  if (res.status >= 500) return {ok: false, msg: `The server answered with error ${res.status}. Look at the server window for the error.`};
  let data = null;
  try { data = JSON.parse(await res.text()); } catch (e) { /* not JSON */ }
  if (!res.ok || !data || data.status !== 'ok') return {ok: false, msg: 'Something answered at this address, but it is not the RahYaab server. Check the IP address and port (usually 5000).'};
  return {ok: true, msg: 'Connected to the RahYaab server.'};
}
