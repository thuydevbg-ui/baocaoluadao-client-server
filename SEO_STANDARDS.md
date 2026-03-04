# 📋 SEO Standards & Guidelines

> Quy chuẩn SEO cho dự án Báo Cáo Lừa Đảo - Tất cả dev phải tuân thủ

---

## 1. 📐 URL STRUCTURE (Chuẩn hóa)

### Format
```
https://baocaoluadao.com/[category]/[slug]
```

### Rules
| Rule | Example | Status |
|------|---------|--------|
| Lowercase only | `/search` ✅ `/Search` ❌ | Bắt buộc |
| Hyphen (-) cho spaces | `/report-guide` ✅ `/report_guide` ❌ | Bắt buộc |
| Không dấu tiếng Việt | `/tra-cuu` ✅ `/tra-cứu` ❌ | Bắt buộc |
| No trailing slash | `/search` ✅ `/search/` ❌ | Bắt buộc |
| Max 3 levels | `/blog/post/title` ✅ `/a/b/c/d` ❌ | Bắt buộc |

### URL Patterns
```
/                           → Homepage
/search                     → Tra cứu
/search?q={keyword}         → Kết quả tìm kiếm
/report                     → Báo cáo lừa đảo
/detail/{type}/{id}         → Chi tiết scam
/blog                       → Danh sách blog
/blog/{slug}                → Chi tiết bài viết
/faq                        → FAQ
/about                      → Về chúng tôi
```

---

## 2. 🏷️ META TAGS STANDARDS

### Title Tag Template
```
{Page Title} | {Category} | Báo Cáo Lừa Đảo
```

### Length Requirements
| Element | Min | Max | Optimal |
|---------|-----|-----|---------|
| Title | 30 | 60 | 50-55 chars |
| Description | 120 | 160 | 150-155 chars |
| Keywords | - | 10 | 5-7 từ |

### Title Formats theo Page Type

#### Homepage
```
Báo Cáo Lừa Đảo | Kiểm Tra & Báo Cáo Lừa Đảo Online Uy Tín #1
```

#### Search Results
```
Kết quả: {query} | Tra Cứu Lừa Đảo | Báo Cáo Lừa Đảo
```

#### Scam Detail
```
Cảnh báo: {scam_type} - {target} | Báo Cáo Lừa Đảo
```

#### Blog Post
```
{post_title} | Blog | Báo Cáo Lừa Đảo
```

#### Static Pages
```
{page_name} | Báo Cáo Lừa Đảo
```

### Description Template
```
{Action verb} {content summary}. {Unique value proposition}. {Call to action}.
```

Example:
```
Kiểm tra website, số điện thoại lừa đảo miễn phí. 
Cơ sở dữ liệu 50,000+ báo cáo từ cộng đồng. 
Bảo vệ bạn khỏi lừa đảo ngay hôm nay!
```

---

## 3. 📑 HEADING HIERARCHY

### Structure Pattern
```
H1 (1 per page)
├── H2 (2-6 per page)
│   ├── H3 (optional)
│   │   └── H4 (optional)
│   └── H3 (optional)
├── H2 (next section)
└── H2 (next section)
```

### Rules
- ✅ **1 H1 duy nhất** mỗi trang
- ✅ **H2 → H3 → H4**: Không skip level
- ✅ **Keywords** trong H1, H2 đầu tiên
- ❌ **Không dùng** heading cho styling
- ❌ **Không dùng** ALL CAPS trong heading

### H1 Patterns
| Page | H1 Format | Example |
|------|-----------|---------|
| Home | Brand + Value Prop | Báo Cáo Lừa Đảo - Cộng đồng báo cáo scam #1 VN |
| Search | Action + Context | Tra cứu thông tin lừa đảo |
| Report | Action | Báo cáo lừa đảo |
| Detail | Entity Type + Name | Cảnh báo: Website lừa đảo shopee-fake.com |
| Blog | Article Title | Cách nhận biết email lừa đảo ngân hàng |

---

## 4. 🖼️ IMAGE OPTIMIZATION

### Naming Convention
```
{page}-{context}-{sequence}.{ext}
```

Examples:
```
home-hero-banner.jpg
blog-scam-email-featured.jpg
about-team-photo-01.jpg
```

### Alt Text Format
```
{Action/Object} {Context} {Detail}
```

Examples:
```html
<!-- ❌ Bad -->
<img alt="image" src="...">
<img alt="screenshot" src="...">

<!-- ✅ Good -->
<img alt="Giao diện tra cứu số điện thoại lừa đảo trên điện thoại" src="...">
<img alt="Biểu đồ thống kê các loại lừa đảo phổ biến 2024" src="...">
```

### Technical Specs
| Spec | Standard |
|------|----------|
| Format | WebP (fallback JPG/PNG) |
| Max size | 200KB |
| Dimensions | Responsive srcset |
| Lazy loading | Below fold only |
| Compression | 80-85% quality |

---

## 5. 🔗 INTERNAL LINKING

### Link Density
- **Min**: 2-3 internal links per 500 words
- **Max**: 1 link per 100 words
- **Homepage**: 10-15 internal links

### Anchor Text Rules
```html
<!-- ✅ Good -->
<a href="/search">tra cứu thông tin lừa đảo</a>
<a href="/report">gửi báo cáo lừa đảo</a>

<!-- ❌ Bad -->
<a href="/search">click here</a>
<a href="/report">link</a>
<a href="/search">baocaoluadao.com/search</a>
```

### Link Placement Priority
1. **Navigation** (Header)
2. **Contextual links** (In-content)
3. **Related articles** (End of content)
4. **Footer links**

---

## 6. 📊 STRUCTURED DATA

### Required Schemas

#### 1. Website Schema (All pages)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Báo Cáo Lừa Đảo",
  "url": "https://baocaoluadao.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://baocaoluadao.com/search?q={search_term_string}"
  }
}
```

#### 2. Organization Schema (All pages)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Báo Cáo Lừa Đảo",
  "url": "https://baocaoluadao.com",
  "logo": "https://baocaoluadao.com/logo.png"
}
```

#### 3. BreadcrumbList (All pages except home)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home"},
    {"@type": "ListItem", "position": 2, "name": "Search"}
  ]
}
```

#### 4. FAQPage (FAQ page only)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Làm sao để báo cáo lừa đảo?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "..."
    }
  }]
}
```

---

## 7. ⚡ CORE WEB VITALS TARGETS

| Metric | Target | Priority |
|--------|--------|----------|
| LCP | < 2.5s | Critical |
| FID | < 100ms | Critical |
| CLS | < 0.1 | Critical |
| TTFB | < 600ms | High |
| FCP | < 1.8s | High |
| INP | < 200ms | Medium |

---

## 8. 📱 MOBILE SEO

### Responsive Breakpoints
```css
/* Mobile First */
Mobile: 0-640px
Tablet: 641-1024px
Desktop: 1025px+
```

### Mobile-Specific Rules
- ✅ Tap targets min 48x48px
- ✅ Font size min 16px
- ✅ Viewport meta tag
- ✅ No horizontal scroll
- ✅ Readable without zoom

---

## 9. 🌍 MULTILINGUAL (Future)

### Hreflang Pattern
```html
<link rel="alternate" hreflang="vi-VN" href="https://baocaoluadao.com/vi/page" />
<link rel="alternate" hreflang="en-US" href="https://baocaoluadao.com/en/page" />
<link rel="alternate" hreflang="x-default" href="https://baocaoluadao.com/page" />
```

---

## 10. 🚫 SEO ANTI-PATTERNS (Cấm)

### Content
- ❌ Duplicate content
- ❌ Hidden text/links
- ❌ Keyword stuffing
- ❌ Cloaking
- ❌ Doorway pages

### Technical
- ❌ Infinite scroll without proper pagination
- ❌ Broken internal links
- ❌ Orphan pages
- ❌ Noindex on important pages
- ❌ Robots.txt blocking CSS/JS

### Links
- ❌ Paid links without nofollow
- ❌ Link schemes
- ❌ Excessive reciprocal links
- ❌ Low-quality directory submissions

---

## 11. ✅ PRE-DEPLOYMENT CHECKLIST

### Code Review
- [ ] Title tags 50-60 chars
- [ ] Meta descriptions 150-160 chars
- [ ] 1 H1 per page
- [ ] Heading hierarchy correct
- [ ] Images have alt text
- [ ] Internal links working
- [ ] Canonical URLs set
- [ ] Structured data valid

### Technical
- [ ] Page load < 3s
- [ ] Mobile responsive
- [ ] HTTPS working
- [ ] Sitemap generated
- [ ] Robots.txt correct
- [ ] No 404 errors
- [ ] No console errors

### Tools Validation
- [ ] Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] PageSpeed Insights: https://pagespeed.web.dev/
- [ ] Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- [ ] Schema Validator: https://validator.schema.org/

---

## 12. 📈 SEO KPIs

### Monthly Targets
| Metric | Target |
|--------|--------|
| Organic Traffic | +10% MoM |
| Click-Through Rate | > 3% |
| Average Position | < 10 |
| Indexed Pages | 100% |
| Core Web Vitals | All green |

### Tools
- Google Search Console
- Google Analytics 4
- Ahrefs/SEMrush (optional)
- PageSpeed Insights API

---

## 13. 🔄 MAINTENANCE SCHEDULE

### Daily (Auto)
- Health check API
- 404 monitoring
- Core Web Vitals tracking

### Weekly (Manual)
- Review Search Console errors
- Check ranking changes
- Content freshness check

### Monthly (Manual)
- Full SEO audit
- Competitor analysis
- Content gap analysis
- Backlink profile review

### Quarterly (Manual)
- Strategy review
- Keyword research update
- Technical SEO deep dive

---

## 14. 🛠️ IMPLEMENTATION EXAMPLES

### New Page Template
```typescript
// src/app/new-page/page.tsx
import { Metadata } from 'next';
import { generateEvergreenMeta } from '@/lib/seo/evergreenSeo';

export const metadata: Metadata = generateEvergreenMeta({
  pageType: 'static',
  data: {
    title: 'Tên Trang Mới',
    description: 'Mô tả ngắn gọn về nội dung trang...'
  }
});

export default function NewPage() {
  return (
    <main>
      <h1>Tên Trang Mới - Đầy đủ từ khóa chính</h1>
      
      <section>
        <h2>Mục 1: Từ khóa phụ</h2>
        <p>Nội dung chất lượng...</p>
        <a href="/related-page">Link nội bộ anchor text mô tả</a>
      </section>
      
      <section>
        <h2>Mục 2: Từ khóa phụ khác</h2>
        <img 
          src="/images/new-page-featured.webp" 
          alt="Mô tả chi tiết hình ảnh cho SEO"
          loading="lazy"
        />
      </section>
    </main>
  );
}
```

---

## 15. 📞 SEO Support

### Questions?
- Review this document
- Check `SEO_CHECKLIST.md`
- Run `node scripts/seo-validator.js`
- Check `/admin/seo-audit`

### Updates
- Version: 1.0
- Last updated: 2026-03-01
- Review cycle: Quarterly
