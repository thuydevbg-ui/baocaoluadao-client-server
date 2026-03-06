'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, CheckCircle, Globe, Phone, Building2, Clock, Eye, Filter, Shield, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ScamData {
  id: number;
  name: string;
  domain: string;
  type: string;
  icon?: string;
  is_scam?: boolean;
  reports?: number;
  views?: number;
  comments?: number;
  ratings?: number;
  status: string;
  date: string;
  description: string;
  organization: string;
}

// Fallback data in case API fails
const FALLBACK_SCAMS: ScamData[] = [
  { id: 1, name: 'Shopee Giả Mạo', domain: 'shopee-sale.com', type: 'web', reports: 1234, status: 'confirmed', date: '2024-01-15', description: 'Website giả mạo Shopee với các sản phẩm giảm giá', organization: 'Shopee' },
  { id: 2, name: 'VCB Lừa Đảo', domain: 'vietcombank-login.net', type: 'web', reports: 892, status: 'confirmed', date: '2024-01-20', description: 'Giả mạo trang đăng nhập VietComBank', organization: 'VietComBank' },
  { id: 3, name: 'Viettel CSKH Giả', domain: 'viettel-support.net', type: 'web', reports: 567, status: 'confirmed', date: '2024-01-22', description: 'Giả mạo CSKH Viettel yêu cầu cung cấp OTP', organization: 'Viettel' },
  { id: 4, name: 'Momo Lừa Đảo', domain: 'momo-vn.net', type: 'web', reports: 445, status: 'confirmed', date: '2024-01-25', description: 'Giả mạo ứng dụng Momo', organization: 'MoMo' },
  { id: 5, name: 'Tiki Giả', domain: 'tiki-deal.com', type: 'web', reports: 321, status: 'confirmed', date: '2024-01-28', description: 'Website giả mạo Tiki', organization: 'Tiki' },
  { id: 6, name: 'ACB Lừa Đảo', domain: 'acb-security.com', type: 'web', reports: 234, status: 'confirmed', date: '2024-02-01', description: 'Giả mạo thông tin tài khoản ACB', organization: 'ACB' },
  { id: 7, name: 'Zalo Lừa Đảo', domain: 'zalo-verified.net', type: 'web', reports: 189, status: 'confirmed', date: '2024-02-05', description: 'Giả mạo tài khoản Zalo', organization: 'Zalo' },
  { id: 8, name: 'Bidv Giả', domain: 'bidv-online.net', type: 'web', reports: 156, status: 'confirmed', date: '2024-02-08', description: 'Giả mạo trang BIDV', organization: 'BIDV' },
];

export default function ScamListPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [scams, setScams] = useState<ScamData[]>([]);
  const [filteredScams, setFilteredScams] = useState<ScamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 6, totalPages: 1, totalItems: 0 });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/scams?page=${pagination.page}&limit=${pagination.limit}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setScams(result.data);
          setFilteredScams(result.data);
          setPagination(prev => ({ ...prev, ...result.pagination }));
          setError(null);
        } else {
          setScams(FALLBACK_SCAMS);
          setFilteredScams(FALLBACK_SCAMS);
          setError('Không thể tải dữ liệu mới nhất, hiển thị dữ liệu cache');
        }
      } catch (err) {
        console.error('Error fetching scams:', err);
        setScams(FALLBACK_SCAMS);
        setFilteredScams(FALLBACK_SCAMS);
        setError('Lỗi kết nối, hiển thị dữ liệu mẫu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pagination.page]);

  // Filter data locally
  useEffect(() => {
    let result = scams;
    
    if (searchTerm) {
      result = result.filter(scam => 
        scam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scam.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scam.organization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      result = result.filter(scam => scam.type === filterType);
    }
    
    setFilteredScams(result);
  }, [searchTerm, filterType, scams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Đã sao chép!');
  };

  const formatDate = (dateStr: string) => {
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString('vi-VN');
    // If API already returns dd/mm/yyyy, just show it raw
    return dateStr || '—';
  };

  const renderStatusBadge = (status: string, isScam?: boolean) => {
    const normalized = (status || '').toLowerCase();
    if (isScam === false || normalized === 'trusted' || normalized === 'safe') {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-success/10 text-success border border-success/30">
          Đã xác minh
        </span>
      );
    }
    if (normalized === 'confirmed' || normalized === 'blocked') {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-danger/10 text-danger border border-danger/30">
          Đã xác nhận
        </span>
      );
    }
    if (normalized === 'processing' || normalized === 'investigating' || normalized === 'suspected') {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-warning/10 text-warning border border-warning/30">
          Đang xử lý
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-slate-200 text-slate-700">
        Chưa xác định
      </span>
    );
  };

  const getIconUrl = (scam: ScamData) => {
    if (scam.icon) return scam.icon;
    const domain = scam.domain || scam.name || '';
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    }
    return 'https://tinnhiemmang.vn/img/icon_web2.png';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/20 rounded-full text-danger text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Cảnh báo lừa đảo
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-2">
              🚨 Danh sách Website lừa đảo
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Dữ liệu được cập nhật từ <a href="https://tinnhiemmang.vn" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TinNhiemMang.vn</a> - Cập nhật danh sách các website và số điện thoại lừa đảo được cộng đồng báo cáo
            </p>
            {error && (
              <div className="mt-4 px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
                ⚠️ {error}
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-text-secondary">Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Stats Banner */}
          {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center bg-danger/5 border-danger/20">
              <p className="text-3xl font-bold text-danger">{pagination.totalItems > 0 ? pagination.totalItems : scams.length}</p>
              <p className="text-sm text-text-muted">Tổng cảnh báo</p>
            </Card>
            <Card className="p-4 text-center bg-warning/5 border-warning/20">
              <p className="text-3xl font-bold text-warning">{pagination.totalItems > 0 ? pagination.totalItems : scams.filter(s => s.type === 'web').length}</p>
              <p className="text-sm text-text-muted">Website lừa đảo</p>
            </Card>
            <Card className="p-4 text-center bg-primary/5 border-primary/20">
              <p className="text-3xl font-bold text-primary">{scams.reduce((a, s) => a + (s.views ?? 0), 0)}</p>
              <p className="text-sm text-text-muted">Lượt xem</p>
            </Card>
            <Card className="p-4 text-center bg-success/5 border-success/20">
              <p className="text-3xl font-bold text-success">{scams.filter(s => s.status === 'confirmed').length}</p>
              <p className="text-sm text-text-muted">Đã xác nhận</p>
            </Card>
          </div>
          )}

          {/* Search and Filter */}
          {!loading && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm tên, domain hoặc mô tả..."
                className="w-full h-12 pl-12 pr-4 bg-bg-card border border-bg-border rounded-button text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'web', 'phone'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-4 py-2 rounded-button font-medium text-sm transition-all',
                    filterType === type 
                      ? 'bg-primary text-white' 
                      : 'bg-bg-card text-text-muted hover:bg-bg-cardHover'
                  )}
                >
                  {type === 'all' ? 'Tất cả' : type === 'web' ? 'Website' : 'Điện thoại'}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Results count */}
          {!loading && (
          <p className="text-sm text-text-muted mb-4">
            Tìm thấy {filteredScams.length} kết quả
          </p>
          )}

          {/* Scam List */}
          <div className="space-y-4">
            {filteredScams.map((scam, index) => (
              <motion.div
                key={scam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-bg-border/60 bg-white'
                      )}
                    >
                      <img
                        src={getIconUrl(scam)}
                        alt={scam.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.dataset.fallback) return;
                          target.dataset.fallback = '1';
                          target.src = 'https://tinnhiemmang.vn/img/icon_web2.png';
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-main">{scam.name}</h3>
                      {renderStatusBadge(scam.status, scam.is_scam)}
                    </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <code 
                          className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded cursor-pointer hover:bg-primary/20"
                          onClick={() => copyToClipboard(scam.domain)}
                          title="Click để sao chép"
                        >
                          {scam.domain}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(scam.domain)}
                          className="p-1 hover:bg-bg-cardHover rounded"
                        >
                          <Copy className="w-4 h-4 text-text-muted" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-text-secondary line-clamp-2">{scam.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {scam.views ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(scam.date)}
                        </span>
                      </div>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => window.open(`https://${scam.domain}`, '_blank')}
                      >
                        Kiểm tra <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredScams.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">Không tìm thấy kết quả nào</p>
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
                className="px-4 py-2 rounded-button bg-bg-card border border-bg-border text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang trước
              </button>

              <span className="px-3 py-2 text-sm text-text-secondary">
                Trang {pagination.page}/{pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                className="px-4 py-2 rounded-button bg-bg-card border border-bg-border text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang sau
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-bg-card border border-bg-border rounded-card">
            <p className="text-sm text-text-muted text-center">
              ⚠️ Lưu ý: Đây là danh sách các trang web và số điện thoại bị cộng đồng báo cáo. 
              Chúng tôi không chịu trách nhiệm về tính chính xác của thông tin. 
              Hãy luôn cẩn thận khi cung cấp thông tin cá nhân trên internet.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
