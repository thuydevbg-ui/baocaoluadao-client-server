# Cấu hình Tunnel Ingress cho MySQL

## Bước 1: Truy cập Cloudflare Dashboard

1. Mở trình duyệt và đăng nhập vào https://dash.cloudflare.com
2. Chọn tài khoản của bạn (Thuydevbg@gmail.com's Account)

## Bước 2: Vào Tunnel Settings

1. Click **Zero Trust** trong menu bên trái
2. Click **Access** → **Tunnels**
3. Bạn sẽ thấy tunnel **baocaoluadao-db** (hoặc tên bạn đặt)
4. Click vào tên tunnel để xem chi tiết

## Bước 3: Thêm Ingress Rule

Trong phần **Ingress rules**, thêm rule mới:

1. Click **Add ingress rule**

2. Cấu hình như sau:
   - **Service**: TCP
   - **Hostname**: `mysql.baocaoluadao.internal`
   - **Port**: `3306`
   - **Origin**: `localhost:3306`

3. Click **Save**

## Bước 4: Xác nhận

Sau khi thêm, ingress rules sẽ có dạng:

```
1. Hostname: mysql.baocaoluadao.com  →  Service: tcp://localhost:3306
2. Hostname: *  →  Service: http_status:404
```

## Bước 5: Khởi động lại Tunnel

Tunnel trên VPS sẽ tự động nhận config mới (thường mất 30-60 giây).

## Kiểm tra

Sau khi cấu hình xong, test thử:

```bash
cd /var/www/baocaoluadao.com && node -e "
const mysql = require('mysql2/promise');
async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'mysql.baocaoluadao.internal',
      user: process.env.DB_USER || 'baocaoluadao',
      password: process.env.DB_PASSWORD || '<YOUR_PASSWORD>',
      database: 'baocaoluadao'
    });
    console.log('Connected!');
    await conn.end();
  } catch(e) {
    console.log('Error:', e.message);
  }
}
test();
"
```

---

**Xong gửi cho tôi để tiếp tục!** 🚀
