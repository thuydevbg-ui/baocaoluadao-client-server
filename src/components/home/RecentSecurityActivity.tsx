'use client';

import { History, LogIn, MonitorSmartphone } from 'lucide-react';
import ActivityItem from '@/components/home/ActivityItem';
import SectionCard from '@/components/home/SectionCard';

const activities = [
  { icon: LogIn, title: 'Đăng nhập mới trên Windows', description: 'Hà Nội · 3 giờ trước' },
  { icon: MonitorSmartphone, title: 'Thiết bị Android mới', description: 'Pixel 8 · 2 ngày trước' },
  { icon: History, title: 'Đã xem hoạt động bảo mật', description: '01/03/2026 · 10:15' },
];

export default function RecentSecurityActivity() {
  return (
    <SectionCard
      title="Hoạt động bảo mật gần nhất"
      description="Kiểm tra lại mọi truy cập và cảnh báo trên tài khoản."
      actions={
        <button
          type="button"
          className="rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[12px] font-semibold text-[#1a73e8] transition hover:border-[#1a73e8]"
        >
          Xem chi tiết
        </button>
      }
    >
      <div className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
        {activities.map((activity) => (
          <ActivityItem key={activity.title} icon={activity.icon} title={activity.title} subtitle={activity.description} />
        ))}
      </div>
    </SectionCard>
  );
}
