import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { getDb } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SeoSettingRow extends RowDataPacket {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
}

/**
 * GET /api/admin/seo/settings
 * Get all SEO settings
 */
export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
        },
      },
      { status: 401 }
    );
  }

  try {
    const db = getDb();

    const [rows] = await db.execute<SeoSettingRow[]>(
      `SELECT * FROM seo_settings ORDER BY setting_key`
    );

    // Parse settings into a structured object
    const settings: Record<string, string | number | boolean | object> = {};
    for (const row of rows) {
      let value: string | number | boolean | object = row.setting_value;
      
      if (row.setting_type === 'number') {
        value = Number(row.setting_value);
      } else if (row.setting_type === 'boolean') {
        value = row.setting_value === 'true' || row.setting_value === '1';
      } else if (row.setting_type === 'json') {
        try {
          value = JSON.parse(row.setting_value);
        } catch {
          value = row.setting_value;
        }
      }
      
      settings[row.setting_key] = value;
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('[Admin SEO Settings] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch SEO settings',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/seo/settings
 * Update SEO settings
 */
export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const db = getDb();

    const allowedSettings = [
      'default_title',
      'default_description',
      'default_keywords',
      'google_verification',
      'bing_verification',
      'robots_txt',
      'facebook_app_id',
      'twitter_site',
      'schema_organization',
    ];

    for (const key of Object.keys(body)) {
      if (!allowedSettings.includes(key)) continue;

      const value = body[key];
      let settingType = 'string';
      let storedValue = String(value);

      if (typeof value === 'number') {
        settingType = 'number';
      } else if (typeof value === 'boolean') {
        settingType = 'boolean';
      } else if (typeof value === 'object') {
        settingType = 'json';
        storedValue = JSON.stringify(value);
      }

      await db.execute<ResultSetHeader>(
        `UPDATE seo_settings 
         SET setting_value = ?, setting_type = ? 
         WHERE setting_key = ?`,
        [storedValue, settingType, key]
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Settings updated successfully' },
    });
  } catch (error) {
    console.error('[Admin SEO Settings] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update settings',
        },
      },
      { status: 500 }
    );
  }
});