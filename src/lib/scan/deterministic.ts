import { promises as dns } from 'dns';
import tls from 'tls';

const RDAP_ENDPOINT = 'https://rdap.org/domain/';
const DOMAIN_AGE_TIMEOUT_MS = 4_000;
const SSL_TIMEOUT_MS = 4_000;

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'work', 'buzz', 'icu', 'click', 'link', 'trade', 'store', 'gdn',
  'loan', 'win', 'online', 'site', 'info', 'loan', 'vip', 'loan'
]);

const SUSPICIOUS_KEYWORDS = ['secure', 'verify', 'confirm', 'login', 'payment', 'bank', 'update', 'account', 'alert', 'support'];

const RISKY_IPS = new Set(['185.199.108.153', '185.199.109.154', '185.199.110.153', '185.199.111.153']);

export interface DeterministicResult {
  deterministicScore: number;
  flags: string[];
  domainAgeDays: number | null;
  dnsResolved: boolean;
  sslValid: boolean;
  ipAddresses: string[];
  suspiciousPatterns: string[];
}

export interface DomainRegistrationInfo {
  registeredAt: string | null;
  ageDays: number | null;
}

export interface DomainExpiryInfo {
  expiresAt: string | null;
  daysLeft: number | null;
}

export async function fetchDomainRegistration(domain: string): Promise<DomainRegistrationInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOMAIN_AGE_TIMEOUT_MS);

  try {
    const response = await fetch(`${RDAP_ENDPOINT}${domain}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { registeredAt: null, ageDays: null };
    }

    const payload = await response.json().catch(() => null);
    const events = Array.isArray(payload?.events) ? payload.events : [];
    const registrationEvents = events
      .filter((event: {eventAction?: string}) => {
        if (typeof event?.eventAction !== 'string') return false;
        return /\bregistration\b|\bregistered\b|\bcreation\b|\bcreated\b/i.test(event.eventAction);
      })
      .map((event: {eventDate?: string}) => ({ date: typeof event.eventDate === 'string' ? Date.parse(event.eventDate) : NaN }))
      .filter((event: {date: number}) => Number.isFinite(event.date));

    if (!registrationEvents.length) {
      return { registeredAt: null, ageDays: null };
    }

    const earliest = registrationEvents.reduce((prev: {date: number}, current: {date: number}) => (current.date < prev.date ? current : prev));
    const days = Math.max(0, Math.floor((Date.now() - earliest.date) / (1000 * 60 * 60 * 24)));
    const registeredAt = new Date(earliest.date).toISOString();
    return { registeredAt, ageDays: days };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { registeredAt: null, ageDays: null };
    }
    return { registeredAt: null, ageDays: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDomainExpiry(domain: string): Promise<DomainExpiryInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOMAIN_AGE_TIMEOUT_MS);

  try {
    const response = await fetch(`${RDAP_ENDPOINT}${domain}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { expiresAt: null, daysLeft: null };
    }

    const payload = await response.json().catch(() => null);
    const events = Array.isArray(payload?.events) ? payload.events : [];
    const expiryEvents = events
      .filter((event: {eventAction?: string}) => {
        if (typeof event?.eventAction !== 'string') return false;
        return /\bexpiration\b|\bexpiry\b|\bexpires\b/i.test(event.eventAction);
      })
      .map((event: {eventDate?: string}) => ({ date: typeof event.eventDate === 'string' ? Date.parse(event.eventDate) : NaN }))
      .filter((event: {date: number}) => Number.isFinite(event.date));

    if (!expiryEvents.length) {
      return { expiresAt: null, daysLeft: null };
    }

    const latest = expiryEvents.reduce((prev: {date: number}, current: {date: number}) => (current.date > prev.date ? current : prev));
    const diffMs = latest.date - Date.now();
    const daysLeft = diffMs <= 0 ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const expiresAt = new Date(latest.date).toISOString();
    return { expiresAt, daysLeft };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { expiresAt: null, daysLeft: null };
    }
    return { expiresAt: null, daysLeft: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveDomainIps(domain: string): Promise<string[]> {
  try {
    const records = await dns.lookup(domain, { all: true });
    return records.map((record) => record.address);
  } catch {
    return [];
  }
}

async function checkSslValidity(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: domain, servername: domain, port: 443, rejectUnauthorized: true },
      () => {
        const valid = socket.authorized;
        socket.end();
        resolve(valid);
      }
    );

    socket.setTimeout(SSL_TIMEOUT_MS, () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function evaluateDeterministicRisk(domain: string): Promise<DeterministicResult> {
  const flags = new Set<string>();
  const suspiciousPatterns: string[] = [];

  const [registration, ipAddresses, sslValid] = await Promise.all([
    fetchDomainRegistration(domain),
    resolveDomainIps(domain),
    checkSslValidity(domain).catch(() => false),
  ]);

  const domainAgeDays = registration.ageDays;
  const dnsResolved = ipAddresses.length > 0;
  if (!dnsResolved) {
    flags.add('dns-resolution-failed');
  }

  if (!sslValid) {
    flags.add('ssl-invalid-or-missing');
  }

  if (domainAgeDays === null) {
    flags.add('domain-age-unknown');
  } else if (domainAgeDays < 30) {
    flags.add('domain-age-young');
  }

  const baseScore = 50;
  let deterministicScore = baseScore;

  if (domainAgeDays !== null) {
    if (domainAgeDays >= 365) {
      deterministicScore += 10;
    } else if (domainAgeDays >= 180) {
      deterministicScore += 5;
    } else if (domainAgeDays < 30) {
      deterministicScore -= 30;
    }
  } else {
    deterministicScore -= 5;
  }

  deterministicScore += dnsResolved ? 10 : -25;
  deterministicScore += sslValid ? 10 : -25;

  const hasRiskyIp = ipAddresses.some((ip) => RISKY_IPS.has(ip));
  if (hasRiskyIp) {
    deterministicScore -= 30;
    flags.add('ip-reputation-risk');
  } else if (ipAddresses.length) {
    deterministicScore += 5;
  }

  const tld = domain.split('.').pop() || '';
  if (tld && SUSPICIOUS_TLDS.has(tld)) {
    deterministicScore -= 10;
    flags.add('suspicious-tld');
    suspiciousPatterns.push('Suspicious TLD: ' + tld);
  }

  if (SUSPICIOUS_KEYWORDS.some((keyword) => domain.includes(keyword))) {
    deterministicScore -= 10;
    flags.add('contains-risk-keyword');
    suspiciousPatterns.push('Contains risk keyword');
  }

  if (/\bhttps?:/.test(domain)) {
    deterministicScore -= 15;
    flags.add('embedded-schema');
    suspiciousPatterns.push('URL scheme detected in domain');
  }

  if (/\b\d{4,}\b/.test(domain)) {
    deterministicScore -= 6;
    flags.add('long-digit-sequence');
    suspiciousPatterns.push('Numeric fingerprint');
  }

  if (domain.includes('--')) {
    deterministicScore -= 5;
    flags.add('double-hyphen');
  }

  const finalScore = clampScore(deterministicScore);

  return {
    deterministicScore: finalScore,
    flags: Array.from(flags),
    domainAgeDays,
    dnsResolved,
    sslValid,
    ipAddresses,
    suspiciousPatterns,
  };
}
