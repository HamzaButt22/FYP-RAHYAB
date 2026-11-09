// The app's connection to the RahYaab server: one client for every request, login token in secure storage,
// honest errors, no request without a server address.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {ApiError, createClient} from '../api/client';
import {tokenStore} from '../api/session';
import {needsGuardian} from '../logic/consent';
import {firstUnanswered, progress, missingCount} from '../logic/questionnaire';
import {radarPoints} from '../logic/radar';

jest.mock('expo-secure-store', () => {
  const m = new Map();
  return {
    isAvailableAsync: jest.fn(async () => true),
    getItemAsync: jest.fn(async (k) => (m.has(k) ? m.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => void m.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void m.delete(k)),
    __m: m,
  };
});

const json = (status, body) => Promise.resolve(new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}}));

function make(responder, extra = {}) {
  const calls = [];
  const fetchImpl = jest.fn((url, init) => {
    calls.push({url, init});
    return responder(url, init);
  });
  const onUnauthorized = jest.fn();
  const client = createClient({getBaseUrl: () => 'https://api.example.org', getToken: async () => 'tok123', fetchImpl, onUnauthorized, timeoutMs: 100, ...extra});
  return {client, calls, onUnauthorized};
}

describe('client', () => {
  it('sends JSON with the bearer token to /api/app', async () => {
    const {client, calls} = make(() => json(200, {user_id: 1}));
    await client.me();
    expect(calls[0].url).toBe('https://api.example.org/api/app/me');
    expect(calls[0].init.headers.Authorization).toBe('Bearer tok123');
    await client.saveProfile({grade: 11});
    expect(calls[1].init.method).toBe('PATCH');
    expect(JSON.parse(calls[1].init.body)).toEqual({grade: 11});
  });

  it('turns server errors into readable messages and reports expired logins', async () => {
    const {client, onUnauthorized} = make(() => json(401, {error: 'Please log in again.'}));
    await expect(client.me()).rejects.toMatchObject({status: 401, message: 'Please log in again.'});
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not treat a failed login as an expired session', async () => {
    const {client, onUnauthorized} = make(() => json(401, {error: 'Invalid login or password.'}));
    await expect(client.login('a@b.co', 'x')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('explains network problems and timeouts', async () => {
    const {client} = make(() => Promise.reject(new TypeError('Network request failed')));
    await expect(client.me()).rejects.toMatchObject({status: 0, message: expect.stringMatching(/Can't reach the RahYaab server/)});
    const hang = make((_u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted')))));
    await expect(hang.client.me()).rejects.toMatchObject({status: 0, message: expect.stringMatching(/did not answer/)});
  });

  it('refuses to send anything without a server address', async () => {
    const {client, calls} = make(() => json(200, {}), {getBaseUrl: () => null});
    await expect(client.me()).rejects.toMatchObject({status: 0, message: expect.stringMatching(/server address/)});
    expect(calls).toHaveLength(0);
  });

  it('calls fetch without a `this` (browsers throw "Illegal invocation" otherwise)', async () => {
    const strict = function (u, i) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      return json(200, {ok: true});
    };
    const client = createClient({getBaseUrl: () => 'https://x.org', getToken: async () => null, fetchImpl: strict});
    await expect(client.me()).resolves.toEqual({ok: true});
  });

  it('url-encodes ids and builds the export download address', async () => {
    const {client, calls} = make(() => json(201, {download_path: '/api/app/admin/export/abc.zip'}));
    await client.result('5/../x');
    expect(calls[0].url).toBe('https://api.example.org/api/app/assessments/5%2F..%2Fx/result');
    expect(client.absolute('/api/app/admin/export/abc.zip')).toBe('https://api.example.org/api/app/admin/export/abc.zip');
  });
});

describe('token storage', () => {
  it('keeps the login token in secure storage, not in plain app storage', async () => {
    await tokenStore.set('secret-token');
    expect(await tokenStore.get()).toBe('secret-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    expect(await AsyncStorage.getItem('rahyaab_token')).toBeNull();
    await tokenStore.clear();
    expect(await tokenStore.get()).toBeNull();
  });
});

describe('consent rules', () => {
  it('asks for a parent or guardian for individual students under 18 or with unknown age', () => {
    expect(needsGuardian({age: 15, org: null})).toBe(true);
    expect(needsGuardian({age: null, org: null})).toBe(true);
    expect(needsGuardian({age: 18, org: null})).toBe(false);
    expect(needsGuardian({age: 15, org: {org_id: 1}})).toBe(false); // the school's consent covers school students
  });
});

describe('questionnaire progress', () => {
  const items = [{item_id: 1}, {item_id: 2}, {item_id: 3}];
  it('resumes at the first unanswered question and blocks submitting with gaps', () => {
    expect(firstUnanswered(items, {})).toBe(0);
    expect(firstUnanswered(items, {1: 3, 3: 5})).toBe(1);
    expect(firstUnanswered(items, {1: 3, 2: 2, 3: 5})).toBe(-1);
    expect(missingCount(items, {1: 3})).toBe(2);
    expect(progress(items, {1: 3, '2': 4})).toBeCloseTo(2 / 3);
  });
});

describe('radar chart geometry', () => {
  it('puts 0 at the centre, 100 on the edge, first axis straight up', () => {
    const pts = radarPoints([100, 0, 50, 100, 100], 100, 100, 80);
    expect(pts[0].x).toBeCloseTo(100);
    expect(pts[0].y).toBeCloseTo(20);
    expect(pts[1].x).toBeCloseTo(100);
    expect(pts[1].y).toBeCloseTo(100);
    expect(Math.hypot(pts[2].x - 100, pts[2].y - 100)).toBeCloseTo(40);
  });
});
