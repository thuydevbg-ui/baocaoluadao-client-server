import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { RowDataPacket } from 'mysql2/promise';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { findUserByEmail } from '@/lib/userRepository';
import { getDb } from '@/lib/db';
import { getPublicSiteSettings } from '@/lib/siteSettings';

export const dynamic = 'force-dynamic';

interface ReportStatsRow extends RowDataPacket {
  total: number | string;
  pending: number | string | null;
  processing: number | string | null;
  completed: number | string | null;
  thisWeek: number | string | null;
  lastReportAt: Date | string | null;
}

interface AccountCountRow extends RowDataPacket {
  count: number | string;
}

interface RecentReportRow extends RowDataPacket {
  id: string;
  type: string;
  target: string;
  status: string;
  createdAt: Date | string | null;
}

function toIso(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export const GET = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  const db = getDb();
  const [reportRows] = await db.query<ReportStatsRow[]>(
    `SELECT
        COUNT(*) AS total,
        SUM(status = 'pending') AS pending,
        SUM(status = 'processing') AS processing,
        SUM(status = 'completed') AS completed,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS thisWeek,
        MAX(created_at) AS lastReportAt
      FROM reports
      WHERE reporter_email = ?`,
    [email]
  );

  const [accountRows] = await db.query<AccountCountRow[]>(
    'SELECT COUNT(*) AS count FROM user_accounts WHERE user_id = ?',
    [user.id]
  );

  const [recentRows] = await db.query<RecentReportRow[]>(
    `SELECT id, type, target, status, created_at AS createdAt
     FROM reports
     WHERE reporter_email = ?
     ORDER BY created_at DESC
     LIMIT 6`,
    [email]
  );

  const settings = await getPublicSiteSettings();

  const stats = reportRows?.[0];
  const accounts = accountRows?.[0];

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || session?.user?.image || null,
      role: user.role,
      provider: user.provider,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      hasPassword: Boolean(user.passwordHash),
      linkedAccounts: Number(accounts?.count || 0),
    },
    reports: {
      total: Number(stats?.total || 0),
      pending: Number(stats?.pending || 0),
      processing: Number(stats?.processing || 0),
      completed: Number(stats?.completed || 0),
      thisWeek: Number(stats?.thisWeek || 0),
      lastReportAt: toIso(stats?.lastReportAt),
    },
    recentReports: (recentRows || []).map((row) => ({
      id: row.id,
      type: row.type,
      target: row.target,
      status: row.status,
      createdAt: toIso(row.createdAt),
    })),
    settings: {
      emailNotifications: settings.emailNotifications,
      analyticsEnabled: settings.analyticsEnabled,
      maintenanceMode: settings.maintenanceMode,
    },
  });
});
