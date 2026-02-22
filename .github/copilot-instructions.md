# Copilot / AI Agent Instructions for ScamGuard

Purpose: help AI coding agents be productive quickly by describing the project architecture, conventions, and key integration points.

**Big Picture**
- **Framework:** Next.js 14 using the App Router (server + client components). See [src/app/layout.tsx](src/app/layout.tsx) and [src/app/providers.tsx](src/app/providers.tsx).
- **Major areas:**
  - UI: [src/components](src/components) (layout, ui primitives, admin).
  - Pages & routes: [src/app](src/app) using file-based App Router and server components by default.
  - APIs: serverless routes under [src/app/api](src/app/api) (e.g., AI analysis at [src/app/api/ai/analyze/route.ts](src/app/api/ai/analyze/route.ts)).
  - Utilities & types: [src/lib/utils.ts](src/lib/utils.ts) (shared types, helpers like `cn`, `sanitizeHTML`).
  - i18n: simple provider in [src/contexts/I18nContext.tsx](src/contexts/I18nContext.tsx) with JSON files in [src/locales](src/locales).

**Dev & run commands**
- Start dev server: `npm run dev` (uses `next dev`).
- Build: `npm run build`; Start production: `npm run start`.
- Lint: `npm run lint`.
- Tests: Playwright is included in devDependencies but no test harness is present by default—check package.json and add tests as needed.

**Environment & integrations**
- `OPENAI_API_KEY` toggles OpenAI usage in [src/app/api/ai/analyze/route.ts](src/app/api/ai/analyze/route.ts). If missing, the code falls back to a local pattern-based analysis.
- The analyze route uses an in-memory rate limiter (development-only). Do NOT assume persistence for production.
- Images domains are configured in [next.config.js](next.config.js).

**Project-specific conventions**
- Path alias: code uses `@/` imports (e.g., `import { I18nProvider } from '@/contexts/I18nContext'`). Keep imports aligned to tsconfig/next settings.
- Styling: Tailwind CSS utility classes everywhere; prefer `cn(...)` from [src/lib/utils.ts](src/lib/utils.ts) when composing classnames.
- Client vs Server: components with `use client` at top are client components (e.g., [src/components/admin/Sidebar.tsx](src/components/admin/Sidebar.tsx)). Avoid adding `use client` unless the component uses hooks or browser APIs.
- Fonts: next/font usage is in [src/app/layout.tsx](src/app/layout.tsx); be conservative when changing global fonts.

**API patterns & examples**
- AI route returns structured JSON with `probability`, `verdict`, `indicators`, and `patterns`. Follow that shape when creating downstream consumers. See the prompt and parsing logic in [src/app/api/ai/analyze/route.ts](src/app/api/ai/analyze/route.ts).
- When adding routes under `src/app/api`, prefer server components / runtime-safe code and avoid client-only APIs.

**Admin UI patterns**
- Admin UI uses `framer-motion` for animations and `lucide-react` for icons. Sidebar state is driven by `isCollapsed` prop and `usePathname()` routing checks in [src/components/admin/Sidebar.tsx](src/components/admin/Sidebar.tsx).

**Safety / production notes agents should surface**
- The in-memory rate limiter and naive HTML sanitizer in [src/lib/utils.ts](src/lib/utils.ts) are acceptable for prototype/dev only—flag these for improvement (use Redis/Upstash for rate limits and DOMPurify for sanitization).
- OpenAI calls are proxied directly from the server route; ensure `OPENAI_API_KEY` is stored securely in environment configuration when deploying.

**Where to change translations and copy**
- Locale JSON: [src/locales/en.json](src/locales/en.json) and [src/locales/vi.json](src/locales/vi.json). Use `I18nContext` for access.

If anything in this file is unclear or you'd like more detail (deployment notes, tests, or additional file links), tell me which area to expand. 
