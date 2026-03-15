#!/bin/bash
#
# =============================================================================
# MySQL Backup Script for baocaoluadao.com
# =============================================================================
# 
# Description:
#   Production-ready MySQL backup script with comprehensive features including
#   locking, error handling, notifications, and retention policies.
#
# Usage:
#   ./backup-mysql.sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -v, --verbose           Enable verbose output
#   -d, --dry-run           Perform a dry run without actual backup
#   -r, --retention DAYS    Number of backups to retain (default: 7)
#   -c, --compress-level    Gzip compression level 1-9 (default: 6)
#   -e, --env-file FILE     Path to environment file
#
# Environment Variables:
#   DB_HOST         Database host (default: localhost)
#   DB_PORT         Database port (default: 3306)
#   DB_NAME         Database name (default: baocaoluadao)
#   DB_USER         Database user (required)
#   DB_PASSWORD     Database password (required)
#   BACKUP_DIR      Backup directory (auto-detected)
#   RETENTION_DAYS  Number of backups to retain (default: 7)
#   WEBHOOK_URL     URL for notifications on success/failure
#   COMPRESS_LEVEL  Gzip compression level 1-9 (default: 6)
#
# Exit Codes:
#   0   - Success
#   1   - General error
#   2   - Missing dependencies
#   3   - Database connection failed
#   4   - Backup creation failed
#   5   - Backup compression failed
#   6   - Backup verification failed
#   7   - Lock file exists (another backup running)
#   8   - Disk space issue
#   9   - Notification failed
#
# =============================================================================

set -o pipefail

# =============================================================================
# Configuration and Defaults
# =============================================================================

# Script metadata
SCRIPT_NAME="$(basename "$0")"
SCRIPT_VERSION="1.0.0"
SCRIPT_AUTHOR="baocaoluadao.com"

# Default configuration
DEFAULT_RETENTION_DAYS=7
DEFAULT_COMPRESS_LEVEL=6
DEFAULT_DB_PORT=3306
DEFAULT_DB_NAME="baocaoluadao"
LOCK_FILE_TIMEOUT=3600  # 1 hour

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Global Variables (can be overridden by environment)
# =============================================================================

# Command-line flags
VERBOSE=false
DRY_RUN=false
RETENTION_DAYS="${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}"
COMPRESS_LEVEL="${COMPRESS_LEVEL:-$DEFAULT_COMPRESS_LEVEL}"
ENV_FILE=""

# Database configuration (can be overridden by env vars or env file)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-$DEFAULT_DB_PORT}"
DB_NAME="${DB_NAME:-$DEFAULT_DB_NAME}"
DB_USER="${DB_USER:-}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Runtime variables
LOCK_FILE=""
BACKUP_FILE=""
LOG_FILE=""
START_TIME=""
END_TIME=""
EXIT_CODE=0

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    
    case "$level" in
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message" >&2
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message" >&2
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        INFO)
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        *)
            echo "[$level] $message"
            ;;
    esac
    
    # Also write to log file if available
    if [[ -n "$LOG_FILE" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "$1"
    fi
}

show_help() {
    sed -n '/^#==/,/^#==/p' "$0" | sed 's/^#//g'
    exit 0
}

# =============================================================================
# Signal Handling
# =============================================================================

cleanup() {
    local exit_status=$?
    local signal=$1
    
    log "WARN" "Received $signal, cleaning up..."
    
    # Remove lock file if we created it
    if [[ -n "$LOCK_FILE" && -f "$LOCK_FILE" ]]; then
        rm -f "$LOCK_FILE"
        verbose "Removed lock file"
    fi
    
    # Calculate duration
    if [[ -n "$START_TIME" ]]; then
        END_TIME=$(date +%s)
        local duration=$((END_TIME - START_TIME))
        log "INFO" "Script completed in ${duration}s with exit code $exit_status"
    fi
    
    exit $exit_status
}

trap_cleanup() {
    cleanup "SIGTERM"
}

trap 'trap_cleanup SIGTERM; exit 1' SIGTERM
trap 'trap_cleanup SIGINT; exit 1' SIGINT
trap 'trap_cleanup EXIT' EXIT

# =============================================================================
# Dependency Checks
# =============================================================================

check_dependencies() {
    local missing_deps=()
    
    # Check for required commands
    for cmd in mysqldump gzip date rm mkdir rmdir cat du find logger; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "Missing required dependencies: ${missing_deps[*]}"
        log "ERROR" "Please install them and try again"
        exit 2
    fi
    
    verbose "All dependencies satisfied"
}

# =============================================================================
# Configuration Loading
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -r|--retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            -c|--compress-level)
                COMPRESS_LEVEL="$2"
                shift 2
                ;;
            -e|--env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help
                ;;
        esac
    done
    
    # Validate compression level
    if ! [[ "$COMPRESS_LEVEL" =~ ^[1-9]$ ]]; then
        log "ERROR" "Invalid compression level: $COMPRESS_LEVEL (must be 1-9)"
        exit 1
    fi
    
    # Validate retention days
    if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
        log "ERROR" "Invalid retention days: $RETENTION_DAYS"
        exit 1
    fi
}

load_environment() {
    # If env file specified, source it
    if [[ -n "$ENV_FILE" ]]; then
        if [[ -f "$ENV_FILE" ]]; then
            verbose "Loading environment from $ENV_FILE"
            set -a
            source "$ENV_FILE"
            set +a
        else
            log "ERROR" "Environment file not found: $ENV_FILE"
            exit 1
        fi
    else
        # Auto-detect env file
        local script_dir
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        local project_dir
        project_dir="$(dirname "$script_dir")"
        
        for env_file in "$project_dir/.env.production" "$project_dir/.env" ".env.production" ".env"; do
            if [[ -f "$env_file" ]]; then
                verbose "Auto-detected environment file: $env_file"
                set -a
                source "$env_file"
                set +a
                break
            fi
        done
    fi
    
    # Override with command-line arguments if provided
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-$DEFAULT_DB_PORT}"
    DB_NAME="${DB_NAME:-$DEFAULT_DB_NAME}"
}

detect_backup_directory() {
    # If BACKUP_DIR is explicitly set, use it
    if [[ -n "$BACKUP_DIR" ]]; then
        verbose "Using explicitly set BACKUP_DIR: $BACKUP_DIR"
        return 0
    fi
    
    # Auto-detect based on user
    if [[ "$(id -u)" == "0" ]] || [[ -w "/var/backups" ]]; then
        BACKUP_DIR="/var/backups/baocaoluadao"
    else
        # Use project directory
        local script_dir
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        BACKUP_DIR="$script_dir/backups"
    fi
    
    verbose "Detected BACKUP_DIR: $BACKUP_DIR"
}

# =============================================================================
# Pre-Backup Checks
# =============================================================================

validate_configuration() {
    # Check required variables
    if [[ -z "$DB_USER" ]]; then
        log "ERROR" "DB_USER is required but not set"
        exit 1
    fi
    
    if [[ -z "$DB_PASSWORD" ]]; then
        log "ERROR" "DB_PASSWORD is required but not set"
        exit 1
    fi
    
    verbose "Configuration validated"
}

check_disk_space() {
    local required_mb=1000  # Require at least 1GB free
    local available_mb
    
    available_mb=$(df -m "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    
    if [[ $available_mb -lt $required_mb ]]; then
        log "ERROR" "Insufficient disk space: ${available_mb}MB available, ${required_mb}MB required"
        exit 8
    fi
    
    verbose "Sufficient disk space available: ${available_mb}MB"
}

acquire_lock() {
    LOCK_FILE="$BACKUP_DIR/.backup.lock"
    
    # Check if lock file exists
    if [[ -f "$LOCK_FILE" ]]; then
        # Check if process is still running
        local lock_pid
        lock_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        
        if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
            log "ERROR" "Another backup process is already running (PID: $lock_pid)"
            log "ERROR" "If you're sure no backup is running, remove $LOCK_FILE"
            exit 7
        else
            log "WARN" "Stale lock file found, removing..."
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Create lock file
    echo $$ > "$LOCK_FILE"
    verbose "Lock file created: $LOCK_FILE"
}

test_database_connection() {
    verbose "Testing database connection..."
    
    export MYSQL_PWD="$DB_PASSWORD"
    
    if ! mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --silent 2>/dev/null; then
        log "ERROR" "Cannot connect to database at $DB_HOST:$DB_PORT"
        log "ERROR" "Please verify DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD"
        exit 3
    fi
    
    verbose "Database connection successful"
    
    # Get database size
    local db_size
    db_size=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -N -e \
        "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) \
         FROM information_schema.tables \
         WHERE table_schema = '$DB_NAME';" 2>/dev/null)
    
    if [[ -n "$db_size" ]]; then
        verbose "Database size: ${db_size}MB"
    fi
}

# =============================================================================
# Backup Operations
# =============================================================================

create_backup_directory() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        
        if [[ $? -ne 0 ]]; then
            log "ERROR" "Failed to create backup directory: $BACKUP_DIR"
            exit 1
        fi
        
        verbose "Created backup directory: $BACKUP_DIR"
    fi
    
    # Set permissions (only if we're root)
    if [[ "$(id -u)" == "0" ]]; then
        chmod 755 "$BACKUP_DIR"
    fi
    
    LOG_FILE="$BACKUP_DIR/backup.log"
}

generate_backup_filename() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${timestamp}.sql.gz"
    verbose "Backup file: $BACKUP_FILE"
}

perform_backup() {
    log "INFO" "Starting backup of database '$DB_NAME'..."
    
    export MYSQL_PWD="$DB_PASSWORD"
    
    # Build mysqldump command
    local mysqldump_cmd=(
        mysqldump
        -h "$DB_HOST"
        -P "$DB_PORT"
        -u "$DB_USER"
        --single-transaction
        --quick
        --routines
        --triggers
        --events
        --add-drop-table
        --add-drop-database
        --create-options
        --complete-insert
        --default-character-set=utf8mb4
        --hex-blob
        --databases "$DB_NAME"
    )
    
    # Run mysqldump with compression
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would execute: mysqldump ..."
        return 0
    fi
    
    if ! "${mysqldump_cmd[@]}" | gzip -"$COMPRESS_LEVEL" > "$BACKUP_FILE" 2>&1; then
        log "ERROR" "Failed to create backup"
        rm -f "$BACKUP_FILE"
        exit 4
    fi
    
    verbose "Backup file created successfully"
}

verify_backup() {
    log "INFO" "Verifying backup..."
    
    # Check file exists
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log "ERROR" "Backup file not found: $BACKUP_FILE"
        exit 6
    fi
    
    # Check file size (minimum 1KB)
    local file_size
    file_size=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
    
    if [[ $file_size -lt 1024 ]]; then
        log "ERROR" "Backup file is too small (${file_size} bytes), likely corrupted"
        rm -f "$BACKUP_FILE"
        exit 6
    fi
    
    verbose "Backup file size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Verify gzip integrity
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "ERROR" "Backup file is corrupted (gzip test failed)"
        rm -f "$BACKUP_FILE"
        exit 6
    fi
    
    verbose "Gzip integrity verified"
    
    # Verify table count
    local expected_min_tables=20
    local actual_tables
    actual_tables=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | grep -c "^CREATE TABLE" || echo "0")
    
    if [[ $actual_tables -lt $expected_min_tables ]]; then
        log "WARN" "Backup may be incomplete: expected ~$expected_min_tables tables, found $actual_tables"
    else
        verbose "Verified $actual_tables tables in backup"
    fi
    
    log "SUCCESS" "Backup verified successfully"
}

cleanup_old_backups() {
    log "INFO" "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would delete backups older than $RETENTION_DAYS days"
        return 0
    fi
    
    # Find and delete old backups
    local deleted_count
    deleted_count=$(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
    
    verbose "Deleted $deleted_count old backup(s)"
    
    # Show remaining backups
    log "INFO" "Current backups:"
    find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -printf "%T@ %p\n" | \
        sort -rn | while read -r ts path; do
            local size
            size=$(du -h "$path" | cut -f1)
            local date
            date=$(date -d "@$ts" '+%Y-%m-%d %H:%M')
            echo "  $date - $size - $(basename "$path")"
        done
}

# =============================================================================
# Notification
# =============================================================================

send_notification() {
    local status="$1"  # success or failure
    local message="$2"
    
    if [[ -z "$WEBHOOK_URL" ]]; then
        verbose "No webhook URL configured, skipping notification"
        return 0
    fi
    
    # Prepare payload
    local payload
    payload=$(cat <<EOF
{
    "status": "$status",
    "message": "$message",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "backup_file": "$(basename "$BACKUP_FILE")",
    "backup_size": "$(du -h "$BACKUP_FILE" | cut -f1)",
    "timestamp": "$(date -Iseconds)",
    "retention_days": $RETENTION_DAYS
}
EOF
)
    
    # Send webhook notification
    if curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 10 \
        --silent --output /dev/null -w "%{http_code}" | grep -q "2"; then
        verbose "Notification sent successfully"
    else
        log "WARN" "Failed to send notification (non-critical)"
    fi
}

# =============================================================================
# Restore Instructions
# =============================================================================

show_restore_instructions() {
    cat <<EOF

============================================================
RESTORE INSTRUCTIONS
============================================================

To restore this backup, run:

  # Stop the application
  pm2 stop all
  
  # Restore the database
  gunzip -c $BACKUP_FILE | mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME
  
  # Or using the password from environment:
  export MYSQL_PWD="\$DB_PASSWORD"
  gunzip -c $BACKUP_FILE | mysql -h $DB_HOST -P $DB_PORT -u $DB_USER $DB_NAME
  
  # Restart the application
  pm2 restart all

============================================================
EOF
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    START_TIME=$(date +%s)
    
    echo "============================================================"
    echo " MySQL Backup Script v$SCRIPT_VERSION"
    echo "============================================================"
    echo ""
    
    # Parse command-line arguments
    parse_arguments "$@"
    
    # Load environment
    load_environment
    
    # Detect backup directory
    detect_backup_directory
    
    # Check dependencies
    check_dependencies
    
    # Validate configuration
    validate_configuration
    
    # Create backup directory
    create_backup_directory
    
    # Check disk space
    check_disk_space
    
    # Acquire lock
    acquire_lock
    
    # Test database connection
    test_database_connection
    
    # Generate backup filename
    generate_backup_filename
    
    # Perform backup
    perform_backup
    
    # Verify backup
    verify_backup
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate duration
    END_TIME=$(date +%s)
    local duration=$((END_TIME - START_TIME))
    
    # Success
    log "SUCCESS" "Backup completed successfully in ${duration}s"
    log "SUCCESS" "Backup file: $BACKUP_FILE"
    
    # Send success notification
    send_notification "success" "Backup completed successfully"
    
    # Show restore instructions
    show_restore_instructions
    
    EXIT_CODE=0
}

# Execute main function
main "$@"
