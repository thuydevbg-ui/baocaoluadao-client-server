import { Building2, CheckCircle2, Clock, FileText, Globe } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { fetchCategoryDirectory, type TinnhiemCategory, type TinnhiemDirectoryItem } from '@/lib/dataSources/tinnhiemmang';

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
}

const CACHE_TTL_MS = 60_000;
const DISPLAY_LIMIT = 6;
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
  if (cachedTrusted && Date.now() - cachedTrusted.fetchedAt < CACHE_TTL_MS) {
    const cachedItems = cachedTrusted.items;
    return renderTrustedSection(cachedItems);
  }

  const items = await fetchTrustedAuthorities();
  cachedTrusted = { items, fetchedAt: Date.now() };
  return renderTrustedSection(items);
}

function renderTrustedSection(items: TrustedAuthorityItem[]) {
  const hasItems = items.length > 0;

  return (
    <section className="rounded-2xl border border-bg-border bg-white/70 dark:bg-[#0c1221]/80 shadow-sm backdrop-blur">
      <div className="p-4 md:p-5 space-y-3 md:space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Trang & Tổ chức uy tín</p>
          <h3 className="text-lg font-semibold text-text-main">Các thực thể được xác minh và đánh giá an toàn</h3>
        </div>

        <div className="grid gap-3 md:flex md:flex-col md:gap-4">
          {items.map((item) => {
            const Icon = item.type === 'website' ? Globe : Building2;
            return (
              <div
                key={item.id}
                className="w-full rounded-xl border border-bg-border/60 bg-white/80 dark:bg-[#101827]/80 p-3 md:p-4 shadow-sm transition-all duration-200 hover:translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-main truncate">{item.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[0.65rem] font-semibold dark:bg-green-500/20 dark:text-green-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã xác minh
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{item.organization}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {item.reports} báo cáo
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(item.firstSeen)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[0.65rem] font-semibold dark:bg-green-500/20 dark:text-green-200">
                        An toàn
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!hasItems && (
            <div className="rounded-2xl border border-dashed border-bg-border/70 bg-bg-card/60 p-6 text-sm text-text-muted">
              Chưa có dữ liệu uy tín để hiển thị.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
