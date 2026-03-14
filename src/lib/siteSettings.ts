import { getDb } from './db';
import { ensureRedisReady, getRedisClientSafe } from './redis';
import {
  defaultFooterContacts,
  defaultFooterLinks,
  FooterContactEntry,
  FooterNavLink,
} from './footerConfig';

// Extend globalThis for cache
declare global {
  var __scamGuardSiteSettingsCache: SiteSettings | undefined;
  var __scamGuardSiteSettingsCacheLoadedAt: number | undefined;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  loginEnabled: boolean;
  emailNotifications: boolean;
  analyticsEnabled: boolean;
  rateLimitEnabled: boolean;
  maxReportsPerDay: number;
  autoModeration: boolean;
  googleAuthEnabled: boolean;
  googleClientId: string | null;
  googleClientSecret: string | null;
  facebookAuthEnabled: boolean;
  facebookClientId: string | null;
  facebookClientSecret: string | null;
  twitterAuthEnabled: boolean;
  twitterClientId: string | null;
  twitterClientSecret: string | null;
  telegramAuthEnabled: boolean;
  telegramBotToken: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpRequireTLS: boolean;
  smtpAuthEnabled: boolean;
  smtpUser: string | null;
  smtpPasswordEnc: string | null;
  smtpFromName: string | null;
  smtpFromEmail: string | null;
  allowedDocsIps: string | null; // comma or newline separated
  footerContactsJson: string | null;
  footerLinksJson: string | null;
  updatedAt: string;
}

export interface PublicSiteSettings
  extends Omit<
    SiteSettings,
    | 'googleClientId'
    | 'googleClientSecret'
    | 'facebookClientId'
    | 'facebookClientSecret'
    | 'twitterClientId'
    | 'twitterClientSecret'
    | 'telegramBotToken'
  | 'smtpPasswordEnc'
  > {
  googleClientIdSet: boolean;
  googleClientSecretSet: boolean;
  facebookClientIdSet: boolean;
  facebookClientSecretSet: boolean;
  twitterClientIdSet: boolean;
  twitterClientSecretSet: boolean;
  telegramBotTokenSet: boolean;
  smtpPasswordSet: boolean;
  googleClientId?: never;
  googleClientSecret?: never;
  facebookClientId?: never;
  facebookClientSecret?: never;
  twitterClientId?: never;
  twitterClientSecret?: never;
  telegramBotToken?: never;
  smtpPasswordEnc?: never;
  footerContacts: FooterContactEntry[];
  footerLinks: FooterNavLink[];
}

type FooterSettingsPartial = {
  footerContacts?: FooterContactEntry[];
  footerLinks?: FooterNavLink[];
  footerContactsJson?: string;
  footerLinksJson?: string;
};

const defaultSettings: SiteSettings = {
  siteName: 'ScamGuard - Cảnh báo lừa đảo',
  siteDescription: 'Nền tảng cảnh báo lừa đảo trực tuyến Việt Nam',
  contactEmail: 'contact@scamguard.vn',
  maintenanceMode: false,
  registrationEnabled: true,
  loginEnabled: true,
  emailNotifications: true,
  analyticsEnabled: true,
  rateLimitEnabled: true,
  maxReportsPerDay: 10,
  autoModeration: false,
  googleAuthEnabled: false,
  googleClientId: null,
  googleClientSecret: null,
  facebookAuthEnabled: false,
  facebookClientId: null,
  facebookClientSecret: null,
  twitterAuthEnabled: false,
  twitterClientId: null,
  twitterClientSecret: null,
  telegramAuthEnabled: false,
  telegramBotToken: null,
  smtpHost: null,
  smtpPort: 587,
  smtpSecure: false,
  smtpRequireTLS: true,
  smtpAuthEnabled: true,
  smtpUser: null,
  smtpPasswordEnc: null,
  smtpFromName: 'ScamGuard',
  smtpFromEmail: null,
  allowedDocsIps: null,
  footerContactsJson: JSON.stringify(defaultFooterContacts),
  footerLinksJson: JSON.stringify(defaultFooterLinks),
  updatedAt: new Date().toISOString(),
};

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardSiteSettingsCache: SiteSettings | undefined;
  // eslint-disable-next-line no-var
  var __scamGuardSiteSettingsLoaded: boolean | undefined;
  // eslint-disable-next-line no-var
  var __scamGuardSiteSettingsCacheLoadedAt: number | undefined;
}

let cache: SiteSettings | undefined = global.__scamGuardSiteSettingsCache;
let cacheLoadedAt = global.__scamGuardSiteSettingsCacheLoadedAt || 0;
let tableChecked = false; // Cache for ensureTable check

// Redis cache key for site settings
const SITE_SETTINGS_REDIS_KEY = 'site:settings';

// Cache TTL in milliseconds (default 5 minutes)
// Can be configured via PUBLIC_SETTINGS_CACHE_TTL_SECONDS env var
const SITE_SETTINGS_CACHE_TTL_MS = Number.parseInt(
  process.env.PUBLIC_SETTINGS_CACHE_TTL_SECONDS || '300',
  10
) * 1000;

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cacheLoadedAt < SITE_SETTINGS_CACHE_TTL_MS;
}

async function ensureTable() {
  // Skip if already checked (cached)
  if (tableChecked) {
    return;
  }
  
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      siteName VARCHAR(200) NOT NULL,
      siteDescription TEXT NOT NULL,
      contactEmail VARCHAR(191) NOT NULL,
      maintenanceMode TINYINT(1) NOT NULL DEFAULT 0,
      registrationEnabled TINYINT(1) NOT NULL DEFAULT 1,
      loginEnabled TINYINT(1) NOT NULL DEFAULT 1,
      emailNotifications TINYINT(1) NOT NULL DEFAULT 1,
      analyticsEnabled TINYINT(1) NOT NULL DEFAULT 1,
      rateLimitEnabled TINYINT(1) NOT NULL DEFAULT 1,
      maxReportsPerDay INT NOT NULL DEFAULT 10,
      autoModeration TINYINT(1) NOT NULL DEFAULT 0,
      googleAuthEnabled TINYINT(1) NOT NULL DEFAULT 0,
      googleClientId VARCHAR(300) NULL,
      googleClientSecret VARCHAR(300) NULL,
      facebookAuthEnabled TINYINT(1) NOT NULL DEFAULT 0,
      facebookClientId VARCHAR(300) NULL,
      facebookClientSecret VARCHAR(300) NULL,
      twitterAuthEnabled TINYINT(1) NOT NULL DEFAULT 0,
      twitterClientId VARCHAR(300) NULL,
      twitterClientSecret VARCHAR(300) NULL,
      telegramAuthEnabled TINYINT(1) NOT NULL DEFAULT 0,
      telegramBotToken VARCHAR(300) NULL,
      smtpHost VARCHAR(191) NULL,
      smtpPort INT NOT NULL DEFAULT 587,
      smtpSecure TINYINT(1) NOT NULL DEFAULT 0,
      smtpRequireTLS TINYINT(1) NOT NULL DEFAULT 1,
      smtpAuthEnabled TINYINT(1) NOT NULL DEFAULT 1,
      smtpUser VARCHAR(191) NULL,
      smtpPasswordEnc TEXT NULL,
      smtpFromName VARCHAR(120) NULL,
      smtpFromEmail VARCHAR(191) NULL,
      allowedDocsIps TEXT NULL,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db
    .query('ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS allowedDocsIps TEXT NULL AFTER googleClientSecret')
    .catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebookAuthEnabled TINYINT(1) NOT NULL DEFAULT 0 AFTER googleClientSecret`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebookClientId VARCHAR(300) NULL AFTER facebookAuthEnabled`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebookClientSecret VARCHAR(300) NULL AFTER facebookClientId`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitterAuthEnabled TINYINT(1) NOT NULL DEFAULT 0 AFTER facebookClientSecret`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitterClientId VARCHAR(300) NULL AFTER twitterAuthEnabled`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitterClientSecret VARCHAR(300) NULL AFTER twitterClientId`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS telegramAuthEnabled TINYINT(1) NOT NULL DEFAULT 0 AFTER twitterClientSecret`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS telegramBotToken VARCHAR(300) NULL AFTER telegramAuthEnabled`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpHost VARCHAR(191) NULL AFTER telegramBotToken`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpPort INT NOT NULL DEFAULT 587 AFTER smtpHost`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpSecure TINYINT(1) NOT NULL DEFAULT 0 AFTER smtpPort`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpRequireTLS TINYINT(1) NOT NULL DEFAULT 1 AFTER smtpSecure`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpAuthEnabled TINYINT(1) NOT NULL DEFAULT 1 AFTER smtpRequireTLS`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpUser VARCHAR(191) NULL AFTER smtpAuthEnabled`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpPasswordEnc TEXT NULL AFTER smtpUser`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpFromName VARCHAR(120) NULL AFTER smtpPasswordEnc`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtpFromEmail VARCHAR(191) NULL AFTER smtpFromName`
  ).catch(() => {});
  await db.query(
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footerContactsJson TEXT NULL AFTER allowedDocsIps`
  ).catch(() => {});
  await db
    .query(
      `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footerLinksJson TEXT NULL AFTER footerContactsJson`
    )
    .catch(() => {});
  
  // Try INSERT with footer columns first (for new installations)
  // If it fails, try without footer columns (for existing installations)
  try {
    await db.query(
      `INSERT IGNORE INTO site_settings (id, siteName, siteDescription, contactEmail, maintenanceMode, registrationEnabled, loginEnabled, emailNotifications, analyticsEnabled, rateLimitEnabled, maxReportsPerDay, autoModeration, googleAuthEnabled, googleClientId, googleClientSecret, facebookAuthEnabled, facebookClientId, facebookClientSecret, twitterAuthEnabled, twitterClientId, twitterClientSecret, telegramAuthEnabled, telegramBotToken, smtpHost, smtpPort, smtpSecure, smtpRequireTLS, smtpAuthEnabled, smtpUser, smtpPasswordEnc, smtpFromName, smtpFromEmail, allowedDocsIps, footerContactsJson, footerLinksJson, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        defaultSettings.siteName,
        defaultSettings.siteDescription,
        defaultSettings.contactEmail,
        Boolean(defaultSettings.maintenanceMode),
        Boolean(defaultSettings.registrationEnabled),
        Boolean(defaultSettings.loginEnabled),
        Boolean(defaultSettings.emailNotifications),
        Boolean(defaultSettings.analyticsEnabled),
        Boolean(defaultSettings.rateLimitEnabled),
        defaultSettings.maxReportsPerDay,
        Boolean(defaultSettings.autoModeration),
        Boolean(defaultSettings.googleAuthEnabled),
        defaultSettings.googleClientId,
        defaultSettings.googleClientSecret,
        Boolean(defaultSettings.facebookAuthEnabled),
        defaultSettings.facebookClientId,
        defaultSettings.facebookClientSecret,
        Boolean(defaultSettings.twitterAuthEnabled),
        defaultSettings.twitterClientId,
        defaultSettings.twitterClientSecret,
        Boolean(defaultSettings.telegramAuthEnabled),
        defaultSettings.telegramBotToken,
        defaultSettings.smtpHost,
        defaultSettings.smtpPort,
        Boolean(defaultSettings.smtpSecure),
        Boolean(defaultSettings.smtpRequireTLS),
        Boolean(defaultSettings.smtpAuthEnabled),
        defaultSettings.smtpUser,
        defaultSettings.smtpPasswordEnc,
        defaultSettings.smtpFromName,
        defaultSettings.smtpFromEmail,
        defaultSettings.allowedDocsIps,
        defaultSettings.footerContactsJson,
        defaultSettings.footerLinksJson,
        new Date().toISOString(),
      ]
    );
  } catch (insertError) {
    // Fallback: Insert without footer columns if they don't exist
    console.warn('[siteSettings] Insert with footer columns failed, trying without:', insertError);
    await db.query(
      `INSERT IGNORE INTO site_settings (id, siteName, siteDescription, contactEmail, maintenanceMode, registrationEnabled, loginEnabled, emailNotifications, analyticsEnabled, rateLimitEnabled, maxReportsPerDay, autoModeration, googleAuthEnabled, googleClientId, googleClientSecret, facebookAuthEnabled, facebookClientId, facebookClientSecret, twitterAuthEnabled, twitterClientId, twitterClientSecret, telegramAuthEnabled, telegramBotToken, smtpHost, smtpPort, smtpSecure, smtpRequireTLS, smtpAuthEnabled, smtpUser, smtpPasswordEnc, smtpFromName, smtpFromEmail, allowedDocsIps, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        1,
        defaultSettings.siteName,
        defaultSettings.siteDescription,
        defaultSettings.contactEmail,
        Boolean(defaultSettings.maintenanceMode),
        Boolean(defaultSettings.registrationEnabled),
        Boolean(defaultSettings.loginEnabled),
        Boolean(defaultSettings.emailNotifications),
        Boolean(defaultSettings.analyticsEnabled),
        Boolean(defaultSettings.rateLimitEnabled),
        defaultSettings.maxReportsPerDay,
        Boolean(defaultSettings.autoModeration),
        Boolean(defaultSettings.googleAuthEnabled),
        defaultSettings.googleClientId,
        defaultSettings.googleClientSecret,
        Boolean(defaultSettings.facebookAuthEnabled),
        defaultSettings.facebookClientId,
        defaultSettings.facebookClientSecret,
        Boolean(defaultSettings.twitterAuthEnabled),
        defaultSettings.twitterClientId,
        defaultSettings.twitterClientSecret,
        Boolean(defaultSettings.telegramAuthEnabled),
        defaultSettings.telegramBotToken,
        defaultSettings.smtpHost,
        defaultSettings.smtpPort,
        Boolean(defaultSettings.smtpSecure),
        Boolean(defaultSettings.smtpRequireTLS),
        Boolean(defaultSettings.smtpAuthEnabled),
        defaultSettings.smtpUser,
        defaultSettings.smtpPasswordEnc,
        defaultSettings.smtpFromName,
        defaultSettings.smtpFromEmail,
        defaultSettings.allowedDocsIps,
      ]
    );
  }
  
  // Mark table as checked to avoid redundant ALTER TABLE checks
  tableChecked = true;
}

function mapRowToSettings(row: any): SiteSettings {
  return {
    siteName: row.siteName ?? defaultSettings.siteName,
    siteDescription: row.siteDescription ?? defaultSettings.siteDescription,
    contactEmail: row.contactEmail ?? defaultSettings.contactEmail,
    maintenanceMode: Boolean(row.maintenanceMode),
    registrationEnabled: Boolean(row.registrationEnabled),
    loginEnabled: Boolean(row.loginEnabled),
    emailNotifications: Boolean(row.emailNotifications),
    analyticsEnabled: Boolean(row.analyticsEnabled),
    rateLimitEnabled: Boolean(row.rateLimitEnabled),
    maxReportsPerDay: Number(row.maxReportsPerDay ?? defaultSettings.maxReportsPerDay),
    autoModeration: Boolean(row.autoModeration),
    googleAuthEnabled: Boolean(row.googleAuthEnabled),
    googleClientId: row.googleClientId ?? null,
    googleClientSecret: row.googleClientSecret ?? null,
    facebookAuthEnabled: Boolean(row.facebookAuthEnabled),
    facebookClientId: row.facebookClientId ?? null,
    facebookClientSecret: row.facebookClientSecret ?? null,
    twitterAuthEnabled: Boolean(row.twitterAuthEnabled),
    twitterClientId: row.twitterClientId ?? null,
    twitterClientSecret: row.twitterClientSecret ?? null,
    telegramAuthEnabled: Boolean(row.telegramAuthEnabled),
    telegramBotToken: row.telegramBotToken ?? null,
    smtpHost: row.smtpHost ?? null,
    smtpPort: Number(row.smtpPort ?? defaultSettings.smtpPort),
    smtpSecure: Boolean(row.smtpSecure),
    smtpRequireTLS: Boolean(row.smtpRequireTLS ?? defaultSettings.smtpRequireTLS),
    smtpAuthEnabled: Boolean(row.smtpAuthEnabled ?? defaultSettings.smtpAuthEnabled),
    smtpUser: row.smtpUser ?? null,
    smtpPasswordEnc: row.smtpPasswordEnc ?? null,
    smtpFromName: row.smtpFromName ?? defaultSettings.smtpFromName,
    smtpFromEmail: row.smtpFromEmail ?? null,
    allowedDocsIps: row.allowedDocsIps ?? null,
    footerContactsJson: row.footerContactsJson ?? defaultSettings.footerContactsJson,
    footerLinksJson: row.footerLinksJson ?? defaultSettings.footerLinksJson,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : defaultSettings.updatedAt,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    // Use TTL-based cache validity check
    if (cache && globalThis.__scamGuardSiteSettingsLoaded && isCacheValid()) {
      return cache;
    }
    
    // Try Redis cache first
    try {
      const redis = await getRedisClientSafe();
      if (redis) {
        const cached = await redis.get(SITE_SETTINGS_REDIS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as SiteSettings;
          cache = parsed;
          globalThis.__scamGuardSiteSettingsCache = parsed;
          globalThis.__scamGuardSiteSettingsLoaded = true;
          cacheLoadedAt = Date.now();
          globalThis.__scamGuardSiteSettingsCacheLoadedAt = cacheLoadedAt;
          return parsed;
        }
      }
    } catch (redisError) {
      console.warn('[siteSettings] Redis cache read error:', redisError);
    }
    
    const db = getDb();
    await ensureTable();
    const [rows] = await db.query<any[]>('SELECT * FROM site_settings WHERE id = 1 LIMIT 1');
    cache = rows && rows.length ? mapRowToSettings(rows[0]) : defaultSettings;
    globalThis.__scamGuardSiteSettingsCache = cache;
    globalThis.__scamGuardSiteSettingsLoaded = true;
    cacheLoadedAt = Date.now();
    globalThis.__scamGuardSiteSettingsCacheLoadedAt = cacheLoadedAt;
    
    // Cache to Redis
    try {
      const redis = await getRedisClientSafe();
      if (redis) {
        await redis.set(SITE_SETTINGS_REDIS_KEY, JSON.stringify(cache), 'EX', 300);
      }
    } catch (redisError) {
      console.warn('[siteSettings] Redis cache write error:', redisError);
    }
    
    return cache;
  } catch (error) {
    console.error('getSiteSettings fallback:', error);
    cache = defaultSettings;
    globalThis.__scamGuardSiteSettingsCache = cache;
    globalThis.__scamGuardSiteSettingsLoaded = true;
    cacheLoadedAt = Date.now();
    globalThis.__scamGuardSiteSettingsCacheLoadedAt = cacheLoadedAt;
    return cache;
  }
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const settings = await getSiteSettings();
  const footerContacts = normalizeFooterContacts(settings.footerContactsJson);
  const footerLinks = normalizeFooterLinks(settings.footerLinksJson);
  return {
    ...settings,
    googleClientIdSet: Boolean(settings.googleClientId),
    googleClientSecretSet: Boolean(settings.googleClientSecret),
    facebookClientIdSet: Boolean(settings.facebookClientId),
    facebookClientSecretSet: Boolean(settings.facebookClientSecret),
    twitterClientIdSet: Boolean(settings.twitterClientId),
    twitterClientSecretSet: Boolean(settings.twitterClientSecret),
    telegramBotTokenSet: Boolean(settings.telegramBotToken),
    smtpPasswordSet: Boolean(settings.smtpPasswordEnc),
    googleClientId: undefined as never,
    googleClientSecret: undefined as never,
    facebookClientId: undefined as never,
    facebookClientSecret: undefined as never,
    twitterClientId: undefined as never,
    twitterClientSecret: undefined as never,
    telegramBotToken: undefined as never,
    smtpPasswordEnc: undefined as never,
    footerContacts,
    footerLinks,
  };
}

export async function updateSiteSettings(
  partial: Partial<SiteSettings> & FooterSettingsPartial
): Promise<SiteSettings> {
  const current = await getSiteSettings();

  const next: SiteSettings = {
    ...current,
    siteName:
      typeof partial.siteName === 'string'
        ? sanitizeString(partial.siteName, 100)
        : current.siteName,
    siteDescription:
      typeof partial.siteDescription === 'string'
        ? sanitizeString(partial.siteDescription, 500)
        : current.siteDescription,
    contactEmail:
      typeof partial.contactEmail === 'string'
        ? sanitizeString(partial.contactEmail, 120)
        : current.contactEmail,
    maintenanceMode:
      typeof partial.maintenanceMode === 'boolean'
        ? partial.maintenanceMode
        : current.maintenanceMode,
    registrationEnabled:
      typeof partial.registrationEnabled === 'boolean'
        ? partial.registrationEnabled
        : current.registrationEnabled,
    loginEnabled:
      typeof partial.loginEnabled === 'boolean' ? partial.loginEnabled : current.loginEnabled,
    emailNotifications:
      typeof partial.emailNotifications === 'boolean'
        ? partial.emailNotifications
        : current.emailNotifications,
    analyticsEnabled:
      typeof partial.analyticsEnabled === 'boolean'
        ? partial.analyticsEnabled
        : current.analyticsEnabled,
    rateLimitEnabled:
      typeof partial.rateLimitEnabled === 'boolean'
        ? partial.rateLimitEnabled
        : current.rateLimitEnabled,
    maxReportsPerDay:
      typeof partial.maxReportsPerDay === 'number'
        ? Math.max(1, Math.min(100, partial.maxReportsPerDay))
        : current.maxReportsPerDay,
    autoModeration:
      typeof partial.autoModeration === 'boolean'
        ? partial.autoModeration
        : current.autoModeration,
    googleAuthEnabled:
      typeof partial.googleAuthEnabled === 'boolean'
        ? partial.googleAuthEnabled
        : current.googleAuthEnabled,
    allowedDocsIps:
      typeof partial.allowedDocsIps === 'string'
        ? sanitizeString(partial.allowedDocsIps, 2000) || null
        : current.allowedDocsIps,
    googleClientId:
      typeof partial.googleClientId === 'string'
        ? sanitizeString(partial.googleClientId, 300) || null
        : current.googleClientId,
    googleClientSecret:
      typeof partial.googleClientSecret === 'string'
        ? sanitizeString(partial.googleClientSecret, 300) || null
        : current.googleClientSecret,
    facebookAuthEnabled:
      typeof partial.facebookAuthEnabled === 'boolean'
        ? partial.facebookAuthEnabled
        : current.facebookAuthEnabled,
    facebookClientId:
      typeof partial.facebookClientId === 'string'
        ? sanitizeString(partial.facebookClientId, 300) || null
        : current.facebookClientId,
    facebookClientSecret:
      typeof partial.facebookClientSecret === 'string'
        ? sanitizeString(partial.facebookClientSecret, 300) || null
        : current.facebookClientSecret,
    twitterAuthEnabled:
      typeof partial.twitterAuthEnabled === 'boolean'
        ? partial.twitterAuthEnabled
        : current.twitterAuthEnabled,
    twitterClientId:
      typeof partial.twitterClientId === 'string'
        ? sanitizeString(partial.twitterClientId, 300) || null
        : current.twitterClientId,
    twitterClientSecret:
      typeof partial.twitterClientSecret === 'string'
        ? sanitizeString(partial.twitterClientSecret, 300) || null
        : current.twitterClientSecret,
    telegramAuthEnabled:
      typeof partial.telegramAuthEnabled === 'boolean'
        ? partial.telegramAuthEnabled
        : current.telegramAuthEnabled,
    telegramBotToken:
      typeof partial.telegramBotToken === 'string'
        ? sanitizeString(partial.telegramBotToken, 300) || null
        : current.telegramBotToken,
    smtpHost:
      typeof partial.smtpHost === 'string' ? sanitizeString(partial.smtpHost, 191) || null : current.smtpHost,
    smtpPort:
      typeof partial.smtpPort === 'number'
        ? Math.max(1, Math.min(65535, Math.floor(partial.smtpPort)))
        : current.smtpPort,
    smtpSecure: typeof partial.smtpSecure === 'boolean' ? partial.smtpSecure : current.smtpSecure,
    smtpRequireTLS:
      typeof partial.smtpRequireTLS === 'boolean' ? partial.smtpRequireTLS : current.smtpRequireTLS,
    smtpAuthEnabled:
      typeof partial.smtpAuthEnabled === 'boolean' ? partial.smtpAuthEnabled : current.smtpAuthEnabled,
    smtpUser:
      typeof partial.smtpUser === 'string' ? sanitizeString(partial.smtpUser, 191) || null : current.smtpUser,
    smtpPasswordEnc:
      typeof partial.smtpPasswordEnc === 'string'
        ? sanitizeString(partial.smtpPasswordEnc, 5000) || null
        : partial.smtpPasswordEnc === null
          ? null
          : current.smtpPasswordEnc,
    smtpFromName:
      typeof partial.smtpFromName === 'string'
        ? sanitizeString(partial.smtpFromName, 120) || null
        : current.smtpFromName,
    smtpFromEmail:
      typeof partial.smtpFromEmail === 'string'
        ? sanitizeString(partial.smtpFromEmail, 191) || null
        : current.smtpFromEmail,
    footerContactsJson: dedupeFooterContactsJson(partial, current),
    footerLinksJson: dedupeFooterLinksJson(partial, current),
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = getDb();
    await ensureTable();
    await db.query(
      `UPDATE site_settings SET
        siteName=?, siteDescription=?, contactEmail=?,
        maintenanceMode=?, registrationEnabled=?, loginEnabled=?,
        emailNotifications=?, analyticsEnabled=?, rateLimitEnabled=?,
        maxReportsPerDay=?, autoModeration=?, googleAuthEnabled=?,
        googleClientId=?, googleClientSecret=?,
        facebookAuthEnabled=?, facebookClientId=?, facebookClientSecret=?,
        twitterAuthEnabled=?, twitterClientId=?, twitterClientSecret=?,
        telegramAuthEnabled=?, telegramBotToken=?,
        smtpHost=?, smtpPort=?, smtpSecure=?, smtpRequireTLS=?, smtpAuthEnabled=?,
        smtpUser=?, smtpPasswordEnc=?, smtpFromName=?, smtpFromEmail=?,
        allowedDocsIps=?, footerContactsJson=?, footerLinksJson=?, updatedAt=NOW()
       WHERE id=1`,
      [
        next.siteName,
        next.siteDescription,
        next.contactEmail,
        next.maintenanceMode,
        next.registrationEnabled,
        next.loginEnabled,
        next.emailNotifications,
        next.analyticsEnabled,
        next.rateLimitEnabled,
        next.maxReportsPerDay,
        next.autoModeration,
        next.googleAuthEnabled,
        next.googleClientId,
        next.googleClientSecret,
        next.facebookAuthEnabled,
        next.facebookClientId,
        next.facebookClientSecret,
        next.twitterAuthEnabled,
        next.twitterClientId,
        next.twitterClientSecret,
        next.telegramAuthEnabled,
        next.telegramBotToken,
        next.smtpHost,
        next.smtpPort,
        next.smtpSecure,
        next.smtpRequireTLS,
        next.smtpAuthEnabled,
        next.smtpUser,
        next.smtpPasswordEnc,
        next.smtpFromName,
        next.smtpFromEmail,
        next.allowedDocsIps,
        next.footerContactsJson,
        next.footerLinksJson,
      ]
    );
  } catch (error) {
    console.error('updateSiteSettings DB error:', error);
  }

  cache = next;
  globalThis.__scamGuardSiteSettingsCache = next;
  globalThis.__scamGuardSiteSettingsLoaded = true;
  
  // Invalidate Redis cache
  await invalidateSiteSettingsCache();
  
  return next;
}

/**
 * Invalidate site settings cache (call after updates)
 */
export async function invalidateSiteSettingsCache(): Promise<void> {
  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.del(SITE_SETTINGS_REDIS_KEY);
      console.log('[Cache] Site settings Redis cache invalidated');
    }
  } catch (error) {
    console.warn('[Cache] Failed to invalidate site settings cache:', error);
  }
}

function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

const MAX_FOOTER_CONTACTS = 6;
const MAX_FOOTER_LINKS = 8;
const ICON_REGEX = /^[a-z0-9-]+$/i;

function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
}

function sanitizeFooterIcon(raw?: unknown): string {
  const text = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (text && ICON_REGEX.test(text)) return text;
  return 'shield';
}

function sanitizeFooterHref(raw?: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return '';
  if (/^(javascript|data):/i.test(text)) return '';
  if (/^(\/|https?:\/\/|mailto:|tel:|#)/i.test(text)) {
    return text;
  }
  return `https://${text}`;
}

function normalizeFooterContact(entry: unknown): FooterContactEntry | null {
  if (!entry || typeof entry !== 'object') return null;
  const label = sanitizeString(String((entry as any).label || ''), 60);
  const value = sanitizeString(String((entry as any).value || ''), 160);
  if (!label || !value) return null;
  const href = sanitizeFooterHref((entry as any).href);
  return {
    label,
    value,
    icon: sanitizeFooterIcon((entry as any).icon),
    href: href || undefined,
  };
}

function normalizeFooterLink(entry: unknown): FooterNavLink | null {
  if (!entry || typeof entry !== 'object') return null;
  const label = sanitizeString(String((entry as any).label || ''), 60);
  const href = sanitizeFooterHref((entry as any).href);
  if (!label || !href) return null;
  const icon = sanitizeFooterIcon((entry as any).icon);
  return { label, href, icon: icon || undefined };
}

function normalizeFooterContacts(raw: unknown): FooterContactEntry[] {
  const normalized = parseJsonArray(raw)
    .map(normalizeFooterContact)
    .filter((item): item is FooterContactEntry => Boolean(item));
  if (normalized.length === 0) {
    return defaultFooterContacts;
  }
  return normalized.slice(0, MAX_FOOTER_CONTACTS);
}

function normalizeFooterLinks(raw: unknown): FooterNavLink[] {
  const normalized = parseJsonArray(raw)
    .map(normalizeFooterLink)
    .filter((item): item is FooterNavLink => Boolean(item));
  if (normalized.length === 0) {
    return defaultFooterLinks;
  }
  return normalized.slice(0, MAX_FOOTER_LINKS);
}

function serializeFooterContacts(raw: unknown): string {
  return JSON.stringify(normalizeFooterContacts(raw));
}

function serializeFooterLinks(raw: unknown): string {
  return JSON.stringify(normalizeFooterLinks(raw));
}

function dedupeFooterContactsJson(
  partial: Partial<SiteSettings> & FooterSettingsPartial,
  current: SiteSettings
): string {
  if (typeof partial.footerContactsJson === 'string') {
    return serializeFooterContacts(partial.footerContactsJson);
  }
  if (Array.isArray(partial.footerContacts)) {
    return serializeFooterContacts(partial.footerContacts);
  }
  return current.footerContactsJson || JSON.stringify(defaultFooterContacts);
}

function dedupeFooterLinksJson(
  partial: Partial<SiteSettings> & FooterSettingsPartial,
  current: SiteSettings
): string {
  if (typeof partial.footerLinksJson === 'string') {
    return serializeFooterLinks(partial.footerLinksJson);
  }
  if (Array.isArray(partial.footerLinks)) {
    return serializeFooterLinks(partial.footerLinks);
  }
  return current.footerLinksJson || JSON.stringify(defaultFooterLinks);
}
