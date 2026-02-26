"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Calendar, ChevronLeft, ChevronRight, Eye, FileText, Loader2, Phone, RefreshCcw, Search, Shield, Star, Unlock, UserCog, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';
type UserStatus = 'active' | 'banned' | 'suspended';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  reputationScore: number;
  reportCount: number;
  verifiedReportCount: number;
  joinedAt: string;
  lastActiveAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  error?: string;
  items: UserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total: number;
    active: number;
    banned: number;
    suspended: number;
  };
}

interface UserDetailResponse {
  success: boolean;
  error?: string;
  item: UserItem;
}

const roleOptions: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'Tất cả vai trò' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'user', label: 'Người dùng' },
];

const statusOptions: { value: 'all' | UserStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'banned', label: 'Bị khóa' },
  { value: 'suspended', label: 'Tạm ngưng' },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';
  return date.toLocaleDateString('vi-VN');
}

function formatLastActive(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return formatDate(value);
}

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [summary, setSummary] = useState<UsersResponse['summary']>({
    total: 0,
    active: 0,
    banned: 0,
    suspended: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedUser) {
      setSelectedRole(selectedUser.role);
    }
  }, [selectedUser]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        role: roleFilter,
        status: statusFilter,
        page: String(currentPage),
        pageSize: '10',
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json()) as UsersResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải dữ liệu Người dùng');
      }

      setUsers(data.items);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
      setTotalUsers(data.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi tải dữ liệu Người dùng';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, searchQuery, showToast, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const updateUser = useCallback(
    async (id: string, payload: { status?: UserStatus; role?: UserRole }, successMessage: string) => {
      setActionUserId(id);
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as UserDetailResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Không thể cập nhật Người dùng');
        }

        if (selectedUser?.id === id) {
          setSelectedUser(data.item);
        }

        showToast('success', successMessage);
        await fetchUsers();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Cập nhật Người dùng thất bại';
        showToast('error', message);
      } finally {
        setActionUserId(null);
      }
    },
    [fetchUsers, selectedUser?.id, showToast]
  );

  const stats = useMemo(
    () => [
      { label: 'Tổng Người dùng', value: summary.total, tone: 'text-blue-400' },
      { label: 'Đang Hoạt động', value: summary.active, tone: 'text-green-400' },
      { label: 'Bị khóa', value: summary.banned, tone: 'text-red-400' },
      { label: 'Tạm ngưng', value: summary.suspended, tone: 'text-yellow-400' },
    ],
    [summary]
  );

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, { label: string; className: string }> = {
      super_admin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200' },
      admin: { label: 'Admin', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200' },
      moderator: { label: 'Moderator', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' },
      user: { label: 'Người dùng', className: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200' },
    };
    const item = map[role];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.className}`}>{item.label}</span>;
  };

  const getStatusBadge = (status: UserStatus) => {
    const map: Record<UserStatus, { label: string; className: string }> = {
      active: { label: 'Hoạt động', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' },
      banned: { label: 'Bị khóa', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200' },
      suspended: { label: 'Tạm ngưng', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' },
    };
    const item = map[status];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.className}`}>{item.label}</span>;
  };

  const reputationColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-300';
    if (score >= 50) return 'text-amber-600 dark:text-amber-300';
    return 'text-rose-600 dark:text-rose-300';
  };

  const rangeStart = users.length === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const rangeEnd = users.length === 0 ? 0 : rangeStart + users.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Quản lý Người dùng</h2>
          <p className="text-text-muted mt-1">Điều phối quyền và trạng thái tài khoản</p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-bg-border bg-bg-card hover:bg-bg-cardHover text-text-main"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-bg-border bg-bg-card p-4">
            <p className="text-sm text-text-muted">{item.label}</p>
            <p className={`text-2xl font-semibold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-bg-border bg-bg-card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email, Số điện thoại, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-bg-border bg-bg-card text-text-main"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-bg-border bg-bg-card text-text-main"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-bg-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-cardHover/60">
              <tr>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">ID</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Người dùng</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Vai trò</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Trạng thái</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Uy tín</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Báo cáo</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Ngày tham gia</th>
                <th className="text-right p-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="p-6 text-center text-text-muted">Đang tải dữ liệu...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-text-muted">Không có Người dùng phù hợp bộ lọc.</td></tr>
              )}
              {!loading && users.map((user) => (
                <tr key={user.id} className="border-t border-bg-border hover:bg-bg-cardHover/60">
                  <td className="p-4 font-mono text-text-secondary">{user.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-text-main">{user.name}</div>
                    <div className="text-text-secondary text-xs">{user.email}</div>
                    {user.phone && <div className="text-text-muted text-xs">{user.phone}</div>}
                  </td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4">{getStatusBadge(user.status)}</td>
                  <td className={`p-4 font-semibold ${reputationColor(user.reputationScore)}`}>{user.reputationScore}</td>
                  <td className="p-4 text-text-main font-semibold">{user.reportCount}</td>
                  <td className="p-4 text-text-secondary">{formatDate(user.joinedAt)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="w-4 h-4" /> Chi tiết
                    </button>
                    {user.status !== 'banned' ? (
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs"
                        disabled={actionUserId === user.id}
                        onClick={() => updateUser(user.id, { status: 'banned' }, 'Đã khóa tài khoản Người dùng')}
                      >
                        {actionUserId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        Khóa
                      </button>
                    ) : (
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs"
                        disabled={actionUserId === user.id}
                        onClick={() => updateUser(user.id, { status: 'active' }, 'Đã mở khóa tài khoản')}
                      >
                        {actionUserId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        Mở khóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-text-secondary">
          <div>Hiển thị {rangeStart}-{rangeEnd} / {totalUsers}</div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-bg-border text-text-main disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-bg-border text-text-main disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl bg-bg-card p-6 border border-bg-border shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-text-main">Thông tin Người dùng</h3>
                  <p className="text-text-secondary text-sm">Cập nhật vai trò và trạng thái</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-text-muted hover:text-text-main">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <div className="rounded-xl border border-bg-border p-3">
                  <p className="text-xs text-text-secondary mb-1">Email</p>
                  <p className="font-semibold text-text-main break-all">{selectedUser.email}</p>
                </div>
                <div className="rounded-xl border border-bg-border p-3">
                  <p className="text-xs text-text-secondary mb-1">Số điện thoại</p>
                  <p className="font-semibold text-text-main">{selectedUser.phone || '—'}</p>
                </div>
                <div className="rounded-xl border border-bg-border p-3">
                  <p className="text-xs text-text-secondary mb-1">Ngày tham gia</p>
                  <p className="font-semibold text-text-main">{formatDate(selectedUser.joinedAt)}</p>
                </div>
                <div className="rounded-xl border border-bg-border p-3">
                  <p className="text-xs text-text-secondary mb-1">Báo cáo đã gửi</p>
                  <p className="font-semibold text-text-main">{selectedUser.reportCount} (đã xác minh {selectedUser.verifiedReportCount})</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <div className="rounded-xl border border-bg-border p-3">
                  <p className="text-xs text-text-secondary mb-1">Vai trò</p>
                  <div className="flex gap-2 flex-wrap">
                    {roleOptions.filter(r => r.value !== 'all').map((opt) => (
                      <button
                        key={opt.value}
                        className={`px-3 py-2 rounded-lg border ${selectedRole === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-bg-border text-text-main'}`}
                        onClick={() => setSelectedRole(opt.value as UserRole)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white"
                    disabled={actionUserId === selectedUser.id}
                    onClick={() => updateUser(selectedUser.id, { role: selectedRole }, 'Đã cập nhật vai trò Người dùng')}
                  >
                    {actionUserId === selectedUser.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
                    Lưu vai trò
                  </button>
                </div>

                <div className="rounded-xl border border-bg-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-main">Khóa / Mở khóa</p>
                      <p className="text-xs text-text-secondary">Bật tắt trạng thái hoạt động</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm"
                        disabled={actionUserId === selectedUser.id || selectedUser.status === 'banned'}
                        onClick={() => updateUser(selectedUser.id, { status: 'banned' }, 'Đã khóa tài khoản Người dùng')}
                      >
                        Khóa
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                        disabled={actionUserId === selectedUser.id || selectedUser.status === 'active'}
                        onClick={() => updateUser(selectedUser.id, { status: 'active' }, 'Đã mở khóa tài khoản')}
                      >
                        Mở khóa
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-bg-border p-3 bg-bg-cardHover">
                    <p className="text-xs text-text-secondary mb-1">Hoạt động gần nhất</p>
                    <p className="text-sm font-semibold text-text-main">{formatLastActive(selectedUser.lastActiveAt || selectedUser.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-bg-border text-text-main hover:bg-bg-cardHover"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
