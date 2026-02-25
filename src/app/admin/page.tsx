'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

export default function AdminDashboard() {
  const { theme } = useAdminTheme();
  const stats = [
    {
      title: 'Tổng báo cáo',
      value: '12,847',
      icon: FileText,
      color: 'blue' as const,
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: 'Báo cáo hôm nay',
      value: '156',
      icon: AlertTriangle,
      color: 'yellow' as const,
      trend: { value: 8.2, isPositive: false }
    },
    {
      title: 'Đã xác minh',
      value: '8,234',
      icon: CheckCircle,
      color: 'green' as const,
      trend: { value: 15.3, isPositive: true }
    },
    {
      title: 'Người dùng',
      value: '4,521',
      icon: Users,
      color: 'purple' as const,
      trend: { value: 5.7, isPositive: true }
    }
  ];

  const recentReports = [
    {
      id: 1,
      title: 'Website lừa đảo mua sắm online',
      type: 'Website',
      status: 'pending',
      date: '5 phút trước',
      reporter: 'Nguyễn Văn A'
    },
    {
      id: 2,
      title: 'Số điện thoại lừa đảo tuyển dụng',
      type: 'Phone',
      status: 'verified',
      date: '15 phút trước',
      reporter: 'Trần Thị B'
    },
    {
      id: 3,
      title: 'Email lừa đảo giả mạo ngân hàng',
      type: 'Email',
      status: 'rejected',
      date: '30 phút trước',
      reporter: 'Lê Văn C'
    },
    {
      id: 4,
      title: 'Tài khoản Facebook lừa đảo',
      type: 'Social',
      status: 'pending',
      date: '1 giờ trước',
      reporter: 'Phạm Thị D'
    },
    {
      id: 5,
      title: 'SMS lừa đảo giả mạo bưu điện',
      type: 'SMS',
      status: 'verified',
      date: '2 giờ trước',
      reporter: 'Hoàng Văn E'
    }
  ];

  const categories = [
    { name: 'Website lừa đảo', count: 3456, percentage: 35 },
    { name: 'SMS lừa đảo', count: 2876, percentage: 29 },
    { name: 'Cuộc gọi lừa đảo', count: 1543, percentage: 16 },
    { name: 'Email lừa đảo', count: 1234, percentage: 12 },
    { name: 'Mạng xã hội', count: 738, percentage: 8 }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ duyệt', className: 'bg-yellow-500/20 text-yellow-400' },
      verified: { label: 'Đã xác minh', className: 'bg-green-500/20 text-green-400' },
      rejected: { label: 'Từ chối', className: 'bg-red-500/20 text-red-400' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      Website: '🌐',
      Phone: '📱',
      Email: '📧',
      Social: '📘',
      SMS: '💬'
    };
    return icons[type] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={`lg:col-span-2 border rounded-2xl overflow-hidden ${
            theme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Báo cáo gần đây</h3>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Danh sách báo cáo mới nhất</p>
            </div>
            <a
              href="/admin/reports"
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Xem tất cả
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className={`divide-y ${
            theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'
          }`}>
            {recentReports.map((report) => (
              <div
                key={report.id}
                className={`flex items-center justify-between p-4 transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{getTypeIcon(report.type)}</span>
                  <div>
                    <h4 className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{report.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>{report.reporter}</span>
                      <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}>•</span>
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>{report.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(report.status)}
                  <button className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-500 hover:text-white hover:bg-gray-800'
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Categories Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className={`border rounded-2xl p-6 ${
            theme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Danh mục lừa đảo</h3>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Phân bố theo loại</p>
            </div>
          </div>

          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>{category.name}</span>
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {category.count.toLocaleString()}
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className={`border rounded-2xl p-6 ${
            theme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h4 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Chờ duyệt</h4>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>234</p>
            </div>
          </div>
          <a
            href="/admin/reports?status=pending"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Xem chi tiết →
          </a>
        </motion.div>

        {/* Verified Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className={`border rounded-2xl p-6 ${
            theme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h4 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Đã xác minh hôm nay</h4>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>89</p>
            </div>
          </div>
          <a
            href="/admin/reports?status=verified"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Xem chi tiết →
          </a>
        </motion.div>

        {/* Page Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className={`border rounded-2xl p-6 ${
            theme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h4 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Lượt xem hôm nay</h4>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>12,456</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>+23% so với hôm qua</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}