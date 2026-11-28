# Naya Shehar — Results Dashboard

The website where teachers and counsellors see their students' Naya Shehar progress and career
guidance results. The same server also receives uploads from the mobile game.

- Node.js 22.13+ and Express; data in a built-in SQLite file (`node:sqlite`, no native modules)
- Server-rendered pages, no front-end build step
- Teacher accounts with roles (admin / teacher); each teacher sees only their own classes

## Run locally

```bash
cd dashboard
npm install
ADMIN_USER=admin ADMIN_PASSWORD='choose-a-strong-password' npm start
# → http://localhost:8080
```

If `ADMIN_PASSWORD` is not set on the first start, a random password is printed in the console.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `DATA_DIR` | `./data` | Folder for `naya-shehar.db` (keep it on a persistent disk) |
| `ADMIN_USER` / `ADMIN_PASSWORD` | `admin` / random | First admin account, created once |
| `COOKIE_SECURE` | off | Set to `1` when served over HTTPS |

## Deploy (example: Render)

1. Push this repository to GitHub.
2. On Render: **New › Web Service**, root directory `dashboard`, build `npm install`, start `npm start`.
3. Add a **persistent disk** mounted at `/var/data` and set `DATA_DIR=/var/data`.
4. Set `ADMIN_PASSWORD`, `COOKIE_SECURE=1`.
5. Put the service URL (for example `https://naya-shehar.onrender.com`) into the game:
   `app.json › expo.extra.apiUrl`, then build the APK.

Any host that runs Node 22 with a persistent disk works (Railway, Fly.io, a VPS). Always use HTTPS:
release Android builds refuse plain `http://` connections. A plain `http://` LAN address only works with
development builds (`npx expo start`).

## Using it

1. Log in as admin. Under **Teachers**, add teacher accounts.
2. Create a **class**. The dashboard shows a 6-digit **class code**.
3. Students enter the class code and their roll number in the game (during setup, or later in Settings › Class & dashboard).
4. Results appear as students play. Each upload happens automatically when the phone is online.

**Class page:** students joined, progress per chapter, strongest interests across the class, first
suggested paths, a filterable student table, and CSV export.
**Student page:** progress, interest profile with evidence labels, suggested paths with reasons and
Plan B, puzzle strengths with the difficulty path, choices and weekly plans, and a print view.

## API used by the game

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health` | Health check |
| `POST /api/v1/classes/lookup` `{code}` | Confirms a class code exists (join screen) |
| `POST /api/v1/sync` | Upload: device id, class code, roll number, nickname, progress, results snapshot and new events |

The first upload from a phone returns a secret token. Later uploads for that phone must include
it, so no other phone can overwrite a student's results. Events are stored once per
`(device, seq)`, so repeated uploads are harmless.

## Demo data

With the server running:

```bash
cd ..   # project root
DEMO_URL=http://localhost:8080 DEMO_USER=admin DEMO_PASS='your-admin-password' npm run seed:demo
```

This plays 28 simulated students through the real game engine and uploads them into a class called
"Class 9 Blue".

## Tests

```bash
npm test     # 9 tests: login/CSRF, roles, uploads, tokens, idempotency, escaping, CSV, archive
```

## Data and privacy

Stored per student: class, roll number, nickname, avatar choices, progress, results and game
events. No names, phone numbers or emails are collected by the game. Teachers match roll numbers to
students themselves. Get consent from the school and from parents or guardians before collecting
student data, and keep the server behind HTTPS.
