'use client';

import React, { useState, useEffect } from 'react';
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
  '/admin/support': 'Hỗ trợ người dùng',
  '/admin/logs': 'Nhật ký hệ thống',
  '/admin/settings': 'Cài đặt'
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Defense-in-depth: Client-side check in addition to middleware
  // Middleware handles most protection, but this is a fallback for edge cases
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();
  const router = useRouter();

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('adminTheme');
    // Default admin UI to light unless user explicitly chose dark
    const initialTheme: 'light' | 'dark' = savedTheme === 'dark' ? 'dark' : 'light';

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('adminTheme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Defense-in-depth: Client-side check in addition to middleware
  // Middleware handles most protection, but this is a fallback for edge cases
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Create abort controller with timeout - increased for reliability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        // Try to verify auth with server-side check
        const response = await fetch('/api/auth/verify', { 
          method: 'POST',
          credentials: 'include', // Include cookies
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthorized(data.authenticated || false);
        } else {
          // Server error - fail closed for security
          setIsAuthorized(false);
        }
      } catch (error) {
        // Network error, timeout, or server unavailable
        // If it's an abort (timeout), fail closed for security
        console.error('Auth verification failed:', error);
        // Don't auto-fail on network errors - let middleware handle protection
        // Just set loading to false and let user see the content if middleware allowed
        setIsAuthorized(false); // Fail closed for security
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect if not authorized
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.push('/admin/login');
    }
  }, [isAuthorized, isLoading, router]);

  // Get page title
  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (path === '/admin' && pathname === '/admin') return title;
      if (path !== '/admin' && pathname.startsWith(path)) return title;
    }
    return 'Admin';
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  // Don't render if not authorized - show redirecting message instead of blank page
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-gray-400">Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  // Theme-aware background classes - White for light mode
  // Keep light mode main transparent so inner cards control white surface width
  const bgMain = theme === 'dark' ? 'bg-[#0B1120]' : 'bg-transparent';
  const textMain = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <AdminThemeProvider theme={theme}>
      <div className={`flex min-h-screen ${bgMain}`}>
        {/* Sidebar */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} theme={theme} />

        {/* Main content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-200 ${
            isCollapsed ? 'lg:ml-16' : 'lg:ml-72'
          }`}
        >
          {/* Header */}
          <Header title={getTitle()} theme={theme} onToggleTheme={toggleTheme} />

          {/* Page content - White background for light mode */}
          <main className={`flex-1 w-full min-w-0 p-2 sm:p-4 lg:p-6 overflow-auto admin-main-full no-overflow-x ${bgMain}`}>
            {children}
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}

