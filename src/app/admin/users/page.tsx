'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, UserRoundCheck, UserRoundMinus, UsersRound } from 'lucide-react';
import StatsCards, { type StatCardItem } from '@/components/admin/StatsCards';

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';
type UserStatus = 'active' | 'banned' | 'suspended';

type UserItem = {
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
};

type UsersResponse = {
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
};

const roleOptions: Array<{ value: 'all' | UserRole; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'user', label: 'User' },
];

const statusOptions: Array<{ value: 'all' | UserStatus; label: string }> = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'suspended', label: 'Suspended' },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN');
}

function roleBadge(role: UserRole) {
  const styles: Record<UserRole, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-sky-100 text-sky-700',
    moderator: 'bg-indigo-100 text-indigo-700',
    user: 'bg-slate-100 text-slate-700',
  };

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[role]}`}>{role}</span>;
}

function statusBadge(status: UserStatus) {
  const styles: Record<UserStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    banned: 'bg-rose-100 text-rose-700',
    suspended: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [summary, setSummary] = useState<UsersResponse['summary']>({
    total: 0,
    active: 0,
    banned: 0,
    suspended: 0,
  });
  const [searchValue, setSearchValue] = useState('');
  const [roleValue, setRoleValue] = useState<'all' | UserRole>('all');
  const [statusValue, setStatusValue] = useState<'all' | UserStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchValue, roleValue, statusValue]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: searchValue,
        role: roleValue,
        status: statusValue,
        page: String(page),
        pageSize: '12',
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const payload = (await response.json()) as UsersResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load users');
      }

      setUsers(payload.items || []);
      setSummary(payload.summary || { total: 0, active: 0, banned: 0, suspended: 0 });
      setTotalPages(payload.totalPages || 1);
      setTotalUsers(payload.total || 0);

      if (selectedUser) {
        const refreshed = (payload.items || []).find((item) => item.id === selectedUser.id) || null;
        setSelectedUser(refreshed);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
      setUsers([]);
      setTotalPages(1);
      setTotalUsers(0);
      if (selectedUser) setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  }, [page, roleValue, searchValue, selectedUser, statusValue]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (userId: string, payload: Partial<Pick<UserItem, 'status' | 'role'>>) => {
    if (actionUserId) return;

    setActionUserId(userId);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to update user');
      }

      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update user');
    } finally {
      setActionUserId(null);
    }
  };

  const statItems = useMemo<StatCardItem[]>(
    () => [
      {
        id: 'users-total',
        title: 'Total Users',
        value: summary.total,
        subtitle: 'All moderated accounts',
        icon: UsersRound,
        tone: 'sky',
      },
      {
        id: 'users-active',
        title: 'Active Users',
        value: summary.active,
        subtitle: 'Allowed to sign in and report',
        icon: UserRoundCheck,
        tone: 'emerald',
      },
      {
        id: 'users-banned',
        title: 'Banned Users',
        value: summary.banned,
        subtitle: 'Hard-blocked accounts',
        icon: UserRoundMinus,
        tone: 'rose',
      },
      {
        id: 'users-suspended',
        title: 'Suspended Users',
        value: summary.suspended,
        subtitle: 'Temporarily restricted',
        icon: ShieldCheck,
        tone: 'amber',
      },
    ],
    [summary]
  );

  const rangeStart = users.length === 0 ? 0 : (page - 1) * 12 + 1;
  const rangeEnd = users.length === 0 ? 0 : rangeStart + users.length - 1;

  return (
    <div className="space-y-5">
      <StatsCards items={statItems} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Users Directory</h2>
            <p className="text-xs text-slate-500">
              Showing {rangeStart}-{rangeEnd} of {totalUsers} users
            </p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by name, email, phone, or user ID..."
              className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300 focus:bg-white"
            />

            <select
              value={roleValue}
              onChange={(event) => setRoleValue(event.target.value as 'all' | UserRole)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
            >
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value as 'all' | UserStatus)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
            >
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <div className="mt-3 overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reputation</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reports</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                <th className="p-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No users found for this filter set.
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs text-slate-500">{user.id}</td>
                    <td className="p-3">
                      <p className="font-medium text-slate-900 break-words">{user.name}</p>
                      <p className="text-xs text-slate-500 break-words">{user.email}</p>
                      {user.phone && <p className="text-xs text-slate-400 break-words">{user.phone}</p>}
                    </td>
                    <td className="p-3">{roleBadge(user.role)}</td>
                    <td className="p-3">{statusBadge(user.status)}</td>
                    <td className="p-3 font-medium text-slate-700">{user.reputationScore}</td>
                    <td className="p-3 text-slate-700">{user.reportCount}</td>
                    <td className="p-3 text-slate-600">{formatDate(user.joinedAt)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Details
                        </button>
                        {user.status !== 'banned' ? (
                          <button
                            type="button"
                            disabled={actionUserId === user.id}
                            onClick={() => updateUser(user.id, { status: 'banned' })}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Ban
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionUserId === user.id}
                            onClick={() => updateUser(user.id, { status: 'active' })}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-600">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>

      {selectedUser && (
        <>
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 z-40 bg-slate-900/25"
            aria-label="Close user panel overlay"
          />
          <aside className="fixed right-0 top-0 z-50 h-full w-[520px] max-w-[calc(100vw-0.75rem)] border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">User Detail</p>
                  <h3 className="text-sm font-semibold text-slate-900">{selectedUser.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[90vh] flex-1 overflow-y-auto p-5">
                <dl className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">ID</dt>
                    <dd className="col-span-2 font-mono text-xs text-slate-600 break-words">{selectedUser.id}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
                    <dd className="col-span-2 text-sm text-slate-700 break-words">{selectedUser.email}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
                    <dd className="col-span-2 text-sm text-slate-700 break-words">{selectedUser.phone || 'N/A'}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Last Active</dt>
                    <dd className="col-span-2 text-sm text-slate-700">{formatDate(selectedUser.lastActiveAt)}</dd>
                  </div>
                </dl>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(event) =>
                      setSelectedUser((prev) =>
                        prev ? { ...prev, role: event.target.value as UserRole } : prev
                      )
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                  >
                    {roleOptions
                      .filter((item) => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                  <select
                    value={selectedUser.status}
                    onChange={(event) =>
                      setSelectedUser((prev) =>
                        prev ? { ...prev, status: event.target.value as UserStatus } : prev
                      )
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                  >
                    {statusOptions
                      .filter((item) => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={actionUserId === selectedUser.id}
                    onClick={() => updateUser(selectedUser.id, { role: selectedUser.role, status: selectedUser.status })}
                    className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    Save User Changes
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
