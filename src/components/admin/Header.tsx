'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

export default function Header({ title = 'Dashboard' }: HeaderProps) {
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

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-800">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Title */}
        <div className="flex items-center gap-4 ml-12 lg:ml-0">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Globe className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
                  className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="font-semibold text-white">Thông báo</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                          notification.unread ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-400 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-800">
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
              className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-gray-400">admin@scamguard.vn</p>
              </div>
              <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-2">
                    <a
                      href="/admin/profile"
                      className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Hồ sơ</span>
                    </a>
                    <a
                      href="/admin/settings"
                      className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Cài đặt</span>
                    </a>
                  </div>
                  <div className="border-t border-gray-800 p-2">
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
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