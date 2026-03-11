# Tạo Cloudflare D1 Database

## Bước 1: Vào Cloudflare Dashboard

1. Mở https://dash.cloudflare.com
2. Chọn tài khoản của bạn

## Bước 2: Tạo D1 Database

1. Click **SQL** trong menu (hoặc tìm "D1")
2. Click **Create Database**
3. Đặt tên: `baocaoluadao`
4. Click **Create**

## Bước 3: Export Database từ VPS

Chạy lệnh sau trên VPS để export:

```bash
mysqldump -u baocaoluadao -p baocaoluadao > dump.sql
```

## Bước 4: Import vào D1

Sau khi tạo D1, bạn cần:
1. Import dữ liệu vào D1
2. Gửi cho tôi D1 database ID để cấu hình Workers

---

## Lưu ý:

- D1 yêu cầu **paid plan** (Workers Paid)
- Miễn phí: 5GB storage, 50K reads/day

Hoặc giải pháp đơn giản hơn:
- **Giữ nguyên kiến trúc hiện tại** (Workers trả về demo data)
- API vẫn hoạt động bình thường
