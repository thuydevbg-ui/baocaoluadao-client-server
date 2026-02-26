'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  Database,
  FileEdit,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  MessageSquare,
  Activity,
  Menu,
  X,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  theme?: 'light' | 'dark';
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    exact: true
  },
  {
    title: 'Báo cáo',
    icon: FileText,
    href: '/admin/reports',
    badge: 12
  },
  {
    title: 'Danh mục',
    icon: FolderTree,
    href: '/admin/categories'
  },
  {
    title: 'Người dùng',
    icon: Users,
    href: '/admin/users'
  },
  {
    title: 'Scam Database',
    icon: Database,
    href: '/admin/scams'
  },
  {
    title: 'Nội dung',
    icon: FileEdit,
    href: '/admin/content',
    children: [
      { title: 'Blog', href: '/admin/content/blog' },
      { title: 'FAQ', href: '/admin/content/faq' }
    ]
  },
  {
    title: 'Thống kê',
    icon: BarChart3,
    href: '/admin/analytics'
  },
  {
    title: 'Hỗ trợ',
    icon: MessageSquare,
    href: '/admin/support',
    badge: 5
  },
  {
    title: 'Nhật ký',
    icon: Activity,
    href: '/admin/logs'
  },
  {
    title: 'Cài đặt',
    icon: Settings,
    href: '/admin/settings'
  },
  {
    title: 'API Docs',
    icon: BookOpen,
    href: '/api-docs'
  }
];

export default function Sidebar({ isCollapsed, setIsCollapsed, theme = 'dark' }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Close mobile sidebar when viewport becomes desktop-sized to avoid
  // leaving the mobile overlay open after resizing (e.g. F12 toggling).
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = !('matches' in e) ? !(e as MediaQueryList).matches : !(e as MediaQueryListEvent).matches;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };
    // Initial check
    const mobile = !mq.matches;
    setIsMobileView(mobile);
    if (!mobile) setIsMobileOpen(false);
    // Add listener
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handler as any);
    } else {
      // Safari fallback
      (mq as any).addListener(handler as any);
    }
    return () => {
      if ('removeEventListener' in mq) {
        mq.removeEventListener('change', handler as any);
      } else {
        (mq as any).removeListener(handler as any);
      }
    };
  }, []);

  const toggleSubmenu = (title: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setExpandedMenu(expandedMenu === title ? null : title);
  };

  // Always close mobile menu on route change (safety)
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className={`flex flex-col h-full overflow-visible ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'}`}>
      {/* Logo */}
      <div className={`flex items-center justify-between h-16 px-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className={`font-bold text-lg whitespace-nowrap ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Admin Panel
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        
        {/* Mobile close button - visible on mobile only */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className={`lg:hidden p-1 ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenu === item.title;
            const active = isActive(item.href, item.exact);

            return (
              <li key={item.title}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-blue-600/20 text-blue-400'
                          : theme === 'dark'
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-between flex-1"
                          >
                            <span className="text-sm font-medium">{item.title}</span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 200 }}
                            >
                              <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    <AnimatePresence>
                      {isExpanded && !isCollapsed && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 200 }}
                          className="ml-4 mt-1 space-y-1 overflow-hidden"
                        >
                          {item.children!.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                  pathname === child.href
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : theme === 'dark'
                                    ? 'text-gray-500 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                onClick={() => setIsMobileOpen(false)}
                              >
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-blue-600/20 text-blue-400'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between flex-1"
                        >
                          <span className="text-sm font-medium">{item.title}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {isCollapsed && item.badge && (
                      <span className="absolute right-2 top-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`border-t p-3 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Về trang chủ
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Collapse button - Desktop only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden lg:flex absolute -right-5 top-20 w-8 h-8 rounded-full items-center justify-center transition-colors z-50 shadow-lg ${
          theme === 'dark'
            ? 'bg-blue-600 border-gray-700 text-white hover:bg-blue-700'
            : 'bg-blue-600 border-gray-300 text-white hover:bg-blue-700'
        } border`}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen border-r z-40 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          theme === 'dark'
            ? 'bg-[#0B1120] border-gray-800'
            : 'bg-white border-gray-200'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* (Mobile sidebar rendered via portal above) */}
    </>
  );
}
