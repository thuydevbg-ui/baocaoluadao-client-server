import React from 'react';
import { Clock } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Hoạt động</p>
          <h2 className="text-lg font-semibold text-text-main">Dòng thời gian</h2>
        </div>
        <Badge variant="primary">{items.length} mục</Badge>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-text-muted">
            Chưa có hoạt động nào. Hãy gửi báo cáo hoặc thêm mục theo dõi.
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 bg-bg-cardHover/50">
            <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-main truncate">{item.description}</p>
              <p className="text-xs text-text-muted">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <Badge variant="default">{item.type}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

