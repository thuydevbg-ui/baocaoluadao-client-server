'use client';

import { CheckCircle2 } from 'lucide-react';
import SectionCard from '@/components/home/SectionCard';

const organizations = [
  { name: 'Bộ Công An', status: 'Verified' },
  { name: 'Vietcombank', status: 'Verified' },
  { name: 'Vietinbank', status: 'Verified' },
  { name: 'Tổng đài 113', status: 'Official' },
];

export default function TrustedOrganizations() {
  return (
    <SectionCard
      title="Tổ chức đã xác minh"
      description="Đối tác uy tín cùng cộng đồng điều tra lừa đảo."
    >
      <div className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
        {organizations.map((org) => (
          <div key={org.name} className="flex h-16 cursor-pointer items-center justify-between px-4 hover:bg-[#f8f9fa] transition">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a73e8] text-[14px] font-semibold text-white shadow-sm">
                {org.name
                  .split(' ')
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <p className="text-[15px] font-[500] text-[#202124]">{org.name}</p>
                <p className="text-[12px] text-[#5f6368]">
                  {org.status === 'Verified' ? 'Hỗ trợ xác minh mọi báo cáo.' : 'Tổ chức chính thức.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#1e8e3e]">
              <CheckCircle2 size={16} />
              <p className="text-[13px] font-[600]">{org.status}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
