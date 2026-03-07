'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import SectionCard from '@/components/home/SectionCard';
import SearchTabs from '@/components/home/SearchTabs';

const tabs = ['Số điện thoại', 'Website', 'Ngân hàng', 'Email', 'Telegram', 'Facebook'];

export default function ScamSearchCard() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <SectionCard title="Kiểm tra lừa đảo" description="Tìm kiếm nhanh dấu hiệu lừa đảo qua nhiều kênh.">
      <div className="space-y-4">
        <SearchTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6368]" />
            <input
              type="text"
              className="w-full rounded-2xl border border-[#dadce0] bg-white px-12 py-3.5 text-[14px] text-[#202124] shadow-sm focus:border-[#1a73e8] focus:outline-none"
              placeholder="Nhập số điện thoại, website, email hoặc tài khoản ngân hàng"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-[#1a73e8] px-6 py-3 text-[14px] font-[600] text-white transition hover:bg-[#1664c1] md:w-auto"
          >
            Tìm kiếm ngay
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
