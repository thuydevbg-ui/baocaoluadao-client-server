import React from 'react';
import { Card, Badge, Button } from '@/components/ui';

export interface NotificationPrefs {
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklySummary: boolean;
}

interface Props {
  prefs: NotificationPrefs;
  onChange: (prefs: NotificationPrefs) => void;
}

export function NotificationSettings({ prefs, onChange }: Props) {
  const toggle = (key: keyof NotificationPrefs) => {
    onChange({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Thông báo</p>
          <h2 className="text-lg font-semibold text-text-main">Cài đặt thông báo</h2>
        </div>
        <Badge variant="primary">Realtime</Badge>
      </div>

      <div className="space-y-3">
        {[
          { key: 'emailAlerts', label: 'Email alerts', desc: 'Nhận cảnh báo qua email' },
          { key: 'pushAlerts', label: 'Push notifications', desc: 'Bật thông báo trình duyệt' },
          { key: 'weeklySummary', label: 'Weekly summary', desc: 'Tổng hợp báo cáo hàng tuần' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 bg-bg-cardHover/50">
            <div>
              <p className="text-sm font-semibold text-text-main">{item.label}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
            <Button
              size="sm"
              variant={prefs[item.key as keyof NotificationPrefs] ? 'secondary' : 'ghost'}
              onClick={() => toggle(item.key as keyof NotificationPrefs)}
            >
              {prefs[item.key as keyof NotificationPrefs] ? 'Đang bật' : 'Bật lên'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

