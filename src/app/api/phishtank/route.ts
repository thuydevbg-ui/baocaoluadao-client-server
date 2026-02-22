import { NextResponse } from 'next/server';
import { fetchPhishTankData, getRecentPhishes, getPhishTankStats, checkUrlInPhishTank } from '@/lib/dataSources/phishtank';

/**
 * GET /api/phishtank
 * 
 * Query parameters:
 * - action: 'list' | 'check' | 'stats' | 'recent'
 * - url: URL to check (for 'check' action)
 * - limit: number of results (for 'recent' action)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const url = searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    switch (action) {
      case 'list':
        // Get all phishing data (paginated)
        const data = await fetchPhishTankData();
        return NextResponse.json({
          success: true,
          source: 'PhishTank',
          data: data,
          total: data.length,
        });

      case 'recent':
        // Get recent phishing entries
        const recentPhishes = await getRecentPhishes(Math.min(limit, 100));
        return NextResponse.json({
          success: true,
          source: 'PhishTank',
          data: recentPhishes,
          total: recentPhishes.length,
        });

      case 'stats':
        // Get statistics
        const stats = await getPhishTankStats();
        return NextResponse.json({
          success: true,
          source: 'PhishTank',
          ...stats,
        });

      case 'check':
        // Check a specific URL
        if (!url) {
          return NextResponse.json(
            { success: false, error: 'URL parameter is required for check action' },
            { status: 400 }
          );
        }
        const result = await checkUrlInPhishTank(url);
        return NextResponse.json({
          success: true,
          source: 'PhishTank',
          url,
          isPhishing: result !== null,
          details: result,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: list, check, stats, or recent' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('PhishTank API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data from PhishTank' },
      { status: 500 }
    );
  }
}
