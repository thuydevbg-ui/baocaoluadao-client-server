# Hướng dẫn Import Dữ liệu vào Cloudflare D1

## Bước 1: Truy cập Cloudflare Dashboard

1. Mở trình duyệt và truy cập: https://dash.cloudflare.com
2. Đăng nhập bằng tài khoản Cloudflare của bạn

## Bước 2: Truy cập D1 Database

1. Trong Dashboard, tìm và click vào **D1** (thường nằm trong mục "Storage")
2. Hoặc truy cập trực tiếp: https://dash.cloudflare.com/76810f76c3bf695a91848a81cb4f807a/d1
3. Bạn sẽ thấy database **baocaoluadao-d1**

## Bước 3: Import Schema

1. Click vào database **baocaoluadao-d1**
2. Trong tab **Tables**, click nút **Import Database**
3. Click **Choose File** và chọn file:
   - `/var/www/baocaoluadao.com/d1_schema.sql`
   
   **Lưu ý**: Bạn cần tải file này về máy trước qua:
   ```bash
   # Trên VPS, file nằm tại:
   /var/www/baocaoluadao.com/d1_schema.sql
   
   # Bạn có thể dùng scp hoặc wget để tải
   ```
   
4. Click **Import** và chờ hoàn tất

## Bước 4: Import Data (tùy chọn)

Sau khi schema import thành công, bạn có thể import data:

1. Click **Import Database** lần nữa
2. Chọn file:
   - `/var/www/baocaoluadao.com/d1_data_categories.sql` (cho categories)

## Bước 5: Kiểm tra

Sau khi import xong, verify bằng cách:

1. Trong D1 Dashboard, click **Query**
2. Chạy query test:
   ```sql
   SELECT COUNT(*) as total FROM categories;
   SELECT COUNT(*) as total FROM scams;
   ```

## Xử lý vấn đề

### Nếu file SQL quá lớn (ví dụ scams ~88K rows)
- Chia nhỏ file thành nhiều phần
- Hoặc sử dụng command line với wrangler

### Nếu gặp lỗi syntax
- Đảm bảo chọn đúng file SQLite (đã chuyển đổi từ MySQL)
- File `d1_schema.sql` đã được chuyển đổi sang SQLite format

## Sau khi Import thành công

1. Deploy lại Workers để áp dụng:
   ```bash
   cd /var/www/baocaoluadao.com/workers
   npx wrangler deploy
   ```

2. Test API:
   ```bash
   curl https://api.baocaoluadao.com/api/stats
   ```

---

## Lưu ý quan trọng

- **Database ID**: `e95728a8-5016-4adb-822f-02c66ffe789a`
- **Workers đã được cấu hình** để kết nối với D1 này
- Nếu không import được data, API vẫn hoạt động nhưng trả về giá trị mặc định (0)
