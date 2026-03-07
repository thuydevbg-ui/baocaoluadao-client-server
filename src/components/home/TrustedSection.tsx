import Link from 'next/link';
import { Building2, BadgeCheck, Globe } from 'lucide-react';
import { fetchCategoryDirectory, type TinnhiemCategory, type TinnhiemDirectoryItem } from '@/lib/dataSources/tinnhiemmang';
import SafeImage from '@/components/ui/SafeImage';

export const dynamic = 'force-dynamic';

type TrustedAuthorityType = 'website' | 'organization';

interface TrustedAuthorityItem {
  id: string;
  type: TrustedAuthorityType;
  name: string;
  organization: string;
  description?: string;
  reports: number;
  firstSeen: string;
  status: string;
  riskScore: number;
  icon?: string;
  link?: string;
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

function formatLinkText(link?: string, fallback?: string) {
  if (!link) return fallback || '';
  try {
    const url = new URL(link);
    const pathname = url.pathname === '/' ? '' : url.pathname;
    return `${url.hostname}${pathname}`;
  } catch {
    return link.replace(/^https?:\/\//, '');
  }
}

function maskForCompactDisplay(text: string): string {
  const clean = text.trim();
  if (clean.length <= 18) return clean;
  return `${clean.slice(0, 6)}***${clean.slice(-8)}`;
}

function toTrustedItem(item: TinnhiemDirectoryItem, serverTime?: number): TrustedAuthorityItem {
  const type = item.type === 'organizations' ? 'organization' : 'website';
  const reports = Number.parseInt(item.count_report || '0', 10) || 0;
  const organization = item.organization || (type === 'organization' ? item.name : 'TinNhiemMang.vn');
  const icon = item.organization_icon || item.icon || '';
  const description = item.description || '';
  // Use server time if provided, otherwise use item's created_at, never generate new date during render
  const firstSeen = serverTime 
    ? new Date(serverTime).toISOString() 
    : (item.created_at || '');
  return {
    id: item.id || `${type}-${item.name}`.toLowerCase().replace(/\s+/g, '-'),
    type: normalizeRowType(type),
    name: item.name,
    organization,
    description,
    reports,
    firstSeen,
    status: (item.status || '').trim().toLowerCase(),
    riskScore: 0,
    icon,
    link: item.link,
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <BadgeCheck className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="text-[16px] font-semibold text-text-main">Danh sách uy tín</h2>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.type === 'website' ? Globe : Building2;
            const fullLabel = item.name || formatLinkText(item.link, item.name);
            const maskedText = maskForCompactDisplay(fullLabel);
            const detailParams = new URLSearchParams({
              status: 'trusted',
              sourceMode: 'trusted',
              source: 'tinnhiemmang.vn',
            });
            if (item.organization) detailParams.set('organization', item.organization);
            if (item.icon) detailParams.set('sourceIcon', item.icon);

            const detailHref = `/detail/${item.type}/${encodeURIComponent(item.name)}?${detailParams.toString()}`;

            const card = (
              <div className="relative flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-bg-border/70 bg-white p-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-primary shadow-sm dark:bg-slate-800">
                    {item.icon ? (
                      <SafeImage
                        src={item.icon}
                        fallbackSrc="https://tinnhiemmang.vn/img/icon_web2.png"
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-text-main hover:text-primary" title={fullLabel}>
                      {maskedText}
                    </p>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <BadgeCheck className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pl-[52px]">
                  <p className="min-w-0 flex-1 truncate text-[12px] text-text-secondary">
                    {item.description || item.organization || 'TinNhiemMang.vn'}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success shrink-0">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Uy tín
                  </span>
                </div>
              </div>
            );

            return (
              <Link
                key={item.id}
                href={detailHref}
                prefetch={false}
                className="block"
              >
                {card}
              </Link>
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
