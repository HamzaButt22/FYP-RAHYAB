# Kubernetes (optional deployment path)

The pilot runs on **one VM with Docker Compose** (`infra/docker`, `docs/devops/DEPLOYMENT.md`): it is cheaper and simpler at pilot scale. These manifests are the ready path for when Rahyaab outgrows one server (more schools, a university or government host that runs Kubernetes, or a need for zero-downtime rolling updates). They work on any cluster, including a single-node **k3s** server.

## Layout

| Path | What |
|---|---|
| `base/` | Namespace (Pod Security "restricted"), config, PostgreSQL StatefulSet, API (Deployment, Service, PodDisruptionBudget, HorizontalPodAutoscaler, migration Job), jobs worker, nightly backup CronJob, dashboard, Ingress (cert-manager TLS), NetworkPolicies (default deny) |
| `overlays/staging/` | Namespace `rahyaab-staging`, staging hosts, 1 API replica minimum, `latest-main` images |
| `overlays/production/` | Namespace `rahyaab`, production hosts, 2 API replicas minimum, version-tagged images |

Every pod runs as a non-root user, with a read-only root filesystem, all Linux capabilities dropped and no service-account token.

## Check the manifests (no cluster needed)

```bash
kubectl kustomize infra/k8s/overlays/staging
```

## Before the first deploy

The cluster needs an ingress controller (Traefik ships with k3s) and cert-manager with a ClusterIssuer named `letsencrypt`. Then create the secrets; they are never stored in Git:

```bash
kubectl create namespace rahyaab-staging
```

```bash
kubectl -n rahyaab-staging create secret generic rahyaab-db --from-literal=username=rahyaab_admin --from-literal=password='<strong password>'
```

```bash
kubectl -n rahyaab-staging create secret generic rahyaab-api --from-literal=database-url='postgresql+psycopg://api_rw:<pw>@postgres:5432/rahyaab' --from-literal=jobs-database-url='postgresql+psycopg://jobs:<pw>@postgres:5432/rahyaab' --from-literal=migrator-database-url='postgresql+psycopg://rahyaab_admin:<pw>@postgres:5432/rahyaab' --from-literal=jwt-signing-key='<48+ random characters>'
```

```bash
kubectl -n rahyaab-staging create secret generic rahyaab-data-key --from-file=data_key_wrapper=./data_key_wrapper
```

```bash
kubectl -n rahyaab-staging create secret generic rahyaab-backup --from-env-file=./backup.env
```

`backup.env` holds the same variables as in `infra/docker/.env.example` (backup section). After the first migration, set the app roles' passwords with `database/set_role_passwords.sql` (run it as the admin in the postgres pod).

## Deploy

The `release` workflow deploys automatically when the GitHub environment variable `DEPLOY_TARGET` is `k8s` and the `KUBECONFIG` secret is set. By hand:

```bash
kubectl apply -k infra/k8s/overlays/staging
```

## Notes

- Security headers (HSTS, CSP, frame options) are added by Caddy in the Compose setup. On Kubernetes, add them with your ingress controller's header middleware before production.
- Narrow the `allow-ingress-to-web` NetworkPolicy to the ingress controller's namespace in each overlay.
- For production, a managed PostgreSQL 16 is preferred: remove `postgres.yaml` from the overlay and point the database URLs at it.
