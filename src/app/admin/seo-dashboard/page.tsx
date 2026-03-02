'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Map,
  HeartPulse,
  Settings,
  Search,
  Plus,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Globe,
  FileCode,
  TrendingUp,
  AlertCircle,
  Save,
  X,
  ExternalLink,
  Trash2,
  Edit2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SeoScoreGauge,
  GooglePreview,
  MetaEditor,
  RedirectTable,
  SitemapViewer,
  CoreWebVitalsChart,
  TrafficChart,
} from '@/components/admin/seo';

// Types
interface SeoStats {
  seoScore: number;
  pages: {
    total: number;
    indexed: number;
    noindexed: number;
    missingTitle: number;
    missingDescription: number;
  };
  redirects: {
    total: number;
    active: number;
    totalHits: number;
  };
  health: {
    totalIssues: number;
    errors: number;
    warnings: number;
  };
  coreWebVitals: {
    lcp: { value: number; unit: string; status: string };
    cls: { value: number; unit: string; status: string };
    fid: { value: number; unit: string; status: string };
  };
  traffic: Array<{ date: string; organic: number; direct: number }>;
  topKeywords: Array<{ keyword: string; position: number; volume: number }>;
  recentAlerts: Array<{ type: string; message: string; severity: string; date: string }>;
}

interface SeoPage {
  id: string;
  url: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  og_title: string;
  og_description: string;
  canonical_url: string;
  robots_meta: string;
  priority: number;
  changefreq: string;
  is_indexed: boolean;
}

interface Redirect {
  id: string;
  from_url: string;
  to_url: string;
  type: '301' | '302' | '307' | '308';
  hits: number;
  is_active: boolean;
}

interface HealthIssue {
  id: string;
  check_type: string;
  url: string;
  status: string;
  details: string;
  severity: string;
  created_at: string;
}

type TabId = 'overview' | 'pages' | 'redirects' | 'sitemap' | 'health' | 'settings';

const tabs = [
  { id: 'overview' as TabId, label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'pages' as TabId, label: 'Trang', icon: FileText },
  { id: 'redirects' as TabId, label: 'Chuyển hướng', icon: GitBranch },
  { id: 'sitemap' as TabId, label: 'Sitemap', icon: Map },
  { id: 'health' as TabId, label: 'Sức khỏe', icon: HeartPulse },
  { id: 'settings' as TabId, label: 'Cài đặt', icon: Settings },
];

export default function SeoDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState<SeoStats | null>(null);
  
  // Pages state
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [pagesPagination, setPagesPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [pagesSearch, setPagesSearch] = useState('');
  const [editingPage, setEditingPage] = useState<SeoPage | null>(null);
  
  // Redirects state
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [redirectsPagination, setRedirectsPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [showRedirectForm, setShowRedirectForm] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  
  // Sitemap state
  const [sitemapData, setSitemapData] = useState<{ urls: any[]; stats: any; sitemapXml: string } | null>(null);
  
  // Health state
  const [healthIssues, setHealthIssues] = useState<HealthIssue[]>([]);
  const [healthStats, setHealthStats] = useState<any>(null);
  
  // Settings state
  const [settings, setSettings] = useState<Record<string, any>>({});

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seo/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Fetch pages
  const fetchPages = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagesPagination.page.toString(),
        pageSize: pagesPagination.pageSize.toString(),
        ...(pagesSearch && { q: pagesSearch }),
      });
      const res = await fetch(`/api/admin/seo/pages?${params}`);
      const data = await res.json();
      if (data.success) {
        setPages(data.data.pages);
        setPagesPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  }, [pagesPagination.page, pagesPagination.pageSize, pagesSearch]);

  // Fetch redirects
  const fetchRedirects = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: redirectsPagination.page.toString(),
        pageSize: redirectsPagination.pageSize.toString(),
      });
      const res = await fetch(`/api/admin/seo/redirects?${params}`);
      const data = await res.json();
      if (data.success) {
        setRedirects(data.data.redirects);
        setRedirectsPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
    }
  }, [redirectsPagination.page, redirectsPagination.pageSize]);

  // Fetch sitemap
  const fetchSitemap = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seo/sitemap');
      const data = await res.json();
      if (data.success) {
        setSitemapData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    }
  }, []);

  // Fetch health
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seo/health');
      const data = await res.json();
      if (data.success) {
        setHealthIssues(data.data.issues);
        setHealthStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seo/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Load tab data
  useEffect(() => {
    switch (activeTab) {
      case 'pages':
        fetchPages();
        break;
      case 'redirects':
        fetchRedirects();
        break;
      case 'sitemap':
        fetchSitemap();
        break;
      case 'health':
        fetchHealth();
        break;
      case 'settings':
        fetchSettings();
        break;
    }
  }, [activeTab, fetchPages, fetchRedirects, fetchSitemap, fetchHealth, fetchSettings]);

  // Save page
  const handleSavePage = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setEditingPage(null);
        fetchPages();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to save page:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run health check
  const handleRunHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/health', {
        method: 'POST',
      });
      if (res.ok) {
        fetchHealth();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to run health check:', error);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate sitemap
  const handleRegenerateSitemap = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/sitemap', {
        method: 'POST',
      });
      if (res.ok) {
        fetchSitemap();
      }
    } catch (error) {
      console.error('Failed to regenerate sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings: Record<string, any>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete redirect
  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chuyển hướng này?')) return;
    
    try {
      const res = await fetch(`/api/admin/seo/redirects?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchRedirects();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete redirect:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">SEO Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Quản lý và tối ưu hóa SEO cho website
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
              <span className="text-gray-400">SEO Score:</span>
              <span className={`text-xl font-bold ${
                stats.seoScore >= 80 ? 'text-green-400' :
                stats.seoScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.seoScore}
              </span>
              <span className="text-gray-500">/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Top Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* SEO Score */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Điểm SEO</h3>
                  <div className="flex justify-center">
                    <SeoScoreGauge score={stats.seoScore} size={200} />
                  </div>
                </div>

                {/* Core Web Vitals */}
                <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Core Web Vitals</h3>
                  <CoreWebVitalsChart vitals={stats.coreWebVitals} />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.pages.total}</p>
                      <p className="text-sm text-gray-400">Tổng trang</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <Globe className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.pages.indexed}</p>
                      <p className="text-sm text-gray-400">Đã index</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <GitBranch className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.redirects.total}</p>
                      <p className="text-sm text-gray-400">Chuyển hướng</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      stats.health.errors > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      <HeartPulse className={`w-6 h-6 ${
                        stats.health.errors > 0 ? 'text-red-400' : 'text-green-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.health.totalIssues}</p>
                      <p className="text-sm text-gray-400">Vấn đề SEO</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traffic & Keywords */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Lưu lượng organic (30 ngày)</h3>
                  <TrafficChart data={stats.traffic} />
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Top từ khóa</h3>
                  <div className="space-y-3">
                    {stats.topKeywords.map((kw, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-white">{kw.keyword}</p>
                          <p className="text-sm text-gray-400">Volume: {kw.volume}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            kw.position <= 3 ? 'bg-green-500/20 text-green-400' :
                            kw.position <= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            #{kw.position}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Alerts */}
              {stats.recentAlerts.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Cảnh báo gần đây</h3>
                  <div className="space-y-2">
                    {stats.recentAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          alert.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                          alert.severity === 'high' ? 'bg-orange-500/10 border border-orange-500/20' :
                          'bg-yellow-500/10 border border-yellow-500/20'
                        }`}
                      >
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.severity === 'critical' ? 'text-red-400' :
                          alert.severity === 'high' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-white">{alert.message}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(alert.date).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-4">
              {/* Search & Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={pagesSearch}
                    onChange={(e) => setPagesSearch(e.target.value)}
                    placeholder="Tìm kiếm URL, tiêu đề..."
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => { setEditingPage({ id: '', url: '', title: '', description: '', keywords: '', og_image: '', og_title: '', og_description: '', canonical_url: '', robots_meta: 'index,follow', priority: 0.5, changefreq: 'weekly', is_indexed: true } as SeoPage); }} leftIcon={<Plus className="w-4 h-4" />}>
                  Thêm trang
                </Button>
              </div>

              {/* Editor Modal */}
              {editingPage && (
                <MetaEditor
                  page={editingPage}
                  onSave={handleSavePage}
                  onCancel={() => setEditingPage(null)}
                />
              )}

              {/* Pages Table */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">URL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tiêu đề</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Index</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.map((page) => (
                        <tr key={page.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-sm text-gray-300 truncate max-w-[200px]">
                            {page.url}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300 truncate max-w-[250px]">
                            {page.title || <span className="text-red-400 italic">Chưa có tiêu đề</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              page.is_indexed ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setEditingPage(page)}
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-gray-800">
                  <span className="text-sm text-gray-400">
                    Hiển thị {pages.length} / {pagesPagination.total} trang
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagesPagination.page <= 1}
                      onClick={() => setPagesPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagesPagination.page >= pagesPagination.totalPages}
                      onClick={() => setPagesPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Redirects Tab */}
          {activeTab === 'redirects' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={() => setShowRedirectForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Thêm chuyển hướng
                </Button>
                <Button variant="secondary" leftIcon={<Upload className="w-4 h-4" />}>
                  Import CSV
                </Button>
              </div>
              
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <RedirectTable
                  redirects={redirects}
                  onEdit={(redirect) => {
                    setEditingRedirect(redirect);
                    setShowRedirectForm(true);
                  }}
                  onDelete={handleDeleteRedirect}
                />
              </div>
            </div>
          )}

          {/* Sitemap Tab */}
          {activeTab === 'sitemap' && sitemapData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button
                  onClick={handleRegenerateSitemap}
                  isLoading={loading}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Tạo lại Sitemap
                </Button>
                <Button variant="secondary" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                    Xem Sitemap
                  </a>
                </Button>
              </div>
              
              <SitemapViewer
                urls={sitemapData.urls}
                stats={sitemapData.stats}
                xmlContent={sitemapData.sitemapXml}
              />
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button
                  onClick={handleRunHealthCheck}
                  isLoading={loading}
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Chạy kiểm tra
                </Button>
              </div>

              {healthStats && (
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <p className="text-2xl font-bold text-white">{healthStats.totalIssues}</p>
                    <p className="text-sm text-gray-400">Tổng vấn đề</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 border border-red-500/20">
                    <p className="text-2xl font-bold text-red-400">{healthStats.errors}</p>
                    <p className="text-sm text-gray-400">Lỗi</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 border border-yellow-500/20">
                    <p className="text-2xl font-bold text-yellow-400">{healthStats.warnings}</p>
                    <p className="text-sm text-gray-400">Cảnh báo</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 border border-green-500/20">
                    <p className="text-2xl font-bold text-green-400">{healthStats.passed || 0}</p>
                    <p className="text-sm text-gray-400">Đạt</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Loại</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">URL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Chi tiết</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Mức độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthIssues.map((issue) => (
                        <tr key={issue.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-sm text-gray-300 capitalize">
                            {issue.check_type.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300 truncate max-w-[200px]">
                            {issue.url}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {issue.details}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                              issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {issue.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} onSave={handleSaveSettings} loading={loading} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ settings, onSave, loading }: { settings: Record<string, any>; onSave: (s: any) => void; loading: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Cài đặt mặc định</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tiêu đề mặc định</label>
            <Input
              value={localSettings.default_title || ''}
              onChange={(e) => handleChange('default_title', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Mô tả mặc định</label>
            <textarea
              value={localSettings.default_description || ''}
              onChange={(e) => handleChange('default_description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Từ khóa mặc định</label>
            <Input
              value={localSettings.default_keywords || ''}
              onChange={(e) => handleChange('default_keywords', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Xác minh công cụ tìm kiếm</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Google Verification Code</label>
            <Input
              value={localSettings.google_verification || ''}
              onChange={(e) => handleChange('google_verification', e.target.value)}
              placeholder="google-site-verification=..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Bing Verification Code</label>
            <Input
              value={localSettings.bing_verification || ''}
              onChange={(e) => handleChange('bing_verification', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Social Media</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Facebook App ID</label>
            <Input
              value={localSettings.facebook_app_id || ''}
              onChange={(e) => handleChange('facebook_app_id', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Twitter Handle</label>
            <Input
              value={localSettings.twitter_site || ''}
              onChange={(e) => handleChange('twitter_site', e.target.value)}
              placeholder="@username"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Robots.txt</h3>
        <textarea
          value={localSettings.robots_txt || ''}
          onChange={(e) => handleChange('robots_txt', e.target.value)}
          rows={10}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onSave(localSettings)}
          isLoading={loading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}