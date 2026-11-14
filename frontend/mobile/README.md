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

Checks CI runs: `pnpm typecheck`, `pnpm lint` and `pnpm test` (unit tests of plain TypeScript rules with Node's own test runner, no extra packages).

**The app talks to the local API** at `http://localhost:8000/v1` in development builds, through `adb reverse tcp:8000 tcp:8000` (the same on the emulator and a USB phone). `python tools/dev.py up` runs it when a device is connected; start the emulator first, or run `up` again. Docker publishes the API on 127.0.0.1 only, so the emulator's usual `10.0.2.2` address cannot reach it. Release builds must set `EXPO_PUBLIC_API_URL`.

**New computer:** follow `docs/project/NEW_DEVICE_SETUP.md` (Android SDK, emulator or phone, debugging, known errors).

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
| `app/` | Screens and navigation (expo-router). `language.tsx` is S-01; `(onboarding)/` holds S-02 Welcome, S-03 Join and the under-13 stop screen; `consent.tsx` is S-04 (the family's consent slip); `(tabs)/` holds Home, Explore, Family and You. Which group is reachable depends on the saved language, the sign-in and the onboarding state (`Stack.Protected` in `app/_layout.tsx`) |
| `components/` | Shared pieces: `AppText` (brand type scale, switches to Gulzar in Urdu), `Button`, `Screen`, `Header` (back and "?"), `Field` with `TextInputBox`, `ChoiceRow` and `SelectBox` (forms with field help), `HelpCard`, `Notice`, `LanguageOption`, `Placeholder` |
| `api/` | `client.ts`: JSON requests to the API; problem+json errors come back as codes, never as server text |
| `join/` | S-03 and S-04 logic: `rules.ts` (code formatting, nickname and age checks that match the server's; tested in `rules.test.ts`), `joinApi.ts` (join and claim, with every server answer mapped), `commonNames.ts` (generated: `python tools/check_names.py --write`) |
| `i18n/` | All interface text in `locales/en.json` and `locales/ur.json` (keys `domain.screen.element`). No text is written directly in a screen (NFR-27). Choosing Urdu restarts the app in right-to-left layout |
| `state/` | Saved settings (language, onboarding) in the Keystore-backed secure store; `session.ts`: the refresh token in the secure store, the access token in memory only, and refresh signed with the device key |
| `theme/` | Tokens and `useTheme()` (light, dark, high contrast) |

**Urdu text is a draft.** A native Urdu editor must review `locales/ur.json` before the pilot (SRS §7.4). Use `start`/`end` in styles, never `left`/`right`, so layouts mirror correctly in Urdu.

**Native code (`modules/device-key/`):** our own Kotlin module for the device key (ADR-0011). It creates an EC P-256 key in the Android Keystore (StrongBox when the phone has it), returns the public key, and signs only refresh requests: it adds the `rahyaab-refresh-v1:` prefix itself, so nothing else in the app can use the key. Expo links it automatically; after changing it, run `pnpm android` again.

**Development-only button:** "Start onboarding again" on You (also deletes the sign-in and the device key) appears only in development builds (`__DEV__`), never in a release build. Joining needs the local backend and a seed class code (`RYB-4K2`; `python tools/dev.py seed`).

**Privacy in the app config:** Android backups are off, and only INTERNET and VIBRATE permissions are requested; location, contacts, camera and microphone are blocked (SECURITY.md §3). The development build adds Expo's developer tools, which may ask for "nearby devices"; that prompt is not part of Rahyaab and can be declined.
