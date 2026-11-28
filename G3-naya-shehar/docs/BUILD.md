# Building Naya Shehar for Android

Application id: `pk.nayashehar.game` · version 1.0.0 (versionCode 1) · portrait only.

## Prerequisites

- Node.js 20+ and npm
- For local native builds: JDK 17+, Android SDK (API 35+), an emulator or a USB-connected phone
- For cloud builds: a free Expo account (`npx eas-cli@latest login`)

```bash
npm install
```

## 1. Development (fastest)

```bash
npx expo start
```

- Press `a` to open an Android emulator, or scan the QR code with **Expo Go** (SDK 58).
- Development builds expose a **"fast weeks"** switch on the locked-week screen (weeks open 2 minutes
  apart) so you can test all five chapters in one sitting. It is forced off in release builds.

## 2. Installable APK

**Cloud (recommended, no Android Studio needed):**

```bash
npx eas-cli@latest build --platform android --profile preview
```

EAS prints a download link / QR code for the APK. Profiles are in `eas.json`
(`development`, `preview` → APK, `production` → AAB for Google Play).

**Local:**

```bash
npx expo prebuild --platform android      # generates ./android from app.json (do not edit by hand)
cd android
./gradlew assembleRelease                 # android/app/build/outputs/apk/release/app-release.apk
```

Without a configured keystore, the local release APK is signed with the debug key — fine for
classroom testing, not for Play Store upload.

## 3. Release checklist

- [ ] Create an upload keystore (`eas credentials` manages this automatically for EAS builds).
- [ ] Bump `expo.version` and `expo.android.versionCode` in `app.json`.
- [ ] Verify pathway rules in `src/assessment/recommendations/rules.ts` against official sources,
      set `verified: true`, add `sources`, and bump `RULESET_VERSION`.
- [ ] Run `npm test`, `npm run typecheck`, `npm run export:android`.
- [ ] Smoke-test on a 2–3 GB RAM Android 10+ phone: town map panning, a full prologue, read-aloud,
      reduced motion, closing and reopening mid-week.
- [ ] `npx eas-cli@latest build --platform android --profile production`.

## Permissions

The manifest keeps only `VIBRATE`, `MODIFY_AUDIO_SETTINGS` (sound effects) and `INTERNET`
(required by development builds to load code from the dev server; the game itself never makes
network requests). Camera, microphone, location, contacts, storage, overlay and foreground-service
permissions are explicitly removed in `app.json`. Background audio is disabled.

## Size

The Android JS bundle is ≈ 4.3 MB of Hermes bytecode; fonts + sounds + icons bring exported assets
to ≈ 9 MB. All town and character art is vector (SVG) drawn in code.
