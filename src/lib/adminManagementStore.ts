export type AdminUserRole = 'super_admin' | 'admin' | 'moderator' | 'user';
export type AdminUserStatus = 'active' | 'banned' | 'suspended';
export type AdminScamType = 'website' | 'phone' | 'email' | 'bank';
export type AdminScamRiskLevel = 'low' | 'medium' | 'high';
export type AdminScamStatus = 'active' | 'investigating' | 'blocked';
export type AdminActivityStatus = 'success' | 'failed' | 'warning';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  reputationScore: number;
  reportCount: number;
  verifiedReportCount: number;
  joinedAt: string;
  lastActiveAt: string;
  updatedAt: string;
}

export interface AdminScamRecord {
  id: string;
  type: AdminScamType;
  value: string;
  description: string;
  reportCount: number;
  riskLevel: AdminScamRiskLevel;
  status: AdminScamStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActivityRecord {
  id: string;
  action: string;
  user: string;
  ip: string;
  target: string;
  status: AdminActivityStatus;
  timestamp: string;
}

interface ManagementStore {
  users: Map<string, AdminUserRecord>;
  scams: Map<string, AdminScamRecord>;
  activityLogs: AdminActivityRecord[];
}

// IN-MEMORY STORE LIMITATIONS:
// - Data is lost on server restart
// - Does not work correctly in serverless environments (Vercel, AWS Lambda)
// - Does not share data between multiple server instances
// - For production, use a database (PostgreSQL, MongoDB, Redis)

interface PagingInput {
  page?: number;
  pageSize?: number;
}

interface ListUserOptions extends PagingInput {
  q?: string;
  role?: 'all' | AdminUserRole;
  status?: 'all' | AdminUserStatus;
}

interface ListScamOptions extends PagingInput {
  q?: string;
  type?: 'all' | AdminScamType;
  status?: 'all' | AdminScamStatus;
  riskLevel?: 'all' | AdminScamRiskLevel;
}

interface ListActivityOptions extends PagingInput {
  q?: string;
  status?: 'all' | AdminActivityStatus;
}

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UserListResult extends PagedResult<AdminUserRecord> {
  summary: {
    total: number;
    active: number;
    banned: number;
    suspended: number;
  };
}

interface ScamListResult extends PagedResult<AdminScamRecord> {
  summary: {
    total: number;
    active: number;
    investigating: number;
    blocked: number;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardAdminManagementStore: ManagementStore | undefined;
}

const store: ManagementStore = globalThis.__scamGuardAdminManagementStore ?? {
  users: new Map<string, AdminUserRecord>(),
  scams: new Map<string, AdminScamRecord>(),
  activityLogs: [],
};

if (!globalThis.__scamGuardAdminManagementStore) {
  globalThis.__scamGuardAdminManagementStore = store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function parsePaging(input: PagingInput): { page: number; pageSize: number } {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize || 10)));
  return { page, pageSize };
}

function paginate<T>(items: T[], input: PagingInput): PagedResult<T> {
  const { page, pageSize } = parsePaging(input);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function seedUsers(): AdminUserRecord[] {
  const now = nowIso();
  return [
    {
      id: 'USR001',
      name: 'Nguyen Van A',
      email: 'nguyenvana@email.com',
      phone: '0912345678',
      role: 'super_admin',
      status: 'active',
      reputationScore: 95,
      reportCount: 156,
      verifiedReportCount: 142,
      joinedAt: '2023-01-15T00:00:00.000Z',
      lastActiveAt: '2026-02-23T02:40:00.000Z',
      updatedAt: now,
    },
    {
      id: 'USR002',
      name: 'Tran Thi B',
      email: 'tranthib@email.com',
      phone: '0912345679',
      role: 'admin',
      status: 'active',
      reputationScore: 88,
      reportCount: 89,
      verifiedReportCount: 78,
      joinedAt: '2023-03-20T00:00:00.000Z',
      lastActiveAt: '2026-02-22T17:20:00.000Z',
      updatedAt: now,
    },
    {
      id: 'USR003',
      name: 'Le Van C',
      email: 'levanc@email.com',
      phone: '0912345680',
      role: 'moderator',
      status: 'active',
      reputationScore: 75,
      reportCount: 45,
      verifiedReportCount: 38,
      joinedAt: '2023-05-10T00:00:00.000Z',
      lastActiveAt: '2026-02-22T08:00:00.000Z',
      updatedAt: now,
    },
    {
      id: 'USR004',
      name: 'Pham Thi D',
      email: 'phamthid@email.com',
      phone: '0912345681',
      role: 'user',
      status: 'active',
      reputationScore: 62,
      reportCount: 23,
      verifiedReportCount: 18,
      joinedAt: '2023-07-25T00:00:00.000Z',
      lastActiveAt: '2026-02-23T01:50:00.000Z',
      updatedAt: now,
    },
    {
      id: 'USR005',
      name: 'Hoang Van E',
      email: 'hoangvane@email.com',
      phone: '0912345682',
      role: 'user',
      status: 'banned',
      reputationScore: 15,
      reportCount: 12,
      verifiedReportCount: 2,
      joinedAt: '2023-08-05T00:00:00.000Z',
      lastActiveAt: '2025-12-15T07:30:00.000Z',
      updatedAt: now,
    },
    {
      id: 'USR006',
      name: 'Vu Thi F',
      email: 'vuthif@email.com',
      phone: '0912345683',
      role: 'user',
      status: 'suspended',
      reputationScore: 58,
      reportCount: 18,
      verifiedReportCount: 14,
      joinedAt: '2023-09-12T00:00:00.000Z',
      lastActiveAt: '2026-02-20T13:15:00.000Z',
      updatedAt: now,
    },
  ];
}

function seedScams(): AdminScamRecord[] {
  const now = nowIso();
  return [
    {
      id: 'SC001',
      type: 'website',
      value: 'shopee-com-vn.xyz',
      description: 'Website gia mao trang thanh toan Shopee',
      reportCount: 234,
      riskLevel: 'high',
      status: 'blocked',
      source: 'community',
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: now,
    },
    {
      id: 'SC002',
      type: 'phone',
      value: '0123456789',
      description: 'So dien thoai lua dao tuyen dung online',
      reportCount: 156,
      riskLevel: 'high',
      status: 'blocked',
      source: 'community',
      createdAt: '2026-02-11T10:00:00.000Z',
      updatedAt: now,
    },
    {
      id: 'SC003',
      type: 'email',
      value: 'support@vietcombank-fake.com',
      description: 'Email gia mao thong bao khoa tai khoan',
      reportCount: 89,
      riskLevel: 'medium',
      status: 'investigating',
      source: 'auto_scan',
      createdAt: '2026-02-12T07:20:00.000Z',
      updatedAt: now,
    },
    {
      id: 'SC004',
      type: 'bank',
      value: '1234567890 - MB',
      description: 'Tai khoan nhan tien lua dao chuyen khoan',
      reportCount: 67,
      riskLevel: 'high',
      status: 'blocked',
      source: 'law_enforcement',
      createdAt: '2026-02-13T14:00:00.000Z',
      updatedAt: now,
    },
    {
      id: 'SC005',
      type: 'website',
      value: 'mua-laptop-gia-re.com',
      description: 'Website ban hang khong giao hang',
      reportCount: 45,
      riskLevel: 'medium',
      status: 'active',
      source: 'community',
      createdAt: '2026-02-14T11:30:00.000Z',
      updatedAt: now,
    },
  ];
}

function ensureSeeded(): void {
  // Only load seed data in development mode
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (store.users.size === 0) {
    seedUsers().forEach((item) => store.users.set(item.id, item));
  }

  if (store.scams.size === 0) {
    seedScams().forEach((item) => store.scams.set(item.id, item));
  }

  if (store.activityLogs.length === 0) {
    store.activityLogs = [
      {
        id: 'LG0001',
        action: 'Dang nhap admin',
        user: 'admin@scamguard.vn',
        ip: '127.0.0.1',
        target: '/admin',
        status: 'success',
        timestamp: '2026-02-23T02:30:00.000Z',
      },
      {
        id: 'LG0002',
        action: 'Khoa nguoi dung',
        user: 'admin@scamguard.vn',
        ip: '127.0.0.1',
        target: 'USR005',
        status: 'warning',
        timestamp: '2026-02-22T08:20:00.000Z',
      },
      {
        id: 'LG0003',
        action: 'Cap nhat scam',
        user: 'admin@scamguard.vn',
        ip: '127.0.0.1',
        target: 'SC003',
        status: 'success',
        timestamp: '2026-02-22T07:00:00.000Z',
      },
    ];
  }
}

function nextSequentialId(prefix: string, existing: Iterable<string>): string {
  const used = new Set(existing);
  let index = used.size + 1;
  while (used.has(`${prefix}${String(index).padStart(3, '0')}`)) {
    index += 1;
  }
  return `${prefix}${String(index).padStart(3, '0')}`;
}

export function recordAdminActivity(payload: {
  action: string;
  user: string;
  target: string;
  status: AdminActivityStatus;
  ip?: string;
}): AdminActivityRecord {
  ensureSeeded();
  const log: AdminActivityRecord = {
    id: `LG${String(store.activityLogs.length + 1).padStart(4, '0')}`,
    action: payload.action.trim().slice(0, 120),
    user: payload.user.trim().slice(0, 120),
    target: payload.target.trim().slice(0, 180),
    status: payload.status,
    ip: (payload.ip || '127.0.0.1').slice(0, 45),
    timestamp: nowIso(),
  };
  store.activityLogs = [log, ...store.activityLogs].slice(0, 5000);
  return log;
}

export function listAdminUsers(options: ListUserOptions = {}): UserListResult {
  ensureSeeded();
  const q = normalizeText(options.q || '');
  const role = options.role || 'all';
  const status = options.status || 'all';

  const all = Array.from(store.users.values()).sort((a, b) => {
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
  });

  const summary = all.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    { total: 0, active: 0, banned: 0, suspended: 0 }
  );

  const filtered = all.filter((item) => {
    const matchRole = role === 'all' || item.role === role;
    const matchStatus = status === 'all' || item.status === status;
    const matchQuery =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q);
    return matchRole && matchStatus && matchQuery;
  });

  const paged = paginate(filtered, options);
  return {
    ...paged,
    summary,
  };
}

export function getAdminUserById(id: string): AdminUserRecord | null {
  ensureSeeded();
  return store.users.get(id) || null;
}

export function updateAdminUser(
  id: string,
  payload: {
    status?: AdminUserStatus;
    role?: AdminUserRole;
    actor?: string;
    ip?: string;
  }
): AdminUserRecord | null {
  ensureSeeded();
  const current = store.users.get(id);
  if (!current) return null;

  const actor = (payload.actor || 'admin@scamguard.vn').slice(0, 120);
  const next: AdminUserRecord = { ...current };
  let changed = false;

  if (payload.status && payload.status !== current.status) {
    next.status = payload.status;
    changed = true;
  }

  if (payload.role && payload.role !== current.role) {
    next.role = payload.role;
    changed = true;
  }

  if (!changed) return current;

  next.updatedAt = nowIso();
  store.users.set(id, next);

  recordAdminActivity({
    action: 'Cap nhat nguoi dung',
    user: actor,
    target: `${id}:${next.status}:${next.role}`,
    status: next.status === 'banned' ? 'warning' : 'success',
    ip: payload.ip,
  });

  return next;
}

export function listAdminScams(options: ListScamOptions = {}): ScamListResult {
  ensureSeeded();
  const q = normalizeText(options.q || '');
  const type = options.type || 'all';
  const status = options.status || 'all';
  const riskLevel = options.riskLevel || 'all';

  const all = Array.from(store.scams.values()).sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const summary = all.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    { total: 0, active: 0, investigating: 0, blocked: 0 }
  );

  const filtered = all.filter((item) => {
    const matchType = type === 'all' || item.type === type;
    const matchStatus = status === 'all' || item.status === status;
    const matchRisk = riskLevel === 'all' || item.riskLevel === riskLevel;
    const matchQuery =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.value.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchType && matchStatus && matchRisk && matchQuery;
  });

  const paged = paginate(filtered, options);
  return {
    ...paged,
    summary,
  };
}

export function getAdminScamById(id: string): AdminScamRecord | null {
  ensureSeeded();
  return store.scams.get(id) || null;
}

export function createAdminScam(payload: {
  type: AdminScamType;
  value: string;
  description: string;
  riskLevel?: AdminScamRiskLevel;
  status?: AdminScamStatus;
  source?: string;
  reportCount?: number;
  actor?: string;
  ip?: string;
}): AdminScamRecord {
  ensureSeeded();
  const id = nextSequentialId('SC', store.scams.keys());
  const now = nowIso();
  const created: AdminScamRecord = {
    id,
    type: payload.type,
    value: payload.value.trim().slice(0, 200),
    description: payload.description.trim().slice(0, 2000),
    reportCount: Math.max(0, Number(payload.reportCount || 0)),
    riskLevel: payload.riskLevel || 'medium',
    status: payload.status || 'investigating',
    source: (payload.source || 'admin').slice(0, 60),
    createdAt: now,
    updatedAt: now,
  };

  store.scams.set(id, created);

  recordAdminActivity({
    action: 'Them scam moi',
    user: payload.actor || 'admin@scamguard.vn',
    target: `${id}:${created.value}`,
    status: 'success',
    ip: payload.ip,
  });

  return created;
}

export function updateAdminScam(
  id: string,
  payload: {
    description?: string;
    riskLevel?: AdminScamRiskLevel;
    status?: AdminScamStatus;
    reportCount?: number;
    source?: string;
    actor?: string;
    ip?: string;
  }
): AdminScamRecord | null {
  ensureSeeded();
  const current = store.scams.get(id);
  if (!current) return null;

  const next: AdminScamRecord = { ...current };
  let changed = false;

  if (payload.description !== undefined) {
    const value = payload.description.trim().slice(0, 2000);
    if (value !== current.description) {
      next.description = value;
      changed = true;
    }
  }

  if (payload.riskLevel && payload.riskLevel !== current.riskLevel) {
    next.riskLevel = payload.riskLevel;
    changed = true;
  }

  if (payload.status && payload.status !== current.status) {
    next.status = payload.status;
    changed = true;
  }

  if (payload.reportCount !== undefined) {
    const count = Math.max(0, Number(payload.reportCount || 0));
    if (count !== current.reportCount) {
      next.reportCount = count;
      changed = true;
    }
  }

  if (payload.source !== undefined) {
    const source = payload.source.trim().slice(0, 60);
    if (source !== current.source) {
      next.source = source;
      changed = true;
    }
  }

  if (!changed) return current;

  next.updatedAt = nowIso();
  store.scams.set(id, next);

  recordAdminActivity({
    action: 'Cap nhat scam',
    user: payload.actor || 'admin@scamguard.vn',
    target: `${id}:${next.status}:${next.riskLevel}`,
    status: next.status === 'blocked' ? 'warning' : 'success',
    ip: payload.ip,
  });

  return next;
}

export function deleteAdminScam(
  id: string,
  payload: { actor?: string; ip?: string } = {}
): boolean {
  ensureSeeded();
  const existed = store.scams.get(id);
  if (!existed) return false;

  store.scams.delete(id);
  recordAdminActivity({
    action: 'Xoa scam',
    user: payload.actor || 'admin@scamguard.vn',
    target: `${id}:${existed.value}`,
    status: 'warning',
    ip: payload.ip,
  });
  return true;
}

export function listAdminActivityLogs(options: ListActivityOptions = {}): PagedResult<AdminActivityRecord> {
  ensureSeeded();
  const q = normalizeText(options.q || '');
  const status = options.status || 'all';

  const sorted = [...store.activityLogs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filtered = sorted.filter((item) => {
    const matchStatus = status === 'all' || item.status === status;
    const matchQuery =
      !q ||
      item.action.toLowerCase().includes(q) ||
      item.user.toLowerCase().includes(q) ||
      item.target.toLowerCase().includes(q) ||
      item.ip.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  return paginate(filtered, options);
}

export function getAdminManagementOverview() {
  const userData = listAdminUsers({ page: 1, pageSize: 1000 });
  const scamData = listAdminScams({ page: 1, pageSize: 1000 });
  const recentLogs = listAdminActivityLogs({ page: 1, pageSize: 10 });
  return {
    users: userData.summary,
    scams: scamData.summary,
    recentLogs: recentLogs.items,
  };
}
