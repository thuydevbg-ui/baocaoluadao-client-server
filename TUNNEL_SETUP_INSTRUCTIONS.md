# Hướng dẫn tạo Cloudflare Tunnel

## Trên máy tính của bạn (local)

### Bước 1: Cài đặt cloudflared

```bash
# macOS
brew install cloudflared

# Windows (PowerShell)
winget install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudfl64
chmodared-linux-amd +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

### Bước 2: Login vào Cloudflare

```bash
cloudflared tunnel login
```

Lệnh này sẽ:
1. Mở trình duyệt tại https://login.cloudflare.com
2. Đăng nhập bằng tài khoản Cloudflare của bạn
3. Chọn domain **baocaoluadao.com**
4. Tạo file credentials tại `~/.cloudflared/`

### Bước 3: Tạo Tunnel

```bash
# Tạo tunnel mới
cloudflared tunnel create baocaoluadao-db
```

Kết quả sẽ hiển thị:
```
Tunnel created with ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**LƯU Ý:** Copy Tunnel ID này!

### Bước 4: Copy credentials file

Sau khi tạo tunnel, copy file credentials từ máy tính của bạn:

```bash
# Trên máy tính của bạn, đường dẫn file credentials:
# ~/.cloudflared/credentials.json
```

Bạn cần upload file này lên VPS tại `/home/thuydevbg_gmail_com/.cloudflared/credentials.json`

---

## Trên VPS (đã chuẩn bị sẵn)

Tôi đã:
- ✅ Cài đặt cloudflared
- ✅ Tạo thư mục ~/.cloudflared

**Bạn cần làm:**
1. Tạo tunnel trên máy tính của bạn (xem hướng dẫn trên)
2. Upload credentials file lên VPS
3. Cho tôi biết Tunnel ID để tôi cấu hình tiếp

---

## Sau khi có credentials

Tôi sẽ chạy các lệnh sau:

```bash
# Tạo tunnel config
cloudflared tunnel --config ~/.cloudflared/mysql.toml run

# Tạo DNS record
cloudflared tunnel route dns baocaoluadao-db api.baocaoluadao.com
```
