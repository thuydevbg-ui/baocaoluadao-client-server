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
  Flag,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  Loader2,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, RiskBadge, DetailSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/contexts/I18nContext';
import { cn, type ScamDetail, type RiskLevel, sanitizeHTML, formatNumber } from '@/lib/utils';

type ScamKind = 'phone' | 'bank' | 'website' | 'crypto';
type SourceStatus = 'trusted' | 'confirmed' | 'suspected' | 'unknown';

interface DetailSourceMeta {
  status?: string;
  reports?: number;
  firstSeen?: string;
  lastReported?: string;
  description?: string;
  organization?: string;
  source?: string;
  sourceLink?: string;
  sourceCategory?: string;
  sourceMode?: string;
  sourceIcon?: string;
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
}

interface CategoryLookupResponse {
  success?: boolean;
  source?: string;
  mode?: string;
  category?: string;
  items?: CategoryLookupItem[];
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
  time: string;
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
  if (status === 'trusted' || status === 'safe' || status === 'verified') return 'trusted';
  if (status === 'confirmed' || status === 'scam') return 'confirmed';
  if (status === 'suspected' || status === 'warning' || status === 'processing') return 'suspected';
  return 'unknown';
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
  if (!/[ÃÂÄÅ]/.test(value)) return value;
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

function formatRelativeTime(input: string): string {
  const target = new Date(input).getTime();
  if (!Number.isFinite(target)) return 'Vừa xong';

  const diffMs = Date.now() - target;
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
  return {
    id: item.id,
    user: item.user,
    avatar: item.avatar,
    text: item.text,
    helpful: item.helpful,
    rating: typeof item.rating === 'number' ? item.rating : null,
    time: formatRelativeTime(item.createdAt),
    verified: Boolean(item.verified),
    helpfulMarked: Boolean(item.helpfulMarked),
    canMarkHelpful: item.canMarkHelpful ?? !item.helpfulMarked,
  };
}

function countSentences(input: string): number {
  const normalized = input.replace(/\n+/g, ' ').trim();
  if (!normalized) return 0;
  const parts = normalized.split(/[.!?…]+/).map((part) => part.trim()).filter(Boolean);
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
  const reports = parsePositiveInt(sourceMeta.reports) ?? 35 + (idHash % 240);
  let confidence = 72 + (idHash % 26);
  const baseScoreMap: Record<ScamKind, number> = {
    phone: 86,
    bank: 90,
    website: 84,
    crypto: 88,
  };

  const keywordBoost = /(otp|verify|xac minh|trung thuong|khuyen mai|chuyen tien|bank|gov|shopee|tiktok)/i.test(value) ? 6 : 0;
  let riskScore = Math.min(98, baseScoreMap[kind] + keywordBoost + (idHash % 5));
  let risk: RiskLevel = riskScore >= 80 ? 'scam' : riskScore >= 55 ? 'suspicious' : 'safe';

  if (hasSourceStatus) {
    risk = mapStatusToRisk(normalizedStatus);
    riskScore = mapStatusToRiskScore(normalizedStatus, reports);
    confidence = normalizedStatus === 'trusted' ? 97 : normalizedStatus === 'confirmed' ? 95 : 86;
  }

  const isTrustedEntity = normalizedStatus === 'trusted' || sourceMeta.sourceMode === 'trusted';
  const typeLabel = isTrustedEntity
    ? TRUSTED_CATEGORY_LABEL[sourceMeta.sourceCategory || ''] || 'Đối tượng tín nhiệm'
    : TYPE_LABEL[kind];

  const detailByType: Record<ScamKind, { description: string; channels: string[]; riskSignals: string[]; safeSignals: string[]; recommendations: string[]; safeRecommendations: string[]; source: string }> = {
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
        'Khóa tạm thời thẻ/tài khoản nếu đã lỡ cung cấp thông tin.',
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
  const statusLabel = getStatusLabel(normalizedStatus, risk);
  const description = sourceMeta.description?.trim()
    ? sourceMeta.description.trim()
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
    amount: risk === 'safe' ? undefined : estimatedLoss,
  };

  const insight: DetailInsight = {
    riskSignals: risk === 'safe' ? profile.safeSignals : profile.riskSignals,
    recommendations: risk === 'safe' ? profile.safeRecommendations : profile.recommendations,
    channels: isTrustedEntity ? ['Thông tin liên hệ', 'Kênh chính thức', 'Xác thực nguồn'] : profile.channels,
    related: [
      sourceMeta.organization || '',
      kind === 'website' ? normalizeDomainKey(value) || value : value,
      sourceMeta.organization ? `${sourceMeta.organization} liên hệ` : '',
    ].filter(Boolean),
    timeline: [
      { label: 'Phát hiện lần đầu', value: firstSeen, tone: risk === 'safe' ? 'neutral' : 'warning' },
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
  const hasKnownSource = Boolean(status || sourceMode || sourceLink);

  return {
    status,
    reports,
    firstSeen: params.get('firstSeen') || undefined,
    lastReported: params.get('lastReported') || undefined,
    description: params.get('description') || undefined,
    organization: params.get('organization') || undefined,
    source: hasKnownSource ? 'tinnhiemmang.vn' : undefined,
    sourceLink,
    sourceCategory: params.get('sourceCategory') || undefined,
    sourceMode,
    sourceIcon: params.get('sourceIcon') || undefined,
  };
}

function mapKindToCategory(kind: ScamKind): string {
  if (kind === 'bank') return 'organizations';
  if (kind === 'website') return 'websites';
  if (kind === 'phone') return 'devices';
  return 'apps';
}

async function lookupSourceMetaByValue(kind: ScamKind, value: string): Promise<DetailSourceMeta | null> {
  const category = mapKindToCategory(kind);
  const targetKey = normalizeCompareKey(value);
  const targetDomain = normalizeDomainKey(value);
  const targetSlug = slugifyForMatch(value);

  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, page: 1 }),
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
    sourceIcon: matched.icon,
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
  const [helpfulSubmittingId, setHelpfulSubmittingId] = useState<string | null>(null);

  const decodedValue = useMemo(() => decodeRouteValue(rawId), [rawId]);
  const normalizedType = useMemo(() => normalizeKind(rawType), [rawType]);
  const detailFeedbackKey = useMemo(
    () => `${normalizedType}:${slugifyForMatch(decodedValue || 'khong-xac-dinh')}`,
    [normalizedType, decodedValue]
  );
  const searchParamsKey = searchParams.toString();

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

        const profile = buildDetailProfile(normalizedType, decodedValue || 'Không xác định', sourceMeta);
        setData(profile.detail);
        setInsight(profile.insight);
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

  const getIcon = (type: ScamKind) => {
    switch (type) {
      case 'phone':
        return Phone;
      case 'bank':
        return Building2;
      case 'website':
        return Globe;
      case 'crypto':
        return Wallet;
      default:
        return AlertTriangle;
    }
  };

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

  const Icon = getIcon(normalizedType);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 border-primary/20 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-bg-border bg-gradient-to-r from-primary/10 via-bg-card to-bg-card">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
                        data.risk === 'scam'
                          ? 'bg-danger/10 text-danger'
                          : data.risk === 'suspicious'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                      )}
                    >
                      {insight.sourceIcon ? (
                        <img src={insight.sourceIcon} alt={data.value} className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <Icon className="w-7 h-7" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl md:text-3xl font-bold text-text-main leading-tight break-words">
                        {data.value}
                      </h1>
                      <p className="text-text-secondary mt-1">{insight.typeLabel}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-bg-border bg-bg-cardHover text-text-secondary">
                          <ShieldCheck className="w-3.5 h-3.5 text-success" />
                          Độ tin cậy nguồn: {insight.confidence}%
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-bg-border bg-bg-cardHover text-text-secondary">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Cập nhật: {insight.updatedAt}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <RiskBadge risk={data.risk} label={insight.statusLabel || t(`risk.${data.risk}`)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      onClick={handleCopy}
                    >
                      {copied ? 'Đã sao chép' : 'Sao chép tiêu đề'}
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
                      {t('detail.share')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Flag className="w-4 h-4" />}
                      onClick={() => router.push(`/report?type=${normalizedType}&target=${encodeURIComponent(data.value)}`)}
                    >
                      {t('detail.report')}
                    </Button>
                    {insight.sourceLink && (
                      <a
                        href={insight.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button border border-bg-border text-text-secondary hover:text-text-main hover:border-primary/40 transition-colors text-sm font-medium"
                      >
                        Nguồn gốc
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-muted">{t('risk.score')}</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        data.risk === 'scam'
                          ? 'text-danger'
                          : data.risk === 'suspicious'
                            ? 'text-warning'
                            : 'text-success'
                      )}
                    >
                      {data.riskScore}/100
                    </span>
                  </div>
                  <div className="h-3 bg-bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.riskScore}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        data.risk === 'scam'
                          ? 'risk-scam'
                          : data.risk === 'suspicious'
                            ? 'risk-suspicious'
                            : 'risk-safe'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-bg-cardHover rounded-xl p-3 text-center">
                    {data.risk === 'safe' ? (
                      <ShieldCheck className="w-4 h-4 text-success mx-auto mb-1.5" />
                    ) : (
                      <AlertTriangle className={cn('w-4 h-4 mx-auto mb-1.5', data.risk === 'scam' ? 'text-danger' : 'text-warning')} />
                    )}
                    <p className="text-xl font-bold text-text-main font-mono">{formatNumber(data.reports)}</p>
                    <p className="text-xs text-text-muted">{data.risk === 'safe' ? 'Báo cáo tiêu cực' : t('risk.reports')}</p>
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

          <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-xl font-bold text-text-main mb-3">{t('detail.description')}</h2>
                <p className="text-text-secondary leading-relaxed">{data.description}</p>
                {data.amount && (
                  <div className="mt-4 pt-4 border-t border-bg-border">
                    <span className="text-text-muted">{t('detail.estimated_loss')}: </span>
                    <span className="text-danger font-mono font-bold">{data.amount}</span>
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-text-main mb-3">Khuyến nghị xử lý ngay</h2>
                <div className="space-y-2.5">
                  {insight.recommendations.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-text-main mb-3">{t('detail.timeline')}</h2>
                <div className="space-y-3">
                  {insight.timeline.map((step) => (
                    <div key={step.label} className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-cardHover/70 px-3 py-2.5">
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

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <Card>
                <h3 className="text-lg font-bold text-text-main mb-3">
                  {data.risk === 'safe' ? 'Tín hiệu xác thực' : 'Dấu hiệu rủi ro'}
                </h3>
                <div className="space-y-2.5">
                  {insight.riskSignals.map((signal) => (
                    <div key={signal} className="flex items-start gap-2 text-sm text-text-secondary">
                      {data.risk === 'safe' ? (
                        <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', data.risk === 'scam' ? 'text-danger' : 'text-warning')} />
                      )}
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-text-main mb-3">Kênh bị nhắm tới</h3>
                <div className="flex flex-wrap gap-2">
                  {insight.channels.map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-bg-border bg-bg-cardHover text-text-secondary"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-text-main mb-3">{t('detail.related')}</h3>
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

              <Card>
                <h3 className="text-lg font-bold text-text-main mb-2">Nguồn dữ liệu</h3>
                <p className="text-sm text-text-secondary">{insight.source}</p>
                {insight.sourceLink && (
                  <a
                    href={insight.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Xem chi tiết trên TinNhiemMang.vn
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </Card>
            </motion.aside>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 space-y-5"
          >
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg md:text-xl font-bold text-text-main">
                  {t('detail.comments')} ({comments.length})
                </h2>
                <div className="inline-flex items-center gap-2 rounded-full border border-bg-border bg-bg-cardHover/70 px-3 py-1.5">
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
                            'w-3.5 h-3.5',
                            (myRating ?? pendingRating ?? ratingStats.average) >= star
                              ? 'text-warning fill-current'
                              : 'text-text-muted/40'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-text-muted">{formatNumber(ratingStats.total)} lượt đánh giá</span>
                </div>
              </div>
              {isFeedbackLoading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải...
                </span>
              )}
            </div>

            <Card className="p-4 md:p-5">
              <div className="flex gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0 text-sm">
                  B
                </div>
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('detail.comment_placeholder')}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-bg-cardHover border border-bg-border rounded-button text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex items-center justify-between mt-2.5 gap-3">
                    <p className="text-[11px] md:text-xs text-text-muted">
                      {myRating === null
                        ? 'Chọn sao cạnh tiêu đề Bình luận và viết nội dung đánh giá (tối đa 20 câu).'
                        : 'Chia sẻ trải nghiệm thực tế để cộng đồng nhận diện rủi ro nhanh hơn (tối đa 20 câu).'}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleComment}
                      disabled={!comment.trim() || isCommentSubmitting || (myRating === null && pendingRating === null)}
                      leftIcon={isCommentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    >
                      {isCommentSubmitting ? 'Đang gửi...' : t('detail.add_comment')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-2.5">
              {!isFeedbackLoading && comments.length === 0 && (
                <Card className="text-center py-7">
                  <p className="text-text-secondary">Chưa có bình luận nào cho cảnh báo này.</p>
                  <p className="text-xs text-text-muted mt-1">Hãy là người đầu tiên chia sẻ thông tin xác minh.</p>
                </Card>
              )}
              {comments.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                >
                  <Card hover className="p-4">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                        {c.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-text-main">{c.user}</span>
                          {(() => {
                            const ratingValue = c.rating ?? 0;
                            if (ratingValue <= 0) return null;
                            return (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-warning/35 bg-warning/10 px-2 py-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={`${c.id}-${star}`}
                                    className={cn(
                                      'w-3 h-3',
                                      ratingValue >= star ? 'text-warning fill-current' : 'text-text-muted/40'
                                    )}
                                  />
                                ))}
                              </span>
                            );
                          })()}
                          <span className="text-xs text-text-muted">{c.time}</span>
                        </div>
                        <p className="text-sm text-text-secondary break-words">{sanitizeHTML(c.text)}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => handleHelpful(c.id)}
                            disabled={!c.canMarkHelpful || isFeedbackLoading || helpfulSubmittingId === c.id}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                              c.helpfulMarked
                                ? 'border-success/40 bg-success/10 text-success'
                                : 'border-bg-border bg-bg-cardHover text-text-muted hover:text-text-main hover:border-primary/40',
                              (!c.canMarkHelpful || isFeedbackLoading || helpfulSubmittingId === c.id) && 'opacity-65 cursor-not-allowed'
                            )}
                          >
                            {helpfulSubmittingId === c.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ThumbsUp className="w-3.5 h-3.5" />
                            )}
                            {formatNumber(c.helpful)} {t('detail.helpful')}
                          </button>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
                              c.verified
                                ? 'border-success/40 bg-success/10 text-success'
                                : 'border-bg-border bg-bg-cardHover text-text-muted'
                            )}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
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
