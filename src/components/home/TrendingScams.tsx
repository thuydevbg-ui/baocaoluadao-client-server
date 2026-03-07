'use client';

import SectionCard from '@/components/home/SectionCard';
import StatusBadge from '@/components/home/StatusBadge';

const trending = [
  { label: 'Giả mạo ngân hàng', reports: '214 báo cáo', risk: 'HIGH' },
  { label: 'Link trúng thưởng Facebook', reports: '178 báo cáo', risk: 'HIGH' },
  { label: 'Lừa chuyển khoản online', reports: '134 báo cáo', risk: 'MEDIUM' },
  { label: 'SMS giả mạo bưu điện', reports: '95 báo cáo', risk: 'MEDIUM' },
];

const riskColorMap: Record<string, string> = {
  HIGH: '#d93025',
  MEDIUM: '#f9ab00',
};

export default function TrendingScams() {
  return (
    <SectionCard title="Xu hướng lừa đảo" description="Những tín hiệu scam đang lan tỏa nhanh nhất.">
      <div className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
        {trending.map((item) => (
          <div key={item.label} className="flex h-16 cursor-pointer items-center justify-between px-4 hover:bg-[#f8f9fa] transition">
            <div>
              <p className="text-[15px] font-[500] text-[#202124]">{item.label}</p>
              <p className="text-[12px] text-[#5f6368]">{item.reports}</p>
            </div>
            <StatusBadge
              label={item.risk}
              color={riskColorMap[item.risk] ?? '#5f6368'}
              background={`${riskColorMap[item.risk] ?? '#5f6368'}1f`}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
