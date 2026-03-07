'use client';

import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActivityItemProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export default function ActivityItem({ icon: Icon, title, subtitle }: ActivityItemProps) {
  return (
    <div className="flex h-16 cursor-pointer items-center justify-between rounded-xl px-3 transition hover:bg-[#f8f9fa]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
          <Icon size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[14px] font-[500] text-[#202124]">{title}</p>
          <p className="text-[12px] text-[#5f6368]">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-[#5f6368]" />
    </div>
  );
}
