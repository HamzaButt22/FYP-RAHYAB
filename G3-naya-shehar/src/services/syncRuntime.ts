import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { SyncDeps } from './sync';

/**
 * Dashboard address. Set it in app.json → expo.extra.apiUrl, or with the
 * EXPO_PUBLIC_API_URL environment variable at build time.
 */
export const API_URL: string =
  ((Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || process.env.EXPO_PUBLIC_API_URL || '').trim();

export const syncDeps: SyncDeps = {
  apiUrl: API_URL,
  isOnline: async () => {
    try {
      const n = await Network.getNetworkStateAsync();
      return !!n.isConnected && n.isInternetReachable !== false;
    } catch { return true; }
  },
};
