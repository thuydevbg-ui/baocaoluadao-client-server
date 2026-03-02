import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Báo Cáo Lừa Đảo | Gửi Tin Báo Scam Ngay | Báo Cáo Lừa Đảo',
  description: 'Báo cáo lừa đảo nhanh chóng, bảo mật 100%. Gửi tin báo số điện thoại, tài khoản ngân hàng, website lừa đảo. Góp phần bảo vệ cộng đồng khỏi scam trực tuyến!',
  keywords: [
    'báo cáo lừa đảo',
    'tố cáo scam',
    'gửi tin báo lừa đảo',
    'báo cáo số điện thoại lừa đảo',
    'báo cáo tài khoản ngân hàng lừa đảo',
    'báo cáo website lừa đảo',
    'tố giác lừa đảo',
    'phản ánh lừa đảo',
    'báo cáo an toàn',
    'cộng đồng chống scam'
  ],
  alternates: {
    canonical: '/report',
  },
  openGraph: {
    title: 'Báo Cáo Lừa Đảo | Gửi Tin Báo Scam Ngay',
    description: 'Báo cáo lừa đảo nhanh chóng, bảo mật 100%. Góp phần bảo vệ cộng đồng khỏi scam trực tuyến. Mỗi báo cáo đều có giá trị!',
    url: '/report',
    siteName: 'Báo Cáo Lừa Đảo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Báo cáo lừa đảo - Báo Cáo Lừa Đảo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Báo Cáo Lừa Đảo | Gửi Tin Báo Scam Ngay',
    description: 'Báo cáo lừa đảo nhanh chóng, bảo mật 100%. Góp phần bảo vệ cộng đồng khỏi scam!',
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
