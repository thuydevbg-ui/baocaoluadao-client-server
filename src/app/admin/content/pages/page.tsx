'use client';

import React, { useState } from 'react';
import { Search, Plus, FileText, Edit, Trash2, Eye, Globe } from 'lucide-react';

const staticPages = [
  { id: '1', title: 'Giới thiệu', slug: 'about', status: 'published', author: 'Admin', updatedAt: '2024-01-15' },
  { id: '2', title: 'Chính sách bảo mật', slug: 'privacy', status: 'published', author: 'Admin', updatedAt: '2024-01-14' },
  { id: '3', title: 'Điều khoản sử dụng', slug: 'terms', status: 'published', author: 'Admin', updatedAt: '2024-01-13' },
  { id: '4', title: 'Chính sách cookie', slug: 'cookies', status: 'published', author: 'Admin', updatedAt: '2024-01-12' },
  { id: '5', title: 'Hướng dẫn báo cáo', slug: 'report-guide', status: 'published', author: 'Admin', updatedAt: '2024-01-10' },
  { id: '6', title: 'Tuyển dụng', slug: 'careers', status: 'draft', author: 'Admin', updatedAt: '2024-01-08' },
  { id: '7', title: 'Báo chí', slug: 'press', status: 'draft', author: 'Admin', updatedAt: '2024-01-05' },
];

export default function StaticPagesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPages = staticPages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.slug.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Quản lý trang tĩnh</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý các trang nội dung tĩnh của website</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />Thêm trang mới
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm trang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tác giả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cập nhật</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{page.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{page.slug}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {page.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{page.author}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{page.updatedAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <a href={`/${page.slug}`} target="_blank" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Xem"><Eye className="w-4 h-4" /></a>
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Sửa"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                    </div>
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