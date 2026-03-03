# 📋 Hệ Thống Báo Cáo ScamGuard

Tài liệu mô tả chi tiết quy trình báo cáo lừa đảo - từ người dùng gửi báo cáo đến admin duyệt và hiển thị kết quả.

---

## 1. 🔄 Quy Trình Hoàn Chỉnh

### **Bước 1: Người Dùng Gửi Báo Cáo**

**Địa chỉ:** 
- **UI:** `src/app/report/page.tsx` - Trang để người dùng gửi báo cáo
- **API:** `POST /api/report` 

**Các loại báo cáo:**
```typescript
- website: Trang web lừa đảo
- phone: Số điện thoại lừa đảo
- email: Email lừa đảo
- social: Tài khoản mạng xã hội lừa đảo
- sms: Tin nhắn lừa đảo
```

**Quá trình:**
1. Người dùng nhập thông tin:
   - Loại lừa đảo (type)
   - Mục tiêu (target) - URL/phone/email/username
   - Mô tả chi tiết (description)
   - Email người báo cáo (optional)
   - Tên người báo cáo (optional)

2. Validation trước khi gửi:
   ```
   ✓ Loại báo cáo hợp lệ
   ✓ Định dạng mục tiêu phù hợp
   ✓ Email hợp lệ (nếu có)
   ✓ Độ dài mô tả phù hợp
   ```

3. Rate Limiting:
   ```
   - Tối đa 5 báo cáo/phút/IP address
   - IP bị khóa 5 phút nếu vượt quá
   - Trả về HTTP 429 (Too Many Requests)
   ```

4. API Endpoint:
```typescript
POST /api/report
Content-Type: application/json

{
  "type": "website|phone|email|social|sms",
  "target": "https://fake-site.com",
  "description": "Trang web giả mạo ngân hàng...",
  "email": "user@example.com",
  "name": "Nguyễn Văn A"
}

Response 200 OK:
{
  "success": true,
  "message": "Báo cáo của bạn đã được ghi nhận. Cảm ơn đã đóng góp!",
  "reportId": "RPTABC12345"
}
```

---

### **Bước 2: Lưu Trữ Vào Database**

**Database Schema:**
```sql
CREATE TABLE reports (
    id VARCHAR(20) PRIMARY KEY,           -- RPT_XXXXX
    type ENUM(...) NOT NULL,               -- website|phone|email|...
    target VARCHAR(500) NOT NULL,          -- Mục tiêu báo cáo
    description TEXT NOT NULL,             -- Chi tiết báo cáo
    reporter_name VARCHAR(80),             -- Tên người báo cáo
    reporter_email VARCHAR(120),           -- Email người báo cáo
    source ENUM(...) DEFAULT 'community',  -- Source: community|auto_scan|manual
    status ENUM(...) DEFAULT 'pending',    -- pending|processing|verified|rejected|completed
    ip VARCHAR(45),                        -- IP address của người báo cáo
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);
```

**Khi báo cáo được tạo:**
- Status = `pending` ⏳ (chờ admin duyệt)
- Timestamp được ghi lại
- IP address được lấy từ request headers

---

### **Bước 3: Admin Nhận Thông Báo**

**Cách Admin Nhận Thông Báo:**

1. **Real-time Dashboard**
   - Trang: `/admin/` (Admin Dashboard)
   - Widget "Báo Cáo Gần Đây" hiển thị báo cáo mới nhất
   - Thống kê: Tổng báo cáo pending, verified, rejected

2. **Notification Bell** (Header)
   - File: `src/components/admin/Header.tsx`
   - Drops down ra danh sách thông báo
   - Hiển thị báo cáo pending mới

3. **Reports Page**
   - URL: `/admin/reports`
   - Hiển thị toàn bộ báo cáo
   - Filter theo: trạng thái (pending/verified/rejected), loại báo cáo

**API để Admin Lấy Danh Sách:**
```typescript
GET /api/admin/reports?status=pending&page=1&pageSize=10

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "RPT12345",
        "type": "website",
        "target": "https://fake-bank.com",
        "description": "Trang web giả mạo ngân hàng ACB...",
        "reporter_name": "Nguyễn Văn A",
        "reporter_email": "nguyen@example.com",
        "status": "pending",
        "created_at": "2026-03-03T10:30:00Z",
        "updated_at": "2026-03-03T10:30:00Z",
        "ip": "192.168.1.1",
        "source": "community"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1,
    "summary": {
      "pending": 5,
      "verified": 12,
      "rejected": 3
    }
  }
}
```

---

### **Bước 4: Admin Duyệt Báo Cáo**

**Hành động của Admin:**

1. **Xem Chi Tiết**
   - URL: `/admin/reports/[reportId]`
   - Hiển thị toàn bộ thông tin báo cáo
   - Có thể xem lịch sử thay đổi (history)

2. **Phân Tích**
   - Kiểm tra target (URL/phone/email)
   - Xem IP address của người báo cáo
   - Đọc mô tả chi tiết
   - Xác minh thông tin báo cáo

3. **Quyết Định: ✅ Approve hoặc ❌ Reject**

---

### **Bước 5: Admin Approve (Duyệt)**

**Hành động:**
```typescript
POST /api/admin/reports
Content-Type: application/json
Authorization: Cookie (admin auth)

{
  "action": "approve",
  "reportId": "RPT12345",
  "riskLevel": "high|medium|low"
}

Response 200 OK:
{
  "success": true,
  "data": {
    "reportId": "RPT12345",
    "scamId": "SCM001",  // Scam mới vừa tạo
    "message": "Report approved successfully"
  }
}
```

**Quá trình Approve:**
1. Lấy thông tin báo cáo từ database
2. Kiểm tra báo cáo còn pending (chưa duyệt/từ chối)
3. **Tạo entry mới trong bảng SCAMS:**
   ```sql
   INSERT INTO scams (
     id, type, value, description,
     risk_level, status, source, report_count,
     created_at, updated_at
   )
   ```
4. **Cập nhật status báo cáo:** `pending` → `verified`
5. **Invalidate cache:** Làm mới thống kê dashboard
6. **Log hoạt động:** Ghi lại ai duyệt, khi nào, từ IP nào

**Kết quả:**
- ✅ Báo cáo được đánh dấu `verified`
- ✅ Tạo một entry mới trong bảng `scams`
- ✅ Báo cáo này sẽ xuất hiện trong danh sách Scams
- ✅ Admin activity được ghi lại

---

### **Bước 6: Admin Reject (Từ Chối)**

**Hành động:**
```typescript
POST /api/admin/reports
Content-Type: application/json
Authorization: Cookie (admin auth)

{
  "action": "reject",
  "reportId": "RPT12345",
  "reason": "Không đủ bằng chứng" // Optional
}

Response 200 OK:
{
  "success": true,
  "data": {
    "reportId": "RPT12345",
    "message": "Report rejected successfully"
  }
}
```

**Quá trình Reject:**
1. Lấy thông tin báo cáo từ database
2. Kiểm tra báo cáo còn pending
3. **Cập nhật status báo cáo:** `pending` → `rejected`
4. **Invalidate cache** 
5. **Log hoạt động:** Ghi lại lý do reject, IP, thời gian

**Kết quả:**
- ❌ Báo cáo được đánh dấu `rejected`
- ❌ Báo cáo KHÔNG được tạo entry mới trong bảng scams
- ❌ Admin activity được ghi lại với lý do

---

### **Bước 7: Hiển Thị Kết Quả**

**Cho Admin:**

1. **Reports Page** (`/admin/reports`)
   - Cập nhật danh sách báo cáo
   - Hiển thị trạng thái `verified` hoặc `rejected`
   - Color-coded: ✅ Xanh (verified), ❌ Đỏ (rejected)

2. **Dashboard** (`/admin/`)
   - Cập nhật số liệu thống kê
   - Pending count giảm đi
   - Verified count tăng lên

3. **Recent Activity**
   - Ghi lại hành động: "Duyệt báo cáo", "Từ chối báo cáo"
   - Tên admin, thời gian, IP
   - Lý do (nếu reject)

**Cho Người Dùng (Báo Cáo Được Approve):**

Nếu báo cáo được approve:
- ✅ Báo cáo được thêm vào danh sách Scams
- ✅ Người dùng có thể tìm thấy target trong kết quả tìm kiếm
- ✅ Thông tin lừa đảo được công khai cho cộng đồng

---

## 2. 📁 Cấu Trúc File

### **Frontend Files:**

| File | Mục đích |
|------|---------|
| `src/app/report/page.tsx` | Form gửi báo cáo (người dùng) |
| `src/app/admin/reports/page.tsx` | Danh sách báo cáo (admin) |
| `src/app/admin/reports/[id]/page.tsx` | Chi tiết báo cáo (admin) |
| `src/app/admin/reports/pending/page.tsx` | Báo cáo pending (admin) |
| `src/components/admin/Header.tsx` | Notification bell (thông báo) |
| `src/app/admin/page.tsx` | Dashboard (thống kê) |

### **Backend Files:**

| File | Mục đích |
|------|---------|
| `src/app/api/report/route.ts` | API gửi báo cáo (POST, GET) |
| `src/app/api/admin/reports/route.ts` | API quản lý báo cáo (GET, POST approve/reject) |
| `src/app/api/admin/reports/[id]/route.ts` | API chi tiết báo cáo (GET, PATCH) |
| `src/lib/services/report.service.ts` | Business logic báo cáo |
| `src/lib/adminManagementStore.ts` | Lưu hoạt động admin (logs) |
| `src/lib/adminDataStore.ts` | In-memory data storage |

### **Database:**

| File | Mục đích |
|------|---------|
| `migrations/001_initial_schema.sql` | Tạo bảng reports, rate_limits |
| `migrations/003_schema_improvements.sql` | Cải thiện schema, thêm index |

---

## 3. 🔗 API Endpoints

### **PUBLIC - Người Dùng:**

#### POST /api/report - Gửi báo cáo
```
URL: POST /api/report
Rate Limit: 5 báo cáo/phút/IP
Response Time: ~500ms

Request:
{
  "type": "website|phone|email|social|sms",
  "target": "string",
  "description": "string",
  "email": "string@example.com", // optional
  "name": "string" // optional
}

Response:
{
  "success": true,
  "message": "Báo cáo của bạn đã được ghi nhận",
  "reportId": "RPTABC12345"
}

Errors:
- 400: Invalid input
- 429: Rate limited
- 500: Server error
```

#### GET /api/report - Lấy danh sách báo cáo
```
URL: GET /api/report?page=1&limit=20&status=pending&type=website
Response: Danh sách báo cáo theo filter
```

---

### **ADMIN - Quản Trị Viên:**

#### GET /api/admin/reports - Danh sách báo cáo
```
URL: GET /api/admin/reports?q=search&status=pending&type=website&page=1&pageSize=10
Auth: Required (cookie session)
Response: { success, data: { items, total, page, totalPages, summary } }
```

#### POST /api/admin/reports - Approve/Reject báo cáo
```
URL: POST /api/admin/reports
Auth: Required (cookie session)

Request (Approve):
{
  "action": "approve",
  "reportId": "RPT12345",
  "riskLevel": "high|medium|low"
}

Request (Reject):
{
  "action": "reject",
  "reportId": "RPT12345",
  "reason": "Không đủ bằng chứng"
}

Response:
{
  "success": true,
  "data": {
    "reportId": "RPT12345",
    "scamId": "SCM001", // chỉ khi approve
    "message": "..."
  }
}
```

#### GET /api/admin/reports/[id] - Chi tiết báo cáo
```
URL: GET /api/admin/reports/RPT12345
Auth: Required
Response: { success, item: {...report details...} }
```

#### PATCH /api/admin/reports/[id] - Cập nhật báo cáo
```
URL: PATCH /api/admin/reports/RPT12345
Auth: Required

Request:
{
  "status": "pending|verified|rejected",
  "adminNotes": "string"
}

Response: { success, item: {...updated report...} }
```

---

## 4. 📊 Trạng Thái Báo Cáo

```
┌─────────────────────────────────────────────────────┐
│              REPORT LIFECYCLE                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  USER SUBMITS REPORT                               │
│         │                                            │
│         ▼                                            │
│  Status: PENDING ⏳ (Chờ duyệt)                    │
│         │                                            │
│         ├─────────────────────┬────────────────┐   │
│         │                     │                │   │
│         ▼                     ▼                ▼   │
│  VERIFIED ✅          REJECTED ❌      PROCESSING   │
│    → Create SCAM              │          (optional) │
│    → Public                   │                     │
│    → Searchable               │                     │
│         │                     │                     │
│         └─────────────┬───────┘                     │
│                       ▼                             │
│              COMPLETED ✓ (Final)                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Status Details:**
- **pending**: Báo cáo vừa tạo, chờ admin duyệt
- **processing**: Admin đang xem xét (optional, hiếm dùng)
- **verified**: Admin đã duyệt, tạo entry trong bảng scams
- **rejected**: Admin đã từ chối, không tạo entry
- **completed**: Báo cáo hoàn thành xử lý

---

## 5. 🔐 Bảo Mật

### **Input Validation:**
- Max length của field
- Định dạng email, URL, phone
- SQL injection prevention
- XSS protection (input sanitization)

### **Rate Limiting:**
- In-memory limiter (dev)
- 5 báo cáo/phút/IP
- 5 phút lockout nếu vượt quá
- Cần thay bằng Redis/Upstash trước production

### **Authentication/Authorization:**
- Admin auth required cho endpoints /api/admin/reports
- Cookie-based session
- Middleware verification

### **Data Sanitization:**
```typescript
- Input trimmed & sliced to max length
- HTML entities escaped
- SQL parameters use prepared statements
- No raw user input in queries
```

---

## 6. 📈 Caching & Performance

### **Cache Invalidation:**
Khi báo cáo được approve/reject:
1. Dashboard cache bị invalidate
2. Stats cache reset
3. Pending count update

### **Database Indexes:**
```sql
- idx_status (status) - Quick filter by status
- idx_type (type) - Quick filter by type
- idx_created_at (created_at) - Sort by date
- idx_target (target) - Search by target
- idx_status_type (status, type) - Combined filter
```

---

## 7. 📝 Activity Logging

**Admin Actions Log:**
```typescript
// File: src/lib/adminManagementStore.ts

recordAdminActivity({
  action: "Duyệt báo cáo thành scam",
  user: "admin@example.com",
  target: "RPT12345 -> SCM001",
  status: "success",
  ip: "192.168.1.1",
  timestamp: new Date()
})
```

**Tracked Actions:**
- Duyệt báo cáo (Approve)
- Từ chối báo cáo (Reject)
- Cập nhật trạng thái
- Thêm ghi chú admin

---

## 8. ⚡ Quy Trình Nhanh

### **Tóm Tắt Quy Trình:**

```
1. USER Gửi báo cáo
   ❌ Validate fail? → 400 error
   ❌ Rate limited? → 429 error
   
2. Database Lưu báo cáo (status=pending)

3. ADMIN Xem dashboard/reports page
   → Thấy báo cáo mới trong notification/list

4. ADMIN Click vào báo cáo
   → Xem chi tiết, target, IP, mô tả

5. ADMIN Quyết định
   ✅ Approve → Tạo SCAM entry + log
   ❌ Reject → Update status + log

6. RESULT
   ✅ Verified: Báo cáo hiển thị công khai
   ❌ Rejected: Báo cáo bị ẩn
```

---

## 9. 🐛 Debugging

### **Kiểm Tra Report Submission:**

1. Check `/api/report` endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/report \
     -H "Content-Type: application/json" \
     -d '{
       "type": "website",
       "target": "https://example.com",
       "description": "Test report"
     }'
   ```

2. Check database:
   ```sql
   SELECT * FROM reports WHERE status = 'pending' ORDER BY created_at DESC;
   ```

3. Check admin API:
   ```bash
   curl http://localhost:3000/api/admin/reports \
     -H "Cookie: [admin-session-cookie]"
   ```

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| Rate limit error (429) | Wait 5 minutes or use different IP |
| Validation error (400) | Check input format, required fields |
| Auth error (401) | Ensure admin is logged in |
| Cache not updating | Check cache invalidation logic |

---

## 10. 🚀 Tương Lai (TODO)

- [ ] Email notification cho admin
- [ ] Real-time WebSocket updates
- [ ] Bulk operations (approve multiple)
- [ ] Report analytics/trends
- [ ] Reporter feedback system
- [ ] Appeal process for rejected reports
- [ ] Two-factor authentication for approvals
- [ ] Report quality scoring

---

**Tài liệu được cập nhật:** 2026-03-03
**Version:** 1.0
**Status:** Production Ready
