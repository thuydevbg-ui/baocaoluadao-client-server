# Hướng dẫn tạo API Token mới cho Cloudflare D1

## Bước 1: Truy cập Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com/
2. Đăng nhập vào tài khoản của bạn
3. Click vào avatar/profile ở góc phải trên cùng
4. Chọn **Profile**

## Bước 2: Tạo API Token mới

1. Trong trang profile, scroll xuống và chọn **API Tokens**
2. Click nút **Create Custom Token** (không phải Edit như token hiện tại)
3. Đặt tên token: `baocaoluadao-d1-access`

## Bước 3: Cấp quyền

Trong phần **Permissions**, click **Add** và thêm các quyền sau:

### Quyền Account (Account-level):
1. **Account** → **D1** → **Edit** (hoặc cả Read và Write)
2. **Account** → **Workers Scripts** → **Edit** (để deploy được Workers)

### Quyền User (User-level):
3. **User** → **User Details** → **Read**
4. **User** → **Memberships** → **Read**

## Bước 4: Thiết lập Resources

1. Trong phần **Account Resources**, chọn:
   - Include: **Specific account** → chọn account của bạn (Thuydevbg@gmail.com's Account)

## Bước 5: Tạo và Lưu Token

1. Click **Continue to summary**
2. Kiểm tra lại các quyền đã chọn
3. Click **Create Token**
4. **QUAN TRỌNG**: Copy token ngay lập tức! Token sẽ chỉ hiển thị 1 lần duy nhất

## Bướchạy SQL với Token mới

Sau khi có token mới, chạy các lệnh sau trên VPS:

```bash
# Export token mới
export CLOUDFLARE_API_TOKEN="token_moi_cua_ban"

# Chạy SQL vào D1
cd /var/www/baocaoluadao.com/workers
npx wrangler d1 execute baocaoluadao-d1 --remote --file=d1_schema_and_data.sql

# Deploy lại Workers
npx wrangler deploy
```

## Kiểm tra kết quả

```bash
curl https://api.baocaoluadao.com/categories
# Kết quả mong đợi: 10 categories từ D1
```
