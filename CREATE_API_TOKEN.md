# Cách tạo Cloudflare API Token

## Bước 1: Truy cập Cloudflare Dashboard

1. Mở trình duyệt và truy cập: **https://dash.cloudflare.com**
2. Đăng nhập bằng tài khoản của bạn

---

## Bước 2: Vào trang API Tokens

Sau khi đăng nhập:
- Click vào **avatar/profile** ở góc phải trên cùng
- Chọn **Profile** hoặc **My Profile**

![Profile Menu](https://developers.cloudflare.com/images/fundamentals/get-started/dashboard-personal-nav.png)

---

## Bước 3: Tạo Token mới

1. Scroll xuống phần **API Tokens**
2. Click nút **Create Token**

![API Tokens](https://developers.cloudflare.com/images/fundamentals/get-started/api-tokens-tab.png)

---

## Bước 4: Cấu hình Token

### Option 1: Dùng Edit Workers (Khuyến nghị - Đơn giản nhất)

1. **Template**: Chọn **Edit Workers**
2. **Account Name**: `baocaoluadao.com` (hoặc tên account của bạn)
3. **Zone Name**: `baocaoluadao.com`
4. Click **Continue to summary**

![Edit Workers Template](https://developers.cloudflare.com/images/workers/wrangler/access/generate-token.png)

---

### Option 2: Tạo Token tùy chỉnh (Chi tiết hơn)

Nếu muốn tùy chỉnh:

1. **Template**: Chọn **Create custom token**
2. **Name**: `baocaoluadao-tunnel`
3. **Permissions** - Thêm các quyền sau:

| Type | Resource | Effect |
|------|----------|--------|
| Zone | Zone | Read |
| Zone | DNS | Edit |
| Account | Workers | Edit |
| Account | Workers Scripts | Write |

4. **Account Resources**: Include → `baocaoluadao.com`
5. **Zone Resources**: Include → `baocaoluadao.com`
6. Click **Continue to summary**

---

## Bước 5: Tạo Token

1. Xem lại các quyền đã chọn
2. Click **Create Token**

![Create Token](https://developers.cloudflare.com/images/fundamentals/get-started/create-api-token-2.png)

---

## Bước 6: LƯU TOKEN

**QUAN TRỌNG**: Token chỉ hiển thị **1 LẦN DUY NHẤT**!

```
EXAMPLE: Pki7cH4x_plus_sign.Efghij8.9klmno12_pqrstu34vwxYZabcdeFGHIJKL
```

**Lưu ngay vào nơi an toàn!**

---

## Bước 7: Sử dụng Token

Thay thế `YOUR_TOKEN` trong các lệnh:

```bash
# Set token
export CLOUDFLARE_API_TOKEN="Pki7cH4x..."

# Kiểm tra token hoạt động
curl -H "Authorization: Bearer Pki7cH4x..." https://api.cloudflare.com/client/v4/accounts
```

---

## Troubleshooting

### Token không hoạt động?
- Kiểm tra đã copy đúng token (không thừa/khuyết ký tự)
- Token có thể đã hết hạn (kiểm tra thời hạn khi tạo)

### Permission denied?
- Kiểm tra đã chọn đúng quyền
- Kiểm tra đã chọn đúng Account/Zone

### Token bị lộ?
- Xóa token ngay tại trang API Tokens
- Tạo token mới

---

## Hỗ trợ thêm

Nếu cần screenshots chi tiết, xem tài liệu chính thức:
https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
