import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tra Cứu Lừa Đảo | Kiểm Tra Số Điện Thoại & Tài Khoản | Báo Cáo Lừa Đảo',
  description: 'Tra cứu miễn phí số điện thoại, tài khoản ngân hàng, website, ví crypto có bị báo cáo lừa đảo. Cơ sở dữ liệu 100,000+ báo cáo từ cộng đồng. Kiểm tra ngay để bảo vệ bạn!',
  keywords: [
    'tra cứu lừa đảo',
    'kiểm tra số điện thoại',
    'kiểm tra tài khoản ngân hàng',
    'quét website lừa đảo',
    'tìm kiếm scam',
    'báo cáo lừa đảo',
    'cảnh báo lừa đảo',
    'kiểm tra ví crypto',
    'tra cứu an toàn',
    'phòng chống lừa đảo'
  ],
  alternates: {
    canonical: '/search',
  },
  openGraph: {
    title: 'Tra Cứu Lừa Đảo | Kiểm Tra Số Điện Thoại & Tài Khoản',
    description: 'Tra cứu miễn phí số điện thoại, tài khoản ngân hàng, website có bị báo cáo lừa đảo. Bảo vệ bạn khỏi scam với cơ sở dữ liệu 100,000+ báo cáo.',
    url: '/search',
    siteName: 'Báo Cáo Lừa Đảo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tra cứu lừa đảo - Báo Cáo Lừa Đảo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tra Cứu Lừa Đảo | Kiểm Tra Số Điện Thoại & Tài Khoản',
    description: 'Tra cứu miễn phí số điện thoại, tài khoản ngân hàng, website có bị báo cáo lừa đảo. Bảo vệ bạn khỏi scam!',
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
