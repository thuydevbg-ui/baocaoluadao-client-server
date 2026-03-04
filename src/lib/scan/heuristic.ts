import { DeterministicResult } from '@/lib/scan/deterministic';

const PRIVACY_PATHS = ['/privacy', '/privacy-policy', '/privacy.html', '/privacy/index.html'];
const SCHEMES = ['https://', 'http://'];
const HEURISTIC_TIMEOUT_MS = 3_000;
const SUBDOMAIN_IGNORE = new Set(['www', 'm', 'api', 'app', 'portal', 'cdn']);

export interface HeuristicResult {
  heuristicScore: number;
  reasons: string[];
  foundPrivacyPolicy: boolean;
}

async function probePrivacyPolicy(domain: string): Promise<boolean> {
  for (const scheme of SCHEMES) {
    for (const path of PRIVACY_PATHS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEURISTIC_TIMEOUT_MS);
      try {
        const response = await fetch(`${scheme}${domain}${path}`, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'User-Agent': 'ScamGuard-PrivacyBot/1.0' },
        });

        if (response.status >= 200 && response.status < 400) {
          return true;
        }

        if (response.headers.get('location')?.includes('privacy')) {
          return true;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return false;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function evaluateHeuristicRisk(
  domain: string,
  deterministic: DeterministicResult
): Promise<HeuristicResult> {
  const reasons: string[] = [];
  let heuristicScore = 30;

  if (deterministic.domainAgeDays !== null && deterministic.domainAgeDays < 30) {
    heuristicScore += 30;
    reasons.push(`Domain age ${deterministic.domainAgeDays} days (<30 days)`);
  }

  const labels = domain.split('.').filter(Boolean);
  const hasUnusualSubdomain = labels.length > 2 && !SUBDOMAIN_IGNORE.has(labels[0]);
  if (hasUnusualSubdomain) {
    heuristicScore += 20;
    reasons.push('Unusual subdomain structure detected');
  }

  const foundPolicy = await probePrivacyPolicy(domain);
  if (!foundPolicy) {
    heuristicScore += 10;
    reasons.push('Privacy policy could not be reached');
  }

  if (deterministic.flags.includes('dns-resolution-failed')) {
    heuristicScore += 5;
    reasons.push('DNS lookups are already failing');
  }

  if (deterministic.flags.includes('domain-age-young')) {
    reasons.push('Domain looks recently registered (deterministic)');
  }

  return {
    heuristicScore: clampScore(heuristicScore),
    reasons,
    foundPrivacyPolicy: foundPolicy,
  };
}
