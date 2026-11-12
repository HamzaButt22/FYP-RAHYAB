# Rahyaab mobile app

Expo SDK 58, React Native 0.88, TypeScript, expo-router. Android first (the target phones are budget Android devices).

```bash
pnpm install
```

The app uses a **development build** (`expo-dev-client`), not Expo Go, because it will need native code (the Android Keystore device key). Build and install it once, and again whenever a native package changes. The emulator or a USB phone must be running:

```bash
pnpm android
```

After that, start the JavaScript server and open the installed **Rahyaab** app:

```bash
pnpm start
```

Checks CI runs: `pnpm typecheck` and `pnpm lint`.

**Windows: one-time setup for the Android build.** React Native compiles C++ code, and on Windows its file paths can pass the old 260-character limit.
1. Long paths must be on (`LongPathsEnabled = 1`; Expo's guide "Windows long paths" shows the command, run as administrator).
2. Install **CMake 3.31.6** (Android Studio → Settings → Languages & Frameworks → Android SDK → SDK Tools → tick *Show Package Details* → CMake → 3.31.6). It ships Ninja 1.12.1, which handles long paths; the default CMake 3.22.1 does not.
3. Add `android.cmakeVersion=3.31.6` to your **personal** Gradle file: `%USERPROFILE%\.gradle\gradle.properties`, or `<GRADLE_USER_HOME>\gradle.properties` if you set that variable. Not in the repo, so EAS and Linux builds keep the default.

`pnpm-workspace.yaml` also sets `nodeLinker: hoisted` (a flat `node_modules`), which keeps these paths shorter.

**Builds:** `eas.json` has three profiles: `development` (dev client), `preview` (an installable APK for testers and the pilot, pointing at staging) and `production` (Play Store bundle). Run them from GitHub (Actions → mobile-build) or locally with `npx eas-cli build --platform android --profile preview`.

**Design:** colours, type and spacing come from `design/tokens/theme.ts` (copy it to `src/theme/` when the first screen is built); the screen designs are in `design/screens/`.

**Privacy in the app config:** Android backups are off, and only INTERNET and VIBRATE permissions are requested; location, contacts, camera and microphone are blocked (SECURITY.md §3).
