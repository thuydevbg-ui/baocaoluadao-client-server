# 🚀 CẤU HÌNH NHANH - CHỈ CẦN 5 PHÚT

## Vấn đề hiện tại

Để Workers kết nối database, cần Cloudflare Tunnel. Tuy nhiên, cần xác thực qua browser.

## Giải pháp: Chạy Tunnel từ máy tính của bạn

### Bước 1: Tải và chạy script

```bash
# Copy script này về máy tính và chạy:
curl -o setup-tunnel.sh https://raw.githubusercontent.com/your-repo/setup-tunnel.sh
chmod +x setup-tunnel.sh
./setup-tunnel.sh
```

Script sẽ:
1. Yêu cầu đăng nhập Cloudflare (browser sẽ mở)
2. Tự động tạo Tunnel
3. Tự động tạo DNS record

### Bước 2: Sau khi chạy xong

Script sẽ hiển thị **Tunnel ID** (ví dụ: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Gửi Tunnel ID này cho tôi!**

### Bước 3: Giữ tunnel chạy

Để tunnel hoạt động, giữ cửa sổ terminal chạy:
```
cloudflared tunnel --config ~/.cloudflared/mysql.toml run
```

Hoặc chạy ở background:
```
nohup cloudflared tunnel --config ~/.cloudflared/mysql.toml run > /dev/null 2>&1 &
```

---

## Alternative: Không cần Tunnel ngay

Nếu bạn muốn deploy Workers trước mà **không cần database ngay**:

1. Workers sẽ trả về **demo/fallback data**
2. Sau khi có tunnel, database sẽ hoạt động

**Muốn deploy Workers trước không?**

---

## Cần hỗ trợ?

Liên hệ tôi nếu gặp vấn đề:
- Tunnel ID: <CHƯA_CUNG_CẤP>
- Lỗi cụ thể: <MÔ_TẢ_LỖI_NẾU_CÓ>

