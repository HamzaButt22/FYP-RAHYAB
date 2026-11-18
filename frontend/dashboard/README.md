# Rahyaab dashboard

React + Vite + TypeScript. The teacher, counsellor and admin screens are D-01 to D-11 and A-01 to A-05 in `design/screens/`.

**Built so far (18 Nov 2026):** staff sign-in with a two-step code (D-01, D-01b, D-01c, invite and reset links); your classes with the students worth a chat (D-02); a class roster with progress, best-fit path, confidence, form numbers and a CSV download (D-03); a printable student summary (D-04). Teachers see only consented students of their own classes (ADR-0017). Not yet: notes, class charts, consent-slip screens, school setup.
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
