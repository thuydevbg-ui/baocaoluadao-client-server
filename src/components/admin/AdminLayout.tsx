'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

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

interface AdminAuth {
  email: string;
  role: string;
  name: string;
  loginTime?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // SECURITY FIX: Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('adminAuth');
        if (authData) {
          const auth: AdminAuth = JSON.parse(authData);
          // Verify auth data exists and has required fields
          if (auth.email && auth.role && auth.name) {
            setIsAuthorized(true);
          } else {
            throw new Error('Invalid auth data');
          }
        } else {
          throw new Error('No auth data');
        }
      } catch {
        // Not authenticated - redirect to login
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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

  // Don't render if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0B1120]">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isCollapsed ? 'lg:ml-0' : 'lg:ml-0'
        }`}
      >
        {/* Header */}
        <Header title={getTitle()} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
