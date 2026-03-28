#!/bin/bash
set -euo pipefail

# Usage:
#   ./restore-db.sh /absolute/path/to/backup.sql.gz

BACKUP_FILE="${1:-}"
CONTAINER="${DB_CONTAINER:-can-antika-db}"
DB_NAME="${POSTGRES_DB:-can_antika_db}"
DB_USER="${POSTGRES_USER:-can_user}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Kullanim: ./restore-db.sh /path/to/backup.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup dosyasi bulunamadi: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restore basladi: $BACKUP_FILE"

gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

echo "[$(date)] Restore tamamlandi."
