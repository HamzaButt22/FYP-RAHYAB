/**
 * The phone's Keystore device key (ADR-0011). Android only; the Kotlin source is in
 * android/src/main/java/expo/modules/devicekey/DeviceKeyModule.kt.
 */
import { requireOptionalNativeModule } from 'expo';

export type KeyHardware = 'strongbox' | 'tee' | 'software';
export type RamClass = 'low' | 'mid' | 'high';

type NativeDeviceKey = {
  getOrCreateKey(): Promise<{ publicKey: string; hardware: KeyHardware }>;
  signRefresh(refreshToken: string): Promise<string>;
  deleteKey(): Promise<void>;
  deviceInfo(): { ramClass: RamClass; osMajor: number };
};

const native = requireOptionalNativeModule<NativeDeviceKey>('RahyaabDeviceKey');

function module(): NativeDeviceKey {
  if (!native) {
    throw new Error('The device key needs the Android development build (pnpm android), not Expo Go or the web.');
  }
  return native;
}

/** Creates the key on first use; afterwards returns the same public key (base64 DER SubjectPublicKeyInfo). */
export const getOrCreateKey = () => module().getOrCreateKey();

/** base64 DER SHA256withECDSA over "rahyaab-refresh-v1:" + refreshToken, as POST /v1/auth/refresh expects. */
export const signRefresh = (refreshToken: string) => module().signRefresh(refreshToken);

/** Removes the key (only "Start onboarding again" in development builds uses this). */
export const deleteKey = () => module().deleteKey();

export const deviceInfo = () => module().deviceInfo();
