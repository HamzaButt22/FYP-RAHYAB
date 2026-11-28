# Naya Shehar — Build Your Town. Shape Your Future.

A mobile, offline-first 2D isometric city-building game for students aged 13–18 in Pakistan,
with a web **results dashboard** for teachers.
Players rebuild a flood-hit town over one prologue and four weekly seasons. Their natural
gameplay decisions and puzzle play provide evidence about career interests (Holland RIASEC) and
six abilities, which feed a transparent career-pathway guide at the end.

- **Game:** phones only (Android first; iOS-compatible), full-screen, portrait. Expo SDK 58 / React Native 0.88, TypeScript strict.
- **Offline play:** the game never needs the internet. No accounts, ads, purchases, chat or free text.
- **Storage:** on-device SQLite with versioned migrations and transactional saves.
- **Results dashboard (`dashboard/`):** a website where teachers see their class. Students join with a
  6-digit class code and roll number; the phone uploads progress and results whenever it is online.

## Quick start

```bash
npm install
npx expo start          # then press "a" for an Android emulator, or scan the QR code

# results dashboard (separate terminal)
cd dashboard && npm install && ADMIN_PASSWORD='choose-one' npm start   # http://localhost:8080
```

Point the game at the dashboard by setting `expo.extra.apiUrl` in `app.json`
(for a phone on the same Wi-Fi during development, use your computer's LAN address, e.g.
`http://192.168.1.20:8080`; for real use, the HTTPS address of the deployed dashboard).
See [dashboard/README.md](dashboard/README.md).

> **Expo Go:** the game only uses modules that are bundled in Expo Go (expo-sqlite, expo-speech,
> expo-haptics, expo-audio, react-native-svg, react-native-reanimated), so it is designed to open in
> the Expo Go app that matches SDK 58. This was **not** tested on a physical phone in the build
> environment (no Android SDK/emulator was available there). Use a preview APK for real-device and
> low-end testing.

### Android build (APK)

```bash
# Option A — cloud build (no Android Studio needed)
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview      # installable APK

# Option B — local build (needs Android SDK + JDK 17+)
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease     # APK in android/app/build/outputs/apk/release/
```

See [docs/BUILD.md](docs/BUILD.md) for signing and release details.

## Testing

```bash
npm test              # 7 Jest suites: content, scoring, engine, SQLite, story, mini-games, sync↔dashboard
npm run typecheck     # strict TypeScript
npm run export:android  # verifies the full Android JS bundle compiles
cd dashboard && npm test  # dashboard server tests
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | How to play, for students and teachers |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Code structure, data model, persistence, scheduling, limitations |
| [docs/MEASUREMENT.md](docs/MEASUREMENT.md) | RIASEC & ability design, scoring models, what is and is not validated |
| [docs/TESTING.md](docs/TESTING.md) | Test suites, what they prove, how to run the E2E playthrough |
| [docs/BUILD.md](docs/BUILD.md) | Android builds, signing, release checklist |
| [dashboard/README.md](dashboard/README.md) | Results dashboard: running, deploying, using, API |
| [docs/Naya-Shehar-Game-Design-and-Measurement.pdf](docs/Naya-Shehar-Game-Design-and-Measurement.pdf) | Full gameplay, journey, screens and measurement document |

## Content at a glance

| Item | Count |
|---|---|
| Districts | 6 (Workshop Lane, Science Corner, Rang Bazaar, Community Square, Market Road, Records House) |
| Buildings | 24, each with 5 visible construction stages |
| Characters | 7 original (Baji Saima, Ustad Rafiq, Dr Hina, Kamran, Zoya, Bilal, Ayesha) |
| Forced-choice scenarios | 30 (all 15 RIASEC pairs × 2, second showing sides swapped) |
| Weekly planner sets | 4 × 6 activities |
| Activity mini-games | 6 (one per kind of work, unscored) |
| Ability puzzles | 96 (6 families × 16, four levels × 4) + 2 practice |
| Game screens | 28+ (including Join your class) |
| Dashboard pages | Login, classes, class overview, student report, teachers, CSV export |
