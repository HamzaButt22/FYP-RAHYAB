// One client for every call to the RahYaab server (/api/app). The server checks roles; the app only shows screens.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = no connection
  }
}

const enc = encodeURIComponent;

export function createClient({getBaseUrl, getToken, onUnauthorized, fetchImpl, timeoutMs = 15000}) {
  // never call fetch as a method of another object: browsers throw "Illegal invocation"
  const doFetch = fetchImpl ? (u, i) => fetchImpl(u, i) : (u, i) => fetch(u, i);

  async function request(method, path, body, {auth = true, sessionCall = true} = {}) {
    const base = getBaseUrl();
    if (!base) throw new ApiError(0, 'No RahYaab server address is set. Tap "Server" on the login screen.');
    const headers = {Accept: 'application/json'};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const t = await getToken();
      if (t) headers.Authorization = `Bearer ${t}`;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await doFetch(`${base}/api/app${path}`, {method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal});
    } catch (e) {
      throw new ApiError(0, ctrl.signal.aborted
        ? 'The RahYaab server did not answer. Check your connection and try again.'
        : "Can't reach the RahYaab server. Check your internet or Wi-Fi and try again.");
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      if (res.status === 401 && sessionCall && onUnauthorized) onUnauthorized();
      throw new ApiError(res.status, (data && typeof data.error === 'string' && data.error) || `Something went wrong (error ${res.status}).`);
    }
    return data;
  }

  const get = (p, o) => request('GET', p, undefined, o);
  const post = (p, b = {}, o) => request('POST', p, b, o);
  const put = (p, b, o) => request('PUT', p, b, o);
  const patch = (p, b, o) => request('PATCH', p, b, o);
  const pub = {auth: false, sessionCall: false};

  return {
    absolute: (path) => `${getBaseUrl()}${path}`,
    // accounts (FR-1)
    register: (d) => post('/auth/register', d, pub),
    login: (login, password) => post('/auth/login', {login, password}, pub),
    logout: () => post('/auth/logout', {}, {sessionCall: false}),
    forgot: (email) => post('/auth/forgot', {email}, pub),
    resetWithCode: (login, code, new_password) => post('/auth/reset', {login, code, new_password}, pub),
    me: () => get('/me'),
    saveProfile: (fields) => patch('/me', fields),
    changePassword: (current_password, new_password) => post('/me/password', {current_password, new_password}),
    // assessment (FR-2..FR-6)
    startAssessment: (consent) => post('/assessments', {consent}),
    assessments: () => get('/assessments'),
    assessment: (id) => get(`/assessments/${enc(id)}`),
    linkGame: (id, session_id) => post(`/assessments/${enc(id)}/game`, {session_id}),
    riasecItems: () => get('/riasec/items'),
    saveAnswers: (id, answers, timings_ms) => put(`/assessments/${enc(id)}/riasec`, {answers, timings_ms}),
    submit: (id) => post(`/assessments/${enc(id)}/submit`),
    result: (id) => get(`/assessments/${enc(id)}/result`),
    feedback: (id, f) => post(`/assessments/${enc(id)}/feedback`, f),
    abandon: (id) => post(`/assessments/${enc(id)}/abandon`),
    // school admin
    schoolStudents: () => get('/school/students'),
    addStudent: (d) => post('/school/students', d),
    updateStudent: (id, d) => patch(`/school/students/${enc(id)}`, d),
    resetCode: (id) => post(`/school/students/${enc(id)}/reset-code`),
    schoolStats: () => get('/school/stats'),
    // platform admin (FR-7)
    orgs: () => get('/admin/orgs'),
    createOrg: (d) => post('/admin/orgs', d),
    updateOrg: (id, d) => patch(`/admin/orgs/${enc(id)}`, d),
    users: (scope, q = '') => get(`/admin/users?scope=${enc(scope)}&q=${enc(q)}`),
    updateUser: (id, d) => patch(`/admin/users/${enc(id)}`, d),
    adminItems: () => get('/admin/riasec-items'),
    addItem: (d) => post('/admin/riasec-items', d),
    updateItem: (id, d) => patch(`/admin/riasec-items/${enc(id)}`, d),
    adminFields: () => get('/admin/fields'),
    addField: (d) => post('/admin/fields', d),
    updateField: (id, d) => patch(`/admin/fields/${enc(id)}`, d),
    adminStats: () => get('/admin/stats'),
    createExport: () => post('/admin/export'),
  };
}
