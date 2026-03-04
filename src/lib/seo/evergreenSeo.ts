/**
 * Evergreen SEO System
 * Tự động hóa 100%, không cần bảo trì, bền vững vĩnh viễn
 */

import { Metadata } from 'next';

// ============================================================================
// 1. AUTO-GENERATED META TAGS (Không cần viết tay)
// ============================================================================

interface AutoMetaConfig {
  pageType: 'home' | 'search' | 'report' | 'about' | 'blog' | 'scam-detail' | 'faq';
  data?: Record<string, any>;
}

export function generateEvergreenMeta(config: AutoMetaConfig): Metadata {
  const templates: Record<string, (data: any) => Metadata> = {
    home: () => ({
      title: 'Báo Cáo Lừa Đảo | Kiểm Tra & Báo Cáo Lừa Đảo Online Uy Tín #1',
      description: 'Kiểm tra website, số điện thoại, email có phải lừa đảo không. Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam với AI phát hiện scam chính xác 98%.',
    }),
    
    search: (data) => ({
      title: data?.query 
        ? `Kết quả: ${data.query} | Tra Cứu Lừa Đảo`
        : 'Tra Cứu Lừa Đảo | Kiểm Tra Website, SĐT, Email',
      description: data?.query
        ? `Kết quả tra cứu "${data.query}". ${data.resultCount || 0} kết quả tìm thấy trong cơ sở dữ liệu lừa đảo.`
        : 'Tra cứu thông tin lừa đảo miễn phí. Kiểm tra website, số điện thoại, tài khoản ngân hàng có bị báo cáo lừa đảo không.',
    }),
    
    'scam-detail': (data) => ({
      title: `Cảnh báo: ${data?.type || 'Lừa đảo'} - ${data?.target || 'Unknown'} | Báo Cáo Lừa Đảo`,
      description: `Đã có ${data?.reportCount || 0} báo cáo về ${data?.type}. Điểm rủi ro: ${data?.riskScore || 0}/100. ${data?.verified ? 'Đã xác minh bởi cộng đồng.' : ''}`,
    }),
    
    blog: (data) => ({
      title: data?.title 
        ? `${data.title} | Blog Báo Cáo Lừa Đảo`
        : 'Blog | Tin Tức & Hướng Dẫn Phòng Chống Lừa Đảo',
      description: data?.excerpt || 'Cập nhật tin tức về các hình thức lừa đảo mới nhất và cách phòng tránh.',
    }),
  };

  const generator = templates[config.pageType];
  const baseMeta = generator ? generator(config.data) : templates.home({});

  // Auto-add Open Graph & Twitter
  return {
    ...baseMeta,
    openGraph: {
      title: baseMeta.title as string,
      description: baseMeta.description as string,
      type: 'website',
      locale: 'vi_VN',
      siteName: 'Báo Cáo Lừa Đảo',
      images: ['/og-image.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: baseMeta.title as string,
      description: baseMeta.description as string,
      images: ['/og-image.svg'],
    },
  };
}

// ============================================================================
// 2. SELF-HEALING SEO (Tự sửa lỗi)
// ============================================================================

interface SEOHealthCheck {
  hasH1: boolean;
  h1Count: number;
  hasMetaDescription: boolean;
  descriptionLength: number;
  hasTitle: boolean;
  titleLength: number;
  hasCanonical: boolean;
  hasStructuredData: boolean;
}

export function selfHealSEO(html: string): string {
  let fixed = html;

  // Auto-fix: Thêm H1 nếu thiếu
  if (!html.includes('<h1')) {
    fixed = fixed.replace('<body>', '<body><h1 style="position:absolute;left:-9999px">Báo Cáo Lừa Đảo</h1>');
  }

  // Auto-fix: Thêm canonical nếu thiếu
  if (!html.includes('rel="canonical"')) {
    const url = extractUrlFromHtml(html);
    fixed = fixed.replace('</head>', `<link rel="canonical" href="${url}" /></head>`);
  }

  // Auto-fix: Thêm meta description nếu thiếu
  if (!html.includes('name="description"')) {
    const firstParagraph = extractFirstParagraph(html);
    const desc = firstParagraph.substring(0, 160);
    fixed = fixed.replace('</head>', `<meta name="description" content="${desc}" /></head>`);
  }

  return fixed;
}

// ============================================================================
// 3. EVERGREEN CONTENT STRATEGY
// ============================================================================

export const evergreenKeywords = {
  // Keywords chính - không bao giờ lỗi thờii
  primary: [
    'kiểm tra lừa đảo',
    'báo cáo lừa đảo', 
    'tra cứu scam',
    'kiểm tra số điện thoại lừa đảo',
    'kiểm tra website lừa đảo',
    'cảnh báo lừa đảo',
    'phòng chống lừa đảo',
  ],
  
  // Keywords theo mùa (auto-rotate)
  seasonal: {
    tet: ['lừa đảo tết', 'lừa đảo lì xì', 'lừa đảo vé máy bay tết'],
    blackFriday: ['lừa đảo black friday', 'lừa đảo giảm giá', 'lừa đảo mua sắm online'],
    valentine: ['lừa đảo valentine', 'lừa đảo tình yêu', 'lừa đảo quà tặng'],
    backToSchool: ['lừa đảo học phí', 'lừa đảo học bổng', 'lừa đảo du học'],
  },
  
  // Keywords trending (auto-update từ DB)
  trending: [] as string[], // Will be populated from DB
};

// ============================================================================
// 4. SELF-UPDATING SITEMAP
// ============================================================================

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export function generateSmartSitemap(entries: SitemapEntry[]): string {
  const now = new Date().toISOString();
  
  // Auto-calculate priority based on update frequency
  const smartEntries = entries.map(entry => {
    const daysSinceUpdate = Math.floor(
      (new Date(now).getTime() - new Date(entry.lastmod).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Giảm priority nếu không update lâu
    if (daysSinceUpdate > 365) {
      return { ...entry, priority: 0.1, changefreq: 'yearly' };
    }
    if (daysSinceUpdate > 30) {
      return { ...entry, priority: Math.max(0.3, entry.priority - 0.2) };
    }
    
    return entry;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${smartEntries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

// ============================================================================
// 5. PERMANENT REDIRECTS (Không bao giờ broken)
// ============================================================================

export const permanentRedirects: Record<string, string> = {
  // Redirects vĩnh viễn cho URLs cũ
  '/old-search': '/search',
  '/report-scam': '/report',
  '/check-phone': '/search?type=phone',
  '/check-website': '/search?type=website',
  
  // Redirects theo pattern
  '/scam/:id': '/detail/:id',
  '/p/:slug': '/blog/:slug',
};

// ============================================================================
// 6. LIFETIME SCHEMA TEMPLATES
// ============================================================================

export const lifetimeSchemas = {
  // Website Schema - không đổi
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Báo Cáo Lừa Đảo',
    url: 'https://baocaoluadao.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://baocaoluadao.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
  
  // Organization Schema - không đổi
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Báo Cáo Lừa Đảo',
    url: 'https://baocaoluadao.com',
    logo: 'https://baocaoluadao.com/logo.png',
    sameAs: [
      'https://facebook.com/baocaoluadao',
      'https://twitter.com/baocaoluadao',
    ],
  },
};

// ============================================================================
// 7. HELPER FUNCTIONS
// ============================================================================

function extractUrlFromHtml(html: string): string {
  // Extract from canonical hoặc return default
  const canonicalMatch = html.match(/rel="canonical"[^>]*href="([^"]*)"/);
  if (canonicalMatch) return canonicalMatch[1];
  
  const ogUrlMatch = html.match(/property="og:url"[^>]*content="([^"]*)"/);
  if (ogUrlMatch) return ogUrlMatch[1];
  
  return 'https://baocaoluadao.com';
}

function extractFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>([^<]+)<\/p>/);
  return match ? match[1].trim() : 'Báo Cáo Lừa Đảo - Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam';
}

// ============================================================================
// 8. LIFETIME SEO CONFIG
// ============================================================================

export const lifetimeSEOConfig = {
  // Domain - không bao giờ đổi
  domain: 'baocaoluadao.com',
  
  // Brand name - vĩnh viễn
  brand: 'Báo Cáo Lừa Đảo',
  
  // Core keywords - evergreen
  coreKeywords: [
    'kiểm tra lừa đảo',
    'báo cáo lừa đảo',
    'tra cứu scam',
  ],
  
  // Social profiles - permanent
  social: {
    facebook: 'https://facebook.com/baocaoluadao',
    twitter: 'https://twitter.com/baocaoluadao',
  },
  
  // Contact - stable
  contact: {
    email: 'contact@baocaoluadao.com',
  },
};

export default {
  generateEvergreenMeta,
  selfHealSEO,
  evergreenKeywords,
  generateSmartSitemap,
  permanentRedirects,
  lifetimeSchemas,
  lifetimeSEOConfig,
};
