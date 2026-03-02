import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Câu Hỏi Thường Gặp | Hướng Dẫn Sử Dụng | Báo Cáo Lừa Đảo',
  description: 'Giải đáp mọi thắc mắc về tra cứu và báo cáo lừa đảo. Hướng dẫn sử dụng, chính sách bảo mật, cách kiểm tra scam. Tìm câu trả lờii ngay!',
  keywords: [
    'câu hỏi thường gặp',
    'FAQ',
    'hướng dẫn sử dụng',
    'cách tra cứu lừa đảo',
    'cách báo cáo lừa đảo',
    'chính sách bảo mật',
    'hỗ trợ ngườii dùng',
    'giải đáp thắc mắc',
    'help center',
    'trung tâm trợ giúp'
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Câu Hỏi Thường Gặp | Hướng Dẫn Sử Dụng',
    description: 'Giải đáp mọi thắc mắc về tra cứu và báo cáo lừa đảo. Hướng dẫn chi tiết, chính sách bảo mật minh bạch.',
    url: '/faq',
    siteName: 'Báo Cáo Lừa Đảo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Câu hỏi thường gặp - Báo Cáo Lừa Đảo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Câu Hỏi Thường Gặp | Hướng Dẫn Sử Dụng',
    description: 'Giải đáp mọi thắc mắc về tra cứu và báo cáo lừa đảo. Tìm câu trả lờii ngay!',
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
