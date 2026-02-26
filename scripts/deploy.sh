#!/bin/bash

# =============================================================================
# ScamGuard Deploy Script - For VPS Linux
# =============================================================================
# Usage: bash scripts/deploy.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="scamguard"
APP_DIR="/var/www/$APP_NAME"
GIT_REPO="https://github.com/thuydevbg-ui/baocaoluadao_client_server.git"
NODE_VERSION="20"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ScamGuard Deploy Script${NC}"
echo -e "${GREEN}========================================${NC}"

# =============================================================================
# CHECK ROOT
# =============================================================================
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or use sudo${NC}"
  exit 1
fi

# =============================================================================
# UPDATE & INSTALL DEPENDENCIES
# =============================================================================
echo -e "${YELLOW}[1/7] Updating system and installing dependencies...${NC}"

# Detect OS
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt update && apt upgrade -y
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    
    # Install MySQL
    apt install -y mysql-server
    
    # Install PM2
    npm install -g pm2
    
    # Install Git & Curl
    apt install -y git curl
    
elif [ -f /etc/centos-release ]; then
    # CentOS/RHEL
    yum update -y
    
    # Install Node.js
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    yum install -y nodejs
    
    # Install MySQL
    yum install -y mysql-server
    
    # Install PM2
    npm install -g pm2
    
    # Install Git & Curl
    yum install -y git curl
fi

echo -e "${GREEN}Dependencies installed successfully!${NC}"

# =============================================================================
# SETUP APP DIRECTORY
# =============================================================================
echo -e "${YELLOW}[2/7] Setting up application directory...${NC}"

# Create directory
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull repository
if [ -d "$APP_DIR/.git" ]; then
    echo "Pulling latest changes..."
    git pull origin main || git pull origin master
else
    echo "Cloning repository..."
    git clone $GIT_REPO $APP_DIR
fi

echo -e "${GREEN}Application directory ready!${NC}"

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================
echo -e "${YELLOW}[3/7] Configuring environment variables...${NC}"

# Copy example env file
cp $APP_DIR/.env.example $APP_DIR/.env

# Create production env file if not exists
if [ ! -f "$APP_DIR/.env.production" ]; then
    cat > $APP_DIR/.env.production << 'EOF'
# ScamGuard Production Environment Configuration

# Authentication (REQUIRED) - Generate with: node -e "require('bcrypt').hash('your-password', 10, (err, hash) => console.log(hash))"
AUTH_COOKIE_SECRET=CHANGE_ME_32_CHARACTERS_LONG_SECRET_KEY
NEXTAUTH_SECRET=CHANGE_ME_ANOTHER_SECRET_KEY
NEXTAUTH_URL=https://your-domain.com

# Admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=CHANGE_ME_BCRYPT_HASH
ADMIN_ROLE=super_admin

# Database (REQUIRED)
DB_HOST=localhost
DB_USER=scamguard
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=scamguard

# Redis (OPTIONAL)
# REDIS_URL=redis://username:password@host:port
EOF
    echo -e "${YELLOW}Created .env.production - Please edit with your credentials!${NC}"
fi

# Link .env
ln -sf $APP_DIR/.env.production $APP_DIR/.env

echo -e "${GREEN}Environment configured!${NC}"

# =============================================================================
# MYSQL DATABASE SETUP
# =============================================================================
echo -e "${YELLOW}[4/7] Setting up MySQL database...${NC}"

# Start MySQL
systemctl start mysql || systemctl start mysqld
systemctl enable mysql || systemctl enable mysqld

# Create database and user
mysql << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Run migrations
echo "Running database migrations..."
mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < $APP_DIR/migrations/001_initial_schema.sql
mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < $APP_DIR/migrations/002_auth_users.sql

echo -e "${GREEN}Database setup complete!${NC}"

# =============================================================================
# INSTALL DEPENDENCIES & BUILD
# =============================================================================
echo -e "${YELLOW}[5/7] Installing dependencies and building...${NC}"

cd $APP_DIR
npm install

# Build application
npm run build

echo -e "${GREEN}Build complete!${NC}"

# =============================================================================
# CONFIGURE PM2
# =============================================================================
echo -e "${YELLOW}[6/7] Configuring PM2 process manager...${NC}"

# Create PM2 ecosystem file
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'scamguard',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/scamguard',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start PM2
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start $APP_DIR/ecosystem.config.js
pm2 save

# Setup PM2 startup script
pm2 startup

echo -e "${GREEN}PM2 configured!${NC}"

# =============================================================================
# CONFIGURE NGINX
# =============================================================================
echo -e "${YELLOW}[7/7] Configuring Nginx as reverse proxy...${NC}"

# Install Nginx
apt install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /fonts {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}Nginx configured!${NC}"

# =============================================================================
# FINAL STATUS
# =============================================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "App URL: http://your-domain.com"
echo -e "Admin URL: http://your-domain.com/admin"
echo ""
echo -e "Useful commands:"
echo -e "  pm2 status          - Check app status"
echo -e "  pm2 logs scamguard  - View logs"
echo -e "  pm2 restart scamguard - Restart app"
echo ""
echo -e "${YELLOW}IMPORTANT: Edit /var/www/scamguard/.env.production with your credentials!${NC}"
echo ""
