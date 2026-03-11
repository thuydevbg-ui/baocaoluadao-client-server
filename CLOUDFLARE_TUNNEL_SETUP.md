# Cloudflare Tunnel Setup Guide

Hướng dẫn cấu hình Cloudflare Tunnel để Workers có thể kết nối tới MySQL database trên VPS.

---

## Tổng quan

```
Cloudflare Workers (Edge)
    ↓ (HTTPS)
Cloudflare Tunnel
    ↓ (MySQL)
Google Cloud VPS (MySQL)
```

Cloudflare Tunnel tạo một kết nối bảo mật từ Cloudflare edge network tới VPS của bạn mà không cần expose MySQL port ra internet.

---

## Bước 1: Cài đặt cloudflared

### Trên Linux (VPS)

```bash
# Tải cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Cấp quyền execute
chmod +x cloudflared-linux-amd64

# Di chuyển vào thư mục system
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify
cloudflared --version
```

### Trên macOS (Development)

```bash
brew install cloudflared
```

---

## Bước 2: Xác thực Cloudflare

```bash
# Login vào Cloudflare
cloudflared tunnel login
```

Lệnh này sẽ:
1. Mở trình duyệt để xác thực Cloudflare
2. Tạo file credentials tại `~/.cloudflared/`

---

## Bước 3: Tạo Tunnel

```bash
# Tạo tunnel mới
cloudflared tunnel create baocaoluadao-db
```

Kết quả sẽ hiển thị:
- Tunnel ID (ví dụ: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- Credentials file tại `~/.cloudflared/credentials.json`

**Lưu ý:** Tunnel ID sẽ cần cho cấu hình Workers.

---

## Bước 4: Cấu hình Tunnel (mysql.toml)

Tạo file cấu hình `mysql.toml`:

```toml
# ~/.cloudflared/mysql.toml

tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: /root/.cloudflared/credentials.json

# MySQL service
ingress:
  - hostname: mysql.baocaoluadao.internal
    service: tcp://localhost:3306
  - service: http_status:404
```

Giải thích:
- `tunnel`: Tunnel ID từ bước 3
- `credentials-file`: Đường dẫn tới credentials
- `hostname`: Internal hostname để truy cập MySQL (sẽ dùng trong Workers)
- `service`: MySQL port trên VPS (thường là 3306)

---

## Bước 5: Chạy Tunnel

### Option 1: Chạy như systemd service (Production)

Tạo service file `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --config /root/.cloudflared/mysql.toml run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable và start:

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### Option 2: Chạy với PM2 (Alternative)

```bash
# Install pm2 if not already
npm install -g pm2

# Create start script
echo 'cloudflared tunnel --config /root/.cloudflared/mysql.toml run' > start-tunnel.sh
chmod +x start-tunnel.sh

# Start with pm2
pm2 start start-tunnel.sh --name cloudflared-tunnel
pm2 save
```

---

## Bước 6: Cấu hình Workers để kết nối

### Sử dụng Private Network URL

Workers sẽ kết nối qua hostname `mysql.baocaoluadao.internal` (đã định nghĩa trong ingress).

Cập nhật Workers environment variables:

```bash
# Set database host (internal tunnel URL)
wrangler secret put DB_HOST
# Enter: mysql.baocaoluadao.internal
```

### Database Connection String Format

```bash
# Thay vì localhost, Workers sẽ dùng:
# Host: mysql.baocaoluadao.internal
# Port: 3306
# Database: baocaoluadao
# User: your-db-user
# Password: your-db-password
```

---

## Bước 7: Cập nhật Workers Code

Trong `workers/src/index.ts` và handlers, sử dụng:

```typescript
// Kết nối MySQL qua cloudflared tunnel
async function getDatabaseConnection(env: Env) {
  const connection = await import('mysql2/promise');
  
  const pool = connection.createPool({
    host: 'mysql.baocaoluadao.internal', // Tunnel hostname
    port: 3306,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
  
  return pool;
}
```

---

## Kiểm tra kết nối

### Test từ VPS

```bash
# Test MySQL qua tunnel (từ VPS)
mysql -h 127.0.0.1 -P 3306 -u your-user -p your-database
```

### Test từ Cloudflare

```bash
# Test tunnel endpoint
curl -v https://mysql.baocaoluadao.internal/health
```

---

## Troubleshooting

### 1. Tunnel không kết nối

```bash
# Kiểm tra logs
journalctl -u cloudflared -f

# Hoặc
pm2 logs cloudflared-tunnel
```

### 2. MySQL connection refused

- Đảm bảo MySQL đang chạy trên VPS
- Kiểm tra MySQL bind-address (nên là 127.0.0.1 hoặc 0.0.0.0)
- Firewall cho phép local connections

### 3. Workers timeout

- Tăng timeout trong Workers
- Kiểm tra tunnel latency

### 4. DNS resolution failed

- Đảm bảo tunnel đang chạy
- Kiểm tra hostname trong cấu hình

---

## Security Notes

1. **Không expose MySQL port** - Chỉ listen trên localhost
2. **Sử dụng credentials riêng** - Tạo user riêng cho Workers
3. **Limit access** - Chỉ cho phép từ tunnel IP

```sql
-- Tạo user cho Workers (chỉ cho phép từ localhost/tunnel)
CREATE USER 'workers'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON baocaoluadao.* TO 'workers'@'localhost';
FLUSH PRIVILEGES;

-- Nếu cần remote access qua tunnel IP, thay localhost bằng IP cụ thể:
-- CREATE USER 'workers'@'TUNNEL_IP' IDENTIFIED BY 'strong_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON baocaoluadao.* TO 'workers'@'TUNNEL_IP';
-- FLUSH PRIVILEGES;
```

---

## Alternative: Sử dụng Cloudflare Access

Nếu không muốn dùng Tunnel, có thể dùng Cloudflare Access:

1. Tạo Access Application cho database
2. Workers authenticate qua Cloudflare Access
3. Kết nối qua protected endpoint

---

## Monitoring

```bash
# Xem tunnel metrics
cloudflared tunnel info baocaoluadao-db

# Xem connection status
cloudflared tunnel list
```

---

## Summary

```
VPS (MySQL:3306) ←cloudflared tunnel→ Cloudflare Network ←Workers
```

Với setup này:
- MySQL database KHÔNG expose ra internet
- Workers kết nối an toàn qua Cloudflare network
- Low latency vì Workers chạy trên edge
