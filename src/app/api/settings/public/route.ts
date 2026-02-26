import { NextResponse } from 'next/server';
import { getPublicSiteSettings } from '@/lib/siteSettings';

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('settings/public error:', error);
    return NextResponse.json({ success: true, settings: { registrationEnabled: true, loginEnabled: true } });
  }
}
