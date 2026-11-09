#!/bin/sh
# Nightly encrypted, off-site PostgreSQL backup (DATA_GOVERNANCE.md, DEPLOYMENT.md).
#   backup.sh once   one backup now (Kubernetes CronJob)
#   backup.sh loop   one backup every night at 02:00 PKT (Docker Compose)
# Needs: PGHOST, PGDATABASE, PGUSER, PGPASSWORD (a read-only backup role), AGE_RECIPIENT (public key),
#        RCLONE_REMOTE (e.g. "offsite:rahyaab-backups") and the remote itself as RCLONE_CONFIG_OFFSITE_* variables.
set -eu

run_once() {
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  out="/tmp/rahyaab-${stamp}.sql.gz.age"
  pg_dump --no-owner --format=plain | gzip -9 | age -r "${AGE_RECIPIENT}" > "${out}"
  rclone copyto "${out}" "${RCLONE_REMOTE}/rahyaab-${stamp}.sql.gz.age"
  rm -f "${out}"
  # keep 30 nightly copies off-site
  rclone delete --min-age 30d "${RCLONE_REMOTE}"
  echo "backup ${stamp} done"
}

case "${1:-loop}" in
  once) run_once ;;
  loop)
    while true; do
      now=$(date -u +%s)
      next=$(date -u -d "$(date -u +%Y-%m-%d) 21:00:00" +%s 2>/dev/null || echo $((now + 86400)))
      [ "${next}" -le "${now}" ] && next=$((next + 86400))
      sleep $((next - now))
      run_once || echo "backup failed" >&2
    done ;;
  *) echo "usage: backup.sh once|loop" >&2; exit 2 ;;
esac
