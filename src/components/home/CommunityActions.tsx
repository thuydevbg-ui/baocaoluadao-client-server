'use client';

import { Activity, BellRing, Bolt, CheckCircle2 } from 'lucide-react';
import SectionCard from '@/components/home/SectionCard';

const actions = ['Báo cáo lừa đảo', 'Thêm bằng chứng', 'Theo dõi cảnh báo', 'Đăng ký nhận thông báo'];
const feed = [
  { icon: BellRing, text: 'Cảnh báo mới từ bank-alert-login.net', meta: '2 phút trước' },
  { icon: Activity, text: 'Người dùng @minhvo đã thêm bằng chứng', meta: '14 phút trước' },
  { icon: CheckCircle2, text: 'scam-alert.vn chuyển trạng thái sang “Đang điều tra”', meta: '1 giờ trước' },
];

export default function CommunityActions() {
  return (
    <SectionCard title="Hành động cộng đồng" description="Tăng độ tin cậy của cảnh báo qua tương tác.">
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-[#dadce0] bg-white px-4 py-3 text-[13px] font-[600] text-[#202124] shadow-sm transition hover:border-[#1a73e8]"
          >
            <Bolt size={16} className="text-[#1a73e8]" />
            {action}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-[#e5e7eb] bg-white">
        {feed.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.text} className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-[#f8f9fa] transition">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-[500] text-[#202124]">{item.text}</p>
                  <p className="text-[11px] text-[#9aa0a6]">{item.meta}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
