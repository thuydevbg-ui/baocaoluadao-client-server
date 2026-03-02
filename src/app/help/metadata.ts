import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trợ Giúp | Hướng Dẫn & Hỗ Trợ Ngườii Dùng | Báo Cáo Lừa Đảo',
  description: 'Trung tâm trợ giúp chi tiết về cách sử dụng Báo Cáo Lừa Đảo. Hướng dẫn tra cứu, báo cáo scam, bảo mật tài khoản. Liên hệ hỗ trợ 24/7!',
  keywords: [
    'trợ giúp',
    'hướng dẫn sử dụng',
    'hỗ trợ ngườii dùng',
    'help center',
    'cách tra cứu lừa đảo',
    'cách báo cáo scam',
    'liên hệ hỗ trợ',
    'tài liệu hướng dẫn',
    'video hướng dẫn',
    'bảo mật tài khoản'
  ],
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Trợ Giúp | Hướng Dẫn & Hỗ Trợ Ngườii Dùng',
    description: 'Trung tâm trợ giúp chi tiết về cách sử dụng Báo Cáo Lừa Đảo. Hướng dẫn tra cứu, báo cáo scam, bảo mật tài khoản.',
    url: '/help',
    siteName: 'Báo Cáo Lừa Đảo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Trợ giúp - Báo Cáo Lừa Đảo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trợ Giúp | Hướng Dẫn & Hỗ Trợ Ngườii Dùng',
    description: 'Trung tâm trợ giúp chi tiết về cách sử dụng Báo Cáo Lừa Đảo. Liên hệ hỗ trợ 24/7!',
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
