import { Building2, CheckCircle2, Clock, FileText, Globe } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { fetchCategoryDirectory, type TinnhiemCategory, type TinnhiemDirectoryItem } from '@/lib/dataSources/tinnhiemmang';
import SafeImage from '@/components/ui/SafeImage';

export const dynamic = 'force-dynamic';

type TrustedAuthorityType = 'website' | 'organization';

interface TrustedAuthorityItem {
  id: string;
  type: TrustedAuthorityType;
  name: string;
  organization: string;
  reports: number;
  firstSeen: string;
  status: string;
  riskScore: number;
  icon?: string;
}

const CACHE_TTL_MS = 60_000;
const DISPLAY_LIMIT = 4;
let cachedTrusted: { items: TrustedAuthorityItem[]; fetchedAt: number } | null = null;

function normalizeRowType(value?: string): TrustedAuthorityType {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'bank' || normalized === 'organization') return 'organization';
  return 'website';
}

const CATEGORY_SOURCE: TinnhiemCategory[] = ['websites', 'organizations', 'apps'];
const SAFE_STATUS_EXCLUDE = ['confirmed', 'scam', 'suspected', 'warning'];

function mapCategoryRisk(status?: string): 'safe' | 'suspicious' | 'scam' {
  if (!status) return 'safe';
  const lowered = status.toLowerCase();
  if (lowered === 'confirmed' || lowered === 'scam') return 'scam';
  if (lowered === 'suspected' || lowered === 'warning') return 'suspicious';
  return 'safe';
}

function parseDateValue(input?: string): number {
  if (!input) return 0;
  const trimmed = input.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const day = Number.parseInt(parts[0], 10);
    const month = Number.parseInt(parts[1], 10) - 1;
    let year = Number.parseInt(parts[2], 10);
    if (Number.isFinite(year) && year < 100) {
      year += 2000;
    }
    const date = new Date(Date.UTC(year, month, day));
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toTrustedItem(item: TinnhiemDirectoryItem, serverTime?: number): TrustedAuthorityItem {
  const type = item.type === 'organizations' ? 'organization' : 'website';
  const reports = Number.parseInt(item.count_report || '0', 10) || 0;
  const organization = item.organization || (type === 'organization' ? item.name : 'TinNhiemMang.vn');
  const icon = item.organization_icon || item.icon || '';
  // Use server time if provided, otherwise use item's created_at, never generate new date during render
  const firstSeen = serverTime 
    ? new Date(serverTime).toISOString() 
    : (item.created_at || '');
  return {
    id: item.id || `${type}-${item.name}`.toLowerCase().replace(/\s+/g, '-'),
    type: normalizeRowType(type),
    name: item.name,
    organization,
    reports,
    firstSeen,
    status: (item.status || '').trim().toLowerCase(),
    riskScore: 0,
    icon,
  };
}

async function fetchTrustedAuthorities(): Promise<TrustedAuthorityItem[]> {
  try {
    // Capture server time once at the start of the request
    const serverTime = Date.now();
    
    const results = await Promise.allSettled(
      CATEGORY_SOURCE.map((category) => fetchCategoryDirectory(category, 1, ''))
    );

    const safeItems: TrustedAuthorityItem[] = [];
    results.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      result.value.items.forEach((item) => {
        if (mapCategoryRisk(item.status) === 'safe') {
          safeItems.push(toTrustedItem(item, serverTime));
        }
      });
    });

    const sorted = safeItems.sort(
      (a, b) => parseDateValue(b.firstSeen) - parseDateValue(a.firstSeen)
    );

    return sorted.slice(0, DISPLAY_LIMIT);
  } catch (error) {
    console.error('Trusted authorities fetch failed:', error);
    return [];
  }
}

export default async function TrustedSection() {
  try {
    if (cachedTrusted && Date.now() - cachedTrusted.fetchedAt < CACHE_TTL_MS) {
      const cachedItems = cachedTrusted.items;
      return renderTrustedSection(cachedItems);
    }

    const items = await fetchTrustedAuthorities();
    cachedTrusted = { items, fetchedAt: Date.now() };
    return renderTrustedSection(items);
  } catch (error) {
    console.error('[TrustedSection] render failed:', error);
    return renderTrustedSection([]);
  }
}

function renderTrustedSection(items: TrustedAuthorityItem[]) {
  const hasItems = items.length > 0;

  return (
    <section className="home-card widget-stack">
      <div className="card-stack">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Verified Organizations</p>
          <h2 className="text-[20px] font-semibold text-text-main">Các thực thể được xác minh và đánh giá an toàn</h2>
          <p className="text-sm leading-6 text-text-secondary">
            Danh sách được rút gọn để sidebar nhẹ hơn nhưng vẫn giữ rõ nhãn xác minh và trạng thái an toàn.
          </p>
        </div>

        <div className="card-stack">
          {items.map((item) => {
            const Icon = item.type === 'website' ? Globe : Building2;
            return (
              <div
                key={item.id}
                className="w-full rounded-2xl border border-bg-border/70 bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                    {item.icon ? (
                      <SafeImage
                        src={item.icon}
                        fallbackSrc="https://tinnhiemmang.vn/img/icon_web2.png"
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-main truncate">{item.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã xác minh
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-text-muted">{item.organization}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {item.reports} báo cáo
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(item.firstSeen)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                        An toàn
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!hasItems && (
            <div className="rounded-2xl border border-dashed border-bg-border/70 bg-white p-6 text-sm text-text-muted dark:bg-slate-950/40">
              Chưa có dữ liệu uy tín để hiển thị.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
