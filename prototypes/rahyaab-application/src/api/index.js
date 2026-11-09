// The app-wide server client and settings (server address). Loaded once at start-up by App.js.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from './client';
import {tokenStore} from './session';
import {normalizeServerUrl} from '../world';

const URL_KEY = 'rahyaab_server_url';
let override = null;
let onExpired = () => {};

// Expo inlines process.env.EXPO_PUBLIC_* at build time: keep them as direct references.
export const builtInServer = () => process.env.EXPO_PUBLIC_RAHYAAB_API_URL || null;
export const httpAllowed = () => __DEV__ || process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP === '1';
export const serverUrl = () => override || builtInServer();

export async function loadSettings() {
  try { override = await AsyncStorage.getItem(URL_KEY); } catch (e) { override = null; }
}

// '' or null -> use the address built into the app again
export async function setServerUrl(url) {
  const clean = url && String(url).trim() ? normalizeServerUrl(url) : null;
  override = clean;
  try { if (clean) await AsyncStorage.setItem(URL_KEY, clean); else await AsyncStorage.removeItem(URL_KEY); } catch (e) { /* kept in memory */ }
  return clean;
}

export const setOnSessionExpired = (fn) => { onExpired = fn; };

export const api = createClient({
  getBaseUrl: serverUrl,
  getToken: () => tokenStore.get(),
  onUnauthorized: () => onExpired(),
});
