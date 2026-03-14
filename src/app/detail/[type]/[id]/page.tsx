'use client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@flaticon/flaticon-uicons/css/solid/rounded.css';
import '@flaticon/flaticon-uicons/css/solid/straight.css';
import '../../detail.css';
import '../../detail-new.css';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/hooks/useAuth';
import { DetailContentNew } from '@/components/detail/DetailContentNew';
import { type ScamDetail, type RiskLevel, sanitizeHTML, formatNumber } from '@/lib/utils';

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
  domainRegisteredAt?: string;
  amount?: string;
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
  domain_registered_at?: string;
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
  requireAuth?: boolean;
  accountAgeHours?: number;
}

interface DomainExpiryResponse {
  success?: boolean;
  domain?: string;
  expiresAt?: string | null;
  daysLeft?: number | null;
  isExpired?: boolean | null;
  checkedAt?: string | null;
  source?: string;
  error?: string;
}

interface ScanSecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  details: string;
}

interface ScanResultPayload {
  risk_score?: number;
  trust_score?: number;
  verdict?: string;
  status?: string;
  source?: string;
  reports?: number;
  description?: string;
  organization?: string;
  policy_violation?: boolean;
  policy_source_url?: string;
  policy_source_title?: string;
  policy_source_name?: string;
  policy_updated_at?: string;
  securityChecks?: ScanSecurityCheck[];
  error?: string;
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
    domainRegisteredAt: keepString(override.domainRegisteredAt, base.domainRegisteredAt),
    amount: keepString(override.amount, base.amount),
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

function normalizeEpochMs(raw: string | number | null | undefined, now?: number): number | null {
  if (raw === null || raw === undefined) return null;
  const nowMs = now ?? 0;
  
  if (typeof raw === 'number' && Number.isFinite(raw)) {
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

    // guard against far-future timestamps - use 0 as default to avoid hydration mismatch
    if (raw > nowMs + 1000 * 60 * 60 * 24 * 365 * 5) return nowMs;
    return raw;
  }

  const text = String(raw).trim();
  if (!text) return null;

  if (/^\d{10,17}$/.test(text)) {
    const numeric = Number.parseInt(text, 10);
    if (!Number.isFinite(numeric)) return null;
    return normalizeEpochMs(numeric);
  }

  // Handle Vietnamese-style dates: "DD/MM/YYYY" or "D/M/YYYY" (optional time).
  // Some datasets return dates like "18/2/2025", which Date.parse() treats as invalid.
  const vnDateMatch = text.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (vnDateMatch) {
    const day = Number.parseInt(vnDateMatch[1], 10);
    const month = Number.parseInt(vnDateMatch[2], 10);
    const year = Number.parseInt(vnDateMatch[3], 10);
    const hour = vnDateMatch[4] ? Number.parseInt(vnDateMatch[4], 10) : 0;
    const minute = vnDateMatch[5] ? Number.parseInt(vnDateMatch[5], 10) : 0;
    const second = vnDateMatch[6] ? Number.parseInt(vnDateMatch[6], 10) : 0;
    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12
    ) {
      const utc = Date.UTC(year, month - 1, day, hour, minute, second);
      return Number.isFinite(utc) ? utc : null;
    }
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

function formatAbsoluteDate(input: string | number): string {
  const target = normalizeEpochMs(input);
  if (target === null) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(target));
}

function formatTimelineValue(input?: string): string {
  if (!input?.trim()) return 'Không rõ';
  const formatted = formatAbsoluteDate(input);
  return formatted === '—' ? input.trim() : formatted;
}

function formatRelativeTime(input: string | number, nowMs: number = 0): string {
  const target = normalizeEpochMs(input, nowMs) ?? nowMs;

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
  // Use 0 as default to avoid hydration mismatch - will be replaced with actual time after mount
  const createdAt = normalizeEpochMs(item.createdAt) ?? 0;
  return {
    id: item.id,
    user: item.user,
    avatar: item.avatar,
    text: item.text,
    helpful: item.helpful,
    rating: typeof item.rating === 'number' ? item.rating : null,
    createdAt: Number.isFinite(createdAt) ? createdAt : 0,
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
  const updatedAt = sourceMeta.lastReported || sourceMeta.firstSeen || '—';

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
    domainRegisteredAt: sourceMeta.domainRegisteredAt,
    description,
    amount: sourceMeta.amount?.trim() || undefined,
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
      { label: 'Phát hiện lần đầu', value: formatTimelineValue(firstSeen), tone: (risk === 'safe' || risk === 'unknown') ? 'neutral' : 'warning' },
      { label: 'Cập nhật gần nhất', value: formatTimelineValue(lastReported), tone: risk === 'scam' ? 'danger' : 'neutral' },
      { label: 'Cập nhật hệ thống', value: formatTimelineValue(updatedAt), tone: 'neutral' },
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
    domainRegisteredAt: params.get('domainRegisteredAt') || undefined,
    amount: params.get('amount') || undefined,
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
    domainRegisteredAt: matched.domain_registered_at,
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
  const { isAuthenticated, accountAge24h } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawType = parseParam(params?.type as string | string[] | undefined);
  const rawId = parseParam(params?.id as string | string[] | undefined);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<FeedbackCommentView[]>([]);
  const [ratingStats, setRatingStats] = useState<FeedbackStats>(DEFAULT_FEEDBACK_STATS);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [helpfulSubmittingId, setHelpfulSubmittingId] = useState<string | null>(null);
  const [commentSort, setCommentSort] = useState<'latest' | 'helpful'>('latest');
  const [viewCount, setViewCount] = useState<number | null>(null);
  // Use a fixed default value to avoid hydration mismatch
  // The actual time will be updated via useEffect after mount
  const [nowTick, setNowTick] = useState<number>(0);
  const [expiryInfo, setExpiryInfo] = useState<DomainExpiryResponse | null>(null);
  const [expiryStatus, setExpiryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<ScanResultPayload | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const decodedValue = useMemo(() => decodeRouteValue(rawId), [rawId]);
  const normalizedType = useMemo(() => normalizeKind(rawType), [rawType]);
  const detailFeedbackKey = useMemo(
    () => {
      const baseValue = decodedValue || 'khong-xac-dinh';
      const canonical = normalizedType === 'website'
        ? (normalizeDomainKey(baseValue) || baseValue)
        : baseValue;
      return `${normalizedType}:${slugifyForMatch(canonical)}`;
    },
    [normalizedType, decodedValue]
  );
  const searchParamsKey = searchParams.toString();
  const baseSourceMeta = useMemo(() => parseDetailSourceMeta(searchParams), [searchParamsKey]);
  const baseProfile = useMemo(
    () => buildDetailProfile(normalizedType, decodedValue || 'Không xác định', baseSourceMeta),
    [normalizedType, decodedValue, baseSourceMeta]
  );
  const [data, setData] = useState<ScamDetail | null>(baseProfile.detail);
  const [insight, setInsight] = useState<DetailInsight | null>(baseProfile.insight);
  const [policyMetaSnapshot, setPolicyMetaSnapshot] = useState<DetailSourceMeta | null>(
    baseSourceMeta.policyViolation ? baseSourceMeta : null
  );
  const commentTrimmed = comment.trim();
  const sentenceCount = useMemo(() => countSentences(commentTrimmed), [commentTrimmed]);
  const canSubmitComment =
    accountAge24h &&
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

  const domainExpiryLabel = useMemo(() => {
    if (normalizedType !== 'website') return null;
    if (expiryStatus === 'idle' || expiryStatus === 'loading') {
      return 'Hết hạn: Đang kiểm tra';
    }
    if (expiryStatus === 'error' || !expiryInfo) {
      return 'Hết hạn: Không rõ';
    }
    const expiresAtMs = normalizeEpochMs(expiryInfo.expiresAt ?? null);
    if (expiresAtMs === null) {
      return 'Hết hạn: Chưa đăng ký';
    }
    const formatted = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(expiresAtMs));
    return `Hết hạn: ${formatted}`;
  }, [normalizedType, expiryInfo, expiryStatus]);

  useEffect(() => {
    // Only update nowTick on client side after hydration
    setNowTick(Date.now());
    setMounted(true);
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = () => {
      setError(null);

      const sourceMetaFromQuery = parseDetailSourceMeta(searchParams);
      const statusFromQuery = normalizeSourceStatus(sourceMetaFromQuery.status || sourceMetaFromQuery.sourceMode);

      // Render immediately with lightweight data first
      const baseProfile = buildDetailProfile(normalizedType, decodedValue || 'Không xác định', sourceMetaFromQuery);
      if (!cancelled) {
        setData(baseProfile.detail);
        setInsight(baseProfile.insight);
        setPolicyMetaSnapshot(sourceMetaFromQuery.policyViolation ? sourceMetaFromQuery : null);
      }

      // Enrich in the background (does not block render)
      void (async () => {
        try {
          let enrichedMeta = sourceMetaFromQuery;

          if (statusFromQuery === 'unknown' && decodedValue && normalizedType !== 'website') {
            try {
              const lookedUpMeta = await lookupSourceMetaByValue(normalizedType, decodedValue);
              if (lookedUpMeta) {
                enrichedMeta = mergeSourceMeta(lookedUpMeta, sourceMetaFromQuery);
              }
            } catch (lookupError) {
              console.warn('Lookup detail from category source failed:', lookupError);
            }
          }

          if (decodedValue && normalizedType === 'website' && !enrichedMeta.policyViolation) {
            try {
              const policyMeta = await lookupPolicyViolationByValue(decodedValue);
              if (policyMeta) {
                enrichedMeta = mergeSourceMeta(enrichedMeta, policyMeta);
              }
            } catch (policyError) {
              console.warn('Lookup policy violation list failed:', policyError);
            }
          }

          if (cancelled) return;
          const updatedProfile = buildDetailProfile(normalizedType, decodedValue || 'Không xác định', enrichedMeta);
          setData(updatedProfile.detail);
          setInsight(updatedProfile.insight);
          setPolicyMetaSnapshot(enrichedMeta.policyViolation ? enrichedMeta : null);
        } catch (err) {
          if (!cancelled) {
            setError('Không thể tải chi tiết cảnh báo. Vui lòng thử lại.');
          }
        }
      })();
    };

    fetchData();

    return () => {
      cancelled = true;
    };
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

    if (normalizedType !== 'website') {
      setExpiryInfo(null);
      setExpiryStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    const domain = normalizeDomainKey(decodedValue || '');
    if (!domain) {
      setExpiryInfo(null);
      setExpiryStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    const loadExpiry = async () => {
      setExpiryStatus('loading');
      try {
        const response = await fetch(`/api/domain-expiry?domain=${encodeURIComponent(domain)}`, { cache: 'no-store' });
        const payload: DomainExpiryResponse = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Không thể kiểm tra hạn tên miền.');
        }
        setExpiryInfo(payload);
        setExpiryStatus('success');
      } catch (error) {
        if (cancelled) return;
        setExpiryInfo(null);
        setExpiryStatus('error');
      }
    };

    loadExpiry();

    return () => {
      cancelled = true;
    };
  }, [normalizedType, decodedValue]);

  useEffect(() => {
    let cancelled = false;

    if (normalizedType !== 'website') {
      setScanResult(null);
      setScanStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    const domain = normalizeDomainKey(decodedValue || '');
    if (!domain) {
      setScanResult(null);
      setScanStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    const runScan = async () => {
      setScanStatus('loading');
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `https://${domain}` }),
          cache: 'no-store',
        });
        const payload: ScanResultPayload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          throw new Error(payload?.error || 'Không thể quét domain.');
        }
        setScanResult(payload);
        setScanStatus('success');
      } catch (error) {
        if (cancelled) return;
        setScanResult(null);
        setScanStatus('error');
      }
    };

    runScan();

    return () => {
      cancelled = true;
    };
  }, [normalizedType, decodedValue]);

  useEffect(() => {
    if (normalizedType !== 'website' || !decodedValue || !scanResult) return;

    const scanMeta: DetailSourceMeta = {
      status: scanResult.status || scanResult.verdict,
      reports: typeof scanResult.reports === 'number' ? scanResult.reports : undefined,
      riskScore: typeof scanResult.risk_score === 'number' ? scanResult.risk_score : undefined,
      description: scanResult.description,
      organization: scanResult.organization,
      source: scanResult.source,
      policyViolation: Boolean(scanResult.policy_violation) || scanResult.verdict === 'policy' || scanResult.status === 'policy',
      policySourceUrl: scanResult.policy_source_url,
      policySourceTitle: scanResult.policy_source_title || scanResult.policy_source_name,
    };

    const merged = mergeSourceMeta(baseSourceMeta, scanMeta);
    const updatedProfile = buildDetailProfile(normalizedType, decodedValue || 'Không xác định', merged);
    setData(updatedProfile.detail);
    setInsight(updatedProfile.insight);
    setPolicyMetaSnapshot(merged.policyViolation ? merged : null);
  }, [scanResult, normalizedType, decodedValue, baseSourceMeta]);

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
    
    // Client-side check for authentication
    if (!isAuthenticated) {
      showToast('warning', 'Vui lòng đăng nhập để bình luận.');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
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
          // Check if requires authentication
          if (ratePayload.requireAuth) {
            showToast('warning', ratePayload.error || 'Vui lòng đăng nhập để đánh giá.');
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
          }
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
        // Check if requires authentication
        if (payload.requireAuth) {
          showToast('warning', payload.error || 'Vui lòng đăng nhập để bình luận.');
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
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

  // Prevent hydration mismatch - show loading on server and initial state on client before mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
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
  const canonicalValue = normalizedType === 'website' ? normalizeDomainKey(data.value) || data.value : data.value;
  const typeIconClass =
    normalizedType === 'phone'
      ? 'fi fi-sr-phone-call'
      : normalizedType === 'bank'
        ? 'fi fi-sr-landmark'
        : normalizedType === 'crypto'
          ? 'fi fi-sr-bitcoin'
          : 'fi fi-sr-globe';
  const hasConfirmedStatus = insight.status === 'confirmed' || Boolean(policyMetaSnapshot?.policyViolation);
  const hasSuspectedStatus = insight.status === 'suspected';
  const isConfirmedRisk = hasConfirmedStatus || scanResult?.verdict === 'scam';
  const isSuspiciousRisk =
    hasSuspectedStatus ||
    (!isConfirmedRisk && (data.risk === 'suspicious' || data.risk === 'scam')) ||
    scanResult?.verdict === 'unknown';
  const riskTagText =
    isConfirmedRisk
      ? 'LỪA ĐẢO'
      : data.risk === 'policy'
        ? 'CẢNH BÁO'
        : isSuspiciousRisk
          ? 'NGHI NGỜ'
          : data.risk === 'unknown'
            ? 'CẦN KIỂM TRA'
            : null;
  const derivedRiskScore = Math.max(0, Math.min(100, Math.round(scanResult?.risk_score ?? data.riskScore)));
  const aiTrustScore = Math.max(
    0,
    Math.min(100, Math.round(scanResult?.trust_score ?? (100 - derivedRiskScore)))
  );
  const referenceNowMs = nowTick > 0 ? nowTick : normalizeEpochMs(insight.updatedAt) ?? null;
  const domainRegisteredMs = normalizeEpochMs(data.domainRegisteredAt);
  const domainAgeDays =
    domainRegisteredMs && referenceNowMs
      ? Math.max(0, Math.floor((referenceNowMs - domainRegisteredMs) / (24 * 60 * 60 * 1000)))
      : null;
  const expiryDaysLeft =
    typeof expiryInfo?.daysLeft === 'number'
      ? expiryInfo.daysLeft
      : (() => {
          const expiresAtMs = normalizeEpochMs(expiryInfo?.expiresAt ?? null);
          if (!expiresAtMs || !referenceNowMs) return null;
          return Math.ceil((expiresAtMs - referenceNowMs) / (24 * 60 * 60 * 1000));
        })();
  const isExpired = expiryInfo?.isExpired === true || (typeof expiryDaysLeft === 'number' && expiryDaysLeft < 0);
  const objectiveScore = (() => {
    let score = 100 - derivedRiskScore;

    if (policyMetaSnapshot?.policyViolation || data.risk === 'policy') score -= 20;
    const reportPenalty = Math.min(20, Math.floor((data.reports || 0) / 2));
    score -= reportPenalty;

    if (domainAgeDays !== null) {
      if (domainAgeDays < 30) score -= 15;
      else if (domainAgeDays < 180) score -= 8;
      else if (domainAgeDays < 365) score -= 4;
      else if (domainAgeDays > 365 * 3) score += 4;
    }

    if (isExpired) score -= 20;
    else if (expiryDaysLeft !== null) {
      if (expiryDaysLeft < 30) score -= 10;
      else if (expiryDaysLeft < 90) score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  })();
  const objectiveTone =
    objectiveScore >= 70 ? 'safe' : objectiveScore >= 45 ? 'warn' : 'danger';
  const objectiveLabel =
    objectiveTone === 'safe' ? 'Rủi ro thấp' : objectiveTone === 'warn' ? 'Cần thận trọng' : 'Rủi ro cao';
  const objectiveFactors = [
    {
      label: 'Tuổi domain',
      value: domainAgeDays !== null ? `${formatNumber(domainAgeDays)} ngày` : 'Chưa rõ',
      icon: 'fi fi-sr-calendar',
    },
    {
      label: 'Hạn sử dụng',
      value: isExpired
        ? 'Đã hết hạn'
        : expiryDaysLeft !== null
          ? `Còn ${formatNumber(Math.max(0, expiryDaysLeft))} ngày`
          : 'Chưa rõ',
      icon: 'fi fi-sr-hourglass',
    },
    {
      label: 'Báo cáo',
      value: `${formatNumber(data.reports || 0)} lượt`,
      icon: 'fi fi-sr-flag',
    },
    {
      label: 'Pháp lý',
      value: policyMetaSnapshot?.policyViolation ? 'Có cảnh báo' : 'Không có',
      icon: 'fi fi-sr-gavel',
    },
    {
      label: 'Nguồn quét',
      value: scanStatus === 'success'
        ? (() => {
            const firstChunk = (scanResult?.source || 'AI').split(/[:;]/)[0];
            return (firstChunk || 'AI').replace(/^local_db:?/i, 'baocaoluadao.com');
          })()
        : 'Chưa quét',
      icon: 'fi fi-sr-radar',
      valueClass: 'objective-source-value',
    },
  ];
  const objectiveSources = [
    scanStatus === 'success' ? 'AI Scan' : null,
    policyMetaSnapshot?.policyViolation ? 'Policy List' : null,
    domainRegisteredMs ? 'RDAP' : null,
    expiryInfo?.source ? expiryInfo.source : null,
    data.reports ? 'Cộng đồng' : null,
  ].filter(Boolean) as string[];
  const similarityScore = (() => {
    const checks = scanResult?.securityChecks;
    if (!checks || checks.length === 0) {
      return Math.min(99, Math.max(5, Math.round(derivedRiskScore * 0.6)));
    }
    const weight = checks.reduce((sum, item) => {
      if (item.status === 'fail') return sum + 2;
      if (item.status === 'warning') return sum + 1;
      return sum;
    }, 0);
    const score = Math.round((weight / (checks.length * 2)) * 100);
    return Math.min(99, Math.max(5, score));
  })();
  const amountText = (data.amount || '').trim();
  const amountParts = amountText ? amountText.split(' ') : [];
  const amountCurrency = amountParts.length > 1 ? (amountParts.pop() as string) : 'VND';
  const amountNumber = amountParts.join(' ') || '';
  const policySourceHref = policyMetaSnapshot?.policySourceUrl?.trim() || undefined;
  const policySourceTitle = policyMetaSnapshot?.policySourceTitle?.trim() || 'Nguồn công bố chính thức';
  const scanFindings = (() => {
    const checks = scanResult?.securityChecks;
    if (!checks || checks.length === 0) return [];
    const rank = (status: ScanSecurityCheck['status']) => (status === 'fail' ? 0 : status === 'warning' ? 1 : 2);
    return [...checks].sort((a, b) => rank(a.status) - rank(b.status));
  })();
  const primaryFinding = scanFindings[0]?.details;
  const secondaryFinding = scanFindings[1]?.details;

  return (
    <DetailContentNew
      data={data}
      insight={insight}
      normalizedType={normalizedType}
      viewCount={viewCount}
      comments={displayedComments}
      ratingStats={ratingStats}
      myRating={myRating}
      accountAge24h={accountAge24h}
      isAuthenticated={isAuthenticated}
      commentSort={commentSort}
      onCommentSortChange={setCommentSort}
      onCommentSubmit={handleComment}
      onRate={handleRate}
      onHelpful={handleHelpful}
      onCopy={handleCopy}
      copied={copied}
      isCommentSubmitting={isCommentSubmitting}
      isRatingSubmitting={isRatingSubmitting}
    />
  );
}
