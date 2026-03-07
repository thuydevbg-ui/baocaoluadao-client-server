'use client';

import { KeyRound, Mail, Shield, Smartphone, SmartphoneNfc } from 'lucide-react';
import SectionCard from '@/components/home/SectionCard';
import StatusBadge from '@/components/home/StatusBadge';

const settings = [
  {
    icon: Shield,
    title: 'Xác minh 2 bước',
    description: 'Đã bật từ 6 tháng 6, 2021',
    badge: { label: 'Đang bật', color: '#1e8e3e', background: 'rgba(30, 142, 62, 0.12)' },
  },
  {
    icon: KeyRound,
    title: 'Mật khẩu',
    description: 'Thay đổi lần cuối: 26 tháng 12, 2023',
    badge: { label: 'Đã cập nhật', color: '#1a73e8', background: 'rgba(26, 115, 232, 0.12)' },
  },
  {
    icon: Mail,
    title: 'Email khôi phục',
    description: 'support@scamguard.vn',
    badge: { label: 'Đã xác minh', color: '#1e8e3e', background: 'rgba(30, 142, 62, 0.12)' },
  },
  {
    icon: Smartphone,
    title: 'Số điện thoại khôi phục',
    description: '+84 345 168 147',
    badge: { label: 'Đã xác minh', color: '#1e8e3e', background: 'rgba(30, 142, 62, 0.12)' },
  },
  {
    icon: SmartphoneNfc,
    title: 'Security prompt',
    description: 'Thông báo đăng nhập mới',
    badge: { label: 'Đang hoạt động', color: '#1a73e8', background: 'rgba(26, 115, 232, 0.12)' },
  },
];

export default function SecuritySettingsList() {
  return (
    <SectionCard
      title="Các cài đặt bảo mật"
      description="Kiểm tra toàn bộ cấu hình tương tự Google Security."
    >
      <div className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <div key={setting.title} className="flex h-16 cursor-pointer items-center justify-between px-3 transition hover:bg-[#f8f9fa]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                  <Icon size={18} strokeWidth={2.1} />
                </div>
                <div>
                  <p className="text-[15px] font-[500] text-[#202124]">{setting.title}</p>
                  <p className="text-[12px] text-[#5f6368]">{setting.description}</p>
                </div>
              </div>
              <StatusBadge
                label={setting.badge.label}
                color={setting.badge.color}
                background={setting.badge.background}
              />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
