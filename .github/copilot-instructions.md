# Copilot / AI Agent Instructions for ScamGuard

Purpose: help AI coding agents be productive quickly by describing the project architecture, conventions, and key integration points.

## Big Picture
- **Framework:** Next.js 14 (App Router) with TypeScript; production spec in [SPEC.md](../SPEC.md), admin features in [ADMIN_FEATURES.md](../ADMIN_FEATURES.md).
- **Major areas:**
  - UI: [src/components](../src/components) (public components, admin shell with theme support).
  - Pages & routes: [src/app](../src/app) using file-based App Router, server components by default.
  - APIs: serverless routes under [src/app/api](../src/app/api) organized by feature (auth, ai, report, stats, phishtank, etc.).
  - Utilities & types: [src/lib/utils.ts](../src/lib/utils.ts) (type definitions like `RiskLevel`, `SearchResult`; helpers `cn()`, `debounce()`, `formatDate()`, `getRiskColor()`).
  - i18n: [src/contexts/I18nContext.tsx](../src/contexts/I18nContext.tsx) with JSON locales in [src/locales](../src/locales) (en, vi).

## Theme & Admin UI
- **Theme management:** Admin layout in [src/components/admin/AdminLayout.tsx](../src/components/admin/AdminLayout.tsx) manages light/dark theme via `localStorage` (`adminTheme` key) and passes `theme` prop to Sidebar and Header.
- **Theme-aware colors:** All admin components use conditional Tailwind classes: `theme === 'dark' ? 'dark-colors' : 'light-colors'` (see [Sidebar.tsx](../src/components/admin/Sidebar.tsx) and [Header.tsx](../src/components/admin/Header.tsx)).
- **Admin UI animations:** Uses `framer-motion` (AnimatePresence, motion.div, etc.) and `lucide-react` icons. Sidebar collapse is driven by `isCollapsed` state + `usePathname()` checks.

## Dev & run commands
- Start: `npm run dev` (Next.js on 3000, or 3001 if port in use).
- Build: `npm run build`; Run: `npm run start`.
- Lint: `npm run lint`.
- Tests: Playwright in devDependencies but no harness configured; add test script in package.json if needed.

## Environment & integrations
- Admin auth: [src/app/api/auth](../src/app/api/auth) handles login/logout with cookie-based sessions. Client-side auth check in AdminLayout calls `/api/auth/verify`.
- Scam analysis: [src/app/api/ai](../src/app/api/ai) (OpenAI optional; falls back to local pattern matching if `OPENAI_API_KEY` missing).
- Rate limiting: In-memory limiter (dev-only; replace with Redis for production).
- Images: Domains configured in [next.config.js](../next.config.js).

## Code conventions
- **Imports:** Use `@/` alias (e.g., `import { cn } from '@/lib/utils'`).
- **Styling:** Tailwind CSS; compose classes with `cn(...)`. Avoid hardcoded color strings—use Tailwind tokens.
- **Client vs Server:** Add `'use client'` only if component uses hooks (useState, useEffect) or browser APIs (localStorage, usePathname).
- **Type safety:** Define types in [src/lib/utils.ts](../src/lib/utils.ts) or component files (e.g., `RiskLevel`, `SearchResult`, `SidebarProps`).
- **Localization:** All UI copy in [src/locales/*.json](../src/locales/); use `I18nContext` to consume.

## API route patterns
- Structure: `src/app/api/[feature]/[action]/route.ts` (e.g., `/api/auth/login`, `/api/ai/analyze`, `/api/report/submit`).
- Returns: JSON with status codes (200 success, 400 bad request, 401 unauthorized, 500 error).
- Scam AI response shape: `{ probability, verdict, indicators, patterns, riskScore }`.

## Production safety notes
- **Auth:** Cookie-based sessions with client-side + middleware verification (see [src/middleware.ts](../src/middleware.ts)).
- **Rate limiting:** Replace in-memory limiter with Redis/Upstash before production.
- **Input sanitization:** Use DOMPurify (not current naive sanitizer) for user-generated HTML.
- **Secrets:** `OPENAI_API_KEY` and DB credentials in `.env.local` (never committed).

## Common tasks
- **Add admin menu item:** Edit `menuItems` in [Sidebar.tsx](../src/components/admin/Sidebar.tsx); add route handler in [src/app/admin/[page]](../src/app/admin).
- **Change theme colors:** Update Tailwind config or override in component classes (ensure light/dark pair).
- **Add locale strings:** Add keys to [en.json](../src/locales/en.json) and [vi.json](../src/locales/vi.json), use `useI18n()` in component.
- **Debug admin auth:** Check `/api/auth/verify` response and middleware rules in [src/middleware.ts](../src/middleware.ts).

If anything is unclear, flag the section for expansion. 
