'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Phone,
  RefreshCcw,
  Search,
  Shield,
  Star,
  Unlock,
  UserCog,
  X,
} from 'lucide-react';
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
        throw new Error(data.error || 'Không thể tải dữ liệu người dùng');
      }

      setUsers(data.items);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
      setTotalUsers(data.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi tải dữ liệu người dùng';
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
          throw new Error(data.error || 'Không thể cập nhật người dùng');
        }

        if (selectedUser?.id === id) {
          setSelectedUser(data.item);
        }

        showToast('success', successMessage);
        await fetchUsers();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Cập nhật người dùng thất bại';
        showToast('error', message);
      } finally {
        setActionUserId(null);
      }
    },
    [fetchUsers, selectedUser?.id, showToast]
  );

  const stats = useMemo(
    () => [
      { label: 'Tổng người dùng', value: summary.total, tone: 'text-blue-400' },
      { label: 'Đang hoạt động', value: summary.active, tone: 'text-green-400' },
      { label: 'Bị khóa', value: summary.banned, tone: 'text-red-400' },
      { label: 'Tạm ngưng', value: summary.suspended, tone: 'text-yellow-400' },
    ],
    [summary]
  );

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, { label: string; className: string }> = {
      super_admin: { label: 'Super Admin', className: 'bg-purple-500/20 text-purple-300' },
      admin: { label: 'Admin', className: 'bg-red-500/20 text-red-300' },
      moderator: { label: 'Moderator', className: 'bg-blue-500/20 text-blue-300' },
      user: { label: 'Người dùng', className: 'bg-gray-500/20 text-gray-300' },
    };
    const item = map[role];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.className}`}>{item.label}</span>;
  };

  const getStatusBadge = (status: UserStatus) => {
    const map: Record<UserStatus, { label: string; className: string }> = {
      active: { label: 'Hoạt động', className: 'bg-green-500/20 text-green-300' },
      banned: { label: 'Bị khóa', className: 'bg-red-500/20 text-red-300' },
      suspended: { label: 'Tạm ngưng', className: 'bg-yellow-500/20 text-yellow-300' },
    };
    const item = map[status];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.className}`}>{item.label}</span>;
  };

  const reputationColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const rangeStart = users.length === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const rangeEnd = users.length === 0 ? 0 : rangeStart + users.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản lý người dùng</h2>
          <p className="text-gray-400 mt-1">Điều phối quyền và trạng thái tài khoản</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
        >
          <RefreshCcw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
          >
            {roleOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-400">ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Người dùng</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Vai trò</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Trạng thái</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Uy tín</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Báo cáo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Ngày tham gia</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Hoạt động gần nhất</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400">
                    Không có người dùng phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isPending = actionUserId === user.id;
                  return (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="p-4 text-sm font-semibold text-blue-300">{user.id}</td>
                      <td className="p-4">
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </td>
                      <td className="p-4">{getRoleBadge(user.role)}</td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 font-semibold ${reputationColor(user.reputationScore)}`}>
                          <Star className="w-4 h-4" />
                          {user.reputationScore}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-white">
                        {user.reportCount} <span className="text-gray-500">(</span>
                        <span className="text-green-400">{user.verifiedReportCount}</span>
                        <span className="text-gray-500">)</span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{formatDate(user.joinedAt)}</td>
                      <td className="p-4 text-sm text-gray-400">{formatLastActive(user.lastActiveAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {user.status === 'active' ? (
                            <button
                              onClick={() => updateUser(user.id, { status: 'banned' }, 'Đã khóa tài khoản người dùng')}
                              disabled={isPending}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-50"
                              title="Khóa tài khoản"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUser(user.id, { status: 'active' }, 'Đã mở khóa tài khoản')}
                              disabled={isPending}
                              className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg disabled:opacity-50"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-800">
          <span className="text-sm text-gray-500">
            Hiển thị {rangeStart}-{rangeEnd} / {totalUsers}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              Trang {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 text-gray-500 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-semibold text-white">Chi tiết người dùng</h3>
                  <p className="text-sm text-gray-400">ID: {selectedUser.id}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-semibold">
                    {selectedUser.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedUser.name}</p>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                    <p className="text-white flex items-center gap-2"><Phone className="w-4 h-4" />{selectedUser.phone}</p>
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Ngày tham gia</p>
                    <p className="text-white flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(selectedUser.joinedAt)}</p>
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Vai trò hiện tại</p>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Điểm uy tín</p>
                    <p className={`font-semibold ${reputationColor(selectedUser.reputationScore)}`}>{selectedUser.reputationScore}/100</p>
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Báo cáo đã gửi</p>
                    <p className="text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      {selectedUser.reportCount} (đã xác minh {selectedUser.verifiedReportCount})
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    Cập nhật vai trò
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                    >
                      {roleOptions
                        .filter((item): item is { value: UserRole; label: string } => item.value !== 'all')
                        .map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => updateUser(selectedUser.id, { role: selectedRole }, 'Đã cập nhật vai trò người dùng')}
                      disabled={actionUserId === selectedUser.id || selectedRole === selectedUser.role}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl"
                    >
                      Lưu vai trò
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  Cập nhật gần nhất: {formatDate(selectedUser.updatedAt)}
                </div>
                <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl">
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
