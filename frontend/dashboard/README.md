# Rahyaab dashboard

React + Vite + TypeScript. The teacher, counsellor and admin screens (D-01 to D-11, A-01 to A-05 in `design/screens/`) are built in FYP-2; for now this is the shell, so CI, the Docker image and deployment work from the start.

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
