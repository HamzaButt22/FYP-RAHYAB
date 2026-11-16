# Rahyaab dashboard

React + Vite + TypeScript. The teacher, counsellor and admin screens are D-01 to D-11 and A-01 to A-05 in `design/screens/`.

**Built so far (15 Nov 2026):** D-03 class roster, with sample data until staff sign-in and the dashboard API exist (the page says so).
- **Language:** English only (ADR-0016). All text is in `src/messages/en.json`; `src/i18n.tsx` looks it up with `{{placeholders}}`.
- **Fonts:** self-hosted in `public/fonts/` (Plus Jakarta Sans, Bricolage Grotesque; SIL Open Font License, licence files beside them), so no request goes to Google.
- **Layout rules** (`src/app.css`): no fixed heights or overflow clipping on text; checked in the browser at 1280, 900 and 375 px and at 200% zoom.

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
