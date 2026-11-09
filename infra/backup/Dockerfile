# Nightly backup image: pg_dump -> age (public key only) -> rclone to off-site object storage.
# Build: docker build -t rahyaab-backup infra/backup
FROM postgres:18-alpine
RUN apk add --no-cache age rclone
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod 0755 /usr/local/bin/backup.sh
USER 70
ENTRYPOINT ["/usr/local/bin/backup.sh"]
CMD ["loop"]
