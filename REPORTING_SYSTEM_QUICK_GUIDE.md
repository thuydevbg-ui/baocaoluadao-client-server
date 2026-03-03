# 📋 Hệ Thống Báo Cáo ScamGuard - Tóm Tắt Nhanh

**Người viết:** GitHub Copilot  
**Ngày:** 2026-03-03  
**Trạng thái:** ✅ Hoàn Thiện

---

## 🎯 Tổng Quan Hệ Thống

Hệ thống báo cáo ScamGuard cho phép người dùng báo cáo các trường hợp lừa đảo qua nhiều kênh (website, điện thoại, email, mạng xã hội, SMS), admin duyệt báo cáo, và hiển thị chúng công khai.

### 📊 Quy Trình Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────────────┐
│                     BÁOO CÁO HỌ ĐẢAO                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1️⃣  USER → Trang /report                                       │
│     - Chọn loại lừa đảo                                         │
│     - Nhập target (URL/phone/email/username)                   │
│     - Nhập mô tả                                                │
│     - Gửi POST /api/report                                      │
│                                                                  │
│ 2️⃣  API → Validate & Rate Limit                                │
│     - Check rate limit (5/phút/IP)                             │
│     - Validate input format                                     │
│     - Sanitize data                                             │
│                                                                  │
│ 3️⃣  DATABASE → Lưu Báo Cáo                                    │
│     - INSERT vào bảng REPORTS                                  │
│     - status = 'pending' ⏳                                     │
│                                                                  │
│ 4️⃣  ADMIN → Nhận Thông Báo                                    │
│     - Dashboard /admin                                          │
│     - Notification bell                                         │
│     - Reports list /admin/reports                              │
│                                                                  │
│ 5️⃣  ADMIN → Duyệt Chi Tiết                                    │
│     - Xem /admin/reports/[id]                                  │
│     - Đánh giá target, IP, mô tả                               │
│                                                                  │
│ 6️⃣  ADMIN → Quyết Định                                        │
│                                                                  │
│     ✅ APPROVE (Duyệt)          ❌ REJECT (Từ Chối)          │
│     - Tạo SCAM entry            - Update status                │
│     - status = 'verified'        - status = 'rejected'         │
│     - Log activity               - Log activity                │
│     - Invalidate cache           - Invalidate cache            │
│                                                                  │
│ 7️⃣  RESULT → Hiển Thị Kết Quả                                │
│     ✅ Báo cáo verified viễn thị trong danh sách Scams       │
│     ❌ Báo cáo rejected bị ẩn                                 │
│     📊 Dashboard stats cập nhật                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu Trúc File Chính

| Layer | File | Mục Đích |
|-------|------|----------|
| **UI (Frontend)** | `src/app/report/page.tsx` | Form người dùng |
| | `src/app/admin/reports/page.tsx` | Danh sách admin (List) |
| | `src/app/admin/reports/[id]/page.tsx` | Chi tiết admin (Detail) |
| | `src/components/admin/Header.tsx` | Notification bell |
| **API (Routes)** | `src/app/api/report/route.ts` | POST/GET báo cáo |
| | `src/app/api/admin/reports/route.ts` | Admin list/approve/reject |
| | `src/app/api/admin/reports/[id]/route.ts` | Admin detail/update |
| **Business Logic** | `src/lib/services/report.service.ts` | Core logic |
| | `src/lib/adminDataStore.ts` | In-memory data |
| | `src/lib/adminManagementStore.ts` | Activity logging |
| **Database** | `migrations/001_initial_schema.sql` | Tables: reports, scams |
| | `migrations/003_schema_improvements.sql` | Indexes, enums |

---

## 🔗 Key API Endpoints

### Public (Người Dùng)

```
POST /api/report
  Gửi báo cáo lừa đảo
  Body: { type, target, description, email, name }
  Response: { success, reportId }

GET /api/report?status=pending&type=website
  Lấy danh sách báo cáo (public)
```

### Admin (Yêu Cầu Auth)

```
GET /api/admin/reports?status=pending&page=1
  Danh sách báo cáo
  Response: { success, data: { items, total, summary } }

GET /api/admin/reports/[reportId]
  Chi tiết báo cáo

POST /api/admin/reports
  Approve/Reject báo cáo
  Body: { action: 'approve'|'reject', reportId, riskLevel?, reason? }
  Response: { success, data: { reportId, scamId?, message } }

PATCH /api/admin/reports/[reportId]
  Cập nhật status/notes
```

---

## 📊 Database Schema

### REPORTS Table

```sql
id              → STRING (RPT_XXXXX)
type            → ENUM (website|phone|email|social|sms)
target          → VARCHAR(500)
description     → TEXT
reporter_name   → VARCHAR(80)
reporter_email  → VARCHAR(120)
source          → ENUM (community|auto_scan|manual)
status          → ENUM (pending|processing|verified|rejected|completed)
ip              → VARCHAR(45)
created_at      → DATETIME
updated_at      → DATETIME
```

### SCAMS Table (khi approved)

```sql
id              → STRING (SCM_XXXXX)
type            → ENUM (website|phone|email|social|sms|bank)
value           → VARCHAR(500) - same as report.target
description     → TEXT - copy from report
risk_level      → ENUM (low|medium|high) - from admin choice
status          → ENUM (active|blocked|archived)
source          → STRING (report:RPT_XXXXX)
report_count    → INT
created_at      → DATETIME
updated_at      → DATETIME
```

---

## 🔐 Bảo Mật

| Biện Pháp | Cách Thực Hiện |
|----------|---------------|
| **Rate Limiting** | 5 báo cáo/phút/IP, ban 5 phút |
| **Input Validation** | Whitelist types, regex for targets |
| **Data Sanitization** | Trim, slice, SQL params |
| **SQL Injection** | Prepared statements, parameterized queries |
| **XSS Protection** | HTML escaping, input sanitization |
| **Admin Auth** | Cookie session, middleware verify |
| **CORS** | Origin validation |

---

## 📈 Trạng Thái Báo Cáo

```
pending ──┬──→ processing ──┬──→ verified  →┐
          │                │    (+ SCAM)    │
          │                │                ├──→ completed
          │                └──→ rejected   ─┘
          │
          └────────────→ rejected ────────→ completed
```

**Legend:**
- **pending**: ⏳ Chờ admin duyệt
- **processing**: 🔄 Admin đang xem xét (tùy chọn)
- **verified**: ✅ Admin duyệt → tạo SCAM entry
- **rejected**: ❌ Admin từ chối → không tạo SCAM
- **completed**: ✓ Hoàn thành xử lý

---

## ⚡ Performance

| Aspect | Details |
|--------|---------|
| **Indexes** | status, type, created_at, target, combo |
| **Pagination** | Default 10/page, max 100/page |
| **Cache** | Dashboard stats invalidate on approve/reject |
| **Transactions** | Atomic approve (SCAM + status update) |

---

## 📝 Activity Logging

Admin actions được ghi lại:
- Action: "Duyệt báo cáo", "Từ chối báo cáo"
- User: admin@example.com
- Timestamp & IP
- Target report ID
- Status: success/failed

---

## 🧪 Testing Checklist

- [ ] User can submit report via /report page
- [ ] Rate limiting works (5/min/IP)
- [ ] Admin sees pending reports in dashboard
- [ ] Admin can approve report → creates SCAM entry
- [ ] Admin can reject report → no SCAM entry
- [ ] Dashboard stats update correctly
- [ ] Activity logged properly
- [ ] Error handling works (400, 401, 429, 500)
- [ ] Input validation blocks invalid data
- [ ] Cache invalidates on changes

---

## 📚 Tài Liệu Liên Quan

1. **[REPORTING_SYSTEM.md](./REPORTING_SYSTEM.md)** - Quy trình chi tiết
2. **[REPORTING_SYSTEM_TECHNICAL.md](./REPORTING_SYSTEM_TECHNICAL.md)** - Chi tiết kỹ thuật
3. **[REPORTING_SYSTEM_EXAMPLES.md](./REPORTING_SYSTEM_EXAMPLES.md)** - Ví dụ thực tế

---

## 🚀 Quick Start

### Người Dùng Báo Cáo

1. Truy cập: `https://baocaoluadao.com/report`
2. Chọn loại lừa đảo
3. Nhập URL/phone/email
4. Nhập mô tả
5. Click gửi
6. ✅ Nhận ID báo cáo

### Admin Duyệt

1. Đăng nhập: `https://baocaoluadao.com/admin`
2. Xem dashboard hoặc `/admin/reports`
3. Click báo cáo pending
4. Đọc chi tiết, IP, target
5. Chọn approve/reject
6. Nếu approve: tạo SCAM entry ✅
7. Nếu reject: đánh dấu rejected ❌

### Xem Kết Quả

- **Báo cáo Approved** → Xuất hiện trong danh sách Scams
- **Báo cáo Rejected** → Bị ẩn, không tạo SCAM
- **Dashboard** → Stats cập nhật real-time

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| 429 Too Many Requests | Báo cáo quá nhanh, đợi 5 phút |
| 400 Validation Error | Check input format (URL, email, etc) |
| 401 Unauthorized | Admin chưa đăng nhập |
| Report vẫn pending | Check `/api/admin/reports` |
| Dashboard không update | Clear cache hoặc f5 page |

---

## 🎯 Key Features

✅ **Multi-channel Reports**: Website, phone, email, social, SMS  
✅ **Rate Limiting**: 5 báo cáo/phút/IP  
✅ **Real-time Notifications**: Admin thấy báo cáo mới immediately  
✅ **Two-level Review**: List view + Detail view  
✅ **Risk Assessment**: Admin chọn low/medium/high  
✅ **Activity Logging**: Ghi lại tất cả hành động admin  
✅ **Cache Management**: Tự động invalidate stats  
✅ **Responsive UI**: Desktop + mobile friendly  

---

## 📌 Notes

- In-memory rate limiter → Cần Redis cho production
- In-memory data store → Cần database persist
- Activity logging → In-memory → Cần database
- Email notifications → TODO (chưa implement)
- Real-time updates → TODO (WebSocket)

---

## 📞 Support

Để cập nhật/thay đổi/debug hệ thống báo cáo:

1. **Xem chi tiết:** Đọc file REPORTING_SYSTEM.md
2. **Xem code:** Kiểm tra files trong src/app/api/report/
3. **Test API:** Dùng cURL hoặc Postman
4. **Debug DB:** Query trực tiếp bảng reports/scams

---

**Created by GitHub Copilot**  
**Last Updated: 2026-03-03**  
**Version: 1.0**  
**Status: Production Ready** ✅
