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

**Design:** colours, type and spacing come from `src/theme/tokens.ts`, an exact copy of `design/tokens/theme.ts`. CI (`design/tokens/check_tokens.py`) fails if the two differ, so change the design file first and copy it. The screen designs are in `design/screens/`; brand images in `assets/brand/` are copies from `design/brand/`.

**Code layout (`src/`):**

| Folder | What |
|---|---|
| `app/` | Screens and navigation (expo-router). `language.tsx` is S-01; `(onboarding)/` holds S-02 and S-03; `(tabs)/` holds Home, Explore, Family and You. Which group is reachable depends on the saved language and onboarding state (`Stack.Protected` in `app/_layout.tsx`) |
| `components/` | Shared pieces: `AppText` (brand type scale, switches to Gulzar in Urdu), `Button`, `Screen`, `LanguageOption`, `Placeholder` |
| `i18n/` | All interface text in `locales/en.json` and `locales/ur.json` (keys `domain.screen.element`). No text is written directly in a screen (NFR-27). Choosing Urdu restarts the app in right-to-left layout |
| `state/` | Saved settings (language, onboarding) in the Keystore-backed secure store |
| `theme/` | Tokens and `useTheme()` (light, dark, high contrast) |

**Urdu text is a draft.** A native Urdu editor must review `locales/ur.json` before the pilot (SRS §7.4). Use `start`/`end` in styles, never `left`/`right`, so layouts mirror correctly in Urdu.

**Development-only buttons:** "Skip to the app" on the join screen and "Start onboarding again" on You appear only in development builds (`__DEV__`), never in a release build.

**Privacy in the app config:** Android backups are off, and only INTERNET and VIBRATE permissions are requested; location, contacts, camera and microphone are blocked (SECURITY.md §3). The development build adds Expo's developer tools, which may ask for "nearby devices"; that prompt is not part of Rahyaab and can be declined.
