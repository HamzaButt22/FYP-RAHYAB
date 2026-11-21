# Valley Explorer — RahYaab assessment module (React Native / Expo)

Valley Explorer is an 8-stop mobile game that produces **RIASEC interest evidence** and **ability evidence** for RahYaab's pathway workflow. It replaces the earlier desktop Pygame prototype (`RahYaab-BigFive-Game_demo3`), whose level designs, event vocabulary and RIASEC scoring it reuses.

> **Status:** working prototype. No score from this game is a validated psychological measure. See `docs/SCORING.md` and `COMPLETION_REPORT.md`.

## Requirements
- Node.js 20 or newer (tested with Node 22.23), npm 10
- An Android phone with **Expo Go for SDK 58** (Play Store), on the same Wi-Fi network as your computer
- Optional (backend integration test): Python 3.10+ and the Python project folder

## Run on an Android phone with Expo Go
```bash
cd valley-explorer
npm install
npx expo start
```
1. Open **Expo Go** on the phone and scan the QR code shown in the terminal.
2. On the demo host screen: type a participant code (e.g. `RY-TEST-01`), switch on both consent toggles, then tap **Open Valley Explorer**.

If the phone cannot reach your computer (different networks or a school network that blocks it), use `npx expo start --tunnel`. The first run asks to install `@expo/ngrok`; answer yes.

To send events to the original Python backend instead of keeping them in memory:
```bash
# terminal 1 (Python project folder, with the backend changes from this delivery)
python -c "from backend.app import main; main(host='0.0.0.0')"   # listens on your Wi-Fi network so the phone can reach it; note your computer's LAN IP
# (`python run.py dashboard` only listens on 127.0.0.1, which the phone cannot reach)
# terminal 2
EXPO_PUBLIC_VE_BACKEND_URL=http://<your-LAN-IP>:5000 npx expo start
```
On Windows `cmd`, run `set EXPO_PUBLIC_VE_BACKEND_URL=http://<your-LAN-IP>:5000` first, then `npx expo start`.

## How to play
The game opens in **landscape** (turn the phone sideways). Press **⟳ Rotate** in the valley's top bar to switch to portrait and back; the choice is remembered.
- **Walk:** tap anywhere on the ground to walk there, or touch the round **joystick** (bottom-left) and slide your thumb; hold it to keep walking.
- **Use things:** tap a person, sign, bench or building — your traveller walks to it and uses it. Or stand next to it and press the orange **Action** button (bottom-right), which always says what it will do.
- **Where next?** The orange arrow at the edge of the screen points to the next place; tap it to walk there.
- After each stop, a short Traveller's Journal page asks 2–3 "How much is this like you?" statements (Big Five); tap an answer or skip.
- In activities, drag the item onto the glowing target (or tap the item, then the target), tap, or press and hold, as the card says.

## Quality checks
| Command | What it does |
|---|---|
| `npm test` | 109 unit, scoring-parity, session-recovery and UI tests (Jest + React Native Testing Library) |
| `npm run typecheck` | TypeScript strict check |
| `npx expo lint` | ESLint (Expo config) |
| `BACKEND_DIR=/path/to/RahYaab-BigFive-Game_demo3 npm run test:integration` | Starts the real Flask backend and uploads a full bot playthrough through it |
| `npx expo export --platform android` | Builds the Android Hermes bundle (verifies the app compiles for Android) |

## Project layout
```
App.tsx                      DEMO HOST (stand-in for RahYaab sign-in/consent) — replace in RahYaab
src/valley/                  the module; RahYaab imports only from src/valley/index.ts
  contract/                  event envelope, validation, version constants
  core/                      pure TypeScript: journey, item banks, level machines, RIASEC + ability scoring
  services/                  storage, durable outbox, sync, sinks, GameSession
  game/                      walkable world (tile engine, arrow pad, Action button), avatar, mini-games, rewards
  ui/ levels/ screens/       React Native presentation only
  testing/bots.ts            scripted players driving the real level logic
  __tests__/ __integration__/
tools/                       parity-fixture generator (runs the original Python scorer), integration runner
docs/                        ARCHITECTURE, SCORING, INTEGRATION, BIG_FIVE
```
Further reading: `docs/INTEGRATION.md` (how to plug into RahYaab) and `COMPLETION_REPORT.md`.
