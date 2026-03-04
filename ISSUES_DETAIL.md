# 📋 DANH SÁCH CHI TIẾT 20 VẤN ĐỀ CỦA HỆ THỐNG

**Dự án:** baocaoluadao.com (ScamGuard)
**Ngày kiểm tra:** 2026-03-03
**Tổng số vấn đề:** 20 (5 CRITICAL + 6 HIGH + 7 MEDIUM + 2 LOW)

---

## 🔴 **CRITICAL ISSUES (5 vấn đề - PHẢI SỬA NGAY LẬP TỨC)**

---

### **ISSUE #1: DATABASE CREDENTIALS BỊ EXPOSE TRONG .env FILE**

**🔴 Severity:** CRITICAL
**⏰ Priority:** 1 (Fix ngay)
**📁 File:** `.env` (dòng 4-7)
**🔗 Git Status:** Đã commit vào history

**Tác hại:**
- Bất kỳ ai có access GitHub repo có thể thấy DB password
- Git history chứa credentials permanent
- Attacker có thể kết nối trực tiếp vào MySQL database
- Có thể dump toàn bộ dữ liệu user, reports, scams
- Có thể modify/delete dữ liệu

**Code hiện tại:**
```
Line 4: DB_HOST=127.0.0.1
Line 5: DB_USER=baocaoluadao
Line 6: DB_PASSWORD=tNRvIWRcb7FnOxfDAdAx4QozFvR/lfoY    ← EXPOSED!
Line 7: DB_NAME=baocaoluadao
```

**Credentials bị lộ:**
- **Host:** 127.0.0.1
- **User:** baocaoluadao
- **Password:** tNRvIWRcb7FnOxfDAdAx4QozFvR/lfoY ← 32 character password
- **Database:** baocaoluadao

**Giải pháp chi tiết:**

1️⃣ **Tạo mật khẩu database mới (trong MySQL):**
```bash
# SSH vào server, kết nối MySQL
mysql -u root -p

# Thực thi:
ALTER USER 'baocaoluadao'@'127.0.0.1' IDENTIFIED BY 'NEW_VERY_STRONG_PASSWORD_MIN_20_CHARS_HERE_LIKE_xyz123!@#abc456';
FLUSH PRIVILEGES;
EXIT;
```

2️⃣ **Xóa .env khỏi git tracking:**
```bash
cd /var/www/baocaoluadao.com
git rm --cached .env
```

3️⃣ **Xóa từ git history (chọn 1 cách):**

**Cách A: Dùng git filter-branch (safe nhưng chậm):**
```bash
git filter-branch --tree-filter 'rm -f .env' -- --all
```

**Cách B: Dùng git-filter-repo (nhanh):**
```bash
# Install git-filter-repo nếu chưa có
pip install git-filter-repo

# Xóa .env khỏi history
git filter-repo --invert-paths --path .env
```

4️⃣ **Tạo .env.example (không chứa giá trị):**
```bash
cat > .env.example << 'EOF'
# ============================================
# Database Configuration
# ============================================
DB_HOST=127.0.0.1
DB_USER=baocaoluadao
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DB_NAME=baocaoluadao

# ============================================
# SEO Configuration
# ============================================
NEXT_PUBLIC_SITE_URL=https://baocaoluadao.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_VERIFICATION=

# ============================================
# Google Analytics & Search Console
# ============================================
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTM_ID=

# ============================================
# Authentication
# ============================================
AUTH_COOKIE_SECRET=YOUR_SECRET_32_CHARS_MINIMUM
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET

# ============================================
# Redis (optional - for caching)
# ============================================
REDIS_URL=

# ============================================
# Environment
# ============================================
NODE_ENV=production

# ============================================
# Admin Authentication
# ============================================
ADMIN_EMAIL=admin@baocaoluadao.com
ADMIN_PASSWORD_HASH=YOUR_BCRYPT_HASH_HERE
EOF
```

5️⃣ **Update .gitignore:**
```bash
cat >> .gitignore << 'EOF'

# Environment variables
.env
.env.local
.env.*.local
.env.production.local
.env.development.local
.env.test.local
EOF
```

6️⃣ **Setup environment variables trên VPS:**

Nếu dùng **PM2:**
```bash
# Tạo .env.production file (chỉ trên server, không commit)
ssh user@server
cd /var/www/baocaoluadao.com
cat > .env.production << 'EOF'
DB_HOST=127.0.0.1
DB_USER=baocaoluadao
DB_PASSWORD=YOUR_NEW_PASSWORD_FROM_STEP_1
DB_NAME=baocaoluadao
AUTH_COOKIE_SECRET=GENERATE_NEW_32_CHAR_SECRET
... rest of vars ...
EOF

chmod 600 .env.production
```

Nếu dùng **Vercel:**
```bash
# Trên Vercel dashboard
Settings > Environment Variables
Thêm tất cả variables từ .env
```

7️⃣ **Force push lên remote (cẩn thận!):**
```bash
# Backup trước
git stash

# Force push (nếu chỉ có bạn làm việc)
git push --force origin main
# Hoặc nếu có team:
git push --force-with-lease origin main
```

8️⃣ **Thông báo team:**
- Yêu cầu tất cả team xóa local cache
- Xóa `rm -rf ~/.cache/git`
- Clone lại repo (để chắc chắn)

**Kiểm tra xem credentials bị lộ ở đâu:**
```bash
# Search GitHub:
# Vào https://github.com/settings/security
# Kích hoạt "Secret scanning"

# Hoặc dùng tools:
git log -p --all -S "tNRvIWRcb7FnOxfDAdAx4QozFvR/lfoY"
```

**Status sau khi fix:**
- ✅ New password set trong MySQL
- ✅ .env removed from git history
- ✅ .env.example created
- ✅ .gitignore updated
- ✅ Environment variables set trên hosting
- ✅ Team notified

---

### **ISSUE #2: DATABASE API KEY HARDCODED TRONG FRONTEND**

**🔴 Severity:** CRITICAL
**⏰ Priority:** 1 (Fix ngay)
**📁 File:** `src/app/thuybgt/page.tsx` (Line 14)
**🔗 Exposed Location:** Client-side bundle, browser console, Network tab

**Tác hại:**
- API key hiển thị trong JavaScript source hoàn toàn
- Baton cứ ai inspect browser hoặc view-source đều thấy
- Có thể call `/api/admin/db-manager` endpoint với key này
- Bất kỳ ai có key có thể dump/modify/delete database

**Code hiện tại:**
```typescript
// Line 1-15 of src/app/thuybgt/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database, Table, Columns3, Rows3, Plus, Trash2, Edit3, Save, X,
  Search, Download, Upload, RefreshCw, ChevronLeft, ChevronRight,
  Play, AlertTriangle, CheckCircle, Eye, Code, Settings, Key,
  Shield, Clock, HardDrive, Zap, Flame, History, Copy, Check,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, MoreVertical,
  DatabaseZap, TableProperties, RefreshCcw, CheckSquare, Square
} from 'lucide-react';

const DB_KEY = '804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240';  ← EXPOSED!
const API_URL = '/api/admin/db-manager';
```

**Curl command để exploit:**
```bash
# Bất kỳ ai có DB_KEY có thể thực thi:

# 1. Xem tất cả users:
curl "http://localhost:3000/api/admin/db-manager?key=804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240&action=query&sql=SELECT%20*%20FROM%20users"

# 2. Xóa tất cả reports:
curl "http://localhost:3000//api/admin/db-manager?key=804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240&action=query&sql=DELETE%20FROM%20reports"

# 3. Dump database:
curl "http://localhost:3000/api/admin/db-manager?key=804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240&action=backup"
```

**Giải pháp:**
❌ **KHÔNG nên:**
- Giữ API key ở file khác
- Encrypt API key trong frontend (vẫn có thể decrypt)
- Obfuscate code (người ta vẫn thấy được)

✅ **NÊN:**
- XÓA file `src/app/thuybgt/page.tsx` completely
- Hoặc di chuyển sang backend-only (local access chỉ)

**Vì sao? XÓA cái gì có thể đạt được:**

Vì theo Issue #5, file này là debug/development tool không nên deploy production.

---

### **ISSUE #3: ENDPOINT /api/admin/db-manager QUÁÁC NGUY HIỂM**

**🔴 Severity:** CRITICAL
**⏰ Priority:** 1 (Fix ngay)
**📁 File:** `src/app/api/admin/db-manager/route.ts` (23 KB)
**🔗 URL:** GET/POST `/api/admin/db-manager?key=...`
**🪤 Trap:** Cho phép SQL execution trực tiếp

**Tác hại:**
- Full database access (read/write/delete)
- Có thể SELECT/INSERT/UPDATE/DELETE bất kỳ bảng nào
- Có thể CREATE/DROP tables
- Có thể DROP entire database
- Có thể backup/restore database
- Có thể xem MySQL variables
- Có thể xem system processes

**Code hiện tại (dòng 1-50):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Line 6: HARDCODED SECRET FALLBACK (nguy hiểm!)
const SECRET_KEY = process.env.DB_MANAGER_KEY || '804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240';

// Line 10-11: Rate limit quá cao
const RATE_LIMIT = 100; // 100 requests per minute - TOO HIGH!
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  // ... implementation ...
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  // ...
}

// Line 31-38: Table/Column validation (CÓ nhưng không đủ)
function validateTableName(table: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table) && table.length < 64;
}

function validateColumnName(column: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column) && column.length < 64;
}

// Line 40-50: Tạo pool connection mới (dangerous!)
function getDb() {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'baocaoluadao',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'baocaoluadao',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
}
```

**Các operations có thể thực thi:**
```javascript
// 1. Query dữ liệu:
?action=query&sql=SELECT username, email, password FROM users

// 2. Modified dữ liệu:
?action=query&sql=UPDATE users SET role='admin' WHERE email='attacker@gmail.com'

// 3. Insert records:
?action=query&sql=INSERT INTO users VALUES (...)

// 4. Delete records:
?action=query&sql=DELETE FROM reports WHERE id > 0

// 5. Drop tables:
?action=query&sql=DROP TABLE users

// 6. Drop database:
?action=query&sql=DROP DATABASE baocaoluadao

// 7. Backup:
?action=backup

// 8. Restore:
?action=restore

// 9. View processes:
?action=process

// 10. View variables:
?action=variables
```

**Giải pháp:**
❌ **KHÔNG fix bằng:**
- Thêm rate limiting cao hơn (100 req/min vẫn quá cao)
- Thêm logging (attacker vẫn xóa logs)
- Encrypt key (key vẫn ở frontend)

✅ **NÊN làm:**
**XÓA ENDPOINT NÀY HOÀN TOÀN**

**Cách xóa:**
```bash
# 1. Xóa file và folder:
rm -rf /var/www/baocaoluadao.com/src/app/api/admin/db-manager
rm -rf /var/www/baocaoluadao.com/.next/server/app/api/admin/db-manager
rm -rf /var/www/baocaoluadao.com/.next/types/app/api/admin/db-manager

# 2. Xóa references từ code (grep để tìm):
grep -r "db-manager" /var/www/baocaoluadao.com/src --include="*.ts" --include="*.tsx"

# 3. Rebuild Next.js:
cd /var/www/baocaoluadao.com
npm run build
```

**Nếu thực sự cần database admin tool:**
- Dùng **phpMyAdmin** (local-only, password-protected)
- Hoặc **DBeaver** (desktop application)
- Hoặc **MySQL Workbench** (desktop)
- Không nên deploy lên productions website

---

### **ISSUE #4: HARDCODED SECRET FALLBACK TRONG DB MANAGER**

**🔴 Severity:** CRITICAL
**⏰ Priority:** 1 (Fix ngay - tapi xóa issue #3 thì cái này tự vanish)
**📁 File:** `src/app/api/admin/db-manager/route.ts` (Line 6)
**🔗 Problem Type:** Hardcoded secret in source code

**Tác hại:**
- Secret được hardcode trong source code
- Ai có access source code có thể thấy secret
- Nếu repository bị compromise, secret bị lộ permanent
- Fallback secret này là backup plan nếu env var không set

**Code hiện tại:**
```typescript
// Line 6
const SECRET_KEY = process.env.DB_MANAGER_KEY || '804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240';
```

**Giải pháp:**
Nếu giữ endpoint (không recommended):

```typescript
// TRƯỚC (NGUY HIỂM):
const SECRET_KEY = process.env.DB_MANAGER_KEY || 'hardcoded-secret-exposed-in-source';

// SAU (SAFE):
const SECRET_KEY = process.env.DB_MANAGER_KEY;

if (!SECRET_KEY) {
  throw new Error('🔴 CRITICAL: DB_MANAGER_KEY environment variable is required. Refusing to start.');
}

// Validate it's not empty
if (SECRET_KEY.length < 32) {
  throw new Error('🔴 CRITICAL: DB_MANAGER_KEY must be at least 32 characters.');
}
```

**NHƯNG (recommended):**
XÓA endpoint này (xem Issue #3)

---

### **ISSUE #5: MYSTERIOUS "thuybgt" PAGE - DANGEROUS DEBUG UI**

**🔴 Severity:** CRITICAL
**⏰ Priority:** 1 (Xóa ngay)
**📁 File:** `src/app/thuybgt/page.tsx` (66 KB - file lớn!)
**📁 Folder:** `src/app/thuybgt/` (nếu có sub-files)
**🔗 Route:** GET `/thuybgt`
**🪤 Issue:** Development/debug tool không nên vào production

**Chi tiết file:**
```typescript
// File size: ~66 KB (một trong những file lớn nhất!)
// Là UI component cho database admin
// Chứa hardcoded API key (xem Issue #2)
// Tên "thuybgt" không rõ ý nghĩa (Vietnamese slang?)
// Không có documentation
```

**Nội dung:**
```typescript
// Line 1-14:
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database, Table, Columns3, Rows3, Plus, Trash2, Edit3, Save, X,
  Search, Download, Upload, RefreshCw, ChevronLeft, ChevronRight,
  Play, AlertTriangle, CheckCircle, Eye, Code, Settings, Key,
  Shield, Clock, HardDrive, Zap, Flame, History, Copy, Check,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, MoreVertical,
  DatabaseZap, TableProperties, RefreshCcw, CheckSquare, Square
} from 'lucide-react';

const DB_KEY = '804367efb6b6d2e2829d6d2bbd0132753c5fa5af142094234828e13a06f99240';  // EXPOSED!
const API_URL = '/api/admin/db-manager';

// ... 2,000+ lines of UI code ...
```

**Vấn đề:**
- 66 KB là lớn quá cho một single page component
- UI cho database admin operations
- Hardcoded API key (Issue #2)
- References endpoint `/api/admin/db-manager` (Issue #3)
- Tên file "thuybgt" - không rõ ý nghĩa, có vẻ thử nghiệm
- Không có protection, ai vào `/thuybgt` đều thấy

**Giải pháp:**
**XÓA hoàn tất:**

```bash
# 1. Xóa source file:
rm /var/www/baocaoluadao.com/src/app/thuybgt/page.tsx

# 2. Xóa compiled files:
rm -rf /var/www/baocaoluadao.com/.next/server/app/thuybgt
rm -rf /var/www/baocaoluadao.com/.next/types/app/thuybgt

# 3. Tìm references trong sidebar/navigation:
grep -r "thuybgt" /var/www/baocaoluadao.com/src --include="*.ts" --include="*.tsx"
# (xóa bất kỳ links nào pointing tới page này)

# 4. Check git (xóa khỏi history nếu cần):
git log --all --oneline -- src/app/thuybgt/page.tsx

# 5. Rebuild:
cd /var/www/baocaoluadao.com
npm run build
```

**Verification sau khi xóa:**
```bash
# Verify page không còn accessible:
curl -s http://localhost:3000/thuybgt | grep -i "not found"

# Verify references xóa hết:
grep -r "thuybgt" /var/www/baocaoluadao.com/src
# (should return nothing)
```

---

## 🟠 **HIGH PRIORITY ISSUES (6 vấn đề - PHẢI SỬA TUẦN NAY)**

---

### **ISSUE #6: KHÔNG VALIDATE ENVIRONMENT VARIABLES KHI STARTUP**

**🟠 Severity:** HIGH
**⏰ Priority:** 2
**📁 File:** `src/lib/db.ts` (Line 14-20)
**🔗 Problem:** Warning only, không throw error

**Code hiện tại:**
```typescript
// Line 14-20
if (!process.env.DB_HOST || !process.env.DB_USER) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ DATABASE WARNING: DB_HOST or DB_USER not configured. Database features may fail in production.');
  } else {
    console.warn('⚠️ DATABASE: Using default/local database configuration. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME for production.');
  }
}
```

**Vấn đề:**
- Chỉ `console.warn()`, không throw error
- Server vẫn start dù thiếu credentials
- Deployment có thể proceed với incomplete configuration
- Lỗi sẽ phát hiện khi query database (muộn)

**Giải pháp chi tiết:**

1️⃣ **Tạo file mới `src/lib/validateEnv.ts`:**
```typescript
// src/lib/validateEnv.ts

const REQUIRED_ENV_VARS: Record<string, { required: boolean; description: string }> = {
  DB_HOST: { required: true, description: 'Database host'},
  DB_USER: { required: true, description: 'Database user'},
  DB_PASSWORD: { required: true, description: 'Database password'},
  DB_NAME: { required: true, description: 'Database name'},
  AUTH_COOKIE_SECRET: { required: true, description: 'Admin auth cookie secret (min 32 chars)'},
  NEXTAUTH_SECRET: { required: true, description: 'NextAuth secret key'},
  ADMIN_EMAIL: { required: true, description: 'Admin email for login'},
  ADMIN_PASSWORD_HASH: { required: false, description: 'Bcrypt hash of admin password (only if custom auth)'},
};

export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  Object.entries(REQUIRED_ENV_VARS).forEach(([varName, config]) => {
    const value = process.env[varName];

    if (config.required && !value) {
      missing.push(`  ❌ ${varName} - ${config.description}`);
    } else if (!config.required && !value) {
      warnings.push(`  ⚠️  ${varName} - ${config.description}`);
    } else if (varName === 'AUTH_COOKIE_SECRET' && value && value.length < 32) {
      missing.push(`  ❌ ${varName} - must be at least 32 characters (current: ${value.length})`);
    }
  });

  if (missing.length > 0) {
    console.error('\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:\n');
    missing.forEach(msg => console.error(msg));
    console.error('\n⛔ Cannot start server without required environment variables.\n');
    process.exit(1);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('\n⚠️  OPTIONAL ENVIRONMENT VARIABLES NOT SET:\n');
    warnings.forEach(msg => console.warn(msg));
  }

  console.log('\n✅ All required environment variables are configured.\n');
}
```

2️⃣ **Gọi validation từ middleware hoặc root:**

**Option A: Trong `middleware.ts`:**
```typescript
// src/middleware.ts
import { validateEnvironment } from '@/lib/validateEnv';

// Run validation on server startup (one-time)
let validated = false;
if (!validated) {
  validateEnvironment();
  validated = true;
}

export const middleware = (request: NextRequest) => {
  // ... middleware logic ...
};
```

**Option B: Trong root layout (app/layout.tsx):**
```typescript
// src/app/layout.tsx
import { validateEnvironment } from '@/lib/validateEnv';

// Validate once on server startup
if (!global.envValidated) {
  validateEnvironment();
  (global as any).envValidated = true;
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Option C: Tạo file initialization:**
```typescript
// src/lib/init.ts
import { validateEnvironment } from '@/lib/validateEnv';

export function initializeApp() {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any)._appInitialized) {
      validateEnvironment();
      (globalThis as any)._appInitialized = true;
    }
  }
}

// Call dalam next.config.js:
import { initializeApp } from './src/lib/init';
initializeApp();
```

3️⃣ **Test validation:**
```bash
# Test missing variable:
unset DB_PASSWORD
npm run dev
# Expected: ❌ Error message, process exit(1)

# Test with valid variables:
export DB_PASSWORD=test
npm run dev
# Expected: ✅ All required environment variables are configured
```

---

### **ISSUE #7: KHÔNG CÓ CSRF PROTECTION CHO LOGIN ENDPOINT**

**🟠 Severity:** HIGH
**⏰ Priority:** 2
**📁 File:** `src/app/api/auth/login/route.ts` (Line 38-77)
**🔗 Attack Type:** Cross-Site Request Forgery (CSRF)

**Vấn đề hiện tại:**
```typescript
// Line 62-69: Chỉ set cookie, không check CSRF token
response.cookies.set(COOKIE_NAME, authData, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',    // ← SameSite helps but not sufficient
  maxAge,
  path: '/'
});
```

**Tác hại:**
- Request login từ trang khác có thể bị exploit
- Attacker có thể forge login request
- SameSite cookie giúp nhưng không 100% safe

**Giải pháp chi tiết:**

1️⃣ **Install CSRF library:**
```bash
npm install csrf express-csrf-protection
```

2️⃣ **Tạo `src/lib/csrf.ts`:**
```typescript
// src/lib/csrf.ts
import Tokens from 'csrf';

const tokens = new Tokens();

export function generateCsrfSecret(): string {
  return tokens.secretSync();
}

export function generateCsrfToken(secret: string): string {
  return tokens.create(secret);
}

export function verifyCsrfToken(secret: string, token: string): boolean {
  try {
    return tokens.verify(secret, token);
  } catch {
    return false;
  }
}
```

3️⃣ **Tạo endpoint để lấy CSRF token:**
```typescript
// src/app/api/auth/csrf-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfSecret, generateCsrfToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Tạo secret mới
    const secret = generateCsrfSecret();
    const token = generateCsrfToken(secret);

    // Store secret trong httpOnly cookie (short-lived)
    const response = NextResponse.json({ token });
    response.cookies.set('csrf-secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
```

4️⃣ **Update login endpoint:**
```typescript
// src/app/api/auth/login/route.ts
import { verifyCsrfToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe, csrfToken } = body;

    // Step 1: Get CSRF secret từ cookie
    const csrfSecret = request.cookies.get('csrf-secret')?.value;

    if (!csrfSecret || !csrfToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Step 2: Verify CSRF token
    if (!verifyCsrfToken(csrfSecret, csrfToken)) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    // Step 3: Continue with password validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const passwordValid = await verifyPassword(password);
    const emailValid = constantTimeEqual(email, ADMIN_EMAIL);

    if (!emailValid || !passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // ... create session and return ...
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

5️⃣ **Frontend implementation:**
```typescript
// src/components/admin/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';

export function LoginForm() {
  const [csrfToken, setCsrfToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Fetch CSRF token khi component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      const response = await fetch('/api/auth/csrf-token');
      const data = await response.json();
      setCsrfToken(data.token);
    };

    fetchCsrfToken();
  }, []);

  // Step 2: Submit login dengan CSRF token
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Important: include cookies
        body: JSON.stringify({
          email,
          password,
          csrfToken,  // ← Include CSRF token
          rememberMe: false
        })
      });

      if (response.ok) {
        // Redirect to admin dashboard
        window.location.href = '/admin';
      } else {
        const error = await response.json();
        alert(`Login failed: ${error.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={!csrfToken || loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

### **ISSUE #8: LOGOUT KHÔNG INVALIDATE SESSION**

**🟠 Severity:** HIGH
**⏰ Priority:** 2
**📁 File:** `src/app/api/auth/logout/route.ts` (cần implement)
**🔗 Problem:** Logout chỉ xóa client cookie, server không biết

**Tác hại:**
- Cookie bị xóa phía client nhưng server không track
- Nếu ai lấy được cookie history/cache, vẫn dùng được
- Không có session revocation mechanism
- Login session trong 24 giờ (Issue #14)

**Giải pháp chi tiết:**

1️⃣ **Tạo bảng `admin_sessions` trong MySQL:**
```sql
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(60) PRIMARY KEY COMMENT 'UUID v4',
  admin_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_valid BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSON,

  INDEX idx_admin_email (admin_email),
  INDEX idx_is_valid (is_valid),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

2️⃣ **Update login endpoint để tạo session:**
```typescript
// src/app/api/auth/login/route.ts
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // ... validation ...

    // Generate session ID
    const sessionId = uuidv4();
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Store session trong database
    const db = getDb();
    await db.query(
      `INSERT INTO admin_sessions
       (id, admin_email, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
      [sessionId, email, clientIp, userAgent]
    );

    // Create auth data dengan session ID
    const authData = createSignedCookie({
      sessionId,
      email,
      role: ADMIN_ROLE,
      name: 'Admin',
      loginTime: new Date().toISOString()
    });

    // Set cookie
    const response = NextResponse.json({ success: true });
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 4 * 60 * 60;
    response.cookies.set(COOKIE_NAME, authData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

3️⃣ **Update logout endpoint:**
```typescript
// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const COOKIE_NAME = 'adminAuth';

function parseSignedCookie(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(COOKIE_NAME);

    if (!cookie) {
      return NextResponse.json({ success: true });
    }

    // Parse cookie
    const authData = parseSignedCookie(cookie.value);
    if (!authData?.sessionId) {
      return NextResponse.json({ success: true });
    }

    // Invalidate session dalam database
    const db = getDb();
    await db.query(
      `UPDATE admin_sessions
       SET is_valid = FALSE, revoked_at = NOW()
       WHERE id = ?`,
      [authData.sessionId]
    );

    // Delete cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('[LOGOUT] Error:', error);
    return NextResponse.json({ success: true }); // Always return success
  }
}
```

4️⃣ **Update middleware để validate session:**
```typescript
// src/middleware.ts
import { getDb } from '@/lib/db';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const cookie = request.cookies.get('adminAuth');

    if (!cookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const authData = parseSignedCookie(cookie.value);
    if (!authData?.sessionId) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Check session trong database
    const db = getDb();
    const [rows]: any = await db.query(
      `SELECT id FROM admin_sessions
       WHERE id = ? AND is_valid = TRUE`,
      [authData.sessionId]
    );

    if (rows.length === 0) {
      // Session invalid/revoked
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('adminAuth');
      return response;
    }

    // Update last_activity
    await db.query(
      `UPDATE admin_sessions SET last_activity = NOW() WHERE id = ?`,
      [authData.sessionId]
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
```

5️⃣ **Cleanup old sessions (cron job):**
```typescript
// src/lib/cleanupSessions.ts
import { getDb } from '@/lib/db';

export async function cleanupExpiredSessions() {
  const db = getDb();

  // Xóa sessions hết hạn (older than 7 days)
  await db.query(
    `DELETE FROM admin_sessions
     WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
  );

  // Invalidate sessions hết hạn (no activity for 4 hours)
  await db.query(
    `UPDATE admin_sessions SET is_valid = FALSE
     WHERE last_activity < DATE_SUB(NOW(), INTERVAL 4 HOUR)
     AND is_valid = TRUE`,
  );
}

// Call từ API endpoint (hoặc cron service):
// GET /api/admin/cleanup-sessions (protected)
```

---

### **ISSUE #9: SCRAPING KHÔNG CÓ RATE LIMITING**

**🟠 Severity:** HIGH
**⏰ Priority:** 2
**📁 File:** `src/app/api/scams/route.ts`
**🔗 Problem:** Scrape tinnhiemmang.vn liên tục, có thể bị block

**Tác hại:**
- Liên tục call tinnhiemmang.vn = bị rate limit hoặc IP block
- Không cache dữ liệu = duplicate requests
- Không implement backoff = khó recover
- Website sẽ down hoặc lỗi khi scrape fail

**Giải pháp chi tiết:**

1️⃣ **Tạo `src/lib/scrapeCache.ts`:**
```typescript
// src/lib/scrapeCache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const scrapeCache = new Map<string, CacheEntry<any>>();

export function getCachedData<T>(key: string): T | null {
  const cached = scrapeCache.get(key);

  if (!cached) return null;

  const elapsed = Date.now() - cached.timestamp;
  if (elapsed > cached.ttl) {
    scrapeCache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function setCachedData<T>(key: string, data: T, ttl: number = 3600000): void {
  scrapeCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });

  console.log(`📦 Cached: ${key} (TTL: ${ttl / 1000}s)`);
}

export function invalidateCache(pattern: string): void {
  const keysToDelete = Array.from(scrapeCache.keys()).filter(k => k.includes(pattern));
  keysToDelete.forEach(k => scrapeCache.delete(k));
}
```

2️⃣ **Tạo `src/lib/scrapeLimiter.ts` (rate limit + backoff):**
```typescript
// src/lib/scrapeLimiter.ts
import { checkRateLimit } from '@/lib/rateLimit';

interface ScrapeLimitState {
  lastAttempt: number;
  failureCount: number;
  backoffMultiplier: number;
}

const scrapeStates = new Map<string, ScrapeLimitState>();

export async function checkScrapeLimits(target: string, ip: string): Promise<{
  allowed: boolean;
  error?: string;
  retryAfter?: number;
}> {
  // Check rate limit: max 3 scrapes per hour
  const rateLimit = await checkRateLimit({
    scope: `scrape:${target}`,
    key: ip,
    maxAttempts: 3,
    windowSeconds: 3600,  // 1 hour
    banSeconds: 3600
  });

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      error: 'Rate limit exceeded. Try again later.',
      retryAfter: rateLimit.retryAfter
    };
  }

  // Check backoff state (exponential backoff)
  const state = scrapeStates.get(target) || {
    lastAttempt: 0,
    failureCount: 0,
    backoffMultiplier: 1
  };

  const now = Date.now();
  const timeSinceLastRequest = now - state.lastAttempt;
  const minDelayMs = 2000 * state.backoffMultiplier; // 2s, 4s, 8s, ...

  if (timeSinceLastRequest < minDelayMs) {
    return {
      allowed: false,
      error: `Please wait before scraping again. (Backoff: ${(minDelayMs / 1000).toFixed(1)}s)`,
      retryAfter: Math.ceil((minDelayMs - timeSinceLastRequest) / 1000)
    };
  }

  return { allowed: true };
}

export function recordScrapeAttempt(target: string, success: boolean): void {
  const state = scrapeStates.get(target) || {
    lastAttempt: 0,
    failureCount: 0,
    backoffMultiplier: 1
  };

  state.lastAttempt = Date.now();

  if (success) {
    // Reset on success
    state.failureCount = 0;
    state.backoffMultiplier = 1;
  } else {
    // Increase backoff on failure
    state.failureCount++;
    state.backoffMultiplier = Math.min(2 ** state.failureCount, 16); // Max 16x backoff
    console.warn(`⚠️  Scrape failed for ${target}. Backoff: ${state.backoffMultiplier}x`);
  }

  scrapeStates.set(target, state);
}
```

3️⃣ **Update `/api/scams` endpoint:**
```typescript
// src/app/api/scams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/scrapeCache';
import { checkScrapeLimits, recordScrapeAttempt } from '@/lib/scrapeLimiter';
import { getClientIp } from '@/lib/utils';

const CACHE_KEY = 'scams_data';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function scrapeScamData(): Promise<any[]> {
  // Implementation to scrape tinnhiemmang.vn
  // ... existing code ...
}

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';

    // 1. Check cache first
    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEY);
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          fromCache: true,
          cached At: new Date(Date.now() - CACHE_TTL).toISOString()
        });
      }
    }

    // 2. Check rate limit + backoff
    const limitCheck = await checkScrapeLimits('tinnhiemmang.vn', clientIp);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: limitCheck.error,
          retryAfter: limitCheck.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': limitCheck.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // 3. Add delay before scraping (be nice to target)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    // 4. Scrape data
    console.log('🔄 Scraping scams data from tinnhiemmang.vn...');
    const scamData = await scrapeScamData();

    // 5. Cache results
    setCachedData(CACHE_KEY, scamData, CACHE_TTL);

    // Record success
    recordScrapeAttempt('tinnhiemmang.vn', true);

    return NextResponse.json({
      success: true,
      data: scamData,
      fromCache: false,
      expiresAt: new Date(Date.now() + CACHE_TTL).toISOString()
    });

  } catch (error) {
    console.error('❌ Scrape error:', error);

    // Record failure for backoff
    recordScrapeAttempt('tinnhiemmang.vn', false);

    // Try to return cached data as fallback
    const cached = getCachedData(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        fromCache: true,
        message: 'Served from cache due to scraping error'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch scams data' },
      { status: 503 }
    );
  }
}
```

4️⃣ **Manual refresh endpoint (admin only):**
```typescript
// src/app/api/admin/scams/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/scrapeCache';

export async function POST(request: NextRequest) {
  // Check admin auth
  const cookie = request.cookies.get('adminAuth');
  if (!cookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Invalidate cache
  invalidateCache('scams');

  return NextResponse.json({
    success: true,
    message: 'Cache invalidated. Next request will scrape fresh data.'
  });
}
```

---

### **ISSUE #10: DATABASE CONFIG BỊ DUPLICATE**

**🟠 Severity:** HIGH
**⏰ Priority:** 2
**📁 File:** `src/lib/db.ts` (dòng 3-11 và 26-44)
**🔗 Problem:** Config definition lặp lại, database name khác nhau

**Status hiện tại (sau linter change):**
```typescript
// Line 26-36: getCurrentalready consolidated
function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "baocaoluadao",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}
```

**Status trước (yang sekarang sudah diperbaiki):**
```typescript
// OLD Line 3-11:
const dbConfig = {   // ← REMOVED
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "scamguard",  // Different!
  ...
};
```

**Kesimpulan:**
✅ **SUDAH FIXED** oleh linter/user sebelumnya.
- Hanya satu `getDbConfig()` function sekarang
- Database name seragam: "baocaoluadao"
- No duplicate anymore

**Verifikasi:**
```bash
grep -n "dbConfig\|getDbConfig" /var/www/baocaoluadao.com/src/lib/db.ts
# Output seharusnya:
# 26:  function getDbConfig() {
# (hanya 1 definition, bukan 2)
```

**Status:** ✅ **RESOLVED** - Tidak perlu action lagi

---

## 🟡 **MEDIUM PRIORITY ISSUES (7 vấn đề)**

Karena character limit, saya akan simpulkan saja:

### **ISSUE #11: EMAIL VALIDATION REGEX QUÁ LAX**
- **File:** Berbagai file validation
- **Masalah:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` menerima email invalid
- **Solusi:** `npm install zod` dan gunakan `z.string().email()`

### **ISSUE #12: API RESPONSE FORMAT TIDAK THỐNG NHẤT**
- **File:** 36 endpoints berbeda
- **Masalah:** Mixed format (data vs items vs report vs users)
- **Solusi:** Create `src/lib/apiResponse.ts` dengan unified interface

### **ISSUE #13: ROLE CHECK TIDAK CENTRALIZED**
- **File:** Tất cả `/api/admin/*` endpoints
- **Masalah:** Setiap endpoint check role beda-beda
- **Solusi:** Create `src/lib/permissions.ts` dengan permission matrix

### **ISSUE #14: ADMIN LOGIN TIMEOUT TERLALU LAMA (24 HOURS)**
- **File:** `src/app/api/auth/login/route.ts` line 62
- **Masalah:** `maxAge: rememberMe ? 30*24*60*60 : 24*60*60` terlalu lama
- **Solusi:** Ubah menjadi `rememberMe ? 7*24*60*60 : 4*60*60`

### **ISSUE #15: TIDAK ADA SESSION REFRESH MECHANISM**
- **File:** N/A - perlu buat baru
- **Masalah:** Admin harus re-login setelah 24 jam
- **Solusi:** Create `/api/auth/refresh` endpoint + auto-refresh setiap 30 menit

### **ISSUE #16: LOGGING HANYA CONSOLE, TIDAK PERSISTENT**
- **File:** Tất cả logs
- **Masalah:** Logs hilang saat server restart
- **Solusi:** Setup Sentry atau file-based logging

### **ISSUE #17: DUA AUTH SYSTEMS TERPISAH**
- **File:** NextAuth + Custom admin auth
- **Masalah:** Confusing, hard to maintain, security gaps
- **Solusi:** Consolidate menjadi NextAuth saja

---

## 🔵 **LOW PRIORITY ISSUES (2 vấn đề)**

### **ISSUE #18 & #19: MISSING DOCUMENTATION**
- Create `docs/API.md` (OpenAPI/Swagger)
- Create `docs/DATABASE.md` (schema + relationships)

### **ISSUE #20: LEGAL COMPLIANCE WEB SCRAPING**
- Verify TOS dari tinnhiemmang.vn
- Ensure compliance dengan Vietnamese privacy law

---

## 📊 **PRIORITAS EKSEKUSI**

**MINGGU 1 (CRITICAL - HARUS SELESAI):**
1. ✅ #1: Hapus DB credentials, update .env
2. ✅ #3: Hapus endpoint `/api/admin/db-manager`
3. ✅ #5: Hapus folder `src/app/thuybgt/`
4. ✅ #4: Remove hardcoded secrets
5. ✅ #6: Add environment validation

**MINGGU 2 (HIGH - JANGAN TUNDA):**
6. #7: Add CSRF protection
7. #8: Implement session invalidation
8. #9: Add rate limiting untuk scraping
9. #10: (Already fixed by linter)

**MINGGU 3+ (MEDIUM & LOW):**
10-20. Remaining issues sesuai prioritas

---

