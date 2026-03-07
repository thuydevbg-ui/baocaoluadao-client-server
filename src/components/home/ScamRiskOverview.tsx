'use client';

import { AlertTriangle, BarChart3, Eye } from 'lucide-react';
import SectionCard from '@/components/home/SectionCard';
import StatCard from '@/components/home/StatCard';
import StatusBadge from '@/components/home/StatusBadge';

const riskStats = [
  { icon: AlertTriangle, label: 'Alerts hôm nay', value: '58', hint: '+12 so với hôm qua' },
  { icon: Eye, label: 'Lượt xem', value: '34k', hint: '7.1k trong 24h' },
  { icon: BarChart3, label: 'Báo cáo cộng đồng', value: '1.2k', hint: 'Tăng 18% tuần này' },
];

const alerts = [
  { name: 'High risk domains', detail: 'scam-alert.vn · bank-alert-login.net', risk: 'HIGH' },
  { name: 'Medium risk domains', detail: 'transfer-safe.co · sms-codship.net', risk: 'MEDIUM' },
  { name: 'Low risk domains', detail: 'safe-tracking.app · otp-helper.vn', risk: 'LOW' },
];

const riskColorMap: Record<string, string> = {
  HIGH: '#d93025',
  MEDIUM: '#f9ab00',
  LOW: '#1e8e3e',
};

export default function ScamRiskOverview() {
  return (
    <SectionCard
      title="Tổng quan rủi ro lừa đảo"
      description="Theo dõi mức rủi ro và top alerts đang nóng."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {riskStats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} hint={stat.hint} />
        ))}
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-[#e5e7eb] bg-white">
        {alerts.map((alert) => (
          <div key={alert.name} className="flex h-16 cursor-pointer items-center justify-between px-4 hover:bg-[#f8f9fa] transition">
            <div>
              <p className="text-[14px] font-[600] text-[#202124]">{alert.name}</p>
              <p className="text-[12px] text-[#5f6368]">{alert.detail}</p>
            </div>
            <StatusBadge
              label={alert.risk}
              color={riskColorMap[alert.risk]}
              background={`${riskColorMap[alert.risk]}1f`}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
