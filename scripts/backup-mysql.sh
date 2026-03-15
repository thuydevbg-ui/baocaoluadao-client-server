#!/bin/bash

# MySQL Backup Script for baocaoluadao.com
# Creates compressed backup with date format (YYYYMMDD)
# Usage: ./scripts/backup-mysql.sh
# 
# For cron job, set ENV_FILE env var or it will auto-detect:
#   ENV_FILE=/var/www/baocaoluadao.com/.env.production ./scripts/backup-mysql.sh

set -euo pipefail

# Detect script directory for env file location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Try to load env file if not already loaded
if [ -z "${DB_HOST:-}" ] || [ -z "${DB_USER:-}" ]; then
    # Check common env file locations
    for env_file in "$PROJECT_DIR/.env.production" "$PROJECT_DIR/.env" ".env.production" ".env"; do
        if [ -f "$env_file" ]; then
            echo "Loading environment from $env_file"
            set -a
            source "$env_file"
            set +a
            break
        fi
    done
fi

# Configuration - can be overridden by environment variables
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-baocaoluadao}"
DB_PORT="${DB_PORT:-3306}"

# Backup directory - use project backups dir for non-root, /var/backups for production
if [ "$(id -u)" = "0" ]; then
    BACKUP_DIR="${BACKUP_DIR:-/var/backups/baocaoluadao}"
else
    BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
fi

DATE_FORMAT="%Y%m%d"
TIMESTAMP=$(date +"$DATE_FORMAT")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Log file
LOG_FILE="$BACKUP_DIR/backup.log"

# Tables to exclude (system tables that can be large and not needed)
EXCLUDE_TABLES=(
    "mysql.*"
    "information_schema.*"
    "performance_schema.*"
    "sys.*"
)

echo "========================================="
echo "MySQL Backup Script"
echo "========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Timestamp: $TIMESTAMP"
echo "Output: $BACKUP_FILE"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Start logging
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..."

# Check if mysqldump is available
if ! command -v mysqldump &> /dev/null; then
    echo "ERROR: mysqldump not found. Please install MySQL client."
    exit 1
fi

# Build exclude options
EXCLUDE_ARGS=""
for table in "${EXCLUDE_TABLES[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --ignore-table=$table"
done

# Set mysqldump password if provided
export MYSQL_PWD="$DB_PASSWORD"

# Create backup with mysqldump
# Options:
# --single-transaction: Creates consistent backup without locking tables
# --quick: Dumps large tables row by row
# --set-gtid-purged=OFF: Disables GTID logging for easier restore
# --routines: Includes stored procedures and functions
# --triggers: Includes triggers
# --events: Includes scheduled events
# --add-drop-table: Adds DROP TABLE statements before CREATE
# --add-drop-database: Adds DROP DATABASE statement
# --create-options: Includes table engine options
# --complete-insert: Uses complete INSERT statements
# --default-character-set=utf8mb4: Uses UTF8MB4 encoding
# --tz-preserve: Preserves timezone info
# --hex-blob: Exports binary data as hex

mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --add-drop-database \
    --create-options \
    --complete-insert \
    --default-character-set=utf8mb4 \
    --hex-blob \
    --databases "$DB_NAME" \
    | gzip -9 > "$BACKUP_FILE"

# Check if backup was successful
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed successfully!"
    echo "Backup file: $BACKUP_FILE"
    echo "Backup size: $BACKUP_SIZE"
    
    # Clean up old backups (keep last 7 days)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up old backups (keeping last 7 days)..."
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete
    
    # List remaining backups
    echo ""
    echo "Current backups:"
    ls -lh "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null || echo "No other backups found"
    
    exit 0
else
    echo "ERROR: Backup failed or file is empty"
    exit 1
fi
