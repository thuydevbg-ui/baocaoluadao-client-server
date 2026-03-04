"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { AdminThemeProvider } from '@/contexts/AdminThemeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/reports': 'Quản lý báo cáo',
  '/admin/categories': 'Quản lý danh mục',
  '/admin/users': 'Quản lý người dùng',
  '/admin/scams': 'Scam Database',
  '/admin/content': 'Quản lý nội dung',
  '/admin/content/blog': 'Quản lý Blog',
  '/admin/content/faq': 'Quản lý FAQ',
  '/admin/analytics': 'Thống kê',
  '/admin/seo-dashboard': 'SEO Dashboard',
  '/admin/support': 'Hỗ trợ người dùng',
  '/admin/logs': 'Nhật ký hệ thống',
  '/admin/settings': 'Cài đặt'
};

// Get initial theme synchronously to prevent hydration mismatch
function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage?.getItem('adminTheme');
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const authCheckDoneRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle theme initialization and DOM sync after mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('adminTheme', nextTheme);
          document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        } catch {
          // Ignore storage errors
        }
      }
      return nextTheme;
    });
  }, []);

  // Client-side auth verification (defense-in-depth)
  useEffect(() => {
    if (authCheckDoneRef.current) return;
    authCheckDoneRef.current = true;

    const checkAuth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          setIsAuthorized(data.authenticated || false);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Handle auth redirect
  useEffect(() => {
    if (!isLoading && !isAuthorized && mounted) {
      router.push('/admin/login');
    }
  }, [isAuthorized, isLoading, router, mounted]);

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (path === '/admin' && pathname === '/admin') return title;
      if (path !== '/admin' && pathname.startsWith(path)) return title;
    }
    return 'Admin';
  };

  // Don't render until hydration is complete
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-gray-400">Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  const bgMain = theme === 'dark' ? 'bg-[#0B1120]' : 'bg-white';

  return (
    <AdminThemeProvider theme={theme}>
      <div className={`flex min-h-screen ${bgMain}`}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} theme={theme} />

        <div
          className={`flex-1 flex flex-col transition-all duration-200 ${
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          } px-3 sm:px-4`}
        >
          <Header title={getTitle()} theme={theme} onToggleTheme={toggleTheme} />

          <main
            className={`flex-1 w-full min-w-0 px-3 sm:px-4 lg:px-6 py-4 lg:py-6 overflow-auto admin-main-full no-overflow-x ${bgMain}`}
          >
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
