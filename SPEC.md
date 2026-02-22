# SCAM GUARD - Production Specification

## 1. Project Overview

**Project Name**: ScamGuard (Bảo vệ lừa đảo)
**Type**: Web Application - Global Scam Reporting Platform
**Primary Language**: Vietnamese
**Secondary Language**: English
**Default UI Language**: Vietnamese (auto-detect browser language)

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useState
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Maps**: React Simple Maps (for heatmap)
- **i18n**: Custom implementation with JSON

## 3. Design System

### Colors
```css
--primary: #2563EB
--primary-hover: #1D4ED8
--danger: #DC2626
--danger-hover: #B91C1C
--warning: #F59E0B
--success: #16A34A

--bg-dark: #0B1120
--bg-card: #111827
--bg-card-hover: #1F2937
--border: #374151

--text-main: #F9FAFB
--text-secondary: #9CA3AF
--text-muted: #6B7280
```

### Typography
- **Headings**: Inter (600, 700)
- **Body**: Inter (400, 500)
- **Monospace**: JetBrains Mono (for numbers, codes)

### Spacing
- **Mobile Padding**: 16px
- **Desktop Padding**: 32px
- **Card Radius**: 18px
- **Button Radius**: 12px
- **Modal Radius**: 24px

### Animations
- **Fast**: 120ms ease
- **Normal**: 180ms ease
- **Slow**: 260ms ease

## 4. Page Structure

### 4.1 Navbar
- Logo (shield icon) - hover rotate 6deg
- Center search input with instant suggestions
- Right side: Report button, Notifications, Language toggle, Login/Avatar
- Sticky on scroll with backdrop blur

### 4.2 Homepage
- Hero section with title and subtitle
- Large search bar (72px desktop, 56px mobile)
- Risk level tags (Green/Yellow/Red)
- Search results with shimmer loading

### 4.3 Report Scam Flow (Multi-step)
**Step 1**: Select scam type (7 options)
**Step 2**: Input evidence data (smart auto-detection)
**Step 3**: Upload proof images
**Step 4**: Submit with confirmation

### 4.4 Scam Detail Page
- Risk score (0-100) with animated bar
- Total reports, first/last seen dates
- Description, victim comments, timeline
- Related scam entries

### 4.5 AI Features
- Scam Message Analyzer (SMS/Email probability)
- Website Scanner (domain age, SSL, risk score)
- Global Scam Heatmap

## 5. Components

### Global Components
- `Button` - Primary, Secondary, Danger variants
- `Input` - With validation states
- `Modal` - With backdrop blur
- `Toast` - Success/Error animations
- `Skeleton` - Loading shimmer
- `Badge` - Risk level indicators
- `Card` - Glass effect subtle

### Navigation
- `Navbar` - Desktop top nav
- `MobileNav` - Bottom tab bar

## 6. i18n Structure

```
/locales
  /vi.json
  /en.json
```

Keys format: `page.section.element`

## 7. Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 8. State Management

- Language context
- Theme context (dark/light)
- Auth context (mock)
- Notification context

## 9. Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Lazy load images
- Debounce search: 300ms
- Cache frequent queries in memory
