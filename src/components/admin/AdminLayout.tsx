'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ListTodo,
  Database,
  Users,
  BarChart3,
  File,
  ScrollText,
  Settings,
  RefreshCw,
  Menu,
  Search,
  Bell,
  Shield,
  X,
  FolderTree,
} from 'lucide-react';
import { AdminThemeProvider } from '@/contexts/AdminThemeContext';

type AuthState = {
  loading: boolean;
  authorized: boolean;
  name: string;
  email: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'reports', label: 'Báo cáo', href: '/admin/reports', icon: FileText },
  { key: 'scams', label: 'Lừa đảo', href: '/admin/scams', icon: Database },
  { key: 'categories', label: 'Danh mục', href: '/admin/categories', icon: FolderTree },
  { key: 'users', label: 'Ngườii dùng', href: '/admin/users', icon: Users },
  { key: 'analytics', label: 'Thống kê', href: '/admin/analytics', icon: BarChart3 },
  { key: 'logs', label: 'Nhật ký', href: '/admin/logs', icon: ScrollText },
  { key: 'settings', label: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

const titleMap: Array<{ test: (pathname: string) => boolean; title: string; subtitle: string }> = [
  { test: (path) => path === '/admin' || path === '/admin/dashboard', title: 'Dashboard', subtitle: 'System moderation overview' },
  { test: (path) => path.startsWith('/admin/reports'), title: 'Báo cáo', subtitle: 'Review and moderate incoming reports' },
  { test: (path) => path.startsWith('/admin/scams'), title: 'Quản lý lừa đảo', subtitle: 'Manage scam database by category' },
  { test: (path) => path.startsWith('/admin/database'), title: 'Database', subtitle: 'Manage verified and risky entities' },
  { test: (path) => path.startsWith('/admin/categories'), title: 'Danh mục', subtitle: 'Manage scam categories' },
  { test: (path) => path.startsWith('/admin/users'), title: 'Ngườii dùng', subtitle: 'Control access and account health' },
  { test: (path) => path.startsWith('/admin/analytics'), title: 'Analytics', subtitle: 'Track moderation operations' },
  { test: (path) => path.startsWith('/admin/content'), title: 'Content', subtitle: 'Manage editorial surfaces' },
  { test: (path) => path.startsWith('/admin/logs'), title: 'Logs', subtitle: 'Audit activity and operations' },
  { test: (path) => path.startsWith('/admin/sync'), title: 'Data Sync', subtitle: 'Sync external scam feeds to local database' },
  { test: (path) => path.startsWith('/admin/settings'), title: 'Cài đặt', subtitle: 'System configuration' },
];

function resolveTitle(pathname: string) {
  const matched = titleMap.find((entry) => entry.test(pathname));
  if (matched) return matched;
  return { title: 'Admin', subtitle: 'Moderation workspace' };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({
    loading: true,
    authorized: false,
    name: 'Admin',
    email: 'admin@scamguard.vn',
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await res.json();
        if (!active) return;

        if (res.ok && payload?.authenticated) {
          setAuth({
            loading: false,
            authorized: true,
            name: payload?.name || 'Admin',
            email: payload?.email || 'admin@scamguard.vn',
          });
          return;
        }

        setAuth((prev) => ({ ...prev, loading: false, authorized: false }));
      } catch {
        if (!active) return;
        setAuth((prev) => ({ ...prev, loading: false, authorized: false }));
      }
    }

    checkAuth();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!auth.loading && !auth.authorized) {
      router.replace('/admin/login');
    }
  }, [auth.authorized, auth.loading, router]);

  const currentTitle = useMemo(() => resolveTitle(pathname), [pathname]);

  const isActive = (item: NavItem): boolean => {
    if (item.key === 'dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard';
    }

    if (item.key === 'queue') {
      return pathname.startsWith('/admin/reports/pending');
    }

    if (item.key === 'reports') {
      return pathname.startsWith('/admin/reports') && !pathname.startsWith('/admin/reports/pending');
    }

    if (item.key === 'entities') {
      return pathname.startsWith('/admin/database') || pathname.startsWith('/admin/scams');
    }

    return pathname.startsWith(item.href);
  };

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-600">
        Checking admin session...
      </div>
    );
  }

  if (!auth.authorized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-600">
        Redirecting to admin login...
      </div>
    );
  }

  const SidebarContent = (
    <div className="h-full flex flex-col">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <Shield className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 tracking-tight">ScamGuard Admin</p>
          <p className="text-xs text-slate-500">Moderation Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const ItemIcon = item.icon;
            const active = isActive(item);

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <a
          href="/api/auth/logout"
          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </a>
      </div>
    </div>
  );

  return (
    <AdminThemeProvider theme="light">
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-slate-200 bg-white lg:block">
          {SidebarContent}
        </div>

        {mobileOpen && (
          <>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden"
              aria-label="Close menu overlay"
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-white lg:hidden">
              <div className="absolute right-3 top-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {SidebarContent}
            </aside>
          </>
        )}

        <div className="lg:pl-[260px] min-h-screen flex flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-semibold tracking-tight text-slate-900">{currentTitle.title}</h1>
                <p className="text-xs text-slate-500 truncate">{currentTitle.subtitle}</p>
              </div>

              <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-[280px] max-w-[420px] flex-1">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  aria-label="Search moderation"
                  placeholder="Search reports, users, entities..."
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                />
              </div>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                  {auth.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-[160px]">{auth.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[160px]">{auth.email}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1580px] min-w-0 text-sm leading-relaxed break-words">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
