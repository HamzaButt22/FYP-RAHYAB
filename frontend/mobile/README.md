# Rahyaab mobile app

Expo SDK 58, React Native 0.88, TypeScript, expo-router. Android first (the target phones are budget Android devices).

```bash
pnpm install
```

```bash
pnpm start
```

Then press `a` for an Android emulator, or scan the QR code with Expo Go. Checks CI runs: `pnpm typecheck` and `pnpm lint`.

**Builds:** `eas.json` has three profiles: `development` (dev client), `preview` (an installable APK for testers and the pilot, pointing at staging) and `production` (Play Store bundle). Run them from GitHub (Actions → mobile-build) or locally with `npx eas-cli build --platform android --profile preview`.

**Design:** colours, type and spacing come from `design/tokens/theme.ts` (copy it to `src/theme/` when the first screen is built); the screen designs are in `design/screens/`.

**Privacy in the app config:** Android backups are off, and only INTERNET and VIBRATE permissions are requested; location, contacts, camera and microphone are blocked (SECURITY.md §3).
