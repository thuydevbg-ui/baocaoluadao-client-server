# Migration Plan: Next.js API → Cloudflare Workers

## Tổng quan

Tài liệu này mô tả kế hoạch di chuyển API từ Next.js server sang Cloudflare Workers để giảm tải cho VPS và cải thiện hiệu suất toàn cầu.

---

## 1. Kiến trúc hiện tại

```
User
→ Cloudflare CDN
→ Google Cloud VPS (Next.js + API)
→ Database (MySQL)
```

---

## 2. Kiến trúc mục tiêu

```
User
→ Cloudflare CDN
→ VPS (Next.js frontend only)
→ Cloudflare Workers (API layer)
→ Database (MySQL - qua SSH tunnel hoặc private network)
```

---

## 3. Danh sách API Routes

### 3.1 APIs di chuyển sang Cloudflare Workers (Public APIs)

| Endpoint | Mô tả | Loại |
|----------|-------|------|
| `/api/report` | Gửi báo cáo lừa đảo | POST |
| `/api/scan` | Quét website | POST |
| `/api/scams` | Danh sách lừa đảo | GET |
| `/api/categories` | Danh mục | GET/POST |
| `/api/stats` | Thống kê dashboard | GET |
| `/api/health` | Health check | GET |
| `/api/phishtank` | Tra cứu PhishTank | GET |
| `/api/policy-violations/lookup` | Tra cứu vi phạm | POST |
| `/api/seo/health-check` | Kiểm tra SEO | GET |
| `/api/settings/public` | Cài đặt công khai | GET |
| `/api/detail-feedback` | Phản hồi chi tiết | POST |
| `/api/detail-views` | Lượt xem chi tiết | POST |
| `/api/risk/analyze` | Phân tích rủi ro | POST |

### 3.2 APIs giữ lại trên VPS (Private/Internal APIs)

| Endpoint | Mô tả | Lý do |
|----------|-------|-------|
| `/api/auth/*` | Xác thực NextAuth | Cần session management |
| `/api/admin/*` | Chức năng admin | Bảo mật, cần auth |
| `/api/user/*` | APIs người dùng | Cần authentication |
| `/api/ai/*` | AI analysis | Cần server resources |
| `/api/users/me` | Profile người dùng | Cần auth |

---

## 4. Cấu hình Cloudflare

### 4.1 Workers Route
```
api.baocaoluadao.com/*
```

### 4.2 DNS Records
- `api.baocaoluadao.com` → Cloudflare Proxy (proxied)

---

## 5. Database Connection

Workers kết nối database qua:
- **Option 1:** Cloudflare Tunnel (recommended)
- **Option 2:** Private network/VPC peering
- **Option 3:** Public IP với firewall rules

---

## 6. Caching Strategy

### 6.1 Cache Headers
- `/api/scams` - Cache 5 phút
- `/api/categories` - Cache 1 giờ
- `/api/stats` - Cache 1 phút
- `/api/health` - Cache 30 giây

### 6.2 Cloudflare Cache API
- Sử dụng `Cache` API cho dynamic content
- Edge caching cho static responses

---

## 7. Security

### 7.1 Rate Limiting
- Sử dụng Cloudflare Rate Limiting
- Per-IP limits per endpoint

### 7.2 CORS
- Chỉ cho phép `baocaoluadao.com`
- Preflight requests xử lý

### 7.3 Request Validation
- Input sanitization
- Schema validation

---

## 8. Deployment

### 8.1 VPS Deployment
```bash
git pull
npm install
npm run build
pm2 restart
```

### 8.2 Workers Deployment
```bash
cd workers
wrangler deploy
```

---

## 9. Rollback Plan

Nếu có vấn đề:
1. Xóa Workers route trong Cloudflare
2. API requests sẽ tự động quay về VPS
3. Frontend code không cần thay đổi (sử dụng relative paths)

---

## 10. Performance Goals

- Giảm 60-80% API load trên VPS
- API responses nhanh hơn nhờ Cloudflare edge network
- Giảm database connections trên VPS

---

## 11. Timeline

1. **Phase 1:** Tạo Workers project và triển khai test
2. **Phase 2:** Di chuyển từng API endpoint
3. **Phase 3:** Cập nhật frontend (sử dụng environment variable)
4. **Phase 4:** Monitoring và tối ưu
5. **Phase 5:** Cleanup và remove old code
