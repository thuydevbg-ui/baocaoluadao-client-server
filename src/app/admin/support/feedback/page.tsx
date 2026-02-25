'use client';

import React, { useState } from 'react';
import { Search, MessageSquare, CheckCircle, Clock, User, Send, Eye } from 'lucide-react';

const feedbacks = [
  { id: '1', user: 'user1@email.com', subject: 'Cần thêm tính năng cảnh báo qua email', status: 'pending', category: 'Góp ý', date: '2024-01-15 10:30' },
  { id: '2', user: 'user2@email.com', subject: 'Báo cáo không được duyệt', status: 'resolved', category: 'Hỗ trợ', date: '2024-01-14 15:20' },
  { id: '3', user: 'user3@email.com', subject: 'Lỗi khi tìm kiếm số điện thoại', status: 'processing', category: 'Báo lỗi', date: '2024-01-14 09:15' },
  { id: '4', user: 'user4@email.com', subject: 'Tích hợp với Telegram', status: 'pending', category: 'Góp ý', date: '2024-01-13 14:45' },
  { id: '5', user: 'user5@email.com', subject: 'Cần hướng dẫn sử dụng API', status: 'resolved', category: 'Hỗ trợ', date: '2024-01-13 11:30' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Mới', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function FeedbackPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = fb.subject.toLowerCase().includes(searchTerm.toLowerCase()) || fb.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || fb.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Quản lý phản hồi</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và xử lý phản hồi từ người dùng</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phản hồi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Mới</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chủ đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFeedbacks.map((fb) => {
                const config = statusConfig[fb.status];
                const StatusIcon = config.icon;
                return (
                  <tr key={fb.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{fb.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{fb.subject}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {fb.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fb.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Phản hồi">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có phản hồi nào</p>
          </div>
        )}
      </div>
    </div>
  );
}