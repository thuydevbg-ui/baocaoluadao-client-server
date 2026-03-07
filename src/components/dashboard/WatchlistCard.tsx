import React, { useState } from 'react';
import { Button, Card, Badge, Input } from '@/components/ui';

export interface WatchItem {
  id: string;
  target: string;
  type: string;
  createdAt: string;
}

interface Props {
  items: WatchItem[];
  onAdd?: (target: string, type: string) => void;
  onRemove?: (id: string) => void;
}

export function WatchlistCard({ items, onAdd, onRemove }: Props) {
  const [target, setTarget] = useState('');
  const [type, setType] = useState('website');

  const submit = () => {
    if (!target.trim()) return;
    onAdd?.(target.trim(), type);
    setTarget('');
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Watchlist</p>
          <h2 className="text-lg font-semibold text-text-main">Theo dõi cảnh báo</h2>
        </div>
        <Badge variant="primary">{items.length} mục</Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1.4fr_auto_auto]">
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Nhập domain / số điện thoại / tài khoản ngân hàng"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-text-main"
        >
          {['website', 'phone', 'bank', 'email', 'social'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Button onClick={submit}>Thêm</Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-text-muted">
            Chưa có mục theo dõi nào.
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 bg-bg-cardHover/50">
            <div>
              <p className="text-sm font-semibold text-text-main">{item.target}</p>
              <p className="text-xs text-text-muted">{item.type} • {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onRemove?.(item.id)}>Gỡ</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

