# Tạo Cloudflare Token với đủ quyền cho Tunnel

## Bước 1: Vào Cloudflare Dashboard

1. Truy cập: **https://dash.cloudflare.com/profile/api-tokens**
2. Click **Create Token**

## Bước 2: Tạo Custom Token với đầy đủ quyền

1. **Template**: Chọn **Create custom token**

2. **Permissions** - Thêm lần lượt:

| # | Type | Permission | Resource |
|---|------|------------|----------|
| 1 | Workers | Edit | Account: baocaoluadao.com |
| 2 | Workers Scripts | Write | Account: baocaoluadao.com |
| 3 | Workers Routes | Edit | Account: baocaoluadao.com |
| 4 | DNS | Edit | Zone: baocaoluadao.com |
| 5 | Zone | Read | Zone: baocaoluadao.com |
| 6 | Account | Read | Account: baocaoluadao.com |

3. **Account Resources**: Include → `baocaoluadao.com`

4. **Zone Resources**: Include → `baocaoluadao.com`

5. **TTL**: Chọn **Never expire** (hoặc thời gian dài nhất)

6. Click **Create Token**

## Bước 3: LƯU TOKEN

**QUAN TRỌNG**: Token chỉ hiển thị 1 lần!

Gửi token cho tôi để tiếp tục cấu hình Tunnel!

---

## Token cần các quyền:
- ✅ Workers: Edit
- ✅ Workers Scripts: Write  
- ✅ Workers Routes: Edit
- ✅ DNS: Edit
- ✅ Zone: Read
- ✅ Account: Read
