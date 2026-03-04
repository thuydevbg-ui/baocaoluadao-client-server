import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | Sứ Mệnh & Tầm Nhìn | Báo Cáo Lừa Đảo',
  description: 'Tìm hiểu về sứ mệnh bảo vệ cộng đồng khỏi lừa đảo trực tuyến của Báo Cáo Lừa Đảo. Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam với 100,000+ ngườii dùng.',
  keywords: ['về chúng tôi', 'sứ mệnh', 'tầm nhìn', 'báo cáo lừa đảo', 'cộng đồng'],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Về Chúng Tôi | Sứ Mệnh & Tầm Nhìn',
    description: 'Cộng đồng báo cáo lừa đảo lớn nhất Việt Nam. Bảo vệ bạn và ngườii thân khỏi lừa đảo trực tuyến.',
    url: '/about',
    images: ['/og-image.jpg'],
  },
};
