// Helpers for the game module: per-student storage on shared phones and server configuration.
import {MemoryStorage} from '../features/rahyaab-game';
import {scopedStorage, worldConfig} from '../world';

describe('scopedStorage (one phone, several students)', () => {
  it('keeps every student\'s unfinished game separate', async () => {
    const base = new MemoryStorage();
    const a = scopedStorage(base, 11);
    const b = scopedStorage(base, 12);
    await a.setItem('rahyaab/v1/active', 'local-a');
    expect(await b.getItem('rahyaab/v1/active')).toBeNull();
    expect(await a.getItem('rahyaab/v1/active')).toBe('local-a');
    await b.setItem('rahyaab/v1/active', 'local-b');
    await a.removeItem('rahyaab/v1/active');
    expect(await b.getItem('rahyaab/v1/active')).toBe('local-b');
    expect([...base.data.keys()]).toEqual(['rahyaab_user_12/rahyaab/v1/active']);
  });

  it('rejects a missing user id instead of falling back to a shared namespace', () => {
    expect(() => scopedStorage(new MemoryStorage(), undefined)).toThrow();
  });
});

describe('worldConfig', () => {
  it('needs a server URL; http only in development or with the explicit flag', () => {
    expect(worldConfig('', undefined, true)).toBeNull();
    expect(worldConfig('https://api.example.org', undefined, false)).toEqual({apiBaseUrl: 'https://api.example.org', allowInsecureHttp: false});
    expect(worldConfig('http://10.0.2.2:5000', undefined, true).allowInsecureHttp).toBe(true);
    expect(worldConfig('http://192.0.2.1:5000', '1', false).allowInsecureHttp).toBe(true);
    expect(worldConfig('http://192.0.2.1:5000', undefined, false).allowInsecureHttp).toBe(false);
  });
});
