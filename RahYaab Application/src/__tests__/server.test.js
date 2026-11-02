// RahYaab server address: set at runtime by the school admin (laptop IPs change with every Wi-Fi), checked before use.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {checkServer, normalizeServerUrl} from '../world';
import {loadSettings, serverUrl, setServerUrl} from '../api';

const json = (status, body) => Promise.resolve(new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}}));

beforeEach(async () => {
  await AsyncStorage.clear();
  await setServerUrl(null);
});

describe('server address setting (before login)', () => {
  it('saves a cleaned address on the phone and falls back to the built-in one when cleared', async () => {
    process.env.EXPO_PUBLIC_RAHYAAB_API_URL = 'https://built.in';
    expect(serverUrl()).toBe('https://built.in');
    await setServerUrl(' http://192.168.100.105:5000/ ');
    expect(serverUrl()).toBe('http://192.168.100.105:5000');
    await loadSettings();
    expect(serverUrl()).toBe('http://192.168.100.105:5000');
    await setServerUrl('');
    expect(serverUrl()).toBe('https://built.in');
    await expect(setServerUrl('javascript:alert(1)')).rejects.toBeTruthy();
    delete process.env.EXPO_PUBLIC_RAHYAAB_API_URL;
  });
});

describe('normalizeServerUrl', () => {
  it('accepts an http(s) origin, trims spaces, trailing slashes and a trailing /api', () => {
    expect(normalizeServerUrl(' http://192.168.1.7:5000/ ')).toBe('http://192.168.1.7:5000');
    expect(normalizeServerUrl('https://rahyaab.example.org/api/')).toBe('https://rahyaab.example.org');
    expect(normalizeServerUrl('HTTP://10.0.2.2:5000')).toBe('http://10.0.2.2:5000');
  });

  it('rejects anything that is not a plain server address', () => {
    for (const bad of ['', 'abc', '192.168.1.7:5000', 'ftp://x.org', 'http://', 'http://a b:5000', 'http://x.org/other/path',
      'http://user:pw@x.org', 'javascript:alert(1)', 'http://x.org:99999', 'http://x.org?a=1']) {
      expect(() => normalizeServerUrl(bad)).toThrow();
    }
  });
});

describe('checkServer', () => {
  it('reports a working RahYaab server', async () => {
    const f = jest.fn(() => json(200, {status: 'ok'}));
    await expect(checkServer('http://192.168.1.7:5000', {fetchImpl: f, allowHttp: true})).resolves.toMatchObject({ok: true});
    expect(f.mock.calls[0][0]).toBe('http://192.168.1.7:5000/api/health');
  });

  it('explains when this build cannot use http (before trying the network)', async () => {
    const f = jest.fn();
    const r = await checkServer('http://192.168.1.7:5000', {fetchImpl: f, allowHttp: false});
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/https/);
    expect(f).not.toHaveBeenCalled();
  });

  it('explains an unreachable laptop (wrong IP, other Wi-Fi, firewall, server not started)', async () => {
    const r = await checkServer('http://192.168.1.7:5000', {fetchImpl: () => Promise.reject(new TypeError('Network request failed')), allowHttp: true});
    expect(r).toMatchObject({ok: false});
    expect(r.msg).toMatch(/Can't reach/);
    expect(r.msg).toMatch(/0\.0\.0\.0/);
  });

  it('detects something else answering at that address', async () => {
    const html = () => Promise.resolve(new Response('<html>router login</html>', {status: 200}));
    expect((await checkServer('http://192.168.1.1', {fetchImpl: html, allowHttp: true})).msg).toMatch(/not the RahYaab server/);
    expect((await checkServer('http://192.168.1.1', {fetchImpl: () => json(404, {}), allowHttp: true})).msg).toMatch(/not the RahYaab server/);
    expect((await checkServer('http://192.168.1.1', {fetchImpl: () => json(500, {error: 'x'}), allowHttp: true})).msg).toMatch(/error 500/);
  });

  it('gives up after the timeout', async () => {
    jest.useFakeTimers();
    const hang = (_u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    const p = checkServer('http://192.168.1.7:5000', {fetchImpl: hang, allowHttp: true, timeoutMs: 3000});
    jest.advanceTimersByTime(3001);
    const r = await p;
    jest.useRealTimers();
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/did not answer/);
  });

  it('calls fetch without a `this` (browsers throw "Illegal invocation" otherwise)', async () => {
    const strict = function () {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      return json(200, {status: 'ok'});
    };
    expect((await checkServer('https://x.org', {fetchImpl: strict})).ok).toBe(true);
  });
});

describe('app.config.js (build settings)', () => {
  const load = (env) => {
    jest.resetModules();
    const old = process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP;
    if (env === undefined) delete process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP;
    else process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP = env;
    const base = require('../../app.json').expo;
    const out = require('../../app.config.js')({config: base});
    if (old === undefined) delete process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP;
    else process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP = old;
    return out;
  };
  const cleartext = (cfg) => (cfg.plugins || []).some((p) => Array.isArray(p) && p[0] === 'expo-build-properties' && p[1]?.android?.usesCleartextTraffic === true);

  it('allows plain http only in builds that ask for it (demo / LAN builds)', () => {
    expect(cleartext(load('1'))).toBe(true);
    expect(cleartext(load(undefined))).toBe(false);
    expect(cleartext(load('0'))).toBe(false);
  });

  it('keeps everything else from app.json', () => {
    const c = load('1');
    expect(c.name).toBe('RahYaab');
    expect(c.android.package).toBe('com.dsarw.rahyaab');
    expect(c.plugins).toEqual(expect.arrayContaining(['expo-status-bar']));
  });
});
