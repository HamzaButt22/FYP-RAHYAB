# Rahyaab dashboard image: build the static site, then serve it with Caddy (no Node at run time).
# Build from the repository root: docker build -f frontend/dashboard/Dockerfile -t rahyaab-dashboard .
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY design/tokens/tokens.css design/tokens/tokens.css
COPY frontend/dashboard/package.json frontend/dashboard/pnpm-lock.yaml frontend/dashboard/pnpm-workspace.yaml frontend/dashboard/
WORKDIR /repo/frontend/dashboard
RUN pnpm install --frozen-lockfile
COPY frontend/dashboard/ ./
RUN pnpm build

FROM caddy:2-alpine
# Runs as any non-root user with a read-only root filesystem: Caddy's state goes to /tmp (a tmpfs or emptyDir).
ENV XDG_CONFIG_HOME=/tmp/config XDG_DATA_HOME=/tmp/data
COPY --from=build /repo/frontend/dashboard/dist /srv/dashboard
COPY infra/docker/Caddyfile.dashboard /etc/caddy/Caddyfile
EXPOSE 8080
