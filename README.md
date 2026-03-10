# 🔍 BaoCaoLuaDao.com - Vietnamese Scam Reporting Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Nền tảng báo cáo lừa đảo trực tuyến hàng đầu Việt Nam. Người dùng có thể tìm kiếm, báo cáo và theo dõi các trường hợp lừa đảo qua website, email, số điện thoại và mạng xã hội.

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                               │
│                  (Static Assets + DNS)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│   baocaoluadao.com      │    │    api.baocaoluadao.com     │
│   (Next.js Frontend)    │    │    (Cloudflare Workers)     │
│   Google Cloud VPS      │    │    (D1 Database)             │
└───────────┬─────────────┘    └──────────────┬────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│    PostgreSQL           │    │    Cloudflare D1            │
│    (Main Database)      │    │    (Edge Database)          │
└─────────────────────────┘    └─────────────────────────────┘
```

### Thành Phần Chính

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| Frontend | Next.js 14 | React server components, App Router |
| API Layer | Cloudflare Workers | Edge computing, 13 endpoints |
| Database | PostgreSQL | VPS (production data) |
| Edge DB | Cloudflare D1 | Cache, fast reads |
| CDN | Cloudflare | Static assets, DDoS protection |
| Auth | NextAuth.js | Session-based authentication |
| Monitoring | Sentry | Error tracking |

## 🚀 Quick Start

### Yêu Cầu

- Node.js 20+
- PostgreSQL 14+
- Cloudflare account
- Wrangler CLI (`npm i -g wrangler`)

### Cài Đặt

```bash
# Clone repository
git clone https://github.com/your-org/baocaoluadao.com.git
cd baocaoluadao.com

# Cài đặt dependencies
npm install

# Copy environment file
cp .env.production.example .env.production

# Edit .env.production với các giá trị thực
nano .env.production

# Chạy migrations
npm run db:migrate

# Build và chạy development
npm run dev
```

### Deploy VPS

```bash
# Deploy với PM2
npm run build
pm2 start ecosystem.config.js
```

### Deploy Cloudflare Workers

```bash
cd workers
wrangler deploy
```

## 📁 Cấu Trúc Project

```
baocaoluadao.com/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (private/admin)
│   │   ├── admin/            # Admin dashboard
│   │   └── [pages]           # Public pages
│   ├── components/           # React components
│   └── lib/                  # Utilities, DB, auth
├── workers/                   # Cloudflare Workers
│   ├── src/
│   │   ├── index.ts          # Main handler
│   │   └── handlers/         # API endpoints
│   ├── wrangler.toml         # Workers config
│   └── d1_schema.sql         # D1 schema
├── migrations/               # Database migrations
├── scripts/                  # Deployment scripts
└── public/                   # Static assets
```

## 🔌 API Endpoints

### Cloudflare Workers (Public APIs)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/health` | GET | Health check |
| `/categories` | GET | Danh sách danh mục |
| `/stats` | GET | Thống kê tổng quan |
| `/report` | POST | Gửi báo cáo lừa đảo |
| `/scan` | POST | AI scan content |
| `/scams` | GET | Tìm kiếm scams |
| `/lookup/phone` | GET | Tra cứu số điện thoại |
| `/lookup/email` | GET | Tra cứu email |
| `/lookup/website` | GET | Tra cứu website |
| `/detail/[type]/[id]` | GET | Chi tiết báo cáo |

### Next.js API (Private/Admin)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/auth/*` | * | NextAuth authentication |
| `/api/admin/*` | * | Admin dashboard APIs |
| `/api/reports/[id]` | GET/PUT/DELETE | Quản lý reports |

## 🔧 Environment Variables

### Frontend (.env.production)

```env
NODE_ENV=production
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://baocaoluadao.com
AUTH_COOKIE_SECRET=your-cookie-secret
ADMIN_EMAIL=admin@baocaoluadao.com
ADMIN_PASSWORD_HASH=bcrypt-hash
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=baocaoluadao
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=https://api.baocaoluadao.com
```

### Workers (wrangler.toml)

```toml
name = "baocaoluadao-api"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "baocaoluadao-api"
database_id = "your-database-id"
```

## 📖 Tài Liệu Chi Tiết

| File | Mô tả |
|------|-------|
| [CLOUDFLARE_MIGRATION_README.md](./CLOUDFLARE_MIGRATION_README.md) | Hướng dẫn migration Cloudflare |
| [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) | Hướng dẫn deploy chi tiết |
| [workers/TOKEN_SETUP.md](./workers/TOKEN_SETUP.md) | Hướng dẫn tạo Cloudflare token |
| [ADMIN_FEATURES.md](./ADMIN_FEATURES.md) | Tính năng admin |
| [REPORTING_SYSTEM.md](./REPORTING_SYSTEM.md) | Hệ thống báo cáo |

## 🛡️ Bảo Mật

- ✅ Rate limiting trên tất cả public endpoints
- ✅ CORS headers được cấu hình
- ✅ Input validation với Zod
- ✅ SQL injection protection qua parameterized queries
- ✅ XSS protection via React
- ✅ CSRF protection via NextAuth
- ✅ Rate limit: 100 requests/giây cho public APIs

## 📊 Monitoring

- **Sentry**: Error tracking cho cả frontend và backend
- **PM2**: Process management và logging
- **Cloudflare Analytics**: Traffic monitoring
- **Health Checks**: `/api/health` và `/health`

## 🤝 Đóng Góp

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📝 License

MIT License - xem [LICENSE](LICENSE) file để biết thêm chi tiết.

## 📞 Liên Hệ

- Website: https://baocaoluadao.com
- Email: contact@baocaoluadao.com
