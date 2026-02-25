import crypto from 'node:crypto';

export type AdminReportType = 'website' | 'phone' | 'email' | 'social' | 'sms';
export type AdminReportStatus = 'pending' | 'verified' | 'rejected';
export type AdminRiskLevel = 'low' | 'medium' | 'high';

export interface AdminReportHistoryItem {
  action: string;
  user: string;
  date: string;
  note?: string;
}

export interface AdminReportRecord {
  id: string;
  title: string;
  type: AdminReportType;
  status: AdminReportStatus;
  riskLevel: AdminRiskLevel;
  description: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  target: {
    type: AdminReportType;
    value: string;
    ip?: string;
    platform?: string;
  };
  adminNotes: string;
  history: AdminReportHistoryItem[];
}

interface AdminStore {
  reports: Map<string, AdminReportRecord>;
}

// IN-MEMORY STORE LIMITATIONS:
// - Data is lost on server restart
// - Does not work correctly in serverless environments (Vercel, AWS Lambda)
// - Does not share data between multiple server instances
// - For production, use a database (PostgreSQL, MongoDB, Redis)

interface ListReportOptions {
  q?: string;
  status?: 'all' | AdminReportStatus;
  type?: 'all' | AdminReportType;
  page?: number;
  pageSize?: number;
}

interface ListReportResult {
  items: AdminReportRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    pending: number;
    verified: number;
    rejected: number;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardAdminStore: AdminStore | undefined;
}

const store: AdminStore = globalThis.__scamGuardAdminStore ?? {
  reports: new Map<string, AdminReportRecord>(),
};

if (!globalThis.__scamGuardAdminStore) {
  globalThis.__scamGuardAdminStore = store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildSeedReports(): AdminReportRecord[] {
  const created = [
    '2026-02-18T08:30:00.000Z',
    '2026-02-18T11:10:00.000Z',
    '2026-02-19T05:45:00.000Z',
    '2026-02-19T13:20:00.000Z',
    '2026-02-20T02:15:00.000Z',
    '2026-02-20T09:40:00.000Z',
    '2026-02-21T03:05:00.000Z',
    '2026-02-21T15:50:00.000Z',
  ];

  return [
    {
      id: 'R001',
      title: 'Website giả mạo Shopee thanh toán',
      type: 'website',
      status: 'pending',
      riskLevel: 'high',
      description: 'Tên miền gần giống Shopee yêu cầu đăng nhập và xác minh OTP.',
      source: 'community',
      createdAt: created[0],
      updatedAt: created[0],
      reporter: {
        id: 'USR021',
        name: 'Nguyễn Văn An',
        email: 'nguyenvanan@example.com',
      },
      target: {
        type: 'website',
        value: 'https://shopee-com-vn.xyz',
        ip: '103.21.244.12',
      },
      adminNotes: '',
      history: [
        { action: 'Tạo báo cáo', user: 'Nguyễn Văn An', date: created[0] },
        { action: 'Tiếp nhận', user: 'Hệ thống', date: created[0] },
      ],
    },
    {
      id: 'R002',
      title: 'Số điện thoại mạo danh ngân hàng',
      type: 'phone',
      status: 'verified',
      riskLevel: 'high',
      description: 'Cuộc gọi yêu cầu chuyển tiền “an toàn” vào tài khoản trung gian.',
      source: 'community',
      createdAt: created[1],
      updatedAt: '2026-02-19T04:15:00.000Z',
      reporter: {
        id: 'USR022',
        name: 'Trần Thị Bình',
        email: 'tranthibinh@example.com',
      },
      target: {
        type: 'phone',
        value: '0987654321',
      },
      adminNotes: 'Đã xác minh với 6 báo cáo trùng mẫu kịch bản.',
      history: [
        { action: 'Tạo báo cáo', user: 'Trần Thị Bình', date: created[1] },
        { action: 'Xác minh', user: 'admin@scamguard.vn', date: '2026-02-19T04:15:00.000Z' },
      ],
    },
    {
      id: 'R003',
      title: 'Email giả mạo thông báo khóa thẻ',
      type: 'email',
      status: 'verified',
      riskLevel: 'medium',
      description: 'Email chứa link thu thập thông tin thẻ và mã OTP.',
      source: 'auto_scan',
      createdAt: created[2],
      updatedAt: '2026-02-19T11:00:00.000Z',
      reporter: {
        id: 'USR023',
        name: 'Lê Quốc Cường',
        email: 'lequoccuong@example.com',
      },
      target: {
        type: 'email',
        value: 'support@bank-security-alerts.net',
      },
      adminNotes: 'Phishing pattern trùng mẫu đã xác nhận.',
      history: [
        { action: 'Tạo báo cáo', user: 'Lê Quốc Cường', date: created[2] },
        { action: 'Xác minh', user: 'admin@scamguard.vn', date: '2026-02-19T11:00:00.000Z' },
      ],
    },
    {
      id: 'R004',
      title: 'Tài khoản mạng xã hội mạo danh người nổi tiếng',
      type: 'social',
      status: 'rejected',
      riskLevel: 'low',
      description: 'Nội dung chưa đủ bằng chứng, không có link hoặc thông tin định danh.',
      source: 'community',
      createdAt: created[3],
      updatedAt: '2026-02-19T18:12:00.000Z',
      reporter: {
        id: 'USR024',
        name: 'Phạm Thu Dung',
        email: 'phamthudung@example.com',
      },
      target: {
        type: 'social',
        value: 'facebook.com/profile.php?id=1000099xxxx',
        platform: 'facebook',
      },
      adminNotes: 'Thiếu dữ liệu đối chiếu, yêu cầu bổ sung bằng chứng.',
      history: [
        { action: 'Tạo báo cáo', user: 'Phạm Thu Dung', date: created[3] },
        { action: 'Từ chối', user: 'admin@scamguard.vn', date: '2026-02-19T18:12:00.000Z' },
      ],
    },
    {
      id: 'R005',
      title: 'SMS giả mạo bưu cục thu phí',
      type: 'sms',
      status: 'pending',
      riskLevel: 'high',
      description: 'Tin nhắn dẫn link yêu cầu nộp phí giao hàng.',
      source: 'community',
      createdAt: created[4],
      updatedAt: created[4],
      reporter: {
        id: 'USR025',
        name: 'Hoàng Văn Em',
        email: 'hoangvanem@example.com',
      },
      target: {
        type: 'sms',
        value: 'SMS Sender: VNPOST-SUPPORT',
      },
      adminNotes: '',
      history: [
        { action: 'Tạo báo cáo', user: 'Hoàng Văn Em', date: created[4] },
      ],
    },
    {
      id: 'R006',
      title: 'Website lừa đảo đầu tư lợi nhuận cao',
      type: 'website',
      status: 'verified',
      riskLevel: 'high',
      description: 'Hứa hẹn lợi nhuận cố định 4% mỗi ngày, yêu cầu nạp USDT.',
      source: 'community',
      createdAt: created[5],
      updatedAt: '2026-02-20T15:00:00.000Z',
      reporter: {
        id: 'USR026',
        name: 'Vũ Thu Hà',
        email: 'vuthuha@example.com',
      },
      target: {
        type: 'website',
        value: 'https://fast-profit-bot.net',
        ip: '172.67.22.189',
      },
      adminNotes: 'Đã đối chiếu với 14 báo cáo cùng mẫu, đánh dấu rủi ro cao.',
      history: [
        { action: 'Tạo báo cáo', user: 'Vũ Thu Hà', date: created[5] },
        { action: 'Xác minh', user: 'admin@scamguard.vn', date: '2026-02-20T15:00:00.000Z' },
      ],
    },
    {
      id: 'R007',
      title: 'Cuộc gọi giả danh công an yêu cầu chuyển tiền',
      type: 'phone',
      status: 'pending',
      riskLevel: 'high',
      description: 'Đe dọa liên quan vụ án, yêu cầu chuyển tiền để “xác minh”.',
      source: 'community',
      createdAt: created[6],
      updatedAt: created[6],
      reporter: {
        id: 'USR027',
        name: 'Đặng Quang Huy',
        email: 'dangquanghuy@example.com',
      },
      target: {
        type: 'phone',
        value: '0901234567',
      },
      adminNotes: '',
      history: [
        { action: 'Tạo báo cáo', user: 'Đặng Quang Huy', date: created[6] },
      ],
    },
    {
      id: 'R008',
      title: 'Email trúng thưởng yêu cầu đóng phí nhận quà',
      type: 'email',
      status: 'rejected',
      riskLevel: 'low',
      description: 'Không đủ nội dung gốc email để xác minh nguồn phát tán.',
      source: 'community',
      createdAt: created[7],
      updatedAt: '2026-02-22T03:00:00.000Z',
      reporter: {
        id: 'USR028',
        name: 'Bùi Thị Lan',
        email: 'buithilan@example.com',
      },
      target: {
        type: 'email',
        value: 'winner@reward-center-mail.org',
      },
      adminNotes: 'Yêu cầu bổ sung header email và nội dung gốc.',
      history: [
        { action: 'Tạo báo cáo', user: 'Bùi Thị Lan', date: created[7] },
        { action: 'Từ chối', user: 'admin@scamguard.vn', date: '2026-02-22T03:00:00.000Z' },
      ],
    },
  ];
}

function ensureSeeded(): void {
  // Only load seed data in development mode
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (store.reports.size > 0) return;
  buildSeedReports().forEach((report) => {
    store.reports.set(report.id, report);
  });
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function listAdminReports(options: ListReportOptions = {}): ListReportResult {
  ensureSeeded();

  const q = normalizeText(options.q || '');
  const status = options.status || 'all';
  const type = options.type || 'all';
  const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 10)));
  const page = Math.max(1, Number(options.page || 1));

  const all = Array.from(store.reports.values()).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const summary = all.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pending: 0, verified: 0, rejected: 0 }
  );

  const filtered = all.filter((item) => {
    const matchStatus = status === 'all' || item.status === status;
    const matchType = type === 'all' || item.type === type;
    const matchQuery =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.reporter.name.toLowerCase().includes(q) ||
      item.target.value.toLowerCase().includes(q);

    return matchStatus && matchType && matchQuery;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    summary,
  };
}

export function getAdminReportById(id: string): AdminReportRecord | null {
  ensureSeeded();
  return store.reports.get(id) || null;
}

export function updateAdminReport(
  id: string,
  payload: {
    status?: AdminReportStatus;
    adminNotes?: string;
    actor?: string;
  }
): AdminReportRecord | null {
  ensureSeeded();
  const current = store.reports.get(id);
  if (!current) return null;

  const actor = (payload.actor || 'admin@scamguard.vn').slice(0, 80);
  const updatedAt = nowIso();
  const next: AdminReportRecord = {
    ...current,
    updatedAt,
  };

  let hasChanged = false;

  if (payload.status && payload.status !== current.status) {
    next.status = payload.status;
    hasChanged = true;
    next.history = [
      {
        action: payload.status === 'verified' ? 'Xác minh' : 'Từ chối',
        user: actor,
        date: updatedAt,
      },
      ...next.history,
    ];
  }

  if (payload.adminNotes !== undefined) {
    const cleanNote = payload.adminNotes.trim().slice(0, 2000);
    if (cleanNote !== current.adminNotes) {
      next.adminNotes = cleanNote;
      hasChanged = true;
      next.history = [
        {
          action: 'Cập nhật ghi chú',
          user: actor,
          date: updatedAt,
          note: cleanNote.slice(0, 140),
        },
        ...next.history,
      ];
    }
  }

  if (!hasChanged) {
    return current;
  }

  store.reports.set(id, next);
  return next;
}

export function createAdminReport(payload: {
  title: string;
  type: AdminReportType;
  riskLevel?: AdminRiskLevel;
  description: string;
  reporterName: string;
  reporterEmail: string;
  targetValue: string;
  source?: string;
}): AdminReportRecord {
  ensureSeeded();
  const now = nowIso();
  const id = `R${String(store.reports.size + 1).padStart(3, '0')}`;

  const report: AdminReportRecord = {
    id,
    title: payload.title.trim().slice(0, 200),
    type: payload.type,
    status: 'pending',
    riskLevel: payload.riskLevel || 'medium',
    description: payload.description.trim().slice(0, 2000),
    source: (payload.source || 'manual').slice(0, 50),
    createdAt: now,
    updatedAt: now,
    reporter: {
      id: crypto.randomUUID().slice(0, 8).toUpperCase(),
      name: payload.reporterName.trim().slice(0, 80),
      email: payload.reporterEmail.trim().slice(0, 120),
    },
    target: {
      type: payload.type,
      value: payload.targetValue.trim().slice(0, 300),
    },
    adminNotes: '',
    history: [
      {
        action: 'Tạo báo cáo',
        user: payload.reporterName.trim().slice(0, 80) || 'Ẩn danh',
        date: now,
      },
    ],
  };

  store.reports.set(report.id, report);
  return report;
}

export function getAdminOverview() {
  const listed = listAdminReports({ page: 1, pageSize: 1000 });
  const byType = listed.items.reduce<Record<AdminReportType, number>>(
    (acc, item) => {
      acc[item.type] += 1;
      return acc;
    },
    {
      website: 0,
      phone: 0,
      email: 0,
      social: 0,
      sms: 0,
    }
  );

  return {
    reports: {
      total: listed.total,
      pending: listed.summary.pending,
      verified: listed.summary.verified,
      rejected: listed.summary.rejected,
    },
    byType,
    recent: listed.items.slice(0, 8),
  };
}

