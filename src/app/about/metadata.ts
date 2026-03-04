import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | Sứ Mệnh & Tầm Nhìn | Báo Cáo Lừa Đảo',
  description: 'Tìm hiểu về sứ mệnh bảo vệ cộng đồng khỏi lừa đảo trực tuyến của Báo Cáo Lừa Đảo. Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam với 100,000+ ngườii dùng.',
  keywords: [
    'về chúng tôi',
    'sứ mệnh',
    'tầm nhìn',
    'báo cáo lừa đảo',
    'cộng đồng',
    'chống scam',
    'bảo vệ ngườii dùng',
    'an toàn trực tuyến',
    'giới thiệu',
    'câu chuyện'
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Về Chúng Tôi | Sứ Mệnh & Tầm Nhìn',
    description: 'Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam. Bảo vệ bạn và ngườii thân khỏi lừa đảo trực tuyến.',
    url: '/about',
    siteName: 'Báo Cáo Lừa Đảo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Về chúng tôi - Báo Cáo Lừa Đảo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Về Chúng Tôi | Sứ Mệnh & Tầm Nhìn',
    description: 'Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam. Bảo vệ bạn khỏi lừa đảo!',
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
