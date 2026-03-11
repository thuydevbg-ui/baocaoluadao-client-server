'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Phone,
  Building2,
  Globe,
  Wallet,
  AlertTriangle,
  Clock,
  Shield,
  MessageCircle,
  ThumbsUp,
  Calendar,
  Share2,
  Eye,
  Flag,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  Loader2,
  SendHorizonal,
  AlertOctagon,
  Bot,
  FileWarning,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Chip, RiskBadge, DetailSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/contexts/I18nContext';
import { cn, type ScamDetail, type RiskLevel, sanitizeHTML, formatNumber } from '@/lib/utils';

type ScamKind = 'phone' | 'bank' | 'website' | 'crypto';
type SourceStatus = 'trusted' | 'confirmed' | 'suspected' | 'unknown';

interface DetailSourceMeta {
  status?: string;
  reports?: number;
  riskScore?: number;
  policyViolation?: boolean;
  policySourceUrl?: string;
  policySourceTitle?: string;
  policySummary?: string;
  firstSeen?: string;
  lastReported?: string;
  description?: string;
  organization?: string;
  sourceUrl?: string;
  source?: string;
  sourceLink?: string;
  sourceCategory?: string;
  sourceMode?: string;
  sourceIcon?: string;
  sourceTitle?: string;
  sourceName?: string;
}

interface DetailInsight {
  riskSignals: string[];
  recommendations: string[];
  channels: string[];
  related: string[];
  timeline: { label: string; value: string; tone?: 'danger' | 'warning' | 'neutral' }[];
  source: string;
  confidence: number;
  updatedAt: string;
  status: SourceStatus;
  statusLabel: string;
  sourceLink?: string;
  sourceIcon?: string;
  typeLabel: string;
  isTrustedEntity: boolean;
}

interface SearchParamReader {
  get: (name: string) => string | null;
}

interface CategoryLookupItem {
  name?: string;
  status?: string;
  description?: string;
  count_report?: string;
  created_at?: string;
  link?: string;
  organization?: string;
  icon?: string;
  organization_icon?: string;
}

interface CategoryLookupResponse {
  success?: boolean;
  source?: string;
  mode?: string;
  category?: string;
  items?: CategoryLookupItem[];
}

interface PolicyViolationLookupResponse {
  success?: boolean;
  found?: boolean;
  item?: {
    domain: string;
    violationSummary: string | null;
    sourceName: string;
    sourceUrl: string;
    sourceTitle: string | null;
    updatedAt: string;
  };
  error?: string;
}

interface FeedbackCommentDto {
  id: string;
  user: string;
  avatar: string;
  text: string;
  helpful: number;
  rating?: number | null;
  verified?: boolean;
  helpfulMarked?: boolean;
  canMarkHelpful?: boolean;
  createdAt: string;
}

interface FeedbackCommentView {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: number;
  helpful: number;
  rating: number | null;
  verified: boolean;
  helpfulMarked: boolean;
  canMarkHelpful: boolean;
}

interface FeedbackStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface DetailFeedbackResponse {
  success: boolean;
  error?: string;
  message?: string;
  comments?: FeedbackCommentDto[];
  ratingStats?: FeedbackStats;
  myRating?: number | null;
  canRate?: boolean;
}

const DEFAULT_FEEDBACK_STATS: FeedbackStats = {
  average: 0,
  total: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

function mergeSourceMeta(base: DetailSourceMeta, override: DetailSourceMeta): DetailSourceMeta {
  const keepString = (value?: string, fallback?: string) => {
    if (value === undefined || value === null) return fallback;
    return value === '' ? fallback : value;
  };

  return {
    status: keepString(override.status, base.status),
    reports: override.reports ?? base.reports,
    riskScore: override.riskScore ?? base.riskScore,
    policyViolation: override.policyViolation ?? base.policyViolation,
    policySourceUrl: keepString(override.policySourceUrl, base.policySourceUrl),
    policySourceTitle: keepString(override.policySourceTitle, base.policySourceTitle),
    policySummary: keepString(override.policySummary, base.policySummary),
    firstSeen: keepString(override.firstSeen, base.firstSeen),
    lastReported: keepString(override.lastReported, base.lastReported),
    description: keepString(override.description, base.description),
    organization: keepString(override.organization, base.organization),
    source: keepString(override.source, base.source),
    sourceLink: keepString(override.sourceLink, base.sourceLink),
    sourceCategory: keepString(override.sourceCategory, base.sourceCategory),
    sourceMode: keepString(override.sourceMode, base.sourceMode),
    sourceIcon: keepString(override.sourceIcon, base.sourceIcon),
  };
}

const TYPE_LABEL: Record<ScamKind, string> = {
  phone: 'Lừa đảo cuộc gọi/SMS',
  bank: 'Mạo danh ngân hàng/tài chính',
  website: 'Website giả mạo/phishing',
  crypto: 'Lừa đảo ví/đầu tư crypto',
};

const TRUSTED_CATEGORY_LABEL: Record<string, string> = {
  organizations: 'Tổ chức tín nhiệm',
  websites: 'Website tín nhiệm',
  devices: 'Thiết bị tín nhiệm',
  systems: 'Hệ thống tín nhiệm',
  apps: 'Ứng dụng tín nhiệm',
};

function parseParam(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

function decodeRouteValue(raw: string): string {
  if (!raw) return '';
  let current = raw;
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

function normalizeKind(raw: string): ScamKind {
  const value = raw.toLowerCase();
  if (value === 'phone' || value === 'bank' || value === 'website' || value === 'crypto') {
    return value;
  }
  return 'website';
}

function parsePositiveInt(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function normalizeSourceStatus(statusRaw?: string): SourceStatus {
  const status = (statusRaw || '').trim().toLowerCase();
  if (!status) return 'unknown';
  // "safe" is a scan verdict - treat as trusted for display consistency
  if (status === 'trusted' || status === 'verified' || status === 'safe') return 'trusted';
  if (status === 'confirmed' || status === 'scam') return 'confirmed';
  if (status === 'suspected' || status === 'warning' || status === 'processing') return 'suspected';
  return 'unknown';
}

function isTrustedValue(value?: string): boolean {
  return (value || '').trim().toLowerCase() === 'trusted';
}

function mapStatusToRisk(status: SourceStatus): RiskLevel {
  if (status === 'trusted') return 'safe';
  if (status === 'suspected') return 'suspicious';
  return status === 'confirmed' ? 'scam' : 'safe';
}

function mapStatusToRiskScore(status: SourceStatus, reports: number): number {
  if (status === 'trusted') {
    const reportPenalty = Math.min(30, Math.floor(reports / 4));
    return Math.max(4, 12 + reportPenalty);
  }
  if (status === 'suspected') {
    return Math.min(78, 56 + Math.min(20, Math.floor(reports / 2)));
  }
  if (status === 'confirmed') {
    return Math.min(98, 88 + Math.min(10, Math.floor(reports / 20)));
  }
  return 40;
}

function getStatusLabel(status: SourceStatus, fallbackRisk: RiskLevel): string {
  if (status === 'trusted') return 'Đã xác thực';
  if (status === 'suspected') return 'Đang xử lý';
  if (status === 'confirmed') return 'Đã xác nhận lừa đảo';
  if (fallbackRisk === 'scam') return 'Lừa đảo';
  if (fallbackRisk === 'suspicious') return 'Nghi ngờ';
  return 'An toàn';
}

function repairMojibake(value: string): string {
  if (!value) return '';
  if (!/[ÃƒÃ‚Ã„Ã…]/.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function foldViText(value: string): string {
  const repaired = repairMojibake(value || '');
  return repaired
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function normalizeCompareKey(value: string): string {
  return foldViText(decodeRouteValue(value))
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDomainKey(value: string): string {
  return foldViText(decodeRouteValue(value))
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/[^a-z0-9.-]+/g, '')
    .trim();
}

function slugifyForMatch(value: string): string {
  return foldViText(decodeRouteValue(value))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function normalizeEpochMs(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const now = Date.now();

    // Handle yyyymmddhhmmss written into BIGINT (e.g. 20260306123456)
    if (raw >= 20000101000000 && raw <= 20991231235959) {
      const year = Math.floor(raw / 10000000000);
      const month = Math.floor(raw / 100000000) % 100;
      const day = Math.floor(raw / 1000000) % 100;
      const hour = Math.floor(raw / 10000) % 100;
      const minute = Math.floor(raw / 100) % 100;
      const second = raw % 100;
      const utc = Date.UTC(year, Math.max(0, month - 1), day, hour, minute, second);
      return Number.isFinite(utc) ? utc : null;
    }

    // seconds → ms
    if (raw > 0 && raw < 100_000_000_000) return raw * 1000;

    // guard against far-future timestamps
    if (raw > now + 1000 * 60 * 60 * 24 * 365 * 5) return now;
    return raw;
  }

  const text = String(raw).trim();
  if (!text) return null;

  if (/^\d{10,17}$/.test(text)) {
    const numeric = Number.parseInt(text, 10);
    if (!Number.isFinite(numeric)) return null;
    return normalizeEpochMs(numeric);
  }

  // Handle "YYYY-MM-DD HH:mm:ss" (Safari-safe by converting to ISO-ish).
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(text)) {
    const iso = text.replace(' ', 'T');
    const parsed = Date.parse(iso);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRelativeTime(input: string | number, nowMs = Date.now()): string {
  const target = normalizeEpochMs(input) ?? nowMs;

  const diffMs = nowMs - target;
  if (diffMs < 0) return 'Vừa xong';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Vừa xong';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} phút trước`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} giờ trước`;
  return `${Math.floor(diffMs / day)} ngày trước`;
}

function toCommentView(item: FeedbackCommentDto): FeedbackCommentView {
  const createdAt = normalizeEpochMs(item.createdAt) ?? Date.now();
  return {
    id: item.id,
    user: item.user,
    avatar: item.avatar,
    text: item.text,
    helpful: item.helpful,
    rating: typeof item.rating === 'number' ? item.rating : null,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    verified: Boolean(item.verified),
    helpfulMarked: Boolean(item.helpfulMarked),
    canMarkHelpful: item.canMarkHelpful ?? !item.helpfulMarked,
  };
}

function countSentences(input: string): number {
  const normalized = input.replace(/\n+/g, ' ').trim();
  if (!normalized) return 0;
  const parts = normalized.split(/[.!?â€¦]+/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts.length : 1;
}

function hashText(value: string): number {
  let hash = 17;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function buildDetailProfile(kind: ScamKind, value: string, sourceMeta: DetailSourceMeta = {}): { detail: ScamDetail; insight: DetailInsight } {
  const idHash = hashText(`${kind}:${value}`);
  const normalizedStatus = normalizeSourceStatus(sourceMeta.status || sourceMeta.sourceMode);
  const hasSourceStatus = normalizedStatus !== 'unknown';
  const explicitUnknownStatus = (sourceMeta.status || '').trim().toLowerCase() === 'unknown';
  const sourceNameNormalized = (sourceMeta.source || '').trim().toLowerCase();
  const fromScanSource =
    sourceNameNormalized.startsWith('scan') ||
    sourceNameNormalized.includes('web_risk') ||
    sourceNameNormalized.includes('local_db');
  const reports = parsePositiveInt(sourceMeta.reports) ?? (fromScanSource ? 0 : 35 + (idHash % 240));
  const baseScoreMap: Record<ScamKind, number> = {
    phone: 86,
    bank: 90,
    website: 84,
    crypto: 88,
  };

  const keywordBoost = /(otp|verify|xac minh|trung thuong|khuyen mai|chuyen tien|bank|gov|shopee|tiktok)/i.test(value) ? 6 : 0;
  let riskScore = Math.min(98, baseScoreMap[kind] + keywordBoost + (idHash % 5));
  let risk: RiskLevel = riskScore >= 80 ? 'scam' : riskScore >= 55 ? 'suspicious' : 'safe';
  let confidence = Math.max(5, 100 - riskScore);

  const policyViolation = Boolean(sourceMeta.policyViolation);

  // For scan-driven links (source=google_web_risk/local_db/scan_unavailable), respect the explicit scan score
  // but do NOT treat it as "trusted/verified".
  const scanRiskScore = typeof sourceMeta.riskScore === 'number' ? Math.max(0, Math.min(100, Math.floor(sourceMeta.riskScore))) : undefined;
  if (normalizedStatus === 'unknown' && fromScanSource && scanRiskScore !== undefined) {
    riskScore = scanRiskScore;
    risk = riskScore >= 80 ? 'scam' : riskScore >= 55 ? 'suspicious' : 'safe';
    confidence = risk === 'safe' ? 75 : risk === 'suspicious' ? 45 : 25;
  }

  // If scan could not determine a verdict, do not auto-escalate to "scam" from heuristics.
  if (normalizedStatus === 'unknown' && explicitUnknownStatus && fromScanSource) {
    risk = 'unknown';
    riskScore = 40;
    confidence = 50;
  }

  if (hasSourceStatus) {
    risk = mapStatusToRisk(normalizedStatus);
    riskScore = mapStatusToRiskScore(normalizedStatus, reports);
    confidence =
      normalizedStatus === 'trusted'
        ? 97
        : normalizedStatus === 'confirmed'
          ? Math.max(25, 100 - Math.floor(riskScore / 2))
          : Math.max(10, 100 - riskScore);
  }

  // Policy-violation warnings must not be presented as "trusted/verified", even if other sources say "safe".
  if (policyViolation) {
    risk = 'policy';
    riskScore = scanRiskScore !== undefined ? scanRiskScore : 45;
    confidence = 70;
  }

  const isTrustedEntity = !policyViolation && (normalizedStatus === 'trusted' || isTrustedValue(sourceMeta.sourceMode));
  const typeLabel = isTrustedEntity
    ? TRUSTED_CATEGORY_LABEL[sourceMeta.sourceCategory || ''] || 'Đối tượng tín nhiệm'
    : risk === 'policy'
      ? 'Cảnh báo pháp lý'
      : risk === 'unknown'
        ? (kind === 'website' ? 'Website cần kiểm tra' : 'Đối tượng cần kiểm tra')
        : TYPE_LABEL[kind];

  const detailByType: Record<
    ScamKind,
    {
      description: string;
      channels: string[];
      riskSignals: string[];
      safeSignals: string[];
      recommendations: string[];
      safeRecommendations: string[];
      source: string;
    }
  > = {
    phone: {
      description:
        'Đối tượng thường gọi điện tự xưng cơ quan chức năng hoặc CSKH, tạo áp lực thời gian và yêu cầu cung cấp OTP/mã xác thực.',
      channels: ['Cuộc gọi', 'SMS', 'Zalo'],
      riskSignals: ['Giục thao tác ngay', 'Yêu cầu OTP/mật khẩu', 'Tự xưng tổng đài/công an', 'Đe dọa khóa tài khoản'],
      safeSignals: ['Số liên hệ rõ ràng', 'Không yêu cầu OTP/mật khẩu', 'Thông tin đối chiếu minh bạch'],
      recommendations: [
        'Ngắt cuộc gọi và gọi lại số tổng đài chính thức.',
        'Không đọc OTP, mật khẩu, mã xác thực cho bất kỳ ai.',
        'Chặn số, lưu bằng chứng và báo cáo ngay.',
      ],
      safeRecommendations: [
        'Ưu tiên liên hệ qua kênh chính thức đã xác thực.',
        'Vẫn kiểm tra số liên hệ nếu có thay đổi bất thường.',
        'Theo dõi cảnh báo mới để cập nhật rủi ro.',
      ],
      source: 'Báo cáo cộng đồng + mẫu lừa đảo điện thoại',
    },
    bank: {
      description:
        'Đối tượng mạo danh ngân hàng hoặc đơn vị tài chính, yêu cầu xác minh tài khoản để xử lý giao dịch bất thường.',
      channels: ['SMS Brandname giả', 'Cuộc gọi', 'Website trung gian'],
      riskSignals: ['Mạo danh thương hiệu lớn', 'Yêu cầu chuyển tiền “an toàn”', 'Form thu thập thông tin thẻ', 'URL không thuộc domain chính thức'],
      safeSignals: ['Đơn vị có hồ sơ xác thực', 'Thông tin liên hệ trùng khớp', 'Nguồn công khai minh bạch'],
      recommendations: [
        'Xác thực qua ứng dụng/chăm sóc khách hàng chính thức.',
        'Khóa tạm thời thẻ/tài khoản nếu đã lộ thông tin.',
        'Liên hệ ngân hàng ngay để tra soát giao dịch.',
      ],
      safeRecommendations: [
        'Đối chiếu website và thông tin pháp lý định kỳ.',
        'Chỉ giao dịch trên kênh chính thức của đơn vị.',
        'Lưu lại link nguồn xác thực để kiểm tra nhanh.',
      ],
      source: 'Kho cảnh báo tài chính + phản ánh người dùng',
    },
    website: {
      description:
        'Tên miền có dấu hiệu giả mạo thương hiệu hoặc nội dung dụ người dùng đăng nhập/chuyển tiền.',
      channels: ['Website', 'Quảng cáo mạng xã hội', 'Link rút gọn'],
      riskSignals: ['Domain gần giống thương hiệu', 'Nội dung “giảm sốc/ưu đãi lớn”', 'Yêu cầu nhập thông tin nhạy cảm', 'Lịch sử báo cáo tiêu cực'],
      safeSignals: ['Domain rõ ràng', 'Thông tin chủ sở hữu minh bạch', 'Không có báo cáo lừa đảo mới'],
      recommendations: [
        'Kiểm tra domain chính xác từng ký tự trước khi đăng nhập.',
        'Không nhập thông tin ngân hàng trên website lạ.',
        'Chụp màn hình và báo cáo đường link cho cộng đồng.',
      ],
      safeRecommendations: [
        'Luôn kiểm tra chứng chỉ và domain trước khi đăng nhập.',
        'Chỉ dùng liên kết chính thức từ nguồn tin cậy.',
        'Bật cảnh báo trình duyệt cho website không an toàn.',
      ],
      source: 'Đối chiếu tín nhiệm miền + dữ liệu báo cáo',
    },
    crypto: {
      description:
        'Kịch bản phổ biến là mời gọi đầu tư lợi nhuận cao, bot giao dịch tự động hoặc yêu cầu nạp ví để “kích hoạt”.',
      channels: ['Telegram', 'Facebook', 'Website đầu tư'],
      riskSignals: ['Cam kết lợi nhuận phi thực tế', 'Ép nạp vốn nhanh', 'Không minh bạch pháp lý', 'Ví nhận tiền thay đổi liên tục'],
      safeSignals: ['Ví có lịch sử minh bạch', 'Thông tin dự án công khai', 'Không ép nạp vốn'],
      recommendations: [
        'Không chuyển tiền vào ví chưa xác thực chủ sở hữu.',
        'Kiểm tra hợp đồng/token trên nguồn uy tín.',
        'Báo cáo ví và nhóm lừa đảo trên các nền tảng liên quan.',
      ],
      safeRecommendations: [
        'Theo dõi cập nhật rủi ro của ví/dự án.',
        'Không cấp quyền ví không cần thiết.',
        'Xác thực nguồn thông tin trước khi đầu tư.',
      ],
      source: 'Theo dõi ví rủi ro + báo cáo cộng đồng',
    },
  };

  const firstSeen = sourceMeta.firstSeen || 'Không rõ';
  const lastReported = sourceMeta.lastReported || firstSeen;
  const estimatedLoss = `${formatNumber((6 + (idHash % 70)) * 1000000)} VND`;
  const updatedAt = new Date().toLocaleString('vi-VN');

  const profile = detailByType[kind];
  let statusLabel = getStatusLabel(normalizedStatus, risk === 'unknown' ? 'suspicious' : risk);
  if (risk === 'policy') {
    statusLabel = 'Cảnh báo pháp lý';
  }
  if (risk === 'unknown' && explicitUnknownStatus && fromScanSource) {
    statusLabel = 'Chưa đủ dữ liệu';
  }
  const description = sourceMeta.description?.trim()
    ? sourceMeta.description.trim()
    : risk === 'policy'
      ? (sourceMeta.policySummary?.trim()
        ? `Cảnh báo pháp lý: ${sourceMeta.policySummary.trim()}`
        : 'Cảnh báo pháp lý: Website có dấu hiệu vi phạm pháp luật theo nguồn công bố chính thức.')
    : isTrustedEntity
      ? 'Đối tượng nằm trong danh bạ tín nhiệm và đang ở trạng thái xác thực trên hệ thống nguồn.'
      : profile.description;
  const sourceName = sourceMeta.source || 'tinnhiemmang.vn';
  const sourceTitle = sourceName.includes('tinnhiemmang.vn') ? 'TinNhiemMang.vn' : sourceName;

  const detail: ScamDetail = {
    id: `${kind}-${idHash}-${normalizedStatus}`,
    type: kind,
    value,
    risk,
    riskScore,
    reports,
    firstSeen,
    lastReported,
    description,
    amount: risk === 'scam' || risk === 'suspicious' ? estimatedLoss : undefined,
  };

  const insight: DetailInsight = {
    riskSignals: (risk === 'safe' || risk === 'unknown' || risk === 'policy') ? profile.safeSignals : profile.riskSignals,
    recommendations: (risk === 'safe' || risk === 'unknown' || risk === 'policy') ? profile.safeRecommendations : profile.recommendations,
    channels: isTrustedEntity ? ['Thông tin liên hệ', 'Kênh chính thức', 'Xác thực nguồn'] : profile.channels,
    related: [
      sourceMeta.organization || '',
      kind === 'website' ? normalizeDomainKey(value) || value : value,
      sourceMeta.organization ? `${sourceMeta.organization} liên hệ` : '',
    ].filter(Boolean),
    timeline: [
      { label: 'Phát hiện lần đầu', value: firstSeen, tone: (risk === 'safe' || risk === 'unknown') ? 'neutral' : 'warning' },
      { label: 'Cập nhật gần nhất', value: lastReported, tone: risk === 'scam' ? 'danger' : 'neutral' },
      { label: 'Cập nhật hệ thống', value: updatedAt, tone: 'neutral' },
    ],
    source: `${sourceTitle}${sourceMeta.sourceCategory ? ` • ${sourceMeta.sourceCategory}` : ''}`,
    confidence,
    updatedAt,
    status: normalizedStatus,
    statusLabel,
    sourceLink: sourceMeta.sourceLink,
    sourceIcon: sourceMeta.sourceIcon,
    typeLabel,
    isTrustedEntity,
  };

  return { detail, insight };
}

function parseDetailSourceMeta(params: SearchParamReader): DetailSourceMeta {
  const reports = parsePositiveInt(params.get('reports'));
  const sourceLink = params.get('sourceLink') || undefined;
  const status = params.get('status') || undefined;
  const sourceMode = params.get('sourceMode') || undefined;
  const source = params.get('source') || undefined;
  const riskScore = parsePositiveInt(params.get('risk'));
  const policyViolationRaw = (params.get('policy') || '').trim().toLowerCase();
  const policyViolation = policyViolationRaw === '1' || policyViolationRaw === 'true' || (params.get('status') || '').trim().toLowerCase() === 'policy';
  const hasKnownSource = Boolean(status || sourceMode || sourceLink || source);
  const normalizedStatus = normalizeSourceStatus(status || sourceMode);

  return {
    status,
    reports,
    riskScore,
    policyViolation,
    policySourceUrl: params.get('policySourceUrl') || undefined,
    policySourceTitle: params.get('policySourceTitle') || undefined,
    policySummary: params.get('policySummary') || undefined,
    firstSeen: params.get('firstSeen') || undefined,
    lastReported: params.get('lastReported') || undefined,
    description: params.get('description') || undefined,
    organization: params.get('organization') || undefined,
    source: source || (hasKnownSource && (normalizedStatus !== 'unknown' || Boolean(sourceLink)) ? 'tinnhiemmang.vn' : undefined),
    sourceLink,
    sourceCategory: params.get('sourceCategory') || undefined,
    sourceMode,
    sourceIcon: params.get('sourceIcon') || params.get('organizationIcon') || undefined,
  };
}

function mapKindToCategory(kind: ScamKind): string {
  if (kind === 'bank') return 'organizations';
  if (kind === 'website') return 'websites';
  if (kind === 'phone') return 'devices';
  return 'apps';
}

function buildDomainFavicon(value: string): string {
  const normalized = normalizeDomainKey(value) || value;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalized)}&sz=128`;
}

async function lookupSourceMetaByValue(kind: ScamKind, value: string): Promise<DetailSourceMeta | null> {
  const category = mapKindToCategory(kind);
  const targetKey = normalizeCompareKey(value);
  const targetDomain = normalizeDomainKey(value);
  const targetSlug = slugifyForMatch(value);

  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, query: value, page: 1 }),
  });

  if (!response.ok) return null;
  const payload: CategoryLookupResponse = await response.json();
  const items = payload.items || [];
  const matched = items.find((item) => {
    const itemName = item.name || '';
    const itemKey = normalizeCompareKey(itemName);
    if (itemKey === targetKey) return true;
    if (itemKey && targetKey && (itemKey.includes(targetKey) || targetKey.includes(itemKey))) return true;

    const itemLink = (item.link || '').toLowerCase();
    if (targetSlug && itemLink.includes(`/${targetSlug}`)) return true;

    const itemDomain = normalizeDomainKey(itemName);
    return Boolean(targetDomain) && Boolean(itemDomain) && itemDomain === targetDomain;
  });

  if (!matched) return null;

  return {
    status: matched.status,
    reports: parsePositiveInt(matched.count_report),
    firstSeen: matched.created_at,
    lastReported: matched.created_at,
    description: matched.description,
    organization: matched.organization,
    source: payload.source || 'tinnhiemmang.vn',
    sourceLink: matched.link,
    sourceCategory: payload.category || category,
    sourceMode: payload.mode,
    sourceIcon: matched.organization_icon || matched.icon,
  };
}

async function lookupPolicyViolationByValue(value: string): Promise<DetailSourceMeta | null> {
  const response = await fetch('/api/policy-violations/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: value }),
  });
  if (!response.ok) return null;
  const payload: PolicyViolationLookupResponse = await response.json();
  if (!payload?.success || !payload.found || !payload.item) return null;

  return {
    policyViolation: true,
    policySourceUrl: payload.item.sourceUrl,
    policySourceTitle: payload.item.sourceTitle || payload.item.sourceName,
    policySummary: payload.item.violationSummary || undefined,
    source: `policy_violation_list:${payload.item.sourceName}`,
  };
}

export default function DetailPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawType = parseParam(params?.type as string | string[] | undefined);
  const rawId = parseParam(params?.id as string | string[] | undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScamDetail | null>(null);
  const [insight, setInsight] = useState<DetailInsight | null>(null);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<FeedbackCommentView[]>([]);
  const [ratingStats, setRatingStats] = useState<FeedbackStats>(DEFAULT_FEEDBACK_STATS);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [policyMetaSnapshot, setPolicyMetaSnapshot] = useState<DetailSourceMeta | null>(null);
  const [helpfulSubmittingId, setHelpfulSubmittingId] = useState<string | null>(null);
  const [commentSort, setCommentSort] = useState<'latest' | 'helpful'>('latest');
  const [aiScan, setAiScan] = useState<{ loading: boolean; error?: string | null; verdict?: 'safe' | 'scam' | 'unknown'; risk?: number; trust?: number; description?: string }>({ loading: false });
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const decodedValue = useMemo(() => decodeRouteValue(rawId), [rawId]);
  const normalizedType = useMemo(() => normalizeKind(rawType), [rawType]);
  const detailFeedbackKey = useMemo(
    () => `${normalizedType}:${slugifyForMatch(decodedValue || 'khong-xac-dinh')}`,
    [normalizedType, decodedValue]
  );
  const searchParamsKey = searchParams.toString();
  const commentTrimmed = comment.trim();
  const sentenceCount = useMemo(() => countSentences(commentTrimmed), [commentTrimmed]);
  const canSubmitComment =
    commentTrimmed.length >= 3 &&
    commentTrimmed.length <= 600 &&
    sentenceCount <= 20 &&
    !isCommentSubmitting &&
    !isRatingSubmitting &&
    !(myRating === null && pendingRating === null);
  const displayedComments = useMemo(() => {
    if (commentSort === 'helpful') {
      return [...comments].sort((a, b) => {
        if (b.helpful !== a.helpful) return b.helpful - a.helpful;
        return b.createdAt - a.createdAt;
      });
    }
    return comments;
  }, [comments, commentSort]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 220));

        const sourceMetaFromQuery = parseDetailSourceMeta(searchParams);
        let sourceMeta = sourceMetaFromQuery;
        const statusFromQuery = normalizeSourceStatus(sourceMetaFromQuery.status || sourceMetaFromQuery.sourceMode);

        if (statusFromQuery === 'unknown' && decodedValue) {
          try {
            const lookedUpMeta = await lookupSourceMetaByValue(normalizedType, decodedValue);
            if (lookedUpMeta) {
              sourceMeta = mergeSourceMeta(lookedUpMeta, sourceMetaFromQuery);
            }
          } catch (lookupError) {
            console.warn('Lookup detail from category source failed:', lookupError);
          }
        }

        if (decodedValue && normalizedType === 'website' && !sourceMeta.policyViolation) {
          try {
            const policyMeta = await lookupPolicyViolationByValue(decodedValue);
            if (policyMeta) {
              sourceMeta = mergeSourceMeta(sourceMeta, policyMeta);
            }
          } catch (policyError) {
            console.warn('Lookup policy violation list failed:', policyError);
          }
        }

        const profile = buildDetailProfile(normalizedType, decodedValue || 'Không xác định', sourceMeta);
        setData(profile.detail);
        setInsight(profile.insight);
        setPolicyMetaSnapshot(sourceMeta.policyViolation ? sourceMeta : null);
      } catch (err) {
        setError('Không thể tải chi tiết cảnh báo. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [normalizedType, decodedValue, searchParamsKey]);

  useEffect(() => {
    let cancelled = false;

    const loadFeedback = async () => {
      setIsFeedbackLoading(true);

      try {
        const response = await fetch(`/api/detail-feedback?detailKey=${encodeURIComponent(detailFeedbackKey)}`, {
          cache: 'no-store',
        });
        const payload: DetailFeedbackResponse = await response.json();

        if (cancelled) return;
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Không thể tải phản hồi cộng đồng.');
        }

        setComments((payload.comments || []).map(toCommentView));
        setRatingStats(payload.ratingStats || DEFAULT_FEEDBACK_STATS);
        const loadedRating = typeof payload.myRating === 'number' ? payload.myRating : null;
        setMyRating(loadedRating);
        if (loadedRating !== null) {
          setPendingRating(null);
        }
      } catch (feedbackError) {
        if (cancelled) return;
        console.error('Load detail feedback failed:', feedbackError);
        setComments([]);
        setRatingStats(DEFAULT_FEEDBACK_STATS);
        setMyRating(null);
      } finally {
        if (!cancelled) {
          setIsFeedbackLoading(false);
        }
      }
    };

    loadFeedback();

    return () => {
      cancelled = true;
    };
  }, [detailFeedbackKey]);

  useEffect(() => {
    let cancelled = false;
    if (!detailFeedbackKey) return () => {};

    const storageKey = `sg_detail_viewed:${detailFeedbackKey}`;
    const now = Date.now();
    const ttlMs = 30 * 60 * 1000;
    let shouldCount = true;

    try {
      const lastSeen = Number.parseInt(sessionStorage.getItem(storageKey) || '0', 10);
      if (Number.isFinite(lastSeen) && lastSeen > 0 && now - lastSeen < ttlMs) {
        shouldCount = false;
      }
    } catch {
      // Ignore storage errors.
    }

    const run = async () => {
      try {
        const response = await fetch(shouldCount ? '/api/detail-views' : `/api/detail-views?detailKey=${encodeURIComponent(detailFeedbackKey)}`, {
          method: shouldCount ? 'POST' : 'GET',
          headers: shouldCount ? { 'Content-Type': 'application/json' } : undefined,
          body: shouldCount ? JSON.stringify({ detailKey: detailFeedbackKey }) : undefined,
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (payload?.success && typeof payload.views === 'number') {
          setViewCount(Math.max(0, Math.floor(payload.views)));
        }
        if (shouldCount) {
          try {
            sessionStorage.setItem(storageKey, String(now));
          } catch {
            // Ignore storage errors.
          }
        }
      } catch {
        // Ignore view tracking errors.
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [detailFeedbackKey]);

  useEffect(() => {
    let cancelled = false;
    const runAiScan = async () => {
      if (normalizedType !== 'website' || !decodedValue) return;
      setAiScan({ loading: true });
      const statusParam = searchParams.get('status') ?? undefined;
      const sourceModeParam = searchParams.get('sourceMode') ?? undefined;
      const sourceStatus = normalizeSourceStatus(statusParam || sourceModeParam);

      let cleanUrl = decodedValue.trim();
      if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
      }
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl, sourceStatus }),
        });
        if (!response.ok) throw new Error('AI scan failed');
        const data = await response.json();
        const riskScore = data.risk_score || data.riskScore || data.score || 0;
        const verdictRaw = typeof data.verdict === 'string' ? data.verdict.trim().toLowerCase() : '';
        const verdict: 'safe' | 'scam' | 'unknown' = verdictRaw === 'scam' || verdictRaw === 'safe' || verdictRaw === 'unknown'
          ? verdictRaw
          : (riskScore > 50 ? 'scam' : 'safe');
        const trustRaw = typeof data.trust_score === 'number' ? data.trust_score : data.trustScore;
        const trustScore = typeof trustRaw === 'number'
          ? Math.max(0, Math.min(100, Math.round(trustRaw)))
          : (verdict === 'unknown' ? 50 : Math.max(0, 100 - Math.round(riskScore)));
        if (!cancelled) {
          setAiScan({
            loading: false,
            verdict,
            risk: Math.round(riskScore),
            trust: trustScore,
            description: data.description || data.summary || '',
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          // Fallback verdict from source status when AI service is unavailable.
          if (sourceStatus === 'trusted') {
            setAiScan({
              loading: false,
              verdict: 'safe',
              risk: 12,
              trust: 92,
              description: 'Nguồn dữ liệu xác thực uy tín. AI tạm thời không phản hồi nên dùng hồ sơ nguồn để suy luận.',
            });
            return;
          }
          if (sourceStatus === 'suspected' || sourceStatus === 'confirmed') {
            setAiScan({
              loading: false,
              verdict: 'scam',
              risk: sourceStatus === 'confirmed' ? 88 : 64,
              trust: sourceStatus === 'confirmed' ? 12 : 36,
              description: 'Nguồn dữ liệu đã gắn cờ rủi ro. AI tạm thời không phản hồi nên dùng hồ sơ nguồn để suy luận.',
            });
            return;
          }
          setAiScan({ loading: false, error: err?.message || 'AI scan failed' });
        }
      }
    };

    runAiScan();
    return () => {
      cancelled = true;
    };
  }, [normalizedType, decodedValue, searchParamsKey]);

  const applyFeedbackPayload = (payload: DetailFeedbackResponse) => {
    setComments((payload.comments || []).map(toCommentView));
    setRatingStats(payload.ratingStats || DEFAULT_FEEDBACK_STATS);
    const nextMyRating = typeof payload.myRating === 'number' ? payload.myRating : null;
    setMyRating(nextMyRating);
    if (nextMyRating !== null) {
      setPendingRating(null);
    }
  };

  const handleRate = (score: number) => {
    if (myRating !== null) {
      showToast('warning', 'Bạn đã đánh giá trước đó. Mỗi IP/tài khoản chỉ được đánh giá 1 lần.');
      return;
    }
    if (isRatingSubmitting || isCommentSubmitting || isFeedbackLoading) return;
    setPendingRating(score);
  };

  const handleComment = async () => {
    const text = comment.trim();
    if (!text) return;
    if (text.length < 3) {
      showToast('warning', 'Bình luận cần tối thiểu 3 ký tự.');
      return;
    }
    if (text.length > 600) {
      showToast('warning', 'Bình luận tối đa 600 ký tự.');
      return;
    }
    const sentenceCount = countSentences(text);
    if (sentenceCount > 20) {
      showToast('warning', 'Đánh giá tối đa 20 câu.');
      return;
    }

    if (myRating === null && pendingRating === null) {
      showToast('warning', 'Vui lòng chọn số sao trước khi gửi đánh giá.');
      return;
    }

    setIsCommentSubmitting(true);
    try {
      if (myRating === null && pendingRating !== null) {
        setIsRatingSubmitting(true);
        const rateResponse = await fetch('/api/detail-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rate',
            detailKey: detailFeedbackKey,
            score: pendingRating,
          }),
        });
        const ratePayload: DetailFeedbackResponse = await rateResponse.json();
        applyFeedbackPayload(ratePayload);

        if (!rateResponse.ok || !ratePayload.success) {
          throw new Error(ratePayload.error || 'Không thể gửi đánh giá sao.');
        }
      }

      const response = await fetch('/api/detail-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          detailKey: detailFeedbackKey,
          text,
        }),
      });

      const payload: DetailFeedbackResponse = await response.json();
      applyFeedbackPayload(payload);

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Không thể đăng bình luận.');
      }

      setComment('');
      setPendingRating(null);
      showToast('success', payload.message || 'Đã đăng bình luận.');
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : 'Không thể đăng bình luận.';
      showToast('error', message);
    } finally {
      setIsRatingSubmitting(false);
      setIsCommentSubmitting(false);
    }
  };

  const handleHelpful = async (commentId: string) => {
    if (helpfulSubmittingId || isFeedbackLoading) return;

    const targetComment = comments.find((item) => item.id === commentId);
    if (!targetComment || !targetComment.canMarkHelpful) {
      if (targetComment?.helpfulMarked) {
        showToast('warning', 'Bạn đã đánh dấu hữu ích bình luận này trước đó.');
      }
      return;
    }

    setHelpfulSubmittingId(commentId);
    try {
      const response = await fetch('/api/detail-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'helpful',
          detailKey: detailFeedbackKey,
          commentId,
        }),
      });

      const payload: DetailFeedbackResponse = await response.json();
      applyFeedbackPayload(payload);

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Không thể ghi nhận bình chọn hữu ích.');
      }

      showToast('success', payload.message || 'Đã ghi nhận bình chọn hữu ích.');
    } catch (helpfulError) {
      const message = helpfulError instanceof Error ? helpfulError.message : 'Không thể ghi nhận bình chọn hữu ích.';
      showToast('error', message);
    } finally {
      setHelpfulSubmittingId(null);
    }
  };

  const handleCopy = async () => {
    if (!data?.value) return;
    try {
      await navigator.clipboard.writeText(data.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    const currentUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cảnh báo: ${data.value}`,
          text: `Xem chi tiết cảnh báo cho ${data.value}`,
          url: currentUrl,
        });
      } else {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }
    } catch {
      // User may cancel the share sheet; no-op.
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            <DetailSkeleton />
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 text-center">
            <Card className="py-12">
              <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-main mb-2">{t('common.error')}</h2>
              <p className="text-text-secondary mb-6">{error}</p>
              <Button variant="primary" onClick={() => router.refresh()}>
                {t('common.retry')}
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!data || !insight) return null;

  const reportHref = `/report?type=${normalizedType}&target=${encodeURIComponent(data.value)}`;
  const suggestedSearchQuery = normalizedType === 'website' ? normalizeDomainKey(data.value) || data.value : data.value;
  const isHighRisk = data.risk === 'scam' || data.risk === 'suspicious' || data.risk === 'policy';
  const nextSteps = isHighRisk
    ? [
        'Dừng tương tác ngay và không cung cấp OTP/mật khẩu.',
        'Bảo vệ tài khoản: đổi mật khẩu, bật 2FA, khóa thẻ nếu cần.',
        'Báo cáo và đính kèm bằng chứng để cộng đồng cảnh giác.',
      ]
    : data.risk === 'unknown'
      ? [
          'Xác minh đường dẫn/tên miền từng ký tự, kiểm tra chứng chỉ bảo mật.',
          'Tìm báo cáo liên quan và đối chiếu kênh liên hệ chính thức.',
          'Nếu có dấu hiệu bất thường, hãy báo cáo để hệ thống cập nhật.',
        ]
      : [
          'Ưu tiên giao dịch qua kênh chính thức đã xác thực.',
          'Lưu thông tin và theo dõi cảnh báo mới để cập nhật rủi ro.',
          'Chia sẻ trang này để người khác kiểm tra nhanh khi cần.',
        ];
  const guidanceTitle = data.risk === 'safe' ? 'Gợi ý sử dụng an toàn' : data.risk === 'unknown' ? 'Cách kiểm tra thêm' : 'Khuyến nghị xử lý ngay';
  const guidanceIcon =
    data.risk === 'safe' ? (
      <ShieldCheck className="w-5 h-5 text-success" />
    ) : (
      <AlertTriangle className={cn('w-5 h-5', isHighRisk ? (data.risk === 'scam' ? 'text-danger' : 'text-warning') : 'text-text-secondary')} />
    );
  const guidanceNumberTone =
    data.risk === 'scam'
      ? 'bg-danger/15 text-danger'
      : data.risk === 'suspicious' || data.risk === 'policy' || data.risk === 'unknown'
        ? 'bg-warning/15 text-warning'
        : 'bg-success/15 text-success';
  const guidanceCardTone = isHighRisk ? 'to-danger/5' : data.risk === 'unknown' ? 'to-warning/5' : 'to-success/5';
  const policySourceHref = policyMetaSnapshot?.policySourceUrl?.trim() || undefined;
  const policySourceTitle = policyMetaSnapshot?.policySourceTitle?.trim() || 'Nguồn công bố chính thức';
  const inlineRiskTag = (() => {
    if (insight.status === 'trusted') {
      return null;
    }
    if (data.risk === 'policy') {
      return { label: 'Cảnh báo pháp lý', tone: 'border-warning/40 bg-warning/10 text-warning' };
    }
    if (data.risk === 'scam') {
      return { label: 'Nguy hiểm', tone: 'border-danger/40 bg-danger/10 text-danger' };
    }
    if (data.risk === 'suspicious' || data.risk === 'unknown') {
      return { label: 'Cần kiểm tra', tone: 'border-warning/40 bg-warning/10 text-warning' };
    }
    return null;
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-10 border-primary/20 overflow-visible rounded-[32px] shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
              <div className="relative overflow-visible rounded-[28px] border border-bg-border/60 bg-gradient-to-r from-primary/10 via-bg-card to-bg-card p-5 md:p-6 pb-10 md:pb-12 space-y-6">
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
                          data.risk === 'scam'
                            ? 'bg-danger/10 text-danger'
                            : data.risk === 'suspicious'
                              ? 'bg-warning/10 text-warning'
                              : data.risk === 'policy'
                                ? 'bg-warning/10 text-warning'
                              : data.risk === 'unknown'
                                ? 'bg-bg-cardHover text-text-secondary'
                              : 'bg-success/10 text-success'
                        )}
                      >
                        <img
                          src={insight.sourceIcon || buildDomainFavicon(data.value)}
                          alt={data.value}
                          className="w-9 h-9 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallbackDomain) {
                              target.dataset.fallbackDomain = '1';
                              target.src = buildDomainFavicon(data.value);
                              return;
                            }
                            if (!target.dataset.fallbackDefault) {
                              target.dataset.fallbackDefault = '1';
                              target.src = 'https://tinnhiemmang.vn/img/icon_web2.png';
                              return;
                            }
                            target.style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h1 className="text-lg md:text-3xl font-bold text-text-main leading-tight break-words flex items-center gap-2 flex-wrap">
                                <span className="break-words">{data.value}</span>
                                {insight.isTrustedEntity && (
                                  <span className="inline-flex items-center justify-center -ml-1 align-middle self-center">
                                    <i className="fi fi-ss-badge-check text-primary text-[1.25em] leading-none block relative top-[1px]" />
                                  </span>
                                )}
                                {inlineRiskTag && (
                                  <span className="inline-flex items-center justify-center text-[0.75rem] font-black tracking-[0.28em] rounded-[12px] px-3 py-1 border-2 border-danger/80 text-danger bg-white/95 shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
                                    {inlineRiskTag.label}
                                  </span>
                                )}
                              </h1>
                              <p className="text-text-secondary mt-1">{insight.typeLabel}</p>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="px-4"
                              leftIcon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              onClick={handleCopy}
                            >
                              {copied ? 'Đã sao chép' : 'Sao chép'}
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {(() => {
                              const variant =
                                data.risk === 'scam'
                                  ? 'danger'
                                  : data.risk === 'suspicious' || data.risk === 'policy'
                                    ? 'warning'
                                    : data.risk === 'unknown'
                                      ? 'default'
                                      : 'success';
                              return (
                                <Chip variant={variant} size="md" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                                  Độ tin cậy nguồn: {insight.confidence}%
                                </Chip>
                              );
                            })()}
                            <Chip variant="default" size="md" leftIcon={<Clock className="w-3.5 h-3.5 text-primary" />}>
                              Cập nhật: {insight.updatedAt}
                            </Chip>
                            {viewCount !== null && (
                              <Chip variant="default" size="md" leftIcon={<Eye className="w-3.5 h-3.5 text-primary" />}>
                                {formatNumber(viewCount)} lượt xem
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {insight.status !== 'trusted' && (
                      <div className="shrink-0 self-start md:self-auto">
                        <RiskBadge
                          risk={data.risk}
                          label={insight.statusLabel || t(`risk.${data.risk}`)}
                        />
                      </div>
                    )}
                  </div>

                </div>
                {data.risk === 'policy' && policyMetaSnapshot && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-warning/40 bg-gradient-to-r from-warning/10 via-bg-card to-bg-card px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning border border-warning/30">
                          <FileWarning className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-text-main text-sm">Cảnh báo pháp lý</p>
                          <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                            {policyMetaSnapshot.policySummary ||
                              'Website nằm trong danh sách cảnh báo chính thức; có dấu hiệu vi phạm quảng cáo/đánh bạc không phép.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-bg-border bg-bg-cardHover/60 px-4 py-3 flex flex-col gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-text-main text-sm">{policySourceTitle}</p>
                        <p className="mt-1 text-xs text-text-muted line-clamp-2">
                          {policySourceHref || 'Không có đường dẫn nguồn kèm theo.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-bg-cardHover rounded-xl p-3 text-center">
                    {data.risk === 'safe' ? (
                      <ShieldCheck className="w-4 h-4 text-success mx-auto mb-1.5" />
                    ) : data.risk === 'unknown' ? (
                      <AlertTriangle className="w-4 h-4 text-text-secondary mx-auto mb-1.5" />
                    ) : (
                      <AlertTriangle className={cn('w-4 h-4 mx-auto mb-1.5', data.risk === 'scam' ? 'text-danger' : 'text-warning')} />
                    )}
                    <p className="text-xl font-bold text-text-main font-mono">{formatNumber(data.reports)}</p>
                    <p className="text-xs text-text-muted">
                      {data.risk === 'safe' ? 'Phản hồi cộng đồng' : data.risk === 'unknown' ? 'Lượt ghi nhận' : t('risk.reports')}
                    </p>
                  </div>
                  <div className="bg-bg-cardHover rounded-xl p-3 text-center">
                    <Clock className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="text-sm text-text-main">{data.firstSeen}</p>
                    <p className="text-xs text-text-muted">{t('risk.first_seen')}</p>
                  </div>
                  <div className="bg-bg-cardHover rounded-xl p-3 text-center">
                    <Calendar className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="text-sm text-text-main">{data.lastReported}</p>
                    <p className="text-xs text-text-muted">{t('risk.last_reported')}</p>
                  </div>
                  <div className="bg-bg-cardHover rounded-xl p-3 text-center">
                    <Shield className="w-4 h-4 text-warning mx-auto mb-1.5" />
                    <p className="text-sm text-text-main">{insight.confidence}%</p>
                    <p className="text-xs text-text-muted">Mức tin cậy</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-6"
            >
              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-bg-cardHover/25">
                <h2 className="text-xl font-bold text-text-main mb-3 flex items-center gap-2">
                  <Copy className="w-5 h-5 text-primary" />
                  {t('detail.description')}
                </h2>
                <p className="text-text-secondary leading-relaxed">{data.description}</p>
                {data.amount && (
                  <div className="mt-4 pt-4 border-t border-bg-border">
                    <span className="text-text-muted">{t('detail.estimated_loss')}: </span>
                    <span className="text-danger font-mono font-bold">{data.amount}</span>
                  </div>
                )}
              </Card>

              <Card className={cn('border border-bg-border/80 bg-gradient-to-br from-bg-card', guidanceCardTone)}>
                <h2 className="text-xl font-bold text-text-main mb-3 flex items-center gap-2">
                  {guidanceIcon}
                  {guidanceTitle}
                </h2>
                <div className="space-y-2.5">
                  {insight.recommendations.map((item, index) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-text-secondary rounded-lg bg-bg-cardHover/60 border border-bg-border/70 px-3 py-2">
                      <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5', guidanceNumberTone)}>
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-info/5">
                <h2 className="text-xl font-bold text-text-main mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('detail.timeline')}
                </h2>
                <div className="space-y-3">
                  {insight.timeline.map((step) => (
                    <div key={step.label} className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-cardHover/70 px-3 py-2.5 shadow-sm">
                      <span className="text-sm text-text-secondary">{step.label}</span>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          step.tone === 'danger'
                            ? 'text-danger'
                            : step.tone === 'warning'
                              ? 'text-warning'
                              : 'text-text-main'
                        )}
                      >
                        {step.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-primary/5">
                <h3 className="text-lg font-bold text-text-main mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Bước tiếp theo
                </h3>
                <div className="space-y-2.5">
                  {nextSteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-2.5 rounded-xl border border-bg-border bg-bg-cardHover/70 px-3 py-2 text-sm text-text-secondary">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant={isHighRisk ? 'danger' : 'primary'}
                    size="sm"
                    leftIcon={<Flag className="w-4 h-4" />}
                    onClick={() => router.push(reportHref)}
                  >
                    Báo cáo ngay
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Globe className="w-4 h-4" />}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(suggestedSearchQuery)}`)}
                  >
                    Tra cứu liên quan
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
                    Chia sẻ
                  </Button>
                </div>
                <p className="mt-3 text-xs text-text-muted">
                  Mẹo: chỉ cần gửi link/bằng chứng; hệ thống sẽ tổng hợp và cập nhật mức rủi ro theo thời gian.
                </p>
              </Card>

              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-primary/5">
                <h3 className="text-lg font-bold text-text-main mb-3 flex items-center gap-2">
                  {data.risk === 'safe' ? (
                    <ShieldCheck className="w-5 h-5 text-success" />
                  ) : data.risk === 'unknown' ? (
                    <AlertTriangle className="w-5 h-5 text-text-secondary" />
                  ) : (
                    <AlertTriangle className={cn('w-5 h-5', data.risk === 'scam' ? 'text-danger' : 'text-warning')} />
                  )}
                  {data.risk === 'safe' ? 'Tín hiệu xác thực' : data.risk === 'unknown' ? 'Cần kiểm tra' : 'Dấu hiệu rủi ro'}
                </h3>
                <div className="space-y-2.5">
                  {insight.riskSignals.map((signal) => (
                    <div key={signal} className="flex items-start gap-2 text-sm text-text-secondary">
                      {data.risk === 'safe' ? (
                        <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      ) : data.risk === 'unknown' ? (
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-text-secondary" />
                      ) : (
                        <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', data.risk === 'scam' ? 'text-danger' : 'text-warning')} />
                      )}
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-warning/5">
                <h3 className="text-lg font-bold text-text-main mb-3 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-warning" />
                  Kênh bị nhắm tới
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insight.channels.map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-bg-border bg-bg-cardHover text-text-secondary shadow-sm"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-bg-cardHover/30">
                <h3 className="text-lg font-bold text-text-main mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  {t('detail.related')}
                </h3>
                <div className="space-y-2">
                  {insight.related.map((item) => (
                    <button
                      key={item}
                      onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)}
                      className="w-full text-left rounded-lg border border-bg-border bg-bg-cardHover/70 px-3 py-2 text-sm text-text-secondary hover:text-text-main hover:border-primary/40 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{item}</span>
                      <ExternalLink className="w-4 h-4 shrink-0 text-text-muted" />
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border border-bg-border/80 bg-gradient-to-br from-bg-card to-primary/5">
                <h3 className="text-lg font-bold text-text-main mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Nguồn dữ liệu
                </h3>
                <p className="text-sm text-text-secondary">{insight.source}</p>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 space-y-5"
          >
            <Card className="overflow-hidden p-0">
              <div className="border-b border-bg-border bg-gradient-to-r from-primary/10 via-info/5 to-success/5 p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-text-main">
                      {t('detail.comments')} ({comments.length})
                    </h2>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-bg-border bg-bg-card/85 px-3 py-1.5">
                      <span className="text-sm font-semibold text-text-main">{ratingStats.average.toFixed(1)}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRate(star)}
                            disabled={isFeedbackLoading || isRatingSubmitting || isCommentSubmitting || myRating !== null}
                            className={cn(
                              'rounded-sm transition-opacity',
                              (isFeedbackLoading || isRatingSubmitting || isCommentSubmitting || myRating !== null) && 'cursor-not-allowed opacity-80'
                            )}
                            aria-label={`Đánh giá ${star} sao`}
                          >
                            <Star
                              className={cn(
                                'h-3.5 w-3.5',
                                (myRating ?? pendingRating ?? ratingStats.average) >= star ? 'text-warning fill-current' : 'text-text-muted/40'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-text-muted">{formatNumber(ratingStats.total)} lượt đánh giá</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCommentSort('latest')}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        commentSort === 'latest'
                          ? 'border-primary/50 bg-primary/15 text-primary'
                          : 'border-bg-border bg-bg-card/80 text-text-muted hover:text-text-main'
                      )}
                    >
                      Mới nhất
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentSort('helpful')}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        commentSort === 'helpful'
                          ? 'border-primary/50 bg-primary/15 text-primary'
                          : 'border-bg-border bg-bg-card/80 text-text-muted hover:text-text-main'
                      )}
                    >
                      Hữu ích nhất
                    </button>
                    {isFeedbackLoading && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tải...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <div className="relative">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('detail.comment_placeholder')}
                    rows={3}
                    maxLength={600}
                    className="w-full rounded-2xl border border-bg-border bg-bg-cardHover pl-3 pr-14 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleComment}
                    disabled={!canSubmitComment}
                    className={cn(
                      'absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                      canSubmitComment
                        ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                        : 'border-bg-border bg-bg-card text-text-muted cursor-not-allowed'
                    )}
                    aria-label="Gui binh luan"
                  >
                    {isCommentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </Card>

            <div className="space-y-2.5">
              {!isFeedbackLoading && comments.length === 0 && (
                <Card className="py-8 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-text-muted/70" />
                  <p className="mt-2 text-text-secondary">Chưa có bình luận nào cho cảnh báo này.</p>
                  <p className="mt-1 text-xs text-text-muted">Hãy là người đầu tiên chia sẻ thông tin xác minh.</p>
                </Card>
              )}
              {displayedComments.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}>
                  <Card hover className="p-4 md:p-5">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-400 text-sm font-semibold text-white">
                        {c.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-medium text-text-main">{c.user}</span>
                          {(() => {
                            const ratingValue = c.rating ?? 0;
                            if (ratingValue <= 0) return null;
                            return (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-warning/35 bg-warning/10 px-2 py-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={`${c.id}-${star}`} className={cn('h-3 w-3', ratingValue >= star ? 'text-warning fill-current' : 'text-text-muted/40')} />
                                ))}
                              </span>
                            );
                          })()}
                          <span className="text-xs text-text-muted">{formatRelativeTime(c.createdAt, nowTick)}</span>
                        </div>
                        <p className="break-words text-sm text-text-secondary">{sanitizeHTML(c.text)}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleHelpful(c.id)}
                            disabled={!c.canMarkHelpful || isFeedbackLoading || helpfulSubmittingId === c.id}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                              c.helpfulMarked
                                ? 'border-success/40 bg-success/10 text-success'
                                : 'border-bg-border bg-bg-cardHover text-text-muted hover:border-primary/40 hover:text-text-main',
                              (!c.canMarkHelpful || isFeedbackLoading || helpfulSubmittingId === c.id) && 'cursor-not-allowed opacity-65'
                            )}
                          >
                            {helpfulSubmittingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                            {formatNumber(c.helpful)} {t('detail.helpful')}
                          </button>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
                              c.verified ? 'border-success/40 bg-success/10 text-success' : 'border-bg-border bg-bg-cardHover text-text-muted'
                            )}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {c.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
