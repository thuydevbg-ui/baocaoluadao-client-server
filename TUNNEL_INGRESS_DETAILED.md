# Thêm Ingress Rule cho MySQL (Chi tiết)

## Bước 1: Vào Dashboard

1. Mở trình duyệt: https://dash.cloudflare.com
2. Đăng nhập
3. Click **Zero Trust** (menu bên trái)

## Bước 2: Vào Tunnels

1. Click **Access** → **Tunnels**
2. Bạn sẽ thấy danh sách tunnels
3. Click vào tunnel có tên **baocaoluadao-db** (hoặc tên bạn đặt)

## Bước 3: Thêm Ingress Rule

Sau khi vào tunnel details:

1. Scroll xuống phần **Ingress rules**
2. Click **Add ingress rule**

### Cấu hình Rule:

```
Public hostname: mysql.baocaoluadao.com
Service:        TCP
URL:            localhost:3306
```

3. Click **Save**

## Bước 4: Kiểm tra

Sau khi Save, đợi 30-60 giây để config được áp dụng.

## Kiểm tra từ máy tính của bạn:

```bash
# Test từ máy local
nc -zv mysql.baocaoluadao.com 3306
```

Nếu thấy thành công, tức là tunnel đang hoạt động!
