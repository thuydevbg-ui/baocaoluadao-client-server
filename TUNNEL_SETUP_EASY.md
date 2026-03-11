# Tạo Cloudflare Tunnel (Cách dễ nhất)

## Vấn đề

Token API hiện tại không có quyền tạo Tunnel. Bạn cần tạo tunnel từ máy tính của mình.

## Cách 1: Sử dụng Dashboard (Dễ nhất)

### Bước 1: Truy cập Cloudflare Dashboard

1. Mở trình duyệt và đăng nhập vào https://dash.cloudflare.com
2. Chọn tài khoản của bạn

### Bước 2: Tạo Tunnel

1. Click vào **Zero Trust** (hoặc tìm "Tunnel" trong menu)
2. Click **Access** > **Tunnels**
3. Click **Create a tunnel**
4. Đặt tên: `baocaoluadao-db`
5. Click **Next**

### Bước 3: Cấu hình Tunnel

1. Chọn loại: **Docker**
2. Copy lệnh cài đặt được hiển thị
3. Thay thế port 80 thành 3306 (MySQL)

Ví dụ:
```bash
docker run -d --name cloudflared \
  --network host \
  cloudflare/cloudflared:latest tunnel run \
  --token YOUR_TOKEN_HERE
```

### Bước 4: Thêm DNS Record

1. Trong phần **Public Hostname**, thêm:
   - Subdomain: `mysql`
   - Domain: `baocaoluadao.com`
   - Type: `TCP`
   - URL: `localhost:3306`

2. Click **Save**

---

## Cách 2: Sử dụng cloudflared CLI

### Bước 1: Cài đặt cloudflared

```bash
# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### Bước 2: Login

```bash
cloudflared tunnel login
```

Trình duyệt sẽ mở ra, bạn đăng nhập Cloudflare và cho phép.

### Bước 3: Tạo Tunnel

```bash
cloudflared tunnel create baocaoluadao-db
```

### Bước 4: Cấu hình

Tạo file `~/.cloudflared/config.yml`:

```yaml
tunnel: baocaoluadao-db
credentials-file: ~/.cloudflared/baocaoluadao-db.json

ingress:
  - hostname: mysql.baocaoluadao.internal
    service: tcp://localhost:3306
  - service: http_status:404
```

### Bước 5: Chạy Tunnel

```bash
cloudflared tunnel run
```

---

## Sau khi tạo Tunnel xong

Gửi cho tôi thông tin sau:

1. **Tunnel Token** (nếu dùng cách 1)
2. Hoặc **Tunnel UUID** (nếu dùng cách 2)

Tôi sẽ:
1. Cập nhật Workers để kết nối tới database qua tunnel
2. Triển khai lại Workers

---

## Kiểm tra

Sau khi tunnel chạy, test thử:

```bash
curl https://mysql.baocaoluadao.internal
```

Nếu thấy response từ MySQL (hoặc lỗi handshake), tức là tunnel đang hoạt động!
