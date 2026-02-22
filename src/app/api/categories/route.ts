import { NextResponse } from 'next/server';

interface ScamItem {
  id: string;
  name: string;
  type: string;
  description: string;
  icon?: string;
  count_report?: string;
  status?: string;
  created_at?: string;
}

// Whitelist of allowed domains for SSRF protection
// WARNING: This whitelist is intentionally restrictive for security.
// If you need to fetch from additional domains, add them here AND ensure
// they are trusted sources (official government or partner sites only).
const ALLOWED_DOMAINS = [
  'tinnhiemmang.vn',
  'www.tinnhiemmang.vn',
];

// Validate that a URL/domain is in the whitelist
function isDomainAllowed(hostname: string): boolean {
  // Block internal/private IP ranges and localhost
  const blockedPatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^0\.\d+\.\d+\.\d+$/,
    /^::1$/,
    /^fe80:/i,
  ];
  
  if (blockedPatterns.some(pattern => pattern.test(hostname))) {
    return false;
  }
  
  return ALLOWED_DOMAINS.some(allowed => 
    hostname === allowed || hostname.endsWith('.' + allowed)
  );
}

export async function POST(request: Request) {
  try {
    const { category, page = 1 } = await request.json();
    
    // Map category to URL
    const categoryUrls: Record<string, string> = {
      'organizations': 'https://tinnhiemmang.vn/to-chuc-tin-nhiem',
      'websites': 'https://tinnhiemmang.vn/website-tin-nhiem',
      'devices': 'https://tinnhiemmang.vn/thiet-bi-tin-nhiem',
      'systems': 'https://tinnhiemmang.vn/he-thong-tin-nhiem',
      'apps': 'https://tinnhiemmang.vn/ung-dung-tin-nhiem',
    };
    
    const targetUrl = categoryUrls[category] || categoryUrls['websites'];
    
    // Extract hostname for validation
    let hostname = '';
    try {
      const urlObj = new URL(targetUrl);
      hostname = urlObj.hostname;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL configuration' },
        { status: 500 }
      );
    }
    
    // SSRF Protection: Validate domain is allowed
    if (!isDomainAllowed(hostname)) {
      return NextResponse.json(
        { success: false, error: 'Domain not allowed for security reasons' },
        { status: 400 }
      );
    }
    
    const url = targetUrl;
    
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse items from HTML
    const items: ScamItem[] = [];
    
    // Try to find JSON data in the page
    const jsonMatch = html.match(/window\.\w+\s*=\s*(\{[\s\S]*?\})/);
    const dataMatch = html.match(/data\s*:\s*(\[[\s\S]*?\])/);
    
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        if (Array.isArray(data)) {
          return NextResponse.json({
            success: true,
            category,
            total: data.length,
            items: data.map((item: any, index: number) => ({
              id: item.id || String(index + 1),
              name: item.name || item.title || item.domain || '',
              type: item.type || category,
              description: item.description || item.content || '',
              icon: item.icon || item.image || '',
              count_report: item.count_report || item.reports || '0',
              status: item.status || 'active',
              created_at: item.created_at || item.date || '',
            })),
          });
        }
      } catch (e) {
        console.log('Failed to parse JSON data:', e);
      }
    }
    
    // Parse HTML items using regex
    // Look for item patterns in the HTML
    const itemPatterns = [
      /class="item[^"]*"[^>]*>[\s\S]*?<span[^>]*class="webkit-box[^"]*"[^>]*>([^<]+)<\/span>/g,
      /class="item[^"]*"[^>]*>[\s\S]*?domain[^>]*>([^<]+)<\/span>/g,
      /data-name="([^"]+)"[^>]*data-report="(\d+)"/g,
    ];
    
    // More general approach - extract links with domain info
    const domainRegex = /<a[^>]*href="\/domain\/[^"]*"[^>]*>([^<]+)<\/a>/g;
    let match;
    
    while ((match = domainRegex.exec(html)) !== null) {
      const name = match[1].trim();
      if (name && name.length > 3 && !name.includes('.')) {
        items.push({
          id: String(items.length + 1),
          name,
          type: category,
          description: '',
          count_report: '0',
          status: 'active',
        });
      }
    }
    
    // Extract from list items with specific classes
    const listItemRegex = /class="item[^"]*"[^>]*>[\s\S]*?webkit-box[^>]*>([^<]+)<[\s\S]*?count[^>]*>(\d+)/g;
    while ((match = listItemRegex.exec(html)) !== null) {
      items.push({
        id: String(items.length + 1),
        name: match[1].trim(),
        type: category,
        count_report: match[2],
        status: 'active',
        description: '',
      });
    }
    
    // If still no items, try generic extraction
    if (items.length === 0) {
      // Look for any links with domain info
      const allLinksRegex = /<a[^>]*>([^<]+)<\/a>/g;
      while ((match = allLinksRegex.exec(html)) !== null) {
        const text = match[1].trim();
        // Filter for likely scam-related content
        if (text.length > 3 && text.length < 100 && !text.includes('<img')) {
          items.push({
            id: String(items.length + 1),
            name: text,
            type: category,
            description: '',
            count_report: '0',
            status: 'active',
          });
        }
      }
    }
    
    // Remove duplicates and limit
    const uniqueItems = items
      .filter((item, index, self) => 
        index === self.findIndex((i) => i.name === item.name)
      )
      .slice(0, 50);
    
    return NextResponse.json({
      success: true,
      category,
      total: uniqueItems.length,
      items: uniqueItems,
    });
    
  } catch (error) {
    console.error('Error fetching category data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data', items: [] },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to fetch category data',
    categories: ['organizations', 'websites', 'devices', 'systems', 'apps'],
    example: {
      category: 'websites',
      page: 1
    }
  });
}
