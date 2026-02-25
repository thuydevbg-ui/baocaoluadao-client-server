'use client';

import React, { useState } from 'react';
import { Search, Filter, User, Activity, Clock, Download, Eye } from 'lucide-react';

const activityLogs = [
  { id: '1', action: 'Đăng nhập hệ thống', user: 'admin@scamguard.vn', ip: '192.168.1.100', target: '-', date: '2024-01-15 14:30:25' },
  { id: '2', action: 'Duyệt báo cáo R001', user: 'admin@scamguard.vn', ip: '192.168.1.100', target: 'Báo cáo R001', date: '2024-01-15 14:25:10' },
  { id: '3', action: 'Tạo danh mục mới', user: 'admin@scamguard.vn', ip: '192.168.1.100', target: 'Danh mục: Lừa đảo SMS', date: '2024-01-15 13:20:05' },
  { id: '4', action: 'Cập nhật người dùng', user: 'mod@scamguard.vn', ip: '192.168.1.101', target: 'User U003', date: '2024-01-15 12:15:30' },
  { id: '5', action: 'Xóa báo cáo R099', user: 'admin@scamguard.vn', ip: '192.168.1.100', target: 'Báo cáo R099', date: '2024-01-15 11:10:45' },
  { id: '6', action: 'Đăng bài blog', user: 'admin@scamguard.vn', ip: '192.168.1.100', target: 'Bài: Cách nhận biết lừa đảo', date: '2024-01-15 10:05:20' },
  { id: '7', action: 'Thay đổi cài đặt', user: 'admin@scamguard.vn', ip: '192.168.1.100', target: 'Email Settings', date: '2024-01-15 09:30:15' },
];

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nhật ký hoạt động</h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi các hoạt động của admin trong hệ thống</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" />Xuất log
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả hành động</option>
              <option value="đăng nhập">Đăng nhập</option>
              <option value="báo cáo">Báo cáo</option>
              <option value="người dùng">Người dùng</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mục tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {log.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{log.ip}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.target}</td>
                  <td className="px-6 py-4">
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}