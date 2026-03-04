# 🔍 Hệ Thống Báo Cáo - Ví Dụ Thực Tế

Tài liệu này chứa các ví dụ chi tiết, hướng dẫn từng bước cho từng kịch bản sử dụng.

---

## 1. 👤 Kịch Bản: Người Dùng Báo Cáo Trang Web Lừa Đảo

### Bước 1: Truy Cập Trang Báo Cáo

**URL:** `https://baocaoluadao.com/report`

```
Người dùng thấy:
┌─────────────────────────────────────────┐
│         Báo Cáo Lừa Đảo                 │
│  ════════════════════════════════════   │
│                                         │
│  Bước 1 - Chọn Loại Lừa Đảo             │
│                                         │
│  [🌐] Trang Web    [☎️] Điện Thoại       │
│  [✉️] Email        [📱] Mạng Xã Hội     │
│  [💬] SMS          [💰] Crypto         │
│  [📈] Đầu Tư       [💼] Tuyển Dụng      │
│                                         │
│  [Tiếp Tục] → Bước 2                    │
└─────────────────────────────────────────┘
```

### Bước 2: Chọn Loại Lừa Đảo

```
Người dùng nhấp vào: [🌐] Trang Web
```

**Response từ Frontend:**
```javascript
// src/app/report/page.tsx
setReportData(prev => ({ 
  ...prev, 
  type: 'website'  // Loại đã chọn
}));
setStep(2);  // Chuyển đến bước tiếp theo
```

### Bước 3: Nhập Thông Tin Báo Cáo

```
Bước 2 - Nhập Thông Tin Chi Tiết
════════════════════════════════

[Input] URL/Tên Miền:  https://fake-acb-bank.com
[Input] Mô Tả:         Trang web giả mạo ngân hàng ACB, 
                       yêu cầu nhập thông tin tài khoản
[Input] Số Tiền Mất:   50.000.000 VND
[Input] Email [opt]:   user@gmail.com
```

### Bước 4: Gửi Báo Cáo (Client Side)

**JavaScript trong browser:**
```javascript
// src/app/report/page.tsx - handleSubmit()

const reportData = {
  type: 'website',
  target: 'https://fake-acb-bank.com',
  description: 'Trang web giả mạo ngân hàng ACB...',
  email: 'user@gmail.com',
  name: 'Nguyễn Văn A'
};

// Gửi đến server
const response = await fetch('/api/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});

const result = await response.json();
// {
//   "success": true,
//   "message": "Báo cáo của bạn đã được ghi nhận...",
//   "reportId": "RPTABC12345"
// }
```

### Bước 5: Backend Xử Lý (API)

**POST /api/report - Server Side Logic:**

```typescript
// File: src/app/api/report/route.ts

export const POST = async (request: NextRequest) => {
  // 1️⃣ Extract IP từ request
  const ip = getClientIP(request);
  // Result: "192.168.1.100"

  // 2️⃣ Check Rate Limit
  const rateLimitResult = await checkRateLimit({
    scope: 'report-submission',
    key: ip,
    maxAttempts: 5,
    windowSeconds: 60,
    banSeconds: 300  // 5 phút
  });
  
  if (!rateLimitResult.allowed) {
    // User đã gửi 5 báo cáo trong 1 phút
    return NextResponse.json(
      { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      { status: 429 }
    );
  }

  // 3️⃣ Parse & Validate Input
  const body = await request.json();
  
  const type = sanitizeInput(body.type, 20);      // "website"
  const target = sanitizeInput(body.target, 500); // "https://fake-acb-bank.com"
  const description = sanitizeInput(body.description, 2000);
  const email = sanitizeInput(body.email, 120);
  const name = sanitizeInput(body.name, 80);

  // Validate
  if (!validateReportType(type)) {
    return NextResponse.json(
      { success: false, error: 'Loại báo cáo không hợp lệ' },
      { status: 400 }
    );
  }

  if (!validateTarget(type, target)) {
    return NextResponse.json(
      { success: false, error: 'URL không hợp lệ: https://...' },
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Email không hợp lệ' },
      { status: 400 }
    );
  }

  // 4️⃣ Create Report ID
  const reportId = `RPT${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  // Result: "RPTABC12345"

  // 5️⃣ Get Timestamp
  const createdAt = new Date().toISOString()
    .replace('T', ' ')
    .replace('Z', '')
    .slice(0, 19);
  // Result: "2026-03-03 10:30:45"

  // 6️⃣ Insert vào Database
  const db = getDb();
  await db.execute(
    `INSERT INTO reports (
      id, type, target, description, 
      reporter_name, reporter_email, source, 
      status, ip, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      reportId,
      type,
      target,
      description,
      name || null,
      email || null,
      'community',
      ip !== 'unknown' ? ip : null,
      createdAt
    ]
  );

  // 7️⃣ Response Success
  return NextResponse.json({
    success: true,
    message: 'Báo cáo của bạn đã được ghi nhận. Cảm ơn đã đóng góp!',
    reportId: reportId
  });
};
```

### Bước 6: Dữ Liệu Lưu Trong Database

```sql
-- Inserted into reports table
+------------------------+---------+---------------------------+--------+
| id         | type    | target                        | status |
+============+=========+===============================+========+
| RPTABC1234 | website | https://fake-acb-bank.com     | pending|
+------------------------+---------+---------------------------+--------+

-- Full row details
{
  id: "RPTABC1234",
  type: "website",
  target: "https://fake-acb-bank.com",
  description: "Trang web giả mạo ngân hàng ACB, yêu cầu nhập thông tin tài khoản",
  reporter_name: "Nguyễn Văn A",
  reporter_email: "user@gmail.com",
  source: "community",
  status: "pending",              -- ⏳ Chờ admin duyệt
  ip: "192.168.1.100",
  created_at: "2026-03-03 10:30:45",
  updated_at: "2026-03-03 10:30:45"
}
```

### Bước 7: Người Dùng Thấy Success

```
Bước 3 - Thành Công ✅
════════════════════════

┌────────────────────────────────────┐
│  ✅ Báo Cáo Được Ghi Nhận!         │
├────────────────────────────────────┤
│                                    │
│  ID Báo Cáo: RPTABC1234           │
│                                    │
│  Cảm ơn bạn đã đóng góp!          │
│  Đội ngũ của chúng tôi sẽ         │
│  xem xét báo cáo này.             │
│                                    │
│  [← Trang Chủ]  [Báo Cáo Khác]   │
│                                    │
└────────────────────────────────────┘
```

---

## 2. 👨‍💼 Kịch Bản: Admin Duyệt Báo Cáo

### Bước 1: Admin Đăng Nhập

**URL:** `https://baocaoluadao.com/admin/login`

```
Admin nhập:
Email: admin@scamguard.vn
Password: ••••••••
```

**Response:**
```javascript
// Cookie được thiết lập
Set-Cookie: admin_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Bước 2: Truy Cập Dashboard

**URL:** `https://baocaoluadao.com/admin`

```
┌─────────────────────────────────────────────────────┐
│              Admin Dashboard                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 THỐNG KÊ                                       │
│  ├─ Báo Cáo Pending:     5 🔔                     │
│  ├─ Báo Cáo Verified:    42 ✅                    │
│  ├─ Báo Cáo Rejected:    3  ❌                    │
│  └─ Scams Detected:      47                       │
│                                                     │
│  📋 BÁOO CÁO GẦN ĐÂY                              │
│  ├─ [ID] RPTABC1234 | Website | 5 phút trước     │
│  ├─ [ID] RPTXYZ9876 | Phone   | 15 phút trước    │
│  └─ [ID] RPTDEF5432 | Email   | 1 giờ trước      │
│                                                     │
│  🔔 THÔNG BÁO: Có 5 báo cáo chờ duyệt             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Bước 3: Admin Click Xem Báo Cáo Pending

**URL:** `https://baocaoluadao.com/admin/reports?status=pending`

```
GET /api/admin/reports?status=pending&page=1&pageSize=10
(với admin_session cookie)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "RPTABC1234",
        "type": "website",
        "target": "https://fake-acb-bank.com",
        "description": "Trang web giả mạo ngân hàng ACB...",
        "reporter_name": "Nguyễn Văn A",
        "reporter_email": "user@gmail.com",
        "status": "pending",
        "created_at": "2026-03-03T10:30:45Z",
        "ip": "192.168.1.100"
      }
    ],
    "summary": {
      "pending": 5,
      "verified": 42,
      "rejected": 3
    }
  }
}
```

**Giao diện hiển thị:**
```
┌──────────────────────────────────────────────────────┐
│ 📋 Danh Sách Báo Cáo (Chờ Duyệt)                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [🔍 Tìm kiếm...] [Status: Pending] [Type: All]    │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ID      │ Type    │ Target              │ Status│ │
│ ├─────────────────────────────────────────────────┤ │
│ │RPTABC1  │Website  │fake-acb-bank.com    │pending│ │
│ │RPTXYZ2  │Phone    │0901234567           │pending│ │
│ │RPTDEF3  │Email    │fake@bank.com        │pending│ │
│ │...      │...      │...                  │...    │ │
│ └─────────────────────────────────────────────────┘ │
│  Page 1 of 1  [< Prev] [Next >]                     │
└──────────────────────────────────────────────────────┘
```

### Bước 4: Admin Click Vào Chi Tiết Báo Cáo

**URL:** `https://baocaoluadao.com/admin/reports/RPTABC1234`

```
GET /api/admin/reports/RPTABC1234
(với admin_session cookie)
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "RPTABC1234",
    "type": "website",
    "target": "https://fake-acb-bank.com",
    "description": "Trang web giả mạo ngân hàng ACB...",
    "reporter_name": "Nguyễn Văn A",
    "reporter_email": "user@gmail.com",
    "source": "community",
    "status": "pending",
    "created_at": "2026-03-03T10:30:45Z",
    "updated_at": "2026-03-03T10:30:45Z",
    "ip": "192.168.1.100",
    "riskLevel": "high",
    "adminNotes": ""
  }
}
```

**Giao diện:**
```
┌──────────────────────────────────────────────────────┐
│ ← Chi Tiết Báo Cáo                                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📌 ID: RPTABC1234                                   │
│ 📌 Loại: Website                                    │
│ 📌 Target: https://fake-acb-bank.com                │
│ 📌 Từ: Nguyễn Văn A (user@gmail.com)               │
│ 📌 IP: 192.168.1.100                                │
│ 📌 Ngày: 2026-03-03 10:30:45                        │
│                                                      │
│ 📝 Mô Tả:                                           │
│ ┌────────────────────────────────────────────────┐ │
│ │ Trang web giả mạo ngân hàng ACB, yêu cầu nhập│ │
│ │ thông tin tài khoản. Tôi đã nhập thông tin   │ │
│ │ nhầm và mất 50 triệu đồng.                   │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ [Ghi Chú Của Admin]:                                │
│ ┌────────────────────────────────────────────────┐ │
│ │ [Nhập ghi chú...]                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ 🎯 MỨC ĐỘ RỦI RO:                                 │
│  ⚫ Thấp    ⚪ Trung Bình    ⚫ CAO                 │
│                                                      │
│ ┌──────────────────────────────────────────────┐  │
│ │ [✅ DUYỆT (Approve)]  [❌ TỪCHỐI (Reject)]   │  │
│ └──────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Bước 5: Admin Quyết Định - APPROVE ✅

**Button Click:** Nhấn [✅ DUYỆT]

```typescript
// Frontend code (src/app/admin/reports/[id]/page.tsx)
const handleApprove = async () => {
  const response = await fetch('/api/admin/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve',
      reportId: 'RPTABC1234',
      riskLevel: 'high'
    })
  });

  const result = await response.json();
  // {
  //   "success": true,
  //   "data": {
  //     "reportId": "RPTABC1234",
  //     "scamId": "SCM045",
  //     "message": "Report approved successfully"
  //   }
  // }
};
```

**Backend Processing:**

```typescript
// File: src/app/api/admin/reports/route.ts

export const POST = async (request: NextRequest) => {
  // 1️⃣ Verify Admin Auth
  const auth = getAdminAuth(request);
  if (!auth) return 401 Unauthorized;

  // 2️⃣ Parse Request
  const { action, reportId, riskLevel } = await request.json();
  // action = 'approve'
  // reportId = 'RPTABC1234'
  // riskLevel = 'high'

  // 3️⃣ Validate
  if (!['low', 'medium', 'high'].includes(riskLevel)) {
    return 400 Invalid risk level;
  }

  // 4️⃣ Call approveReport service
  const result = await approveReport({
    reportId: 'RPTABC1234',
    riskLevel: 'high',
    actor: 'admin@scamguard.vn',
    ip: '203.0.113.50'
  });

  return success response with scamId;
};
```

**Service Layer Processing:**

```typescript
// File: src/lib/services/report.service.ts

export async function approveReport(payload) {
  // 1️⃣ Lấy báo cáo từ database
  const report = await getReportById('RPTABC1234');
  // {
  //   id: 'RPTABC1234',
  //   type: 'website',
  //   target: 'https://fake-acb-bank.com',
  //   description: '...',
  //   status: 'pending'
  // }

  // 2️⃣ Kiểm tra status
  if (report.status !== 'pending') {
    return { success: false, error: 'Report already processed' };
  }

  // 3️⃣ Generate Scam ID
  const scamId = await generateUniqueId('SCM', 'scams', 'id');
  // Result: 'SCM045'

  // 4️⃣ Bắt đầu transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 5️⃣ INSERT vào bảng SCAMS
    await connection.execute(
      `INSERT INTO scams (
        id, type, value, description,
        risk_level, status, source, report_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, 1, NOW(), NOW())`,
      [
        'SCM045',                          // ID mới
        'website',                         // Loại
        'https://fake-acb-bank.com',       // Target
        'Trang web giả mạo...',           // Mô tả
        'high',                            // Risk level
        'report:RPTABC1234'               // Source
      ]
    );

    // 6️⃣ UPDATE báo cáo: pending → verified
    await connection.execute(
      `UPDATE reports SET status = 'verified', updated_at = NOW()
       WHERE id = ?`,
      ['RPTABC1234']
    );

    // 7️⃣ Commit transaction
    await connection.commit();

  } catch (error) {
    // ❌ Rollback nếu có lỗi
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // 8️⃣ Invalidate dashboard cache
  await invalidateDashboardCache();

  // 9️⃣ Record admin activity
  await recordAdminActivity({
    action: 'Duyệt báo cáo thành scam',
    user: 'admin@scamguard.vn',
    target: 'RPTABC1234 -> SCM045',
    status: 'success',
    ip: '203.0.113.50'
  });

  return {
    success: true,
    scamId: 'SCM045'
  };
}
```

**Database Changes:**

```sql
-- 1️⃣ New row in SCAMS table
INSERT INTO scams VALUES (
  'SCM045',
  'website',
  'https://fake-acb-bank.com',
  'Trang web giả mạo ngân hàng ACB...',
  'high',        -- Risk level
  'active',      -- Status
  'report:RPTABC1234',
  1,             -- report_count
  NOW(),
  NOW()
);

-- 2️⃣ Update in REPORTS table
UPDATE reports 
SET status = 'verified', updated_at = NOW()
WHERE id = 'RPTABC1234';
```

**Admin UI Feedback:**

```
┌──────────────────────────────────────────────────────┐
│ ✅ Báo Cáo Đã Được Duyệt Thành Công!               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ID Báo Cáo: RPTABC1234                             │
│ Scam ID Tạo: SCM045                                │
│ Trạng Thái: VERIFIED ✅                            │
│                                                      │
│ Báo cáo này bây giờ hiển thị trong danh sách       │
│ Scams và người dùng có thể tìm thấy.               │
│                                                      │
│ [← Quay Lại Danh Sách]  [Xem SCM045]              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 3. 👨‍💼 Kịch Bản: Admin Từ Chối Báo Cáo

**Button Click:** Nhấn [❌ TỪ CHỐI]

```typescript
// Frontend code
const handleReject = async () => {
  const response = await fetch('/api/admin/reports', {
    method: 'POST',
    body: JSON.stringify({
      action: 'reject',
      reportId: 'RPTABC1234',
      reason: 'Không có đủ bằng chứng, URL có thể là tạm thời'
    })
  });

  const result = await response.json();
  // { "success": true, "data": { "reportId": "...", "message": "..." } }
};
```

**Backend Processing:**

```typescript
// src/lib/services/report.service.ts
export async function rejectReport(payload) {
  // 1️⃣ Lấy báo cáo
  const report = await getReportById('RPTABC1234');

  // 2️⃣ Kiểm tra status
  if (report.status !== 'pending') {
    return { success: false, error: 'Cannot reject after approval' };
  }

  // 3️⃣ UPDATE báo cáo: pending → rejected
  //    ⚠️  KHÔNG tạo entry trong bảng SCAMS
  await db.execute(
    `UPDATE reports SET status = 'rejected', updated_at = NOW()
     WHERE id = ?`,
    ['RPTABC1234']
  );

  // 4️⃣ Invalidate cache
  await invalidateDashboardCache();

  // 5️⃣ Log hoạt động
  await recordAdminActivity({
    action: 'Từ chối báo cáo',
    user: 'admin@scamguard.vn',
    target: 'RPTABC1234',
    status: 'success',
    details: {
      reason: 'Không có đủ bằng chứng...'
    }
  });

  return { success: true };
}
```

**Database Change:**

```sql
UPDATE reports
SET status = 'rejected', updated_at = NOW()
WHERE id = 'RPTABC1234';

-- Result: status = 'rejected', NOT in SCAMS table
```

---

## 4. 📊 Dashboard Stats Cập Nhật

**Trước Approve:**
```
Pending:    5 ⏳
Verified:   42 ✅
Rejected:   3  ❌
```

**Sau Approve Report RPTABC1234:**
```
Pending:    4 ⏳  (giảm 1)
Verified:   43 ✅ (tăng 1)
Rejected:   3  ❌ (không thay đổi)
```

**Query gọi để update:**
```sql
SELECT
  COUNT(*) as total,
  SUM(IF(status='pending', 1, 0)) as pending,
  SUM(IF(status='verified', 1, 0)) as verified,
  SUM(IF(status='rejected', 1, 0)) as rejected
FROM reports;
```

---

## 5. 🔒 Error Scenarios

### Scenario A: Rate Limited

```
Request #6 from IP 192.168.1.100 (trong 1 phút)

Response 429:
{
  "success": false,
  "error": "Quá nhiều yêu cầu. Vui lòng thử lại sau."
}

Headers:
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1646305245  (5 phút sau)
Retry-After: 300
```

### Scenario B: Invalid Email Format

```
Request:
{
  "type": "website",
  "target": "...",
  "description": "...",
  "email": "not-an-email"  // Invalid format
}

Response 400:
{
  "success": false,
  "error": "Định dạng email không hợp lệ"
}
```

### Scenario C: Admin Not Authenticated

```
GET /api/admin/reports
(No admin_session cookie)

Response 401:
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized access"
  }
}
```

### Scenario D: Cannot Approve Already Verified Report

```
Request:
{
  "action": "approve",
  "reportId": "RPTABC1234"  // Already verified
}

Response 400:
{
  "success": false,
  "error": {
    "code": "APPROVE_ERROR",
    "message": "Report already verified"
  }
}
```

---

## 6. 🔍 Debugging Commands

### Check Pending Reports in Database

```sql
SELECT 
  id, type, target, status, 
  reporter_name, reporter_email,
  created_at, ip
FROM reports
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Recently Approved Scams

```sql
SELECT 
  scams.id as scam_id,
  scams.type, scams.value, scams.risk_level,
  scams.created_at,
  reports.id as report_id,
  reports.reporter_name
FROM scams
LEFT JOIN reports ON scams.source = CONCAT('report:', reports.id)
WHERE scams.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY scams.created_at DESC;
```

### Check Admin Activity Log

```sql
SELECT 
  action, user, target, status, ip, timestamp
FROM admin_activities
WHERE action LIKE '%báo cáo%'
ORDER BY timestamp DESC
LIMIT 20;
```

### Test API with cURL

```bash
# Submit report
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "type": "website",
    "target": "https://fake-site.com",
    "description": "Fake website",
    "email": "test@example.com"
  }'

# Get admin reports
curl http://localhost:3000/api/admin/reports \
  -H "Cookie: admin_session=YOUR_SESSION_TOKEN"

# Approve report
curl -X POST http://localhost:3000/api/admin/reports \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_SESSION_TOKEN" \
  -d '{
    "action": "approve",
    "reportId": "RPTABC1234",
    "riskLevel": "high"
  }'
```

---

**Tài liệu cập nhật:** 2026-03-03
**Version:** 1.0
