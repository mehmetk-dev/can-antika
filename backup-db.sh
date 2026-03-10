#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  PostgreSQL otomatik yedekleme scripti                         ║
# ║  Crontab ile kullanım:                                         ║
# ║  0 3 * * * /path/to/backup-db.sh >> /var/log/db-backup.log 2>&1║
# ╚══════════════════════════════════════════════════════════════════╝

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
CONTAINER="${DB_CONTAINER:-can-antika-db}"
DB_NAME="${POSTGRES_DB:-can_antika_db}"
DB_USER="${POSTGRES_USER:-can_user}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="can_antika_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Yedekleme başlıyor: $DB_NAME"

docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "[$(date)] Yedek oluşturuldu: $FILENAME ($SIZE)"

# Eski yedekleri sil
DELETED=$(find "$BACKUP_DIR" -name "can_antika_*.sql.gz" -mtime +"$KEEP_DAYS" -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] $DELETED eski yedek silindi (>${KEEP_DAYS} gün)"
fi

echo "[$(date)] Yedekleme tamamlandı."
