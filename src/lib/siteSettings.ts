import { getDb } from './db';

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
  allowedDocsIps: string | null; // comma or newline separated
  updatedAt: string;
}

export interface PublicSiteSettings
  extends Omit<SiteSettings, 'googleClientId' | 'googleClientSecret'> {
  googleClientIdSet: boolean;
  googleClientSecretSet: boolean;
}

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
  allowedDocsIps: null,
  updatedAt: new Date().toISOString(),
};

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardSiteSettingsCache: SiteSettings | undefined;
  // eslint-disable-next-line no-var
  var __scamGuardSiteSettingsLoaded: boolean | undefined;
}

let cache = globalThis.__scamGuardSiteSettingsCache;

async function ensureTable() {
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
      allowedDocsIps TEXT NULL,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db
    .query('ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS allowedDocsIps TEXT NULL AFTER googleClientSecret')
    .catch(() => {});
  await db.query(
    `INSERT IGNORE INTO site_settings (id, siteName, siteDescription, contactEmail, maintenanceMode, registrationEnabled, loginEnabled, emailNotifications, analyticsEnabled, rateLimitEnabled, maxReportsPerDay, autoModeration, googleAuthEnabled, googleClientId, googleClientSecret, allowedDocsIps, updatedAt)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      defaultSettings.siteName,
      defaultSettings.siteDescription,
      defaultSettings.contactEmail,
      defaultSettings.maintenanceMode,
      defaultSettings.registrationEnabled,
      defaultSettings.loginEnabled,
      defaultSettings.emailNotifications,
      defaultSettings.analyticsEnabled,
      defaultSettings.rateLimitEnabled,
      defaultSettings.maxReportsPerDay,
      defaultSettings.autoModeration,
      defaultSettings.googleAuthEnabled,
      defaultSettings.googleClientId,
      defaultSettings.googleClientSecret,
      defaultSettings.allowedDocsIps,
    ]
  );
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
    allowedDocsIps: row.allowedDocsIps ?? null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : defaultSettings.updatedAt,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    if (cache && globalThis.__scamGuardSiteSettingsLoaded) return cache;
    const db = getDb();
    await ensureTable();
    const [rows] = await db.query<any[]>('SELECT * FROM site_settings WHERE id = 1 LIMIT 1');
    cache = rows && rows.length ? mapRowToSettings(rows[0]) : defaultSettings;
    globalThis.__scamGuardSiteSettingsCache = cache;
    globalThis.__scamGuardSiteSettingsLoaded = true;
    return cache;
  } catch (error) {
    console.error('getSiteSettings fallback:', error);
    cache = defaultSettings;
    globalThis.__scamGuardSiteSettingsCache = cache;
    globalThis.__scamGuardSiteSettingsLoaded = true;
    return cache;
  }
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const settings = await getSiteSettings();
  return {
    ...settings,
    googleClientIdSet: Boolean(settings.googleClientId),
    googleClientSecretSet: Boolean(settings.googleClientSecret),
    googleClientId: undefined as never,
    googleClientSecret: undefined as never,
  };
}

export async function updateSiteSettings(
  partial: Partial<SiteSettings>
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
        googleClientId=?, googleClientSecret=?, allowedDocsIps=?, updatedAt=NOW()
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
        next.allowedDocsIps,
      ]
    );
  } catch (error) {
    console.error('updateSiteSettings DB error:', error);
  }

  cache = next;
  globalThis.__scamGuardSiteSettingsCache = next;
  globalThis.__scamGuardSiteSettingsLoaded = true;
  return next;
}

function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}
