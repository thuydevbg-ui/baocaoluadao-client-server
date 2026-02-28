import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import ApiDocsClient from './ApiDocsClient';
import { getSiteSettings } from '@/lib/siteSettings';
import { banIp, isIpBanned } from '@/lib/ipBan';

function parseAllowedIps(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getClientIpFromHeaders(): Promise<string | null> {
  const h = await headers();
  const xf = h.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return h.get('x-real-ip') ?? null;
}

export default async function ApiDocsPage() {
  const ip = await getClientIpFromHeaders();

  if (await isIpBanned(ip)) {
    return notFound();
  }

  const settings = await getSiteSettings();
  const allowed = parseAllowedIps(settings.allowedDocsIps);
  const allowedMatch = ip && allowed.includes(ip);

  if (!allowedMatch) {
    await banIp(ip, 'api-docs unauthorized');
    return notFound();
  }

  return <ApiDocsClient />;
}
