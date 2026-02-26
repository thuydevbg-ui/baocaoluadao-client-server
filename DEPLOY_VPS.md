# Hướng Dẫn Deploy Lên VPS Linux

## Yêu Cầu Hệ Thống

- **OS**: Ubuntu 20.04+ hoặc CentOS 8+
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB)
- **CPU**: Tối thiểu 2 cores
- **Disk**: Tối thiểu 20GB SSD

## Chuẩn Bị Trước Khi Deploy

### 1. Chuẩn Bị Domain
- Trỏ domain về IP VPS
- Cài đặt SSL (Let's Encrypt) sau khi deploy

### 2. Chuẩn Bị GitHub Repository
Đảm bảo code đã được push lên GitHub:
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 3. Chuẩn Bị Các Thông Tin Cần Thiết

#### Tạo Admin Password Hash
```bash
# Chạy lệnh sau để tạo bcrypt hash cho password admin
node -e "require('bcrypt').hash('YOUR_PASSWORD_HERE', 10, (err, hash) => console.log(hash))"
```

#### Database Credentials
- Tên database: `scamguard`
- Username: `scamguard` (hoặc tùy chọn)
- Password: Mật khẩu mạnh

## Các Bước Deploy

### Cách 1: Sử Dụng Script Tự Động (Khuyến Nghị)

```bash
# 1. SSH vào VPS với quyền root
ssh root@YOUR_VPS_IP

# 2. Tải script deploy về VPS
cd /tmp
git clone https://github.com/thuydevbg-ui/baocaoluadao_client_server.git
cd baocaoluadao_client_server

# 3. Chạy script deploy
bash scripts/deploy.sh
```

### Cách 2: Deploy Thủ Công

#### Bước 1: Cài Đặt Dependencies

```bash
# Cập nhật hệ thống
apt update && apt upgrade -y

# Cài đặt Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Cài đặt MySQL
apt install -y mysql-server

# Cài đặt PM2
npm install -g pm2

# Cài đặt Nginx
apt install -y nginx

# Cài đặt Git
apt install -y git
```

#### Bước 2: Cài Đặt Ứng Dụng

```bash
# Tạo thư mục ứng dụng
mkdir -p /var/www/scamguard
cd /var/www/scamguard

# Clone code từ GitHub
git clone https://github.com/thuydevbg-ui/baocaoluadao_client_server.git .

# Copy file cấu hình môi trường
cp .env.example .env.production

# Chỉnh sửa file .env.production
nano .env.production
```

#### Bước 3: Cấu Hình Database

```bash
# Khởi động MySQL
systemctl start mysql
systemctl enable mysql

# Tạo database và user
mysql -u root -p << EOF
CREATE DATABASE scamguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'scamguard'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON scamguard.* TO 'scamguard'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import migrations
mysql -u scamguard -p scamguard < migrations/001_initial_schema.sql
mysql -u scamguard -p scamguard < migrations/002_auth_users.sql
```

#### Bước 4: Cài Đặt Dependencies & Build

```bash
cd /var/www/scamguard
npm install
npm run build
```

#### Bước 5: Cấu Hình PM2

```bash
# Tạo file ecosystem.config.js
cat > /var/www/scamguard/ecosystem.config.js << 'EOF'
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

# Khởi động ứng dụng với PM2
pm2 start /var/www/scamguard/ecosystem.config.js
pm2 save

# Cấu hình auto-start khi reboot
pm2 startup
```

#### Bước 6: Cấu Hình Nginx

```bash
# Tạo file cấu hình Nginx
cat > /etc/nginx/sites-available/scamguard << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

# Kích hoạt site
ln -sf /etc/nginx/sites-available/scamguard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
systemctl enable nginx
```

#### Bước 7: Cài Đặt SSL (Let's Encrypt)

```bash
# Cài đặt Certbot
apt install -y certbot python3-certbot-nginx

# Xin chứng chỉ SSL
certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot sẽ tự động cấu hình HTTPS
```

## Sau Khi Deploy

### Kiểm Tra Trạng Thái

```bash
# Kiểm tra PM2
pm2 status

# Xem logs
pm2 logs scamguard

# Kiểm tra Nginx
nginx -t
systemctl status nginx

# Kiểm tra MySQL
systemctl status mysql
```

### Các Lệnh Hữu Ích

```bash
# Restart ứng dụng
pm2 restart scamguard

# Stop ứng dụng
pm2 stop scamguard

# Xem logs realtime
pm2 logs scamguard --follow

# Monitor tài nguyên
pm2 monit

# Update ứng dụng
git pull origin main
npm run build
pm2 restart scamguard
```

### Troubleshooting

#### Lỗi Kết Nối Database
- Kiểm tra credentials trong .env.production
- Kiểm tra MySQL đang chạy: `systemctl status mysql`
- Kiểm tra quyền user: `mysql -u scamguard -p`

#### Lỗi Build
- Xóa node_modules và cài lại: `rm -rf node_modules && npm install`
- Clear cache Next.js: `rm -rf .next`

#### Lỗi PM2
- Xem logs chi tiết: `pm2 logs scamguard --err`
- Restart và theo dõi: `pm2 restart scamguard && pm2 logs`

## Cấu Trúc Thư Mục Sau Deploy

```
/var/www/scamguard/
├── .env.production          # File cấu hình môi trường
├── ecosystem.config.js     # Cấu hình PM2
├── migrations/             # Database migrations
├── node_modules/           # Dependencies
├── public/                 # Static files
├── src/                    # Source code
├── package.json
└── ...
```

## Bảo Mật Sau Deploy

1. **Cập nhật firewall**:
   ```bash
   ufw allow 22/tcp   # SSH
   ufw allow 80/tcp   # HTTP
   ufw allow 443/tcp  # HTTPS
   ufw enable
   ```

2. **Bảo mật MySQL**:
   ```bash
   mysql_secure_installation
   ```

3. **Cập nhật thường xuyên**:
   ```bash
   # Update code
   cd /var/www/scamguard
   git pull origin main
   npm run build
   pm2 restart scamguard
   ```

---

**Chúc bạn deploy thành công!** 🚀