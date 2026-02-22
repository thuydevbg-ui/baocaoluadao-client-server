'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'website' | 'phone' | 'email' | 'social' | 'sms';
  status: 'pending' | 'verified' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  reporter: string;
  createdAt: string;
  description: string;
}

const mockReports: Report[] = [
  {
    id: 'R001',
    title: 'Website giả mạo shopee.com.vn',
    type: 'website',
    status: 'pending',
    riskLevel: 'high',
    reporter: 'Nguyễn Văn A',
    createdAt: '2024-01-15 10:30',
    description: 'Website giả mạo shopee với domain shopee-com-vn.xyz'
  },
  {
    id: 'R002',
    title: 'Số điện thoại lừa đảo tuyển dụng',
    type: 'phone',
    status: 'verified',
    riskLevel: 'high',
    reporter: 'Trần Thị B',
    createdAt: '2024-01-15 09:15',
    description: 'Số 0123456789 gọi tuyển dụng yêu chuyển tiền phí'
  },
  {
    id: 'R003',
    title: 'Email giả mạo Vietcombank',
    type: 'email',
    status: 'verified',
    riskLevel: 'medium',
    reporter: 'Lê Văn C',
    createdAt: '2024-01-15 08:45',
    description: 'Email yêu cầu cập nhật thông tin thẻ'
  },
  {
    id: 'R004',
    title: 'Tài khoản Facebook lừa đảo',
    type: 'social',
    status: 'rejected',
    riskLevel: 'low',
    reporter: 'Phạm Thị D',
    createdAt: '2024-01-14 16:20',
    description: 'Tài khoản Facebook giả mạo người nổi tiếng'
  },
  {
    id: 'R005',
    title: 'SMS lừa đảo giả Bưu điện',
    type: 'sms',
    status: 'pending',
    riskLevel: 'high',
    reporter: 'Hoàng Văn E',
    createdAt: '2024-01-14 14:00',
    description: 'Tin nhắn SMS yêu cầu cập nhật địa chỉ nhận hàng'
  },
  {
    id: 'R006',
    title: 'Website mua sắm lừa đảo',
    type: 'website',
    status: 'verified',
    riskLevel: 'high',
    reporter: 'Vũ Thị F',
    createdAt: '2024-01-14 11:30',
    description: 'Website bán hàng giả mạo thương hiệu'
  },
  {
    id: 'R007',
    title: 'Cuộc gọi giả mạo công an',
    type: 'phone',
    status: 'pending',
    riskLevel: 'high',
    reporter: 'Đặng Văn G',
    createdAt: '2024-01-13 15:45',
    description: 'Cuộc gọi từ số máy lạ yêu cung cấp CCCD'
  },
  {
    id: 'R008',
    title: 'Email lừa đảo lottery',
    type: 'email',
    status: 'rejected',
    riskLevel: 'low',
    reporter: 'Bùi Thị H',
    createdAt: '2024-01-13 10:20',
    description: 'Email thông báo trúng thưởng giả mạo'
  }
];

export default function ReportsPage() {
  const [reports] = useState<Report[]>(mockReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'Chờ duyệt', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      verified: { label: 'Đã xác minh', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      rejected: { label: 'Từ chối', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    const { label, className } = config[status] || config.pending;
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${className}`}>
        {label}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: 'Thấp', className: 'bg-green-500/10 text-green-400' },
      medium: { label: 'Trung bình', className: 'bg-yellow-500/10 text-yellow-400' },
      high: { label: 'Cao', className: 'bg-red-500/10 text-red-400' }
    };
    const { label, className } = config[risk] || config.low;
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${className}`}>
        {label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      website: '🌐',
      phone: '📱',
      email: '📧',
      social: '📘',
      sms: '💬'
    };
    return icons[type] || '📋';
  };

  const handleApprove = (id: string) => {
    console.log('Approve report:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject report:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản lý báo cáo</h2>
          <p className="text-gray-400 mt-1">Danh sách tất cả báo cáo lừa đảo</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="verified">Đã xác minh</option>
            <option value="rejected">Từ chối</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">Tất cả loại</option>
            <option value="website">Website</option>
            <option value="phone">Điện thoại</option>
            <option value="email">Email</option>
            <option value="social">Mạng xã hội</option>
            <option value="sms">SMS</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-400">ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Tiêu đề</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Loại</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Mức độ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Trạng thái</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Người báo cáo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Ngày tạo</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4">
                    <span className="text-sm font-medium text-blue-400">{report.id}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="text-sm font-medium text-white">{report.title}</span>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{report.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-lg">{getTypeIcon(report.type)}</span>
                  </td>
                  <td className="p-4">
                    {getRiskBadge(report.riskLevel)}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-300">{report.reporter}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-500">{report.createdAt}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(report.id)}
                            className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Duyệt báo cáo"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <span className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredReports.length)} của {filteredReports.length} báo cáo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-semibold text-white">Chi tiết báo cáo</h3>
                  <p className="text-sm text-gray-400 mt-1">ID: {selectedReport.id}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Loại</p>
                    <p className="text-white">{getTypeIcon(selectedReport.type)} {selectedReport.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mức độ rủi ro</p>
                    {getRiskBadge(selectedReport.riskLevel)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                    <p className="text-white">{selectedReport.createdAt}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Tiêu đề</p>
                  <p className="text-white font-medium">{selectedReport.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Mô tả chi tiết</p>
                  <p className="text-gray-300">{selectedReport.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Người báo cáo</p>
                  <p className="text-white">{selectedReport.reporter}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedReport.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleApprove(selectedReport.id)}
                      className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors"
                    >
                      Duyệt báo cáo
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}