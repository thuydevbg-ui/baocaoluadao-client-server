'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Globe
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function Header({ title = 'Dashboard', theme = 'dark', onToggleTheme }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    {
      id: 1,
      title: 'Báo cáo mới',
      message: 'Có 5 báo cáo mới chờ duyệt',
      time: '5 phút trước',
      unread: true
    },
    {
      id: 2,
      title: 'Người dùng mới',
      message: '10 người dùng đăng ký hôm nay',
      time: '1 giờ trước',
      unread: true
    },
    {
      id: 3,
      title: 'Cảnh báo hệ thống',
      message: 'Server CPU usage cao',
      time: '2 giờ trước',
      unread: false
    }
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  /* Stack Overflow style: Clean header */
  return (
    <header className={`sticky top-0 z-30 h-14 border-b transition-colors ${
      theme === 'dark' 
        ? 'bg-[#232629] border-[#3c4043]' 
        : 'bg-white border-[#d6d9dc]'
    }`}>
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Title */}
        <div className="flex items-center gap-4 ml-12 lg:ml-0">
          {/* Text color for theme-aware elements */}
          <h1 className={`text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-[#171a1e]'}`}>{title}</h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          )}

          {/* Language toggle */}
          <button className={`p-1.5 rounded transition-colors ${
            theme === 'dark' 
              ? 'text-[#babfc4] hover:text-white hover:bg-[#3c4043]' 
              : 'text-[#6a737c] hover:text-[#171a1e] hover:bg-[#f8f9f9]'
          }`}>
            <Globe className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className={`relative p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-gray-900 border border-gray-800'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Thông báo</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b cursor-pointer transition-colors ${
                          theme === 'dark'
                            ? `border-gray-800 hover:bg-gray-800/50 ${notification.unread ? 'bg-blue-500/5' : ''}`
                            : `border-gray-100 hover:bg-gray-50 ${notification.unread ? 'bg-blue-50' : ''}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`p-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                    <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              /* Stack Overflow style: Clean user button */
              className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-[#3c4043]' 
                  : 'hover:bg-[#f8f9f9]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Admin</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>admin@scamguard.vn</p>
              </div>
              <ChevronDown className={`hidden lg:block w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-gray-900 border border-gray-800'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="p-2">
                    <a
                      href="/admin/profile"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Hồ sơ</span>
                    </a>
                    <a
                      href="/admin/settings"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Cài đặt</span>
                    </a>
                  </div>
                  <div className={`border-t p-2 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                    <button 
                      onClick={async () => {
                        // Call logout API to clear HttpOnly cookie
                        await fetch('/api/auth/logout', { method: 'POST' });
                        router.push('/admin/login');
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}