import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  analyticsEnabled: boolean;
  rateLimitEnabled: boolean;
  maxReportsPerDay: number;
  autoModeration: boolean;
  updatedAt: string;
}

declare global {
  var __scamGuardSiteSettings: SiteSettings | undefined;
}

const defaultSettings: SiteSettings = {
  siteName: 'ScamGuard - Cảnh báo lừa đảo',
  siteDescription: 'Nền tảng cảnh báo lừa đảo trực tuyến Việt Nam',
  contactEmail: 'contact@scamguard.vn',
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  analyticsEnabled: true,
  rateLimitEnabled: true,
  maxReportsPerDay: 10,
  autoModeration: false,
  updatedAt: new Date().toISOString(),
};

const settings = globalThis.__scamGuardSiteSettings ?? defaultSettings;
if (!globalThis.__scamGuardSiteSettings) {
  globalThis.__scamGuardSiteSettings = settings;
}

function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Return settings without exposing sensitive data
  const { siteName, siteDescription, contactEmail, maintenanceMode, registrationEnabled, emailNotifications, analyticsEnabled, rateLimitEnabled, maxReportsPerDay, autoModeration, updatedAt } = settings;

  return NextResponse.json({
    success: true,
    settings: {
      siteName,
      siteDescription,
      contactEmail,
      maintenanceMode,
      registrationEnabled,
      emailNotifications,
      analyticsEnabled,
      rateLimitEnabled,
      maxReportsPerDay,
      autoModeration,
      updatedAt,
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Update allowed fields
    if (typeof body.siteName === 'string') {
      settings.siteName = sanitizeString(body.siteName, 100) || settings.siteName;
    }
    if (typeof body.siteDescription === 'string') {
      settings.siteDescription = sanitizeString(body.siteDescription, 500) || settings.siteDescription;
    }
    if (typeof body.contactEmail === 'string') {
      settings.contactEmail = sanitizeString(body.contactEmail, 120) || settings.contactEmail;
    }
    if (typeof body.maintenanceMode === 'boolean') {
      settings.maintenanceMode = body.maintenanceMode;
    }
    if (typeof body.registrationEnabled === 'boolean') {
      settings.registrationEnabled = body.registrationEnabled;
    }
    if (typeof body.emailNotifications === 'boolean') {
      settings.emailNotifications = body.emailNotifications;
    }
    if (typeof body.analyticsEnabled === 'boolean') {
      settings.analyticsEnabled = body.analyticsEnabled;
    }
    if (typeof body.rateLimitEnabled === 'boolean') {
      settings.rateLimitEnabled = body.rateLimitEnabled;
    }
    if (typeof body.maxReportsPerDay === 'number') {
      settings.maxReportsPerDay = Math.max(1, Math.min(100, body.maxReportsPerDay));
    }
    if (typeof body.autoModeration === 'boolean') {
      settings.autoModeration = body.autoModeration;
    }

    settings.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Cài đặt đã được cập nhật',
      settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}