#!/bin/bash

# =============================================================================
# ScamGuard Rollback Script - For VPS Linux
# =============================================================================
# Usage: bash scripts/rollback.sh [version]
# Version: git commit hash or branch name (default: previous commit)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="scamguard"
APP_DIR="/var/www/$APP_NAME"
GIT_REPO="https://github.com/thuydevbg-ui/baocaoluadao_client_server.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ScamGuard Rollback Script${NC}"
echo -e "${BLUE}========================================${NC}"

# =============================================================================
# CHECK ROOT
# =============================================================================
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or use sudo${NC}"
  exit 1
fi

# =============================================================================
# CHECK IF APP EXISTS
# =============================================================================
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}App directory not found at $APP_DIR${NC}"
  echo -e "${YELLOW}Please deploy the app first before rolling back${NC}"
  exit 1
fi

cd $APP_DIR

# =============================================================================
# GET CURRENT VERSION
# =============================================================================
echo -e "${YELLOW}Current version:${NC}"
git log --oneline -1
echo ""

# =============================================================================
# GET AVAILABLE VERSIONS
# =============================================================================
echo -e "${YELLOW}Available versions:${NC}"
echo "0) Cancel"
echo "1) Previous commit (HEAD~1)"
echo "2) Previous 5 commits"
git log --oneline -10
echo ""

# =============================================================================
# GET ROLLBACK TARGET
# =============================================================================
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter version to rollback to:${NC}"
    echo "  - Enter commit hash (full or short)"
    echo "  - Enter branch name (e.g., main, master)"
    echo "  - Or press Enter to rollback to previous commit"
    echo ""
    read -p "Rollback to: " ROLLBACK_TARGET
    
    if [ -z "$ROLLBACK_TARGET" ]; then
        ROLLBACK_TARGET="HEAD~1"
    fi
else
    ROLLBACK_TARGET="$1"
fi

echo -e "${YELLOW}Rolling back to: $ROLLBACK_TARGET${NC}"

# =============================================================================
# CREATE BACKUP BEFORE ROLLBACK
# =============================================================================
BACKUP_DIR="/var/www/${APP_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}Creating backup at $BACKUP_DIR${NC}"

cp -r $APP_DIR $BACKUP_DIR

# Backup PM2 ecosystem
cp $APP_DIR/ecosystem.config.js $BACKUP_DIR/ 2>/dev/null || true

echo -e "${GREEN}Backup created successfully!${NC}"
echo -e "${YELLOW}Backup location: $BACKUP_DIR${NC}"
echo ""

# =============================================================================
# PERFORM ROLLBACK
# =============================================================================
echo -e "${YELLOW}Performing rollback...${NC}"

# Checkout to target version
git checkout "$ROLLBACK_TARGET"

# Install dependencies if needed
npm install --production

# Rebuild
npm run build

# Restart PM2
pm2 restart $APP_NAME

echo -e "${GREEN}Rollback complete!${NC}"

# =============================================================================
# FINAL STATUS
# =============================================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rollback Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Rolled back to: $(git log --oneline -1)"
echo -e "Backup location: $BACKUP_DIR"
echo ""
echo -e "Useful commands:"
echo -e "  pm2 status          - Check app status"
echo -e "  pm2 logs scamguard  - View logs"
echo -e "  $BACKUP_DIR         - Your backup"
echo ""
echo -e "${YELLOW}To restore from backup if rollback fails:${NC}"
echo -e "  cp -r $BACKUP_DIR/* $APP_DIR/"
echo -e "  pm2 restart $APP_NAME"
echo ""
