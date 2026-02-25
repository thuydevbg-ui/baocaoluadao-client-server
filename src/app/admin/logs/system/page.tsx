'use client';

import React, { useState } from 'react';
import { Search, AlertTriangle, AlertCircle, Info, Download, Server, Clock, Eye } from 'lucide-react';

const systemLogs = [
  { id: '1', level: 'error', source: 'API', message: 'Failed to connect to database', details: 'Connection timeout after 30s', date: '2024-01-15 14:30:25' },
  { id: '2', level: 'warning', source: 'Auth', message: 'Multiple failed login attempts', details: 'IP: 192.168.1.200, Attempts: 5', date: '2024-01-15 14:25:10' },
  { id: '3', level: 'info', source: 'System', message: 'Backup completed successfully', details: 'Size: 2.5GB, Duration: 45s', date: '2024-01-15 13:00:00' },
  { id: '4', level: 'error', source: 'Email', message: 'SMTP connection failed', details: 'Invalid credentials', date: '2024-01-15 12:15:30' },
  { id: '5', level: 'warning', source: 'API', message: 'Rate limit exceeded', details: 'API key: sk_test_xxx, Requests: 1000/min', date: '2024-01-15 11:10:45' },
  { id: '6', level: 'info', source: 'System', message: 'Scheduled maintenance completed', details: 'All services restarted', date: '2024-01-15 10:00:00' },
  { id: '7', level: 'error', source: 'Scanner', message: 'Virus scan failed', details: 'File: /uploads/suspicious.zip', date: '2024-01-15 09:30:15' },
];

const levelConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  error: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Lỗi' },
  warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Cảnh báo' },
  info: { color: 'bg-blue-100 text-blue-800', icon: Info, label: 'Thông tin' },
};

export default function SystemLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nhật ký hệ thống</h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi các lỗi và cảnh báo hệ thống</p>
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
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="error">Lỗi</option>
              <option value="warning">Cảnh báo</option>
              <option value="info">Thông tin</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mức độ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nguồn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thông báo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const config = levelConfig[log.level];
                const LevelIcon = config.icon;
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {log.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        <LevelIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{log.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.message}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.details}</td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}