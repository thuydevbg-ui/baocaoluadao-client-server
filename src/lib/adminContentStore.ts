export type AdminContentStatus = 'draft' | 'published' | 'archived';

export interface AdminContentItem {
  id: string;
  title: string;
  summary: string;
  status: AdminContentStatus;
  updatedAt: string;
  author: string;
}

interface AdminContentStore {
  items: Map<string, AdminContentItem>;
}

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardAdminContentStore: AdminContentStore | undefined;
}

const initialItems: AdminContentItem[] = [
  {
    id: 'post-001',
    title: 'Cảnh báo lừa đảo VinID giả mạo',
    summary: 'Trang web yêu cầu đăng nhập tài khoản VinID và chuyển mã OTP.',
    status: 'published',
    updatedAt: '2026-03-01T09:15:00.000Z',
    author: 'Admin team',
  },
  {
    id: 'post-002',
    title: 'Thủ đoạn gọi điện giả danh ngân hàng',
    summary: 'Kẻ lừa đảo yêu cầu chuyển tiền vào tài khoản trung gian trong vòng 15 phút.',
    status: 'draft',
    updatedAt: '2026-03-03T15:20:00.000Z',
    author: 'Moderation Ops',
  },
];

const store: AdminContentStore = globalThis.__scamGuardAdminContentStore ?? {
  items: new Map(initialItems.map((item) => [item.id, item])),
};

if (!globalThis.__scamGuardAdminContentStore) {
  globalThis.__scamGuardAdminContentStore = store;
}

export function listAdminContent() {
  return Array.from(store.items.values());
}

export function upsertContent(item: AdminContentItem) {
  store.items.set(item.id, item);
  return item;
}

export function createContent(data: Omit<AdminContentItem, 'id' | 'updatedAt'>) {
  const id = `post-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const payload: AdminContentItem = {
    id,
    updatedAt: now,
    ...data,
  };
  store.items.set(id, payload);
  return payload;
}
