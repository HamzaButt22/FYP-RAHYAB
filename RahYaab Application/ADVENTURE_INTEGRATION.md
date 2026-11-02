# RahYaab app - setup and how it works

> **Since the requirements update:** accounts, assessments and results live on the RahYaab server.
> See REQUIREMENTS_TRACEABILITY.md for every requirement and where it is implemented.

## First-time setup (server)

```powershell
cd D:\RahYaab\rahyaab
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt             # if pandas is blocked by Windows: pip install "pandas==2.2.3"
python -m tools.create_admin --email team@rahyaab.pk --name "RahYaab Team"   # asks for a password
$env:RAHYAAB_REQUIRE_USER_AUTH="1"           # game uploads only with the student's own login
python -c "from backend.app import main; main(host='0.0.0.0')"
```

Then in the app: log in as the platform admin -> Schools -> add a school (shows the school admin's temporary
password once) -> the school admin adds students. Individual students register themselves; activate their
subscription under Students.

Optional server settings: `RAHYAAB_SMTP_HOST`, `RAHYAAB_SMTP_PORT`, `RAHYAAB_SMTP_USER`, `RAHYAAB_SMTP_PASSWORD`,
`RAHYAAB_SMTP_FROM` (password-reset emails; without them emails are saved in `data/outbox`), `RAHYAAB_PUBLIC_URL`
(link in reset emails), `RAHYAAB_EXPORT_SECRET` (stable export pseudonyms), `RAHYAAB_TOKEN_DAYS` (login length,
default 30), `RAHYAAB_TRUST_PROXY=1` (behind nginx/Caddy).

## The app
* Server address: built in (`.env` / `eas.json`) or set on the login screen ("🔌 Server").
* Student: Home -> Start assessment -> consent -> Part 1 Adventure (levels 1-6) -> Part 2 questions -> results.
* Tests: `npm test` (167), browser end-to-end: `e2e/requirements.e2e.js` (instructions in the file).

---

## Earlier notes (game integration)

# RahYaab Adventure in the RahYaab app

The 8-level RahYaab game (converted from the Python/Pygame version) is now part of this app as **"Adventure"**, next to
the 5 mini-games. It runs inside the app (no WebView, no second app). Scores come from the RahYaab server (Flask +
Python scoring, the same code as the desktop game); the app keeps a small summary and builds career matches with its
own engine (`src/scoring.js`).

## Where it appears

| Place | What the student sees |
|---|---|
| Home | **Adventure assessment** card -> *Start adventure* (all 8 levels) and, after one is finished, *Latest adventure report* |
| Games tab | **RahYaab Adventure** card -> *Play the adventure* (game menu: tracks, Level Select, Instructions) |
| History | Adventures listed with the mini-game assessments (`🗺️ Adventure · N levels · code`) |
| Adventure report | Big Five + RIASEC from the server, best-fit career fields + roadmap (app engine), the scoring disclaimer |
| Admin | each student shows `🗺️ Adventure completed · code` |

Same rule as the mini-game assessment: an inactive subscription cannot start it.

## Files

| File | Role |
|---|---|
| `src/features/rahyaab-game/` | the game module (TypeScript): engine, 8 levels, touch UI, offline save/resume, upload |
| `src/screens/World.js` | opens the game full screen for the logged-in student; orientation; saves the result |
| `src/screens/WorldReport.js` | the app's Adventure report |
| `src/world.js` | converts the server report to the app's O/C/E/A/N and RIASEC format; per-student storage; server config |
| `src/store.js` | `startWorld`, `finishWorld`, `world`, `worldsOf`, `worldRecommend` (+ data migration: `worlds` list) |
| `src/screens/Student.js`, `Admin.js`, `Results.js`, `App.js` | entries above; `CareerCards` shared by both reports |
| `app.json` | `orientation: default` + `expo-screen-orientation` plugin (portrait app, landscape only while playing), `ios.requireFullScreen` |
| `app.config.js`, `eas.json` | demo (`preview`) builds may use http://; `production` builds are https-only |
| `src/screens/Admin.js` | **🔌 RahYaab server** card: address, Test connection, Save |

## Setup

```bash
npm install
cp .env.example .env            # set EXPO_PUBLIC_RAHYAAB_API_URL (see the comments in the file)
npx expo start
```

Start the RahYaab server (in the RahYaab backend repo): `python run.py dashboard` for local work, or
`gunicorn wsgi:app` behind HTTPS for real use (see MOBILE_INTEGRATION.md there).
Android emulator -> `http://10.0.2.2:5000`. A real phone needs the laptop's LAN IP and the server listening on
`0.0.0.0` (development builds only; production must be `https://`). Without a URL the Adventure shows
"not available" instead of crashing.

`react-native-svg` and `expo-screen-orientation` are included in Expo Go, so no development build is needed.

### Server address in an installed app (APK)
The address can be changed **inside the app**, so a new laptop IP never needs a new build:
log in as the school admin -> **🔌 RahYaab server** -> enter `http://<laptop IP>:5000` -> **Test connection** -> **Save**.
It is stored on that phone and overrides the address built into the app (`.env`). Only the admin can change it.

Builds:

| Profile | Command | http:// to a laptop |
|---|---|---|
| `preview` (demo APK) | `npx eas-cli@latest build -p android --profile preview` | allowed (`EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP=1` in `eas.json`; `app.config.js` turns on Android cleartext traffic) |
| `production` | `npx eas-cli@latest build -p android --profile production` | blocked: use an `https://` server |

`.env` is **not** uploaded to EAS (it is git-ignored), so an APK only knows the address set in the Admin screen
(or one added to the profile's `env` in `eas.json`). Install the new APK over the old one; data on the phone is kept.

## How it behaves
* **Saved as you play.** Closing the app mid-level is fine: the next time the student opens the Adventure it offers to continue.
  Each student has a separate save (shared school phones/tablets).
* **Offline.** Levels play offline; results need the server. If it cannot be reached at the end, the student is told the game is saved on the phone and it finishes later.
* **Honest results.** The report is stored only after the server returned it. Traits the levels played could not measure say "Not enough data" (a neutral value is used for career matching and the card says so). Career matches need both personality (levels 1-6) and interests (levels 7-8).
* Android back button pauses the game; quitting needs confirmation.

## Tests

```bash
npm test             # 163 tests: game module (129) + app integration (34)
npm run typecheck
```

`src/__tests__/appAdventure.test.js` drives the real `App.js`: register, log in, Adventure, play a level by touch,
server report, Adventure report, History, Admin. `e2e/adventure.e2e.js` does the same in a browser against the real server
(instructions at the top of the file); `e2e/admin-server.e2e.js` checks the APK case (no address built in, set by the admin).

## Known limits
* Not yet tried on a physical phone (only bundles + tests + browser run). Check frame rate in levels 4-5 and the orientation switch on a real device.
* The game screens keep the game's own dark-blue look, the rest of the app is purple.
* The game was designed for ages 8-13; this app's students are grades 9-12. Content and scoring norms should be reviewed for that age group.
