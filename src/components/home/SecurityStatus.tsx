'use client';

import { KeyRound, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import SectionCard from '@/components/home/SectionCard';
import StatusBadge from '@/components/home/StatusBadge';

const detailItems = [
  { icon: ShieldCheck, label: 'Xác minh 2 bước', description: 'Đang hoạt động', badge: 'Đang bật' },
  { icon: KeyRound, label: 'Mật khẩu', description: 'Đã cập nhật gần đây', badge: 'Đã cập nhật' },
  { icon: Mail, label: 'Email khôi phục', description: 'support@scamguard.vn', badge: 'Đã xác minh' },
  { icon: Smartphone, label: 'Thiết bị đăng nhập', description: '3 thiết bị đang hoạt động', badge: 'Đang giám sát' },
];

export default function SecurityStatus() {
  return (
    <SectionCard>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-sm">
          <ShieldCheck size={26} strokeWidth={2.4} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-[18px] font-semibold text-[#202124]">Trạng thái bảo vệ tài khoản</p>
          <p className="text-[13px] text-[#5f6368]">
            Tài khoản được giám sát 24/7 với các lớp bảo mật hiện đại.
          </p>
        </div>
        <StatusBadge label="AN TOÀN" color="#1e8e3e" background="rgba(30,142,62,0.12)" />
      </div>

      <div className="mt-4 divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
        {detailItems.map((item) => {
          const BadgeColor = item.badge === 'Đang bật' || item.badge === 'Đã xác minh' ? '#1e8e3e' : '#1a73e8';
          const Bg =
            item.badge === 'Đang bật' || item.badge === 'Đã xác minh'
              ? 'rgba(30,142,62,0.12)'
              : 'rgba(26,115,232,0.12)';

          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex h-16 cursor-pointer items-center justify-between px-4 transition hover:bg-[#f8f9fa]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                  <Icon size={18} strokeWidth={2.1} />
                </div>
                <div>
                  <p className="text-[15px] font-[500] text-[#202124]">{item.label}</p>
                  <p className="text-[12px] text-[#5f6368]">{item.description}</p>
                </div>
              </div>
              <StatusBadge label={item.badge} color={BadgeColor} background={Bg} />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
