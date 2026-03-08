'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export type AdminContentStatus = 'draft' | 'published' | 'archived';

export interface AdminContentItem {
  id: string;
  title: string;
  summary: string;
  status: AdminContentStatus;
  updatedAt: string;
  author: string;
}

const statusPalette: Record<AdminContentStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-warning/10 text-warning',
};

const statusOptions: AdminContentStatus[] = ['draft', 'published', 'archived'];

export function AdminContentManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    summary: '',
    status: 'draft' as AdminContentStatus,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', summary: '', status: 'draft' as AdminContentStatus });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được nội dung');
      setItems(data.items || []);
    } catch (err: any) {
      showToast('error', err?.message || 'Không tải nội dung admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async () => {
    if (!newContent.title.trim() || !newContent.summary.trim()) {
      showToast('warning', 'Tiêu đề và tóm tắt là bắt buộc');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tạo được nội dung');
      setItems((prev) => [data.item, ...prev]);
      setNewContent({ title: '', summary: '', status: 'draft' });
      showToast('success', 'Đã tạo nội dung mới');
    } catch (err: any) {
      showToast('error', err?.message || 'Không tạo được nội dung');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: AdminContentItem) => {
    setEditingId(item.id);
    setEditForm({ title: item.title, summary: item.summary, status: item.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (item: AdminContentItem) => {
    const payload: Partial<AdminContentItem> = {};
    if (editForm.title.trim() && editForm.title !== item.title) payload.title = editForm.title.trim();
    if (editForm.summary.trim() && editForm.summary !== item.summary) payload.summary = editForm.summary.trim();
    if (editForm.status !== item.status) payload.status = editForm.status;
    if (!Object.keys(payload).length) {
      showToast('warning', 'Không có thay đổi nào để lưu');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không cập nhật được nội dung');
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
      setEditingId(null);
      showToast('success', 'Đã cập nhật nội dung');
    } catch (err: any) {
      showToast('error', err?.message || 'Không cập nhật được nội dung');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCounts = useMemo(() => {
    const output: Record<AdminContentStatus, number> = { draft: 0, published: 0, archived: 0 };
    items.forEach((item) => {
      output[item.status] += 1;
    });
    return output;
  }, [items]);

  return (
    <Card className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Quản trị nội dung</p>
        <h2 className="text-lg font-semibold text-text-main">Bài viết trên trang chủ</h2>
        <p className="text-sm text-text-secondary">Tạo mới, chỉnh sửa trạng thái và xuất bản tức thì.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {statusOptions.map((status) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{status}</p>
            <p className="text-2xl font-bold text-text-main">{statusCounts[status]}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-text-main">Tạo bài mới</p>
          <Input
            label="Tiêu đề"
            value={newContent.title}
            onChange={(e) => setNewContent((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Tiêu đề nội dung"
          />
          <Input
            label="Tóm tắt"
            value={newContent.summary}
            onChange={(e) => setNewContent((prev) => ({ ...prev, summary: e.target.value }))}
            placeholder="Tóm tắt ngắn nội dung"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-secondary">Trạng thái</label>
            <select
              value={newContent.status}
              onChange={(e) => setNewContent((prev) => ({ ...prev, status: e.target.value as AdminContentStatus }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-text-main"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreate} isLoading={submitting}>
            Tạo bài mới
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-text-main">Danh sách nhanh</p>
          {items.length === 0 && <p className="text-sm text-text-muted">Chưa có nội dung.</p>}
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="space-y-3 border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-main">{item.title}</p>
                    <p className="text-xs text-text-muted">
                      Cập nhật {new Date(item.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusPalette[item.status])}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{item.summary}</p>
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <Input
                      label="Tiêu đề"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <Input
                      label="Tóm tắt"
                      value={editForm.summary}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-text-secondary">Trạng thái</label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, status: e.target.value as AdminContentStatus }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-text-main"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(item)} isLoading={submitting}>
                        Lưu
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Huỷ
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => startEdit(item)}>
                    Chỉnh sửa
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Card>
  );
}
