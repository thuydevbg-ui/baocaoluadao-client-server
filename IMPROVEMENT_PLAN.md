# Kế Hoạch Cải Thiện Hệ Thống baocaoluadao.com

## Tổng quan

Tài liệu này trình bày chiến lược cải thiện toàn diện cho hệ thống báo cáo lừa đảo baocaoluadao.com, bao gồm 6 lĩnh vực chính: Database MySQL, Backup/Restore, Authentication với 2FA, API Routes, Frontend UX, và các tính năng Backend mới.

---

## 1. Database MySQL - Tối ưu & Hiệu năng

### 1.1. Phân tích hiện trạng

**Cấu trúc database hiện tại:**
- Tables chính: `reports`, `scams`, `users`, `user_reports`, `watchlist`, `alerts`, `detail_feedback`, `detail_ratings`, `categories`, `site_settings`, `auth_sessions`, `auth_activity`, `login_attempts`
- Indexes đã có: Composite indexes cho status, type, created_at, email

**Vấn đề nhận diện:**
1. Thiếu indexes cho các truy vấn phổ biến trên bảng `detail_feedback` và `detail_ratings`
2. Chưa có partitioning cho các bảng lớn như `reports`, `scams`, `auth_activity`
3. Query performance chưa được tối ưu cho các truy vấn phức tạp

### 1.2. Giải pháp đề xuất

#### 1.2.1. Tối ưu Indexes

```sql
-- Migration: Thêm indexes mới cho query performance
-- File: migrations/017_optimize_indexes.sql

-- Index cho truy vấn detail page
CREATE INDEX idx_detail_feedback_created_at ON detail_feedback(created_at DESC);
CREATE INDEX idx_detail_ratings_detail_score ON detail_ratings(detail_key, score);

-- Index cho user activity queries
CREATE INDEX idx_auth_activity_user_action ON auth_activity(user_id, action);
CREATE INDEX idx_auth_activity_created_action ON auth_activity(created_at, action);

-- Index cho truy vấn login attempts
CREATE INDEX idx_login_attempts_email_status ON login_attempts(email, locked_until);

-- Index cho session cleanup
CREATE INDEX idx_auth_sessions_expires_user ON auth_sessions(expires_at, user_id);
```

#### 1.2.2. Query Optimization

**Tại [`src/lib/services/dashboard.service.ts`](src/lib/services/dashboard.service.ts):**

1. Sử dụng `EXPLAIN` để phân tích các query chậm
2. Implement query result caching với Redis cho các truy vấn nặng
3. Sử dụng `COUNT(*)` thay vì `COUNT(column)` khi không cần kiểm tra NULL

#### 1.2.3. Table Partitioning

```sql
-- Migration: Partitioning cho bảng reports
-- Áp dụng khi dữ liệu > 1 triệu rows

ALTER TABLE reports 
PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p202601 VALUES LESS THAN (TO_DAYS('2026-02-01')),
    PARTITION p202602 VALUES LESS THAN (TO_DAYS('2026-03-01')),
    PARTITION p202603 VALUES LESS THAN (TO_DAYS('2026-04-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Tự động thêm partition hàng tháng qua cron job
```

#### 1.2.4. Connection Pooling

Cấu hình MySQL connection pool trong [`src/lib/db.ts`](src/lib/db.ts):

```typescript
// Tăng pool size cho production
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20, // Tăng từ 10
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

---

## 2. Backup/Restore - Cải thiện cơ chế

### 2.1. Phân tích hiện trạng

**Script backup hiện tại:** [`scripts/backup-mysql.sh`](scripts/backup-mysql.sh) và [`/usr/local/bin/backup-baocaoluadao.sh`](../../../usr/local/bin/backup-baocaoluadao.sh)

**Vấn đề nhận diện:**
1. Chỉ giữ 7 ngày backup - cần lâu hơn cho compliance
2. Không có backup incremental
3. Không có verification sau backup
4. Thiếu notification khi backup thất bại
5. Không có off-site backup (cloud storage)

### 2.2. Giải pháp đề xuất

#### 2.2.1. Cải thiện retention policy

```bash
# Cập nhật trong backup script
# Giữ 7 daily backups
find "$BACKUP_DIR" -maxdepth 1 -name 'db_*.sql.gz' -mtime +7 -delete

# Giữ 4 weekly backups (tháng trước)
find "$BACKUP_DIR" -maxdepth 1 -name 'db_week_*.sql.gz' -mtime +30 -delete

# Giữ 12 monthly backups
find "$BACKUP_DIR" -maxdepth 1 -name 'db_month_*.sql.gz' -mtime +365 -delete
```

#### 2.2.2. Thêm backup verification

```bash
# Verify backup integrity
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "ERROR: Backup file is corrupted"
    send_alert "Backup verification failed"
    exit 1
fi

# Test restore to temporary database
mysqladmin create test_restore_$$ || true
if ! gunzip < "$BACKUP_FILE" | mysql -h "$DB_HOST" -u "$DB_USER" test_restore_$$ 2>/dev/null; then
    log "WARNING: Backup restore test failed"
fi
mysqladmin drop test_restore_$$ 2>/dev/null || true
```

#### 2.2.3. Off-site backup to cloud

```bash
# Upload to Google Cloud Storage / AWS S3
if command -v gsutil &> /dev/null; then
    gsutil cp "$BACKUP_FILE" gs://$BUCKET_NAME/backups/
    gsutil cp "$BACKUP_FILE" gs://$BUCKET_NAME/backups/$(date +%Y)/$(date +%m)/
fi

# Or use rclone for multiple cloud providers
rclone copy "$BACKUP_FILE" remote:backups/ --quiet
```

#### 2.2.4. Incremental backup với binlog

```bash
# Kích hoạt binlog trong MySQL config
# my.cnf:
# log_bin = /var/log/mysql/mysql-bin
# expire_logs_days = 7
# max_binlog_size = 100M

# Backup incremental hàng giờ
mysqlbinlog --stop-never mysql-bin.000001 > "$BACKUP_DIR/incremental_$(date +%H).sql"
```

---

## 3. Authentication & 2FA - Hoàn thiện bảo mật

### 3.1. Phân tích hiện trạng

**Tại [`src/lib/nextAuthOptions.ts`](src/lib/nextAuthOptions.ts):**

**Tính năng hiện có:**
- ✅ Credentials login với bcrypt
- ✅ OAuth providers (Google, Facebook, Twitter)
- ✅ 2FA với TOTP (otplib)
- ✅ Backup codes cho 2FA
- ✅ Rate limiting cho login attempts
- ✅ JWT sessions với refresh tokens
- ✅ Login attempts tracking

**Vấn đề nhận diện:**
1. Rate limiting sử dụng in-memory Map - không scale được multi-instance
2. Thiếu 2FA via SMS/Email như backup method
3. Chưa có password strength enforcement
4. Session timeout cố định - nên có configurable options
5. Thiến audit logging chi tiết cho security events

### 3.2. Giải pháp đề xuất

#### 3.2.1. Database-backed Rate Limiting

```sql
-- Migration: Cải thiện rate limiting table
ALTER TABLE login_attempts 
ADD COLUMN attempt_type ENUM('login', '2fa', 'password_reset') DEFAULT 'login',
ADD INDEX idx_attempt_type_email (attempt_type, email);
```

#### 3.2.2. Thêm Password Policy

```typescript
// Trong src/lib/nextAuthOptions.ts
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // days
  preventReuse: 5 // last 5 passwords
};

function validatePassword(password: string): boolean {
  if (password.length < passwordPolicy.minLength) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
}
```

#### 3.2.3. Enhanced 2FA Options

```typescript
// Thêm 2FA via email như backup option
// File: src/lib/twofaEmail.ts

export async function send2FAViaEmail(email: string, code: string): Promise<void> {
  // Sử dụng đã có email service
  await sendEmail({
    to: email,
    subject: 'Mã xác minh 2FA - ScamGuard',
    template: 'twofa-code',
    data: { code, expiresIn: '5 phút' }
  });
}
```

#### 3.2.4. Session Management Improvements

```typescript
// Cải thiện session config trong nextAuthOptions.ts
session: { 
  strategy: 'jwt', 
  maxAge: 30 * 24 * 60 * 60, // 30 days với refresh token
  updateAge: 5 * 60,
  // Thêm rolling refresh
}

// Implement refresh token rotation
async function refreshAccessToken(token: Token) {
  // Rotate refresh token after each use
  const newRefreshToken = generateRandomToken();
  await db.query(
    'UPDATE auth_sessions SET refresh_token_hash = ? WHERE user_id = ?',
    [hash(newRefreshToken), token.sub]
  );
  return { ...token, refreshToken: newRefreshToken };
}
```

---

## 4. API Routes - Tối ưu & Mở rộng

### 4.1. Phân tích hiện trạng

**API Routes hiện có:**
- Admin: `/api/admin/*` (overview, reports, scams, users, settings, logs, etc.)
- User: `/api/user/*` (reports, watchlist, alerts, profile, security)
- Auth: `/api/auth/*` (login, refresh, verify)
- Public: `/api/blacklist`, `/api/detail-feedback`, `/api/victim-aid`

**Vấn đề nhận diện:**
1. Thiếu pagination cho một số endpoints
2. Chưa có rate limiting cho API calls
3. Không có API versioning
4. Response size có thể lớn - cần pagination
5. Cache strategy chưa nhất quán

### 4.2. Giải pháp đề xuất

#### 4.2.1. Implement Standardized Pagination

```typescript
// src/lib/apiResponse.ts
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}
```

Áp dụng tại [`src/app/api/admin/reports/route.ts`](src/app/api/admin/reports/route.ts):

```typescript
export const GET = withApiObservability(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const offset = (page - 1) * limit;
  
  const [rows] = await db.query(
    `SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  
  const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM reports');
  
  return NextResponse.json(paginatedResponse(rows, total, page, limit));
});
```

#### 4.2.2. API Rate Limiting

```typescript
// src/lib/apiRateLimiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

const apiRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1m'), // 100 requests per minute
  prefix: 'ratelimit:api:'
});

export async function withRateLimit(
  request: NextRequest,
  key: string,
  handler: () => Promise<NextResponse>
) {
  const { success } = await apiRateLimit.limit(key);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }
  
  return handler();
}
```

#### 4.2.3. API Versioning

```typescript
// src/app/api/v1/reports/route.ts
// Hoặc sử dụng route groups
// src/app/api/(v1)/reports/route.ts
// src/app/api/(v2)/reports/route.ts

export async function GET(request: NextRequest) {
  const version = request.headers.get('X-API-Version') || 'v1';
  
  if (version === 'v2') {
    return handleV2Request(request);
  }
  
  return handleV1Request(request);
}
```

#### 4.2.4. New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats/summary` | GET | Tổng hợp thống kê nhanh |
| `/api/search/advanced` | POST | Tìm kiếm nâng cao |
| `/api/reports/:id/evidence` | GET | Lấy evidence của report |
| `/api/users/me/notifications/settings` | PATCH | Cập nhật notification preferences |
| `/api/admin/analytics/trends` | GET | Phân tích xu hướng |
| `/api/webhooks/scam-alert` | POST | Webhook cho alert system |

---

## 5. Frontend UX - Cải thiện giao diện

### 5.1. Phân tích hiện trạng

**Tại [`src/components/layout/Navbar.tsx`](src/components/layout/Navbar.tsx) và [`src/app/detail/[type]/[id]/page.tsx`](src/app/detail/[type]/[id]/page.tsx):**

**Điểm mạnh:**
- ✅ Responsive design với Tailwind CSS
- ✅ Dark mode support
- ✅ Mobile navigation với slide menu
- ✅ Feedback system với ratings
- ✅ Toast notifications

**Vấn đề nhận diện:**
1. Loading states chưa tối ưu
2. Chưa có skeleton loaders
3. Error handling chưa nhất quán
4. Form validation UX chưa tốt
5. Thiếu accessibility features

### 5.2. Giải pháp đề xuất

#### 5.2.1. Skeleton Loaders

```tsx
// src/components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />
  );
}

export function ReportCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
```

#### 5.2.2. Improved Form Validation

```tsx
// src/components/ui/Form.tsx
'use client';
import { useState } from 'react';

interface InputProps {
  label: string;
  error?: string;
  onChange: (value: string) => void;
}

export function FormInput({ label, error, onChange, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        className={cn(
          "w-full px-3 py-2 border rounded-lg",
          error ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-primary"
        )}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

#### 5.2.3. Toast Notifications Improvement

```tsx
// Cải thiện Toast component
// src/components/ui/Toast.tsx
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const toast = ({ title, description, type = 'info' }: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  
  return { toast, toasts };
}
```

#### 5.2.4. Accessibility Improvements

```tsx
// Thêm aria labels và keyboard navigation
<button
  aria-label="Đóng menu"
  aria-expanded={isOpen}
  onClick={closeMenu}
  className="..."
>
  <X className="h-5 w-5" />
</button>

// Focus management cho modals
useEffect(() => {
  if (isOpen) {
    focusableRef.current?.focus();
  }
}, [isOpen]);
```

---

## 6. Tính năng Backend Mới

### 6.1. Real-time Notifications

```typescript
// src/lib/realtime/notifications.ts
import { Server } from 'socket.io';

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_SITE_URL }
  });
  
  io.on('connection', (socket) => {
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });
  });
  
  return io;
}

// Gửi notification
export async function notifyUser(userId: string, notification: Notification) {
  const io = getIO();
  io.to(`user:${userId}`).emit('notification', notification);
  
  // Lưu vào database cho offline users
  await saveNotification(userId, notification);
}
```

### 6.2. Advanced Search Engine

```typescript
// src/lib/search/engine.ts
export interface SearchFilters {
  type?: ('website' | 'phone' | 'email' | 'social' | 'sms')[];
  status?: ('pending' | 'processing' | 'completed')[];
  riskLevel?: ('low' | 'medium' | 'high')[];
  dateFrom?: Date;
  dateTo?: Date;
  minReports?: number;
}

export async function advancedSearch(
  query: string,
  filters: SearchFilters,
  pagination: Pagination
): Promise<SearchResults> {
  // Sử dụng MySQL FULLTEXT search hoặc Elasticsearch
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (query) {
    conditions.push('(target LIKE ? OR description LIKE ?)');
    params.push(`%${query}%`, `%${query}%`);
  }
  
  if (filters.type?.length) {
    conditions.push(`type IN (${filters.type.map(() => '?').join(',')})`);
    params.push(...filters.type);
  }
  
  // ... build query dynamically
}
```

### 6.3. Analytics Dashboard API

```typescript
// src/app/api/admin/analytics/trends/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
  
  const trends = await getScamTrends(period);
  const topCategories = await getTopCategories(period);
  const userActivity = await getUserActivity(period);
  const reportProcessingTime = await getAvgProcessingTime(period);
  
  return NextResponse.json({
    success: true,
    data: {
      trends,
      topCategories,
      userActivity,
      processingTime: reportProcessingTime
    }
  });
}
```

### 6.4. Webhook System

```typescript
// src/lib/webhooks/manager.ts
export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
}

export async function triggerWebhook(
  event: WebhookEvent,
  payload: any
): Promise<void> {
  const webhooks = await getActiveWebhooks(event);
  
  await Promise.allSettled(
    webhooks.map(webhook => 
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ScamGuard-Event': event,
          'X-ScamGuard-Signature': signPayload(payload, webhook.secret)
        },
        body: JSON.stringify(payload)
      })
    )
  );
}
```

### 6.5. Export/Report Generation

```typescript
// src/app/api/reports/export/route.ts
export async function POST(request: NextRequest) {
  const { format, filters } = await request.json();
  
  const reports = await getReports(filters);
  
  switch (format) {
    case 'csv':
      return exportCSV(reports);
    case 'xlsx':
      return exportExcel(reports);
    case 'pdf':
      return exportPDF(reports);
    default:
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }
}
```

---

## 7. Triển khai - Lộ trình

### Phase 1: Ưu tiên cao (1-2 tuần)

| Task | Description | Estimated Time |
|------|-------------|----------------|
| Database indexes | Thêm indexes mới | 2 giờ |
| Backup verification | Thêm verify step | 4 giờ |
| API pagination | Standardize all endpoints | 8 giờ |
| Rate limiting | Database-backed | 6 giờ |

### Phase 2: Ưu tiên trung bình (2-4 tuần)

| Task | Description | Estimated Time |
|------|-------------|----------------|
| Partition tables | reports, scams | 8 giờ |
| Cloud backup | Off-site storage | 8 giờ |
| Password policy | Enforcement | 6 giờ |
| Frontend UX | Skeleton loaders | 12 giờ |
| New API endpoints | Analytics, search | 16 giờ |

### Phase 3: Ưu tiên thấp (1-2 tháng)

| Task | Description | Estimated Time |
|------|-------------|----------------|
| Real-time notifications | Socket.io | 24 giờ |
| Advanced search | Elasticsearch | 40 giờ |
| Webhook system | Event-driven | 24 giờ |
| Report generation | PDF/Excel export | 16 giờ |

---

## 8. Monitoring & Performance

### 8.1. Metrics to Track

```typescript
// src/lib/metrics/collector.ts
export const metrics = {
  // Database
  dbQueryDuration: new Histogram({
    name: 'db_query_duration_seconds',
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    help: 'Database query duration'
  }),
  
  // API
  apiRequestDuration: new Histogram({
    name: 'api_request_duration_seconds',
    buckets: [0.1, 0.5, 1, 2, 5],
    help: 'API request duration'
  }),
  
  // Business
  reportsSubmitted: new Counter({
    name: 'reports_submitted_total',
    help: 'Total number of reports submitted'
  }),
  
  // Cache
  cacheHitRate: new Gauge({
    name: 'cache_hit_rate',
    help: 'Redis cache hit rate'
  })
};
```

### 8.2. Health Checks

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const [dbHealthy, redisHealthy, diskSpace] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkDiskSpace()
  ]);
  
  const healthy = dbHealthy && redisHealthy && diskSpace > 10; // 10% min
  
  return NextResponse.json({
    healthy,
    services: { database: dbHealthy, redis: redisHealthy },
    diskSpace: `${diskSpace}% free`
  }, healthy ? 200 : 503);
}
```

---

## Kết luận

Hệ thống baocaoluadao.com hiện tại có nền tảng vững chắc với:
- ✅ Authentication đa factor (credentials + OAuth + 2FA)
- ✅ Cấu trúc database tốt với indexes cơ bản
- ✅ API routes đầy đủ cho admin và user
- ✅ Frontend responsive với dark mode

Các đề xuất trong tài liệu này sẽ giúp:
1. **Cải thiện hiệu năng** - Query optimization, caching, indexing
2. **Tăng cường bảo mật** - Password policy, database-backed rate limiting, audit logging  
3. **Nâng cao UX** - Loading states, form validation, accessibility
4. **Mở rộng tính năng** - Real-time notifications, advanced search, analytics

Lộ trình triển khai nên ưu tiên Phase 1 trước để đạt được cải thiện nhanh về hiệu năng và bảo mật.
