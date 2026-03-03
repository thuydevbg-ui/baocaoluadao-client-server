# 📊 Hệ Thống Báo Cáo - Chi Tiết Kỹ Thuật

## 1. Database Schema

### REPORTS Table

```sql
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(20) PRIMARY KEY,
    type ENUM('website', 'phone', 'email', 'social', 'sms') NOT NULL,
    target VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    reporter_name VARCHAR(80) DEFAULT NULL,
    reporter_email VARCHAR(120) DEFAULT NULL,
    source ENUM('community', 'auto_scan', 'manual') NOT NULL DEFAULT 'community',
    status ENUM('pending', 'processing', 'verified', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    ip VARCHAR(45) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_target (target(255)),
    INDEX idx_status_type (status, type),
    INDEX idx_reporter_email (reporter_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### SCAMS Table (Verified Reports)

```sql
CREATE TABLE IF NOT EXISTS scams (
    id VARCHAR(20) PRIMARY KEY,
    type ENUM('website', 'phone', 'email', 'social', 'sms', 'bank') NOT NULL,
    value VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    risk_level ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('active', 'blocked', 'archived') NOT NULL DEFAULT 'active',
    source VARCHAR(50) DEFAULT NULL,
    report_count INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_risk_level (risk_level),
    INDEX idx_created_at (created_at),
    INDEX idx_value (value(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationship Flow

```
REPORTS (pending)
    ↓
    ├─ User submits via /api/report
    ├─ Status = 'pending'
    ├─ Stored with type, target, description, IP
    ├─ Admin sees in dashboard
    │
    ├─ Admin reviews
    │
    ├─ IF APPROVE (✅)
    │   └─ Create new row in SCAMS
    │       └─ status = 'active'
    │       └─ risk_level = admin's choice
    │       └─ source = 'report:RPT12345'
    │   └─ Update REPORTS: status = 'verified'
    │
    └─ IF REJECT (❌)
        └─ Update REPORTS: status = 'rejected'
        └─ No SCAMS entry created
```

---

## 2. API Response Models

### Report Creation Response

```typescript
interface ReportSubmittedResponse {
  success: boolean;
  message: string;    // "Báo cáo của bạn đã được ghi nhận..."
  reportId: string;   // "RPTABC12345"
}

interface ReportItem {
  id: string;                    // "RPT12345"
  type: string;                  // "website" | "phone" | ...
  target: string;                // "https://example.com"
  description: string;           // "Chi tiết báo cáo..."
  reporter_name: string | null;  // "Nguyễn Văn A"
  reporter_email: string | null; // "user@example.com"
  source: string;                // "community"
  status: string;                // "pending"
  ip: string | null;             // "192.168.1.1"
  created_at: string;            // "2026-03-03 10:30:00"
  updated_at: string;            // "2026-03-03 10:30:00"
}

interface ReportListResponse {
  success: boolean;
  data: {
    items: ReportItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: {
      pending: number;
      processing: number;
      verified: number;
      rejected: number;
      completed: number;
    }
  }
}

interface ApproveReportResponse {
  success: true;
  data: {
    reportId: string;     // "RPT12345"
    scamId: string;       // "SCM001" (newly created)
    message: string;      // "Report approved successfully"
  }
}

interface RejectReportResponse {
  success: true;
  data: {
    reportId: string;
    message: string;
  }
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  }
}
```

---

## 3. Input Validation Rules

### Type Validation

```typescript
// Valid types
const validTypes = [
  'website',  // URL format
  'phone',    // Phone number format
  'email',    // Email format
  'social',   // Username/Handle
  'sms'       // SMS content
];
```

### Target Format Validation

```typescript
// Website
/^(https?:\/\/)?([\w.-]+\.)+[\w.-]+(\/[\w.-]*)*\/?$/

// Phone
/^[\d\s+().-]{7,20}$/

// Email
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Social & SMS
// Minimum length 3-5 characters
```

### Length Limits

```typescript
type: 20 characters max
target: 500 characters max
description: 2000 characters max
reporter_name: 80 characters max
reporter_email: 120 characters max
reason (reject): 500 characters max
adminNotes: 2000 characters max
```

---

## 4. Status Transitions

### Valid Status Transitions

```
pending
  ├─→ processing   (optional, admin signal "reviewing")
  ├─→ verified     (admin approved)
  ├─→ rejected     (admin rejected)
  └─→ completed    (final, no more changes)

processing
  ├─→ verified
  ├─→ rejected
  └─→ completed

verified ─→ completed (no rejecting after verify)
rejected ─→ completed (no approving after reject)

completed (terminal state, no transitions)
```

### Cannot Transition Rules

```
- verified → rejected (can't undo approval)
- rejected → verified  (can't approve after reject)
- completed → *        (final state)
- pending → pending    (ignore same status)
```

---

## 5. Rate Limiting Implementation

### Rate Limit Configuration

```typescript
// File: src/lib/rateLimit.ts

interface RateLimitConfig {
  scope: string;              // e.g., 'report-submission'
  key: string;                // e.g., IP address
  maxAttempts: number;        // 5 attempts
  windowSeconds: number;      // 60 seconds
  banSeconds: number;         // 300 seconds (5 minutes)
}

// Applied to: POST /api/report
// Scope: report-submission
// Key: IP address
// Config: 5 attempts/60 seconds, 300 seconds ban
```

### Rate Limit Logic

```
1. Extract IP from request:
   - x-forwarded-for header (first IP)
   - x-real-ip header
   - cf-connecting-ip header (Cloudflare)
   - fallback: 'unknown'

2. Check if IP is banned:
   if (ban_time < now) {
     return 429 Too Many Requests
   }

3. Increment counter for IP in time window:
   if (count >= maxAttempts) {
     return 429 Too Many Requests
     ban_until = now + banSeconds
   }

4. On successful submission:
   reset counter for IP
```

### Response Headers

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1646304600
Retry-After: 300
```

---

## 6. Security Implementation

### Input Sanitization

```typescript
// Sanitize function
function sanitizeInput(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input
    .trim()                    // Remove whitespace
    .slice(0, maxLength)       // Max length
    // Additional: could add HTML entity escaping
}
```

### SQL Injection Prevention

```typescript
// Using parameterized queries - ALL
const [rows] = await db.execute(
  'SELECT * FROM reports WHERE id = ? AND status = ?',
  [reportId, status]  // Parameters separated
);

// Never like this:
db.execute(`SELECT * FROM reports WHERE id = '${reportId}'`)
```

### CORS & Origin Check

```typescript
// File: src/lib/apiSecurity.ts
function isRequestFromSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  // Validate request origin
}
```

### Admin Authentication

```typescript
// File: src/lib/adminApiAuth.ts
function getAdminAuth(request: NextRequest): AdminAuth | null {
  const sessionCookie = request.cookies.get('admin_session');
  if (!sessionCookie) return null;
  // Validate session
  return { email: valid_admin_email }
}

// Applied to: all /api/admin/* endpoints
```

---

## 7. Admin Activity Logging

### Activity Record Structure

```typescript
interface AdminActivity {
  id?: string;
  action: string;              // "Duyệt báo cáo thành scam"
  user: string;                // admin@example.com
  target: string;              // "RPT12345 -> SCM001"
  status: 'success' | 'failed';
  ip?: string;                 // 192.168.1.1
  timestamp?: Date;
  details?: Record<string, any>;
}
```

### Logged Actions

```
1. Report Submission
   action: "Gửi báo cáo mới"
   
2. Report Approval
   action: "Duyệt báo cáo thành scam"
   
3. Report Rejection
   action: "Từ chối báo cáo"
   
4. Status Update
   action: "Cập nhật trạng thái báo cáo: verified"
```

### Activity Storage

```typescript
// File: src/lib/adminManagementStore.ts
// In-memory storage (dev)
// Should use database for production

export function recordAdminActivity(activity: AdminActivity): void {
  // Store in memory or database
}
```

---

## 8. Dashboard Caching

### Cache Invalidation Points

```typescript
// When report is approved/rejected, invalidate:
1. Dashboard stats cache
2. Pending count cache
3. Category breakdown cache
4. All summary caches

File: src/lib/services/dashboard.service.ts
Function: invalidateDashboardCache()
```

### Cache Keys

```
dashboard:stats           // Overall statistics
dashboard:breakdown       // Category breakdown  
dashboard:pending_count   // Pending reports count
dashboard:recent_reports  // Recent activity
```

---

## 9. Error Handling

### API Error Codes

```typescript
// Report Submission Errors (400s)
'INVALID_JSON'              // JSON parse error
'MISSING_FIELDS'            // Required fields missing
'INVALID_TYPE'              // Type not in whitelist
'INVALID_TARGET_FORMAT'     // Target validation failed
'INVALID_EMAIL'             // Email format invalid

// Rate Limiting (429)
'RATE_LIMITED'              // Too many requests

// Admin Errors (401/400/404)
'UNAUTHORIZED'              // Not logged in as admin
'REPORT_NOT_FOUND'          // Report ID doesn't exist
'INVALID_RISK_LEVEL'        // Risk level not valid
'CANNOT_REJECT_VERIFIED'    // Report already verified
'INVALID_ACTION'            // Action not recognized
```

### HTTP Status Codes

```
200 OK                      // Success
400 Bad Request             // Validation error
401 Unauthorized            // Missing auth
404 Not Found               // Report not found
429 Too Many Requests       // Rate limited
500 Internal Server Error   // Server error
```

---

## 10. Performance Considerations

### Query Optimization

```sql
-- Efficient queries with indexes
SELECT * FROM reports 
WHERE status = 'pending' 
  AND type = 'website'
  AND created_at DESC
LIMIT 10;

-- Uses indexes: idx_status_type, idx_created_at
```

### Database Indexes Summary

```
idx_status              - Fast filter by status
idx_type                - Fast filter by type
idx_created_at          - Fast sort/filter by date
idx_target              - Fast search by target
idx_status_type         - Combined filter
idx_reporter_email      - Search by reporter
```

### Pagination

```typescript
// Default: page 1, pageSize 10
// Max pageSize: 100

offset = (page - 1) * pageSize
SELECT * FROM reports LIMIT pageSize OFFSET offset
totalPages = Math.ceil(total / pageSize)
```

---

## 11. TypeScript Types

### Report Types

```typescript
type ReportType = 'website' | 'phone' | 'email' | 'social' | 'sms' | 'bank';
type ReportStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'completed';
type RiskLevel = 'low' | 'medium' | 'high';
type ReportSource = 'community' | 'auto_scan' | 'manual';

interface Report {
  id: string;
  type: ReportType;
  target: string;
  description: string;
  reporter_name: string | null;
  reporter_email: string | null;
  source: string;
  status: ReportStatus;
  ip: string | null;
  created_at: string;
  updated_at: string;
}

interface ReportListOptions {
  page?: number;
  pageSize?: number;
  status?: ReportStatus;
  type?: ReportType;
  search?: string;
}

interface ApproveReportPayload {
  reportId: string;
  riskLevel?: RiskLevel;
  adminNotes?: string;
  actor: string;
  ip?: string;
}

interface RejectReportPayload {
  reportId: string;
  reason?: string;
  actor: string;
  ip?: string;
}
```

---

## 12. Monitoring & Metrics

### Key Metrics to Track

```
1. Report Submission Rate
   - Reports per hour
   - By type
   - By source (community/auto/manual)

2. Processing Metrics
   - Avg time to approve/reject
   - Approval rate (% approved)
   - Rejection rate (% rejected)
   - Pending queue length

3. Quality Metrics
   - Reports by reporter (spam detection)
   - Most common scam types
   - Geographic distribution (by IP)
   - False positive rate

4. Performance
   - API response time
   - Database query time
   - Rate limit hit rate
   - Cache hit rate
```

### Dashboard Stats Query

```sql
SELECT
  COUNT(*) as total_reports,
  SUM(IF(status='pending', 1, 0)) as pending_reports,
  SUM(IF(status='verified', 1, 0)) as verified_reports,
  SUM(IF(status='rejected', 1, 0)) as rejected_reports
FROM reports;
```

---

## 13. Testing Checklist

### Unit Tests

- [ ] Input validation (all types)
- [ ] Rate limiting logic
- [ ] Status transitions
- [ ] Database queries
- [ ] Error handling

### Integration Tests

- [ ] Full report submission flow
- [ ] Admin approval flow
- [ ] Admin rejection flow
- [ ] Cache invalidation
- [ ] Activity logging

### Security Tests

- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limit bypass attempts
- [ ] Auth bypass attempts

### Load Tests

- [ ] 100 concurrent submissions
- [ ] 1000 pending reports in queue
- [ ] Admin listing 10k+ reports
- [ ] Cache performance under load

---

**Last Updated:** 2026-03-03
**Version:** 1.0
**Status:** Complete Documentation
