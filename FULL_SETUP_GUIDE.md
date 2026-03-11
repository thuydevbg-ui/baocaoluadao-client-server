# Hướng dẫn đầy đủ - Cloudflare Workers + Tunnel

## Tổng quan

Sau khi hoàn thành, hệ thống sẽ hoạt động như sau:

```
User → Cloudflare CDN → Cloudflare Workers (API)
                                    ↓ (Tunnel)
                              VPS (MySQL)
```

---

## PHẦN 1: TẠO CLOUDFLARE TUNNEL (Cần làm trên máy tính của bạn)

### Bước 1: Tạo API Token trên Cloudflare

1. Đăng nhập https://dash.cloudflare.com
2. Vào **Profile** → **API Tokens**
3. Chọn **Create Custom Token**
4. Cấu hình:
   - **Name**: `baocaoluadao-tunnel`
   - **Permissions**:
     - `Zone:Read` - Zone Resources: Include -> baocaoluadao.com
     - `Account:Read` - Account Resources: Include -> baocaoluadao.com  
     - `Workers:Write` - Account Resources: Include -> baocaoluadao.com
   - **Client IP Address Filtering**: (để trống)
5. Click **Continue to summary** → **Create Token**
6. **LƯU LẠI TOKEN** (chỉ hiển thị 1 lần!)

### Bước 2: Chạy lệnh dưới đây trên máy tính

```bash
# Cài đặt cloudflared nếu chưa có
brew install cloudflared  # macOS

# Set token
export CLOUDFLARE_API_TOKEN="YOUR_TOKEN_HERE"

# Tạo tunnel (thay YOUR_TOKEN bằng token ở trên)
cloudflared tunnel create baocaoluadao-db --token "YOUR_TOKEN_HERE"

# Tạo config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/mysql.toml << 'EOF'
tunnel: baocaoluadao-db
credentials-file: ~/.cloudflared/credentials.json

ingress:
  - hostname: mysql.baocaoluadao.internal
    service: tcp://localhost:3306
  - service: http_status:404
EOF

# Tạo DNS
cloudflared tunnel route dns baocaoluadao-db api.baocaoluadao.com --token "YOUR_TOKEN_HERE"

# Chạy tunnel (giữ cửa sổ này)
cloudflared tunnel --config ~/.cloudflared/mysql.toml run --token "YOUR_TOKEN_HERE"
```

---

## PHẦN 2: CẤU HÌNH VPS (Đã làm sẵn)

Tôi đã cấu hình:
- ✅ Cloudflare Workers code
- ✅ API routing
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Security headers

---

## PHẦN 3: DNS RECORDS (Cần làm trên Cloudflare Dashboard)

Thêm record trong Cloudflare → DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | api | baocaoluadao-db.trycloudflare.com | Proxied |

**Hoặc chạy lệnh trên đã tự động tạo DNS!**

---

## PHẦN 4: DEPLOY WORKERS

Sau khi tunnel chạy và DNS propagate:

```bash
# Cài đặt wrangler
npm install -g wrangler

# Di chuyển vào thư mục workers
cd workers

# Login (chỉ cần 1 lần)
wrangler login

# Set database host
wrangler secret put DB_HOST
# Gõ: mysql.baocaoluadao.internal

# Deploy
wrangler deploy
```

---

## KIỂM TRA

```bash
# Test API
curl https://api.baocaoluadao.com/health

# Kết quả mong đợi:
# {"success":true,"status":"healthy","timestamp":"..."}
```

---

## XÓA TUNNEL (nếu cần)

```bash
cloudflared tunnel delete baocaoluadao-db --token "YOUR_TOKEN"
```

---

## Cần giúp đỡ?

Liên hệ với các thông tin:
- Tunnel ID: <CHƯA_CUNG_CẤP>
- Token đã tạo: <CHƯA_XAC_NHAN>
- Lỗi gặp phải: <MÔ_TẢ_LỖI_NẾU_CÓ>

