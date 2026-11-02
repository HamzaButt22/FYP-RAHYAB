// Where the login token lives: the phone's secure storage (iOS Keychain / Android Keystore).
// Only where secure storage does not exist (the web build used for testing) it falls back to app storage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'rahyaab_token';
let secure = null;
const useSecure = async () => {
  if (secure === null) {
    try { secure = await SecureStore.isAvailableAsync(); } catch (e) { secure = false; }
  }
  return secure;
};

export const tokenStore = {
  async get() {
    try { return (await useSecure()) ? await SecureStore.getItemAsync(KEY) : await AsyncStorage.getItem(KEY); } catch (e) { return null; }
  },
  async set(t) {
    if (await useSecure()) await SecureStore.setItemAsync(KEY, t);
    else await AsyncStorage.setItem(KEY, t);
  },
  async clear() {
    try { if (await useSecure()) await SecureStore.deleteItemAsync(KEY); else await AsyncStorage.removeItem(KEY); } catch (e) { /* already gone */ }
  },
};
