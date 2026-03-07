'use client';

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}

export default function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1a73e8] shadow-sm">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[#202124]">{value}</p>
        <p className="text-[12px] text-[#5f6368]">{label}</p>
        {hint && <p className="text-[11px] text-[#9aa0a6]">{hint}</p>}
      </div>
    </div>
  );
}
