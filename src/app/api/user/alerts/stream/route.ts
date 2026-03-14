import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { getSessionEmail } from '@/lib/sessionEmail';

export const runtime = 'nodejs';

function buildEvent(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function fetchAlerts(userId: string) {
  const db = getDb();
  const [stored] = await db.query<any[]>(
    `SELECT id, target, type, level AS status, message, createdAt FROM alerts WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId]
  );
  if ((stored as any[])?.length) return stored;

  const [watchRows] = await db.query<any[]>(`SELECT target, type FROM watchlist WHERE userId = ?`, [userId]);
  const alerts: any[] = [];
  for (const row of watchRows) {
    const [scams] = await db.query<any[]>(
      `SELECT id, value, type, risk_level AS riskLevel, status, report_count AS reportCount, description
       FROM scams
       WHERE type = ? AND value = ?
       LIMIT 1`,
      [row.type, row.target]
    );
    const match = scams?.[0];
    if (match) {
      const status = match.riskLevel === 'high' || match.status === 'blocked' ? 'danger' : match.riskLevel === 'medium' ? 'suspected' : 'info';
      alerts.push({
        id: match.id,
        target: match.value,
        type: match.type,
        status,
        message: match.description || 'Phát hiện trong danh sách cảnh báo',
        reportCount: match.reportCount,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return alerts;
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const email = process.env.MOCK_DB === '1' ? 'mock@local' : await getSessionEmail(req);
  if (!email) {
    return new Response('Unauthorized', { status: 401 });
  }

  await ensureUserInfra();

  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const userId = rows?.[0]?.id as string | undefined;
  if (!userId) {
    return new Response('User not found', { status: 404 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // initial snapshot
      const initialAlerts = process.env.MOCK_DB === '1'
        ? [{ id: 'ALERT-MOCK-1', target: '0987654321', type: 'phone', status: 'danger', message: 'Số này đã bị tố giác 12 lần', createdAt: new Date().toISOString() }]
        : await fetchAlerts(userId);

      let lastHash = JSON.stringify(initialAlerts);
      let lastIds = new Set(initialAlerts.map((a) => `${a.id}:${a.target}`));

      controller.enqueue(new TextEncoder().encode(buildEvent('snapshot', initialAlerts)));
      if (initialAlerts.length) {
        controller.enqueue(new TextEncoder().encode(buildEvent('match', initialAlerts)));
      }

      const interval = setInterval(async () => {
        const data = process.env.MOCK_DB === '1' ? initialAlerts : await fetchAlerts(userId);
        const hash = JSON.stringify(data);
        const ids = new Set(data.map((a) => `${a.id}:${a.target}`));

        // New matches
        const newOnes = data.filter((a) => !lastIds.has(`${a.id}:${a.target}`));
        if (newOnes.length) {
          controller.enqueue(new TextEncoder().encode(buildEvent('match', newOnes)));
        }

        // Full update only when changed
        if (hash !== lastHash) {
          controller.enqueue(new TextEncoder().encode(buildEvent('update', data)));
          lastHash = hash;
          lastIds = ids;
        }
      }, 5000);

      const heartbeat = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`event: heartbeat\ndata: {}\n\n`));
      }, 20000);

      const signal = req.signal;
      signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});
