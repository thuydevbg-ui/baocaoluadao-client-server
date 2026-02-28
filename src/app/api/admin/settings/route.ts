import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { getPublicSiteSettings, updateSiteSettings } from '@/lib/siteSettings';

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    settings: await getPublicSiteSettings(),
  });
});

export const PUT = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    await updateSiteSettings({
      siteName: body.siteName,
      siteDescription: body.siteDescription,
      contactEmail: body.contactEmail,
      maintenanceMode: body.maintenanceMode,
      registrationEnabled: body.registrationEnabled,
      loginEnabled: body.loginEnabled,
      emailNotifications: body.emailNotifications,
      analyticsEnabled: body.analyticsEnabled,
      rateLimitEnabled: body.rateLimitEnabled,
      maxReportsPerDay: body.maxReportsPerDay,
      autoModeration: body.autoModeration,
      googleAuthEnabled: body.googleAuthEnabled,
      googleClientId: body.googleClientId,
      googleClientSecret: body.googleClientSecret,
      allowedDocsIps: body.allowedDocsIps,
    });

    return NextResponse.json({
      success: true,
      message: 'Cài đặt đã được cập nhật',
      settings: await getPublicSiteSettings(),
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
});
