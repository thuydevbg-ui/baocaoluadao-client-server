# Báo Cáo Lừa Đảo - Cloudflare Workers Migration Guide

## 📋 Tổng quan

Dự án này sử dụng kiến trúc **Next.js + Cloudflare Workers + D1 Database** để giảm tải cho VPS.

### Kiến trúc hiện tại

```
User 
  ↓
Cloudflare CDN 
  ↓
┌─────────────────────────────────────────────┐
│  baocaoluadao.com → Next.js (VPS)          │  ← Frontend only
│  api.baocaoluadao.com → Cloudflare Workers │  ← API Layer
│                                            │
│  Workers → D1 Database                     │  ← Database
└─────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Clone và cài đặt

```bash
git clone <repo-url>
cd baocaoluadao.com
npm install
```

### 2. Cấu hình Environment

Tạo file `.env.production`:

```env
# Frontend URL
NEXT_PUBLIC_API_URL=https://api.baocaoluadao.com
NEXT_PUBLIC_SITE_URL=https://baocaoluadao.com

# ... các biến khác giữ nguyên
```

### 3. Build và Deploy

```bash
# Frontend (VPS)
npm run build
pm2 restart all

# API (Cloudflare Workers)
cd workers
npx wrangler deploy
```

---

## 📁 Cấu trúc dự án

```
baocaoluadao.com/
├── src/                      # Next.js frontend
│   ├── app/                  # App router
│   ├── components/           # Components
│   └── lib/                 # Utilities (bao gồm apiClient.ts)
│
├── workers/                 # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts        # Main handler
│   │   ├── types.ts       # Type definitions
│   │   ├── utils.ts       # Utilities
│   │   └── handlers/      # API handlers
│   ├── wrangler.toml      # Workers config
│   ├── package.json
│   └── d1_schema_and_data.sql  # Database schema
│
└── .env.production         # Environment variables
```

---

## 🔧 API Endpoints

Workers cung cấp các endpoints sau:

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/health` | Health check |
| GET | `/categories` | Danh sách categories |
| POST | `/categories` | Tìm kiếm categories |
| GET | `/stats` | Thống kê |
| POST | `/report` | Gửi báo cáo |
| POST | `/scan` | Quét URL/Email |
| GET | `/scams` | Danh sách scams |
| GET | `/search` | Tìm kiếm |
| POST | `/policy-violations/lookup` | Tra cứu policy violation |
| POST | `/detail-feedback` | Gửi feedback |
| POST | `/detail-views` | Track views |
| POST | `/risk/analyze` | Phân tích rủi ro |

---

## 🗄️ D1 Database

### Schema

Database baocaoluadao-d1 chứa các tables:

- `categories` - Danh mục báo cáo
- `scams` - Dữ liệu lừa đảo
- `reports` - Báo cáo của user
- `site_settings` - Cấu hình site
- `detail_view_counts` - Số lượt xem
- `detail_feedback` - Feedback
- `policy_violations` - Policy violations

### Chạy SQL vào D1

```bash
cd workers
npx wrangler d1 execute baocaoluadao-d1 --remote --file=d1_schema_and_data.sql
```

---

## ☁️ Cloudflare Workers Deployment

### Yêu cầu

1. Cloudflare account
2. API Token với quyền:
   - D1: Edit
   - Workers Scripts: Edit
   - User Details: Read
   - Memberships: Read

### Deploy Workers

```bash
cd workers

# Set token
export CLOUDFLARE_API_TOKEN="your-token"

# Deploy
npx wrangler deploy
```

### Kiểm tra

```bash
curl https://api.baocaoluadao.com/health
# Response: {"success":true,"status":"healthy"}
```

---

## 🔄 Chuyển VPS khác

Khi chuyển sang VPS mới, thực hiện các bước sau:

### Bước 1: Cài đặt trên VPS mới

```bash
# Clone repo
git clone <repo-url>
cd baocaoluadao.com

# Cài đặt dependencies
npm install

# Tạo .env.production
cp .env.production.example .env.production
# Chỉnh sửa các biến cần thiết
```

### Bước 2: Build

```bash
npm run build
```

### Bước 3: Cấu hình PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

### Bước 4: Cloudflare DNS (nếu cần)

Đảm bảo:
- `baocaoluadao.com` trỏ đến VPS mới
- `api.baocaoluadao.com` trỏ đến Cloudflare Workers (không đổi)

### Không cần thay đổi gì khác!

Workers API và D1 database độc lập với VPS, nên:
- ✅ Không cần deploy lại Workers
- ✅ Không cần tạo lại D1
- ✅ Không cần cấu hình lại DNS cho api subdomain

---

## ⚙️ Cấu hình chi tiết

### Frontend (.env.production)

```env
# Required
NEXT_PUBLIC_API_URL=https://api.baocaoluadao.com
NEXT_PUBLIC_SITE_URL=https://baocaoluadao.com

# Database (for NextAuth)
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://baocaoluadao.com
NEXTAUTH_SECRET=...

# API Keys
OPENAI_API_KEY=...
```

### Workers (workers/wrangler.toml)

```toml
name = "baocaoluadao-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "baocaoluadao-d1"
database_id = "e95728a8-5016-4adb-822f-02c66ffe789a"
```

---

## 🔒 Bảo mật

### Rate Limiting

Workers có tích hợp rate limiting:
- `/report`: 10 requests/phút
- `/scan`: 10 requests/phút
- `/search`: 30 requests/phút
- `/categories`: 60 requests/phút
- `/stats`: 30 requests/phút

### CORS

Đã cấu hình CORS cho phép:
- `https://baocaoluadao.com`
- `http://localhost:3000` (development)

---

## 📊 Performance

### Kết quả benchmark

| Endpoint | Response Time |
|----------|---------------|
| /health | ~100ms |
| /categories | ~150ms |
| /stats | ~380ms |

### Caching

- Categories: 1 hour
- Stats: 1 minute
- Health: 1 minute

---

## 🔧 Troubleshooting

### Workers không kết nối được D1

```bash
# Kiểm tra token
curl https://api.cloudflare.com/client/v4/user/tokens/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### API trả về lỗi

```bash
# Kiểm tra logs
npx wrangler tail baocaoluadao-api
```

### Database empty

```bash
# Chạy lại schema
cd workers
npx wrangler d1 execute baocaoluadao-d1 --remote --file=d1_schema_and_data.sql
```

---

## 📝 Các file quan trọng

| File | Mô tả |
|------|--------|
| `workers/d1_schema_and_data.sql` | Schema và data mẫu cho D1 |
| `workers/wrangler.toml` | Cấu hình Workers |
| `workers/TOKEN_SETUP.md` | Hướng dẫn tạo API token |
| `src/lib/apiClient.ts` | API client cho frontend |
| `.env.production.example` | Template cho environment |

---

## License

MIT
