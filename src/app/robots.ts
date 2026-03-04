import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/search',
          '/report',
          '/faq',
          '/blog',
          '/help',
          '/about',
          '/detail/',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/login',
          '/register',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/admin/', '/dashboard/', '/api/', '/login'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: ['/admin/', '/dashboard/', '/api/'],
      },
    ],
    sitemap: 'https://baocaoluadao.com/sitemap.xml',
    host: 'https://baocaoluadao.com',
  };
}
