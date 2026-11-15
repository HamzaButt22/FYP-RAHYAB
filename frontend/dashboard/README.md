# Rahyaab dashboard

React + Vite + TypeScript. The teacher, counsellor and admin screens are D-01 to D-11 and A-01 to A-05 in `design/screens/`.

**Built so far (15 Nov 2026):** D-03 class roster, in English and Urdu, with sample data until staff sign-in and the dashboard API exist (the page says so).
- **Languages:** `src/messages/en.json` and `ur.json` (same keys; `src/i18n.test.ts` checks), `src/i18n.tsx` sets `<html lang dir>` with the language and remembers the choice in the browser. Urdu text is a draft until a native speaker reviews it.
- **Fonts:** self-hosted in `public/fonts/` (Gulzar for Urdu, Plus Jakarta Sans, Bricolage Grotesque; all SIL Open Font License, licence files beside them), so no request goes to Google.
- **Urdu layout rules** (`src/app.css`): logical properties only, Gulzar with line-height 2.4 for text and 2.0 for labels and buttons, no fixed heights or overflow clipping on text; checked in the browser at 1280, 900 and 375 px and at 200% zoom.

```bash
pnpm install
```

```bash
pnpm dev
```

Checks CI runs: `pnpm typecheck`, `pnpm test`, `pnpm build` (and a check that the build has no inline scripts, which the CSP forbids).

**Docker image** (built from the repository root, static files served by Caddy on port 8080):

```bash
docker build -f frontend/dashboard/Dockerfile -t rahyaab-dashboard .
```
