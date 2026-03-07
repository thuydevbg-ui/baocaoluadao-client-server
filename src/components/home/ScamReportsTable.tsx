'use client';

import ReportTable, { ReportRow } from '@/components/home/ReportTable';
import SectionCard from '@/components/home/SectionCard';

const reports: ReportRow[] = [
  {
    id: 'scam-alert.vn',
    target: 'scam-alert.vn',
    category: 'Website lừa đảo',
    reports: '84 báo cáo',
    views: '12k lượt xem',
    likes: '430 lượt thích',
    comments: '82 bình luận',
    date: '04/03/2026',
    status: 'investigating',
  },
  {
    id: '+84985111222',
    target: '+84985111222',
    category: 'Giả mạo ngân hàng',
    reports: '47 báo cáo',
    views: '8k lượt xem',
    likes: '210 lượt thích',
    comments: '40 bình luận',
    date: '03/03/2026',
    status: 'safe',
  },
  {
    id: 'bank-transfers.net',
    target: 'bank-transfers.net',
    category: 'Lừa chuyển khoản',
    reports: '62 báo cáo',
    views: '9k lượt xem',
    likes: '330 lượt thích',
    comments: '55 bình luận',
    date: '02/03/2026',
    status: 'warning',
  },
  {
    id: 'support@vib.vn',
    target: 'support@vib.vn',
    category: 'Giả danh hỗ trợ',
    reports: '19 báo cáo',
    views: '5k lượt xem',
    likes: '120 lượt thích',
    comments: '20 bình luận',
    date: '28/02/2026',
    status: 'danger',
  },
];

export default function ScamReportsTable() {
  return (
    <SectionCard
      title="Báo cáo lừa đảo cộng đồng"
      description="Cộng đồng tương tác qua lượt thích, bình luận và lượt xem."
    >
      <ReportTable rows={reports} />
    </SectionCard>
  );
}
