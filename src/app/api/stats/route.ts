import { NextResponse } from 'next/server';

interface CategoryStats {
  name: string;
  slug: string;
  count: number;
  icon: string;
  description: string;
}

export async function GET() {
  try {
    // Return fallback data directly to avoid external API issues
    // tinnhiemmang.vn scraping is unreliable and PhishTank may have CORS issues
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: 12405,
      categories: [
        { name: 'Website', slug: 'websites', count: 8200, icon: '🌐', description: 'Website giả mạo, lừa đảo' },
        { name: 'Tổ chức', slug: 'organizations', count: 2100, icon: '🏢', description: 'Tổ chức bị mạo danh' },
        { name: 'Thiết bị', slug: 'devices', count: 1200, icon: '📱', description: 'Thiết bị bị cảnh báo' },
        { name: 'Hệ thống', slug: 'systems', count: 550, icon: '🔒', description: 'Hệ thống bị tấn công' },
        { name: 'Ứng dụng', slug: 'apps', count: 355, icon: '📲', description: 'Ứng dụng giả mạo' },
      ],
      summary: {
        websites: 8200,
        organizations: 2100,
        devices: 1200,
        systems: 550,
        apps: 355,
      },
      source: 'fallback',
      message: 'Dữ liệu mẫu - cần kết nối API thật từ cơ quan chức năng'
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: 12405,
      categories: [
        { name: 'Website', slug: 'websites', count: 8200, icon: '🌐', description: 'Website giả mạo, lừa đảo' },
        { name: 'Tổ chức', slug: 'organizations', count: 2100, icon: '🏢', description: 'Tổ chức bị mạo danh' },
        { name: 'Thiết bị', slug: 'devices', count: 1200, icon: '📱', description: 'Thiết bị bị cảnh báo' },
        { name: 'Hệ thống', slug: 'systems', count: 550, icon: '🔒', description: 'Hệ thống bị tấn công' },
        { name: 'Ứng dụng', slug: 'apps', count: 355, icon: '📲', description: 'Ứng dụng giả mạo' },
      ],
      summary: {
        websites: 8200,
        organizations: 2100,
        devices: 1200,
        systems: 550,
        apps: 355,
      },
      source: 'fallback',
    });
  }
}
