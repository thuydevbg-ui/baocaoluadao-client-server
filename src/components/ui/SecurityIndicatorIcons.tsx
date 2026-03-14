'use client';

import React, { useState, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  Globe,
  Globe2,
  Crown,
  Shield,
  ShieldCheck,
  ShieldX,
  TrendingUp,
  TrendingDown,
  Minus,
  Network,
  Server,
  Mail,
  MailOpen,
  Archive,
  History,
  Image,
  Eye,
  Brain,
  Bug,
  AlertOctagon,
  Skull,
  Fish,
  ShoppingCart,
  DollarSign,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ==================== TYPES ====================

export type RiskLevel = 'safe' | 'warning' | 'danger' | 'unknown' | 'info';

export interface SecuritySignalData {
  domainAge?: {
    days: number;
    registeredDate: string;
    registrar?: string;
  };
  sslStatus?: {
    valid: boolean;
    issuer?: string;
    expiryDate?: string;
    hasEV?: boolean;
  };
  hostingCountry?: {
    countryCode: string;
    countryName: string;
    city?: string;
    isProxy?: boolean;
    isVPN?: boolean;
  };
  brandImpersonation?: {
    score: number;
    matchedBrand?: string;
    similarityType?: 'logo' | 'name' | 'domain' | 'content';
  };
  googleSafeBrowsing?: {
    status: 'safe' | 'phishing' | 'malware' | 'unwanted' | 'unknown';
    lastChecked: string;
    detailsUrl?: string;
  };
  traffic?: {
    rank?: number;
    monthlyVisits?: number;
    trend?: 'up' | 'down' | 'stable';
  };
  dnsProvider?: {
    name: string;
    ip?: string;
    isKnownProvider?: boolean;
  };
  mxRecords?: {
    hasMX: boolean;
    servers?: string[];
    hasSPF?: boolean;
    hasDMARC?: boolean;
  };
  archive?: {
    hasSnapshots: boolean;
    firstSnapshot?: string;
    lastSnapshot?: string;
    snapshotCount?: number;
  };
  screenshot?: {
    url?: string;
    lastCaptured?: string;
  };
  aiRisk?: {
    score: number;
    factors?: string[];
    modelVersion?: string;
  };
  threatCategory?: {
    category: string;
    subcategory?: string;
    confidence: number;
  };
}

export type SecurityIndicatorType =
  | 'domainAge'
  | 'ssl'
  | 'hostingCountry'
  | 'brandImpersonation'
  | 'googleSafeBrowsing'
  | 'traffic'
  | 'dns'
  | 'mxRecords'
  | 'archive'
  | 'screenshot'
  | 'aiRisk'
  | 'threatCategory';

// ==================== UTILITIES ====================

const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'safe': return '#22c55e';
    case 'warning': return '#eab308';
    case 'danger': return '#ef4444';
    case 'unknown': return '#6b7280';
    case 'info': return '#3b82f6';
    default: return '#6b7280';
  }
};

const getRiskBgColor = (level: RiskLevel): string => {
  switch (level) {
    case 'safe': return 'rgba(34, 197, 94, 0.1)';
    case 'warning': return 'rgba(234, 179, 8, 0.1)';
    case 'danger': return 'rgba(239, 68, 68, 0.1)';
    case 'unknown': return 'rgba(107, 114, 128, 0.1)';
    case 'info': return 'rgba(59, 130, 246, 0.1)';
    default: return 'rgba(107, 114, 128, 0.1)';
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getDomainAgeRisk = (days: number): RiskLevel => {
  if (days < 30) return 'danger';
  if (days < 90) return 'warning';
  if (days < 365) return 'info';
  return 'safe';
};

const getTrafficRisk = (rank?: number): RiskLevel => {
  if (!rank) return 'unknown';
  if (rank < 1000) return 'safe';
  if (rank < 10000) return 'info';
  if (rank < 100000) return 'warning';
  return 'danger';
};

// ==================== ICONS ====================

const DomainAgeIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const days = data.domainAge?.days ?? 0;
  const risk = getDomainAgeRisk(days);
  return <Clock size={size} color={getRiskColor(risk)} strokeWidth={2} />;
};

const SSLIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const valid = data.sslStatus?.valid ?? false;
  const hasEV = data.sslStatus?.hasEV ?? false;
  const color = valid ? getRiskColor('safe') : getRiskColor('danger');
  if (!valid) return <Unlock size={size} color={color} strokeWidth={2} />;
  if (hasEV) return <Crown size={size} color={color} strokeWidth={2} />;
  return <Lock size={size} color={color} strokeWidth={2} />;
};

const HostingCountryIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const isProxy = data.hostingCountry?.isProxy ?? false;
  const risk = isProxy ? 'danger' : 'info';
  return <Globe2 size={size} color={getRiskColor(risk)} strokeWidth={2} />;
};

const BrandImpersonationIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const score = data.brandImpersonation?.score ?? 0;
  let risk: RiskLevel = 'safe';
  if (score >= 80) risk = 'danger';
  else if (score >= 60) risk = 'warning';
  else if (score >= 40) risk = 'info';
  return <Crown size={size} color={getRiskColor(risk)} strokeWidth={2} />;
};

const GoogleSafeBrowsingIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const status = data.googleSafeBrowsing?.status ?? 'unknown';
  let Icon = Shield;
  let color = getRiskColor('unknown');
  switch (status) {
    case 'safe': Icon = ShieldCheck; color = getRiskColor('safe'); break;
    case 'phishing':
    case 'malware':
    case 'unwanted': Icon = ShieldX; color = getRiskColor('danger'); break;
  }
  return <Icon size={size} color={color} strokeWidth={2} />;
};

const TrafficIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const trend = data.traffic?.trend ?? 'stable';
  const risk = getTrafficRisk(data.traffic?.rank);
  if (trend === 'up') return <TrendingUp size={size} color={getRiskColor(risk)} strokeWidth={2} />;
  if (trend === 'down') return <TrendingDown size={size} color={getRiskColor(risk)} strokeWidth={2} />;
  return <Minus size={size} color={getRiskColor(risk)} strokeWidth={2} />;
};

const DNSIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const isKnown = data.dnsProvider?.isKnownProvider ?? false;
  const color = isKnown ? getRiskColor('safe') : getRiskColor('info');
  return <Network size={size} color={color} strokeWidth={2} />;
};

const MXRecordsIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const hasMX = data.mxRecords?.hasMX ?? false;
  const hasSPF = data.mxRecords?.hasSPF ?? false;
  const hasDMARC = data.mxRecords?.hasDMARC ?? false;
  const color = hasMX && hasSPF && hasDMARC ? getRiskColor('safe') : hasMX ? getRiskColor('warning') : getRiskColor('danger');
  const Icon = hasMX ? Mail : MailOpen;
  return <Icon size={size} color={color} strokeWidth={2} />;
};

const ArchiveIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const hasSnapshots = data.archive?.hasSnapshots ?? false;
  const count = data.archive?.snapshotCount ?? 0;
  const color = hasSnapshots ? (count > 10 ? getRiskColor('safe') : getRiskColor('warning')) : getRiskColor('danger');
  return <Archive size={size} color={color} strokeWidth={2} />;
};

const ScreenshotIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const hasScreenshot = !!data.screenshot?.url;
  const color = hasScreenshot ? getRiskColor('safe') : getRiskColor('unknown');
  return <Image size={size} color={color} strokeWidth={2} />;
};

const AIRiskIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const score = data.aiRisk?.score ?? 0;
  let risk: RiskLevel = 'safe';
  if (score >= 70) risk = 'danger';
  else if (score >= 50) risk = 'warning';
  else if (score >= 30) risk = 'info';
  return <Brain size={size} color={getRiskColor(risk)} strokeWidth={2} />;
};

const ThreatCategoryIcon: React.FC<{ data: SecuritySignalData; size?: number }> = ({ data, size = 16 }) => {
  const category = data.threatCategory?.category ?? '';
  let Icon = Bug;
  let color = getRiskColor('unknown');
  const cat = category.toLowerCase();
  if (cat.includes('phishing')) { Icon = Fish; color = getRiskColor('danger'); }
  else if (cat.includes('fake') || cat.includes('store')) { Icon = ShoppingCart; color = getRiskColor('danger'); }
  else if (cat.includes('crypto')) { Icon = DollarSign; color = getRiskColor('danger'); }
  else if (cat.includes('malware')) { Icon = Skull; color = getRiskColor('danger'); }
  else if (cat.includes('scam')) { Icon = AlertOctagon; color = getRiskColor('danger'); }
  else if (cat.includes('social')) { Icon = Users; color = getRiskColor('warning'); }
  return <Icon size={size} color={color} strokeWidth={2} />;
};

// ==================== TOOLTIP ====================

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setShow(true), 300);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setShow(false);
  };

  return (
    <div className="relative inline-flex" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs whitespace-nowrap bg-gray-900 text-white rounded-md shadow-lg z-50 pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== MODAL ====================

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: SecurityIndicatorType;
  data: SecuritySignalData;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, type, data }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'domainAge':
        return {
          title: 'Domain Age - Tuổi Domain',
          icon: <Clock size={32} />,
          content: data.domainAge ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Domain <strong>{data.domainAge.days} ngày</strong> tuổi
                (đăng ký ngày {new Date(data.domainAge.registeredDate).toLocaleDateString('vi-VN')})
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ⚠️ <strong>Why it matters:</strong> Các domain lừa đảo thường có tuổi đời rất ngắn (dưới 30 ngày). 
                Domain trên 1 năm có độ tin cậy cao hơn đáng kể.
              </p>
              {data.domainAge.registrar && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">📝 Registrar: {data.domainAge.registrar}</p>
              )}
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu tuổi domain</p>,
          risk: getDomainAgeRisk(data.domainAge?.days ?? 0) as RiskLevel,
        };

      case 'ssl':
        return {
          title: 'SSL Certificate - Chứng chỉ SSL',
          icon: data.sslStatus?.valid ? <Lock size={32} /> : <Unlock size={32} />,
          content: data.sslStatus ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {data.sslStatus.valid ? '✅ Chứng chỉ SSL hợp lệ' : '❌ Chứng chỉ SSL không hợp lệ'}
              </p>
              {data.sslStatus.issuer && <p className="text-xs text-gray-500 dark:text-gray-400">🏢 Issuer: {data.sslStatus.issuer}</p>}
              {data.sslStatus.expiryDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 Hết hạn: {new Date(data.sslStatus.expiryDate).toLocaleDateString('vi-VN')}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Chứng chỉ SSL xác nhận danh tính website. 
                Các trang lừa đảo thường sử dụng SSL miễn phí hoặc chứng chỉ tự ký.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu SSL</p>,
          risk: data.sslStatus?.valid ? 'safe' : 'danger' as RiskLevel,
        };

      case 'hostingCountry':
        return {
          title: 'Hosting Country - Quốc gia Server',
          icon: <Globe2 size={32} />,
          content: data.hostingCountry ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                🌍 Server đặt tại: <strong>{data.hostingCountry.countryName}</strong>
                {data.hostingCountry.city && ` (${data.hostingCountry.city})`}
              </p>
              {data.hostingCountry.isProxy && <p className="text-xs text-red-500 mt-1">🚨 Phát hiện Proxy/VPN!</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Các trang lừa đảo thường đặt server ở các quốc gia có luật pháp lỏng lẻo. 
                Server tại US/EU có độ tin cậy cao hơn.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu hosting</p>,
          risk: data.hostingCountry?.isProxy ? 'danger' : 'info' as RiskLevel,
        };

      case 'brandImpersonation':
        return {
          title: 'Brand Impersonation - Giả mạo Thương hiệu',
          icon: <Crown size={32} />,
          content: data.brandImpersonation ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                🎯 Điểm giống: <strong>{data.brandImpersonation.score}%</strong>
              </p>
              {data.brandImpersonation.matchedBrand && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🏷️ Thương hiệu bị giả mạo: <strong>{data.brandImpersonation.matchedBrand}</strong>
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Tội phạm mạng thường giả mạo các thương hiệu lớn để lừa đảo nạn nhân. 
                Điểm similarity trên 60% là nghi ngờ cao.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu brand impersonation</p>,
          risk: (data.brandImpersonation?.score ?? 0) >= 80 ? 'danger' : (data.brandImpersonation?.score ?? 0) >= 60 ? 'warning' : 'safe' as RiskLevel,
        };

      case 'googleSafeBrowsing':
        return {
          title: 'Google Safe Browsing',
          icon: data.googleSafeBrowsing?.status === 'safe' ? <ShieldCheck size={32} /> : <ShieldX size={32} />,
          content: data.googleSafeBrowsing ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {data.googleSafeBrowsing.status === 'safe' ? '✅ An toàn theo Google' : `🚨 Phát hiện mối đe dọa: ${data.googleSafeBrowsing.status}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                📅 Kiểm tra lần cuối: {new Date(data.googleSafeBrowsing.lastChecked).toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Google Safe Browsing là cơ sở dữ liệu đe dọa lớn nhất thế giới. 
                Kết quả từ Google là signal quan trọng nhất để xác định website độc hại.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu Google Safe Browsing</p>,
          risk: data.googleSafeBrowsing?.status === 'safe' ? 'safe' : 'danger' as RiskLevel,
        };

      case 'traffic':
        return {
          title: 'Website Traffic - Lưu lượng truy cập',
          icon: <TrendingUp size={32} />,
          content: data.traffic ? (
            <>
              {data.traffic.rank ? (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">📊 Alexa Rank: <strong>#{formatNumber(data.traffic.rank)}</strong></p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">📊 Không có dữ liệu traffic</p>
              )}
              {data.traffic.monthlyVisits && (
                <p className="text-xs text-gray-500 dark:text-gray-400">👥 Lượt truy cập/tháng: <strong>{formatNumber(data.traffic.monthlyVisits)}</strong></p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Website lừa đảo thường có traffic rất thấp hoặc traffic bất thường.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu traffic</p>,
          risk: getTrafficRisk(data.traffic?.rank) as RiskLevel,
        };

      case 'dns':
        return {
          title: 'DNS Provider - Nhà cung cấp DNS',
          icon: <Network size={32} />,
          content: data.dnsProvider ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">🌍 DNS Provider: <strong>{data.dnsProvider.name}</strong></p>
              {data.dnsProvider.ip && <p className="text-xs text-gray-500 dark:text-gray-400">📍 IP: {data.dnsProvider.ip}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Các nhà cung cấp DNS đáng tin cậy (Cloudflare, Google, Quad9) có hệ thống bảo mật tốt.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu DNS</p>,
          risk: data.dnsProvider?.isKnownProvider ? 'safe' : 'info' as RiskLevel,
        };

      case 'mxRecords':
        return {
          title: 'MX Records - Cấu hình Email',
          icon: <Mail size={32} />,
          content: data.mxRecords ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">📧 MX Records: {data.mxRecords.hasMX ? '✅ Có' : '❌ Không có'}</p>
              {data.mxRecords.servers && data.mxRecords.servers.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">🖥️ Servers: {data.mxRecords.servers.join(', ')}</p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                <p>🔐 SPF: {data.mxRecords.hasSPF ? '✅' : '❌'}</p>
                <p>🛡️ DMARC: {data.mxRecords.hasDMARC ? '✅' : '❌'}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Email authentication (SPF/DKIM/DMARC) giúp ngăn chặn email giả mạo.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu MX</p>,
          risk: data.mxRecords?.hasMX && data.mxRecords?.hasSPF && data.mxRecords?.hasDMARC ? 'safe' : data.mxRecords?.hasMX ? 'warning' : 'danger' as RiskLevel,
        };

      case 'archive':
        return {
          title: 'Archive History - Lịch sử Lưu trữ',
          icon: <Archive size={32} />,
          content: data.archive ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">📚 Số snapshot: <strong>{data.archive.snapshotCount ?? 0}</strong></p>
              {data.archive.firstSnapshot && (
                <p className="text-xs text-gray-500 dark:text-gray-400">📅 Snapshot đầu tiên: {new Date(data.archive.firstSnapshot).toLocaleDateString('vi-VN')}</p>
              )}
              {data.archive.lastSnapshot && (
                <p className="text-xs text-gray-500 dark:text-gray-400">🕐 Snapshot cuối: {new Date(data.archive.lastSnapshot).toLocaleDateString('vi-VN')}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Wayback Machine lưu trữ lịch sử website. Không có snapshot là dấu hiệu domain mới/đáng ngờ.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu archive</p>,
          risk: data.archive?.hasSnapshots && (data.archive?.snapshotCount ?? 0) > 10 ? 'safe' : data.archive?.hasSnapshots ? 'warning' : 'danger' as RiskLevel,
        };

      case 'screenshot':
        return {
          title: 'Screenshot Preview - Ảnh Preview',
          icon: <Image size={32} />,
          content: data.screenshot ? (
            <>
              {data.screenshot.url && (
                <div className="mb-3">
                  <img src={data.screenshot.url} alt="Website screenshot" className="w-full h-auto rounded border border-gray-200 dark:border-gray-700" />
                </div>
              )}
              {data.screenshot.lastCaptured && (
                <p className="text-xs text-gray-500 dark:text-gray-400">📸 Chụp lần cuối: {new Date(data.screenshot.lastCaptured).toLocaleString('vi-VN')}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Screenshot giúp nhanh chóng đánh giá giao diện website mà không cần truy cập trực tiếp.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có screenshot</p>,
          risk: data.screenshot?.url ? 'safe' : 'unknown' as RiskLevel,
        };

      case 'aiRisk':
        return {
          title: 'AI Risk Score - Điểm Rủi ro AI',
          icon: <Brain size={32} />,
          content: data.aiRisk ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">🤖 AI Risk Score: <strong>{data.aiRisk.score}/100</strong></p>
              {data.aiRisk.factors && data.aiRisk.factors.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <p className="font-medium mb-1">Yếu tố rủi ro:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {data.aiRisk.factors.map((factor, i) => <li key={i}>{factor}</li>)}
                  </ul>
                </div>
              )}
              {data.aiRisk.modelVersion && <p className="text-xs text-gray-500 dark:text-gray-400">🔬 Model: {data.aiRisk.modelVersion}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> AI phân tích hàng trăm signal để đưa ra đánh giá rủi ro tổng hợp.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu AI</p>,
          risk: (data.aiRisk?.score ?? 0) >= 70 ? 'danger' : (data.aiRisk?.score ?? 0) >= 50 ? 'warning' : 'safe' as RiskLevel,
        };

      case 'threatCategory':
        return {
          title: 'Threat Category - Loại Mối đe dọa',
          icon: <Bug size={32} />,
          content: data.threatCategory ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">🏷️ Loại đe dọa: <strong>{data.threatCategory.category}</strong></p>
              {data.threatCategory.subcategory && <p className="text-xs text-gray-500 dark:text-gray-400">📂 Subcategory: {data.threatCategory.subcategory}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">🎯 Confidence: {data.threatCategory.confidence}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ <strong>Why it matters:</strong> Xác định loại lừa đảo giúp người dùng nhận biết chiến thuật và tránh bị lừa.
              </p>
            </>
          ) : <p className="text-sm text-gray-500">Không có dữ liệu threat category</p>,
          risk: 'danger' as RiskLevel,
        };

      default:
        return {
          title: 'Security Indicator',
          icon: <Shield size={32} />,
          content: <p className="text-sm text-gray-500">Không có dữ liệu</p>,
          risk: 'unknown' as RiskLevel,
        };
    }
  };

  const { title, icon, content, risk } = renderContent();
  const riskColor = getRiskColor(risk);
  const riskBgColor = getRiskBgColor(risk);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: riskBgColor }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: riskColor, color: 'white' }}>{icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">{content}</div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== MAIN COMPONENT ====================

const INDICATOR_CONFIG: Record<SecurityIndicatorType, { icon: React.FC<{ data: SecuritySignalData; size?: number }>; tooltip: string }> = {
  domainAge: { icon: DomainAgeIcon, tooltip: 'Domain Age' },
  ssl: { icon: SSLIcon, tooltip: 'SSL Certificate' },
  hostingCountry: { icon: HostingCountryIcon, tooltip: 'Hosting Country' },
  brandImpersonation: { icon: BrandImpersonationIcon, tooltip: 'Brand Impersonation' },
  googleSafeBrowsing: { icon: GoogleSafeBrowsingIcon, tooltip: 'Google Safe Browsing' },
  traffic: { icon: TrafficIcon, tooltip: 'Website Traffic' },
  dns: { icon: DNSIcon, tooltip: 'DNS Provider' },
  mxRecords: { icon: MXRecordsIcon, tooltip: 'MX Records' },
  archive: { icon: ArchiveIcon, tooltip: 'Archive History' },
  screenshot: { icon: ScreenshotIcon, tooltip: 'Screenshot Preview' },
  aiRisk: { icon: AIRiskIcon, tooltip: 'AI Risk Score' },
  threatCategory: { icon: ThreatCategoryIcon, tooltip: 'Threat Category' },
};

export const SecurityIndicatorIcons: React.FC<{
  data: SecuritySignalData;
  showAll?: boolean;
  onIconClick?: (type: SecurityIndicatorType) => void;
}> = ({ data, showAll = true, onIconClick }) => {
  const [activeModal, setActiveModal] = useState<SecurityIndicatorType | null>(null);

  const handleIconClick = useCallback((type: SecurityIndicatorType) => {
    setActiveModal(type);
    onIconClick?.(type);
  }, [onIconClick]);

  const indicators = Object.entries(INDICATOR_CONFIG).filter(([type]) => {
    const key = type as SecurityIndicatorType;
    switch (key) {
      case 'domainAge': return !!data.domainAge;
      case 'ssl': return !!data.sslStatus;
      case 'hostingCountry': return !!data.hostingCountry;
      case 'brandImpersonation': return !!data.brandImpersonation;
      case 'googleSafeBrowsing': return !!data.googleSafeBrowsing;
      case 'traffic': return !!data.traffic;
      case 'dns': return !!data.dnsProvider;
      case 'mxRecords': return !!data.mxRecords;
      case 'archive': return !!data.archive;
      case 'screenshot': return !!data.screenshot;
      case 'aiRisk': return !!data.aiRisk;
      case 'threatCategory': return !!data.threatCategory;
      default: return false;
    }
  });

  if (indicators.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {indicators.slice(0, showAll ? 12 : 4).map(([type, config]) => {
          const IconComponent = config.icon;
          return (
            <Tooltip key={type} content={config.tooltip}>
              <button
                type="button"
                onClick={() => handleIconClick(type as SecurityIndicatorType)}
                className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 cursor-pointer"
                style={{ transform: 'scale(1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <IconComponent data={data} size={16} />
              </button>
            </Tooltip>
          );
        })}
      </div>
      {activeModal && (
        <SecurityModal isOpen={true} onClose={() => setActiveModal(null)} type={activeModal} data={data} />
      )}
    </>
  );
};
