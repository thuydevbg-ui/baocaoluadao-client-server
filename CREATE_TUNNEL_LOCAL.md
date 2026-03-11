# Tạo Tunnel từ máy tính của bạn

Do hạn chế quyền API, bạn cần tạo Tunnel từ máy tính và giữ nó chạy.

## Bước 1: Cài đặt cloudflared

```bash
# macOS
brew install cloudflared

# Windows (PowerShell as Admin)
winget install cloudflared
```

## Bước 2: Tạo Tunnel

Mở Terminal và chạy:

```bash
cloudflared tunnel create baocaoluadao-db
```

Lệnh này sẽ tạo:
- Tunnel với tên `baocaoluadao-db`
- Credentials file tại `~/.cloudflared/credentials.json`

## Bước 3: Tạo config

Tạo file `~/.cloudflared/mysql.toml`:

```toml
tunnel: baocaoluadao-db
credentials-file: ~/.cloudflared/credentials.json

ingress:
  - hostname: mysql.baocaoluadao.internal
    service: tcp://localhost:3306
  - service: http_status:404
```

## Bước 4: Tạo DNS

```bash
cloudflared tunnel route dns baocaoluadao-db api.baocaoluadao.com
```

## Bước 5: Chạy Tunnel

```bash
cloudflared tunnel --config ~/.cloudflared/mysql.toml run
```

**Giữ cửa sổ terminal này mở để Tunnel hoạt động!**

---

## Sau khi Tunnel chạy

Gửi cho tôi biết để tôi cập nhật Workers kết nối Database!

