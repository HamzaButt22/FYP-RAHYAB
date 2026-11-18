# Rahyaab dashboard image: build the static site, then serve it with Caddy (no Node at run time).
# Build from the repository root: docker build -f frontend/dashboard/Dockerfile -t rahyaab-dashboard .
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY design/tokens/tokens.css design/tokens/tokens.css
# Files the dashboard imports from design/ (src/main.tsx, src/Roster.tsx); keep in step with Dockerfile.dockerignore.
COPY design/brand/logo/svg/branch-light.svg design/brand/logo/svg/branch-light.svg
COPY frontend/dashboard/package.json frontend/dashboard/pnpm-lock.yaml frontend/dashboard/pnpm-workspace.yaml frontend/dashboard/
WORKDIR /repo/frontend/dashboard
RUN pnpm install --frozen-lockfile
COPY frontend/dashboard/ ./
# The API the dashboard calls (src/api.ts). Staging builds pass --build-arg VITE_API_URL=https://staging.api.rahyaab.pk.
ARG VITE_API_URL=https://api.rahyaab.pk
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM caddy:2-alpine
# Runs as any non-root user with a read-only root filesystem: Caddy's state goes to /tmp (a tmpfs or emptyDir).
ENV XDG_CONFIG_HOME=/tmp/config XDG_DATA_HOME=/tmp/data
COPY --from=build /repo/frontend/dashboard/dist /srv/dashboard
COPY infra/docker/Caddyfile.dashboard /etc/caddy/Caddyfile
EXPOSE 8080
