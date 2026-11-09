// Practice scores for the 5 mini-games, kept on this phone per student (they are practice, not part of the
// assessment). Accounts and results live on the RahYaab server (src/api).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rahyaab_practice_v1';
let cache = null;

async function load() {
  if (cache) return cache;
  try { cache = JSON.parse(await AsyncStorage.getItem(KEY)) || {}; } catch (e) { cache = {}; }
  return cache;
}

export const practice = {
  async best(uid) { const c = await load(); return {...(c[uid] || {})}; },
  async save(uid, key, score) {
    const c = await load();
    const mine = c[uid] || (c[uid] = {});
    mine[key] = Math.max(mine[key] ?? 0, score);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* stays for this session */ }
  },
  _reset() { cache = null; },
};
