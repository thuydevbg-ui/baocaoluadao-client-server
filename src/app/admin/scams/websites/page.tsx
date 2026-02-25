'use client';

import React, { useState } from 'react';
import { Search, Plus, Globe, AlertTriangle, CheckCircle, Trash2, Edit, Copy, ExternalLink, Shield } from 'lucide-react';

const websiteScams = [
  { id: 'W001', domain: 'shopee-com-vn.xyz', status: 'verified', reports: 25, riskLevel: 'high', category: 'Giả mạo thương hiệu', ip: '192.168.1.100', registrar: 'NameCheap', firstReported: '2024-01-10', lastReported: '2024-01-15' },
  { id: 'W002', domain: 'vietcombank-login.net', status: 'verified', reports: 18, riskLevel: 'high', category: 'Giả mạo ngân hàng', ip: '192.168.1.101', registrar: 'GoDaddy', firstReported: '2024-01-08', lastReported: '2024-01-14' },
  { id: 'W003', domain: 'tiktok-gift.xyz', status: 'verified', reports: 12, riskLevel: 'medium', category: 'Lừa đảo tặng quà', ip: '192.168.1.102', registrar: 'NameCheap', firstReported: '2024-01-05', lastReported: '2024-01-12' },
  { id: 'W004', domain: 'fast-delivery.shop', status: 'pending', reports: 3, riskLevel: 'medium', category: 'Lừa đảo mua sắm', ip: '192.168.1.103', registrar: 'Cloudflare', firstReported: '2024-01-14', lastReported: '2024-01-15' },
  { id: 'W005', domain: 'bank-security-update.com', status: 'verified', reports: 30, riskLevel: 'high', category: 'Giả mạo ngân hàng', ip: '192.168.1.104', registrar: 'NameCheap', firstReported: '2024-01-02', lastReported: '2024-01-15' },
];

export default function WebsiteScamsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWebsites = websiteScams.filter(w => w.domain.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Website lừa đảo</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý cơ sở dữ liệu website lừa đảo</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />Thêm website
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm domain..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Báo cáo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mức độ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại lừa đảo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWebsites.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="font-mono font-medium">{item.domain}</span>
                      <button className="p-1 text-gray-400 hover:text-gray-600"><Copy className="w-3 h-3" /></button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.status === 'verified' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      {item.status === 'verified' ? 'Đã xác minh' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.reports}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.riskLevel === 'high' ? 'Cao' : 'Trung bình'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{item.ip}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Chi tiết"><ExternalLink className="w-4 h-4" /></button>
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