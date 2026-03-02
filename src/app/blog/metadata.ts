import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Tin Tức & Cảnh Báo Lừa Đảo Mới Nhất | Báo Cáo Lừa Đảo',
  description: 'Cập nhật tin tức lừa đảo mới nhất 2025, cảnh báo scam, mẹo phòng chống và hướng dẫn bảo vệ tài sản. Chia sẻ kiến thức an toàn mạng hữu ích!',
  keywords: [
    'blog lừa đảo',
    'tin tức scam',
    'cảnh báo lừa đảo mới nhất',
    'mẹo phòng chống lừa đảo',
    'an toàn mạng',
    'bảo vệ tài sản',
    'lừa đảo trực tuyến',
    'scam 2025',
    'kiến thức an ninh mạng',
    'cảnh báo an toàn'
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Blog | Tin Tức & Cảnh Báo Lừa Đảo Mới Nhất',
    description: 'Cập nhật tin tức lừa đảo mới nhất 2025, cảnh báo scam, mẹo phòng chống và hướng dẫn bảo vệ tài sản.',
    url: '/blog',
    siteName: 'Báo Cáo Lừa Đảo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog tin tức lừa đảo - Báo Cáo Lừa Đảo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Tin Tức & Cảnh Báo Lừa Đảo Mới Nhất',
    description: 'Cập nhật tin tức lừa đảo mới nhất 2025, cảnh báo scam, mẹo phòng chống!',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
