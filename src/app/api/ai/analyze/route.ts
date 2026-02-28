import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';

// SECURITY NOTE: In-memory rate limiter does NOT work in serverless environments
// (Vercel, AWS Lambda, etc.) because each function invocation may have a new instance.
// 
// PRODUCTION SOLUTIONS:
// 1. Use Upstash Redis: https://upstash.com/
// 2. Use Vercel Edge Config: https://vercel.com/docs/edge-config
// 3. Use a third-party rate limiting service (e.g., Cloudflare Rate Limiting)
//
// For demo purposes, we use in-memory storage which works in local development only.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Use a global variable to persist across hot reloads in development
// This will NOT work reliably in production serverless environments
const globalForRateLimit = globalThis as unknown as {
  rateLimitMap: Map<string, RateLimitEntry> | undefined;
};

const rateLimitMap = globalForRateLimit.rateLimitMap || new Map<string, RateLimitEntry>();
if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.rateLimitMap = rateLimitMap;
}

const RATE_LIMIT = 10; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Types for AI Analysis
interface AnalysisRequest {
  type: 'message' | 'url' | 'phone';
  content: string;
}

interface Indicator {
  category: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface Pattern {
  name: string;
  matched: boolean;
  description: string;
}

interface AnalysisResult {
  probability: number;
  verdict: 'safe' | 'suspicious' | 'scam';
  indicators: Indicator[];
  patterns: Pattern[];
  recommendation: string;
  aiModel: string;
  analysisMethod: 'openai' | 'local_ml';
}

// Scam patterns for local ML analysis
const SCAM_PATTERNS = [
  { id: 'urgency', name: 'Ngôn ngữ khẩn cấp', description: 'Từ ngữ gây áp lực như "ngay lập tức", "khẩn", "hết hạn"' },
  { id: 'prize', name: 'Lừa đảo giải thưởng', description: 'Tuyên bố trúng thưởng, xổ số, hoặc thừa kế' },
  { id: 'authority', name: 'Mạo danh cơ quan', description: 'Giả danh chính phủ, công an, hoặc ngân hàng' },
  { id: 'otp', name: 'Yêu cầu OTP', description: 'Hỏi mã xác minh hoặc OTP' },
  { id: 'link', name: 'Liên kết đáng ngờ', description: 'Chứa link rút gọn hoặc URL đáng ngờ' },
  { id: 'money', name: 'Chuyển tiền', description: 'Yêu cầu chuyển tiền hoặc thẻ tiền' },
  { id: 'personal', name: 'Thông tin cá nhân', description: 'Hỏi thông tin cá nhân hoặc tài chính' },
  { id: 'threat', name: 'Đe dọa', description: 'Ngôn ngữ đe dọa hoặc cưỡng ép' },
  { id: 'job', name: 'Việc làm lừa đảo', description: 'Tuyển dụng việc làm online với thu nhập cao' },
  { id: 'investment', name: 'Đầu tư lừa đảo', description: 'Cơ hội đầu tư với lợi nhuận cao bất thường' },
];

// Local ML-based analysis (fallback when no OpenAI API key)
function analyzeWithLocalML(content: string, type: 'message' | 'url' | 'phone'): AnalysisResult {
  const lowerContent = content.toLowerCase();
  const indicators: Indicator[] = [];
  const patterns: Pattern[] = [];
  
  // Pattern matching for message analysis
  if (type === 'message') {
    SCAM_PATTERNS.forEach(pattern => {
      let matched = false;
      switch(pattern.id) {
        case 'urgency':
          matched = /\b(ngay|lập tức|khẩn|expire|hết hạn|24h|48h|72h|urgent|immediately|now|hôm nay|ngay|hết\s*hiệu|lần\s*cùng)\b/i.test(lowerContent);
          break;
        case 'prize':
          matched = /\b(trúng|thưởng|giải thưởng|lottery|prize|won|winner|inheritance|di sản|tặng|quà|miễn phí|free|gift)\b/i.test(lowerContent);
          break;
        case 'authority':
          matched = /\b(công an|ngân hàng|police|bank|tòa|tòa án|chính phủ|government|viện kiểm|sở|cơ quan|thuế|hải quan|bảo hiểm)\b/i.test(lowerContent);
          break;
        case 'otp':
          matched = /\b(otp|mã|xác minh|verify|code|pin|password|mật khẩu|mã\s*xác|token|otp\s*(gửi|mã))\b/i.test(lowerContent);
          break;
        case 'link':
          matched = /\b(http|www\.|bit\.ly|tinyurl|click|link|liên\s*kết|truy cập|click\s*vào)\b/i.test(lowerContent);
          break;
        case 'money':
          matched = /\b(chuyển tiền|transfer|money|tiền|vnd|dola|thanh toán|payment|ngân lượng|ngân hàng|stk|tài khoản|thẻ\s*ngân hàng)\b/i.test(lowerContent);
          break;
        case 'personal':
          matched = /\b(cmnd|cccd|số tài khoản|account|stk|tk|thông tin cá nhân|cmtnd|họ tên|ngày sinh|địa chỉ|số điện thoại)\b/i.test(lowerContent);
          break;
        case 'threat':
          matched = /\b(khóa|tước|bắt|phạt|jail|arrest|prison|banned|block|cấm|khoá|tắt\s*dịch|phạt\s*tiền)\b/i.test(lowerContent);
          break;
        case 'job':
          matched = /\b(việc\s*làm|tuyển dụng|làm\s*tại\s*nhà|thu\s*nhập\s*cao|kiếm\s*tiền\s*online|part-time|full-time\s*在家)\b/i.test(lowerContent);
          break;
        case 'investment':
          matched = /\b(đầu tư|lợi nhuận|hoàn\s*vốn|cổ phiếu|chứng khoán|bitcoin|crypto|forex|dự án\s*hot)\b/i.test(lowerContent);
          break;
      }
      
      patterns.push({
        name: pattern.name,
        matched,
        description: pattern.description
      });
      
      if (matched) {
        const severity = pattern.id === 'otp' || pattern.id === 'money' || pattern.id === 'threat' || pattern.id === 'personal' ? 'high' : 
                        pattern.id === 'urgency' || pattern.id === 'authority' || pattern.id === 'investment' ? 'medium' : 'low';
        indicators.push({
          category: pattern.name,
          severity,
          description: pattern.description
        });
      }
    });
  }
  
  // URL analysis
  if (type === 'url') {
    // Check for suspicious URL patterns
    const urlPatterns = [
      { id: 'suspicious_tld', name: 'TLD đáng ngờ', pattern: /\.(xyz|tk|ml|ga|cf|gq|top|work|click|link|buzz|icu)\//i },
      { id: 'ip_address', name: 'URL là IP', pattern: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/ },
      { id: 'shortened', name: 'Link rút gọn', pattern: /(bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd|buff\.ly)/i },
      { id: 'suspicious_keywords', name: 'Từ khóa đáng ngờ', pattern: /(login|signin|verify|secure|account|update|password|confirm|banking|paypal|ebay|amazon|apple|google|microsoft)/i },
      { id: 'typosquatting', name: 'Typosquatting', pattern: /(gooogle|faceboook|amaz0n|micros0ft|app1e|go0gle)/i },
      { id: 'https_missing', name: 'Thiếu HTTPS', pattern: /^http:\/\//i },
      { id: 'long_url', name: 'URL quá dài', pattern: /.{100,}/ },
      { id: 'at_symbol', name: 'Ký tự @ trong URL', pattern: /@/ },
    ];
    
    urlPatterns.forEach(p => {
      const matched = p.pattern.test(content);
      patterns.push({
        name: p.name,
        matched,
        description: p.name
      });
      
      if (matched) {
        indicators.push({
          category: p.name,
          severity: p.id === 'suspicious_tld' || p.id === 'typosquatting' || p.id === 'ip_address' ? 'high' : 'medium',
          description: p.name
        });
      }
    });
  }
  
  // Phone analysis
  if (type === 'phone') {
    const phonePatterns = [
      { id: 'premium', name: 'Số Premium', pattern: /^1900/i },
      { id: 'short_code', name: 'Số ngắn', pattern: /^6[0-9]{3}$/ },
      { id: 'suspicious_prefix', name: 'Đầu số đáng ngờ', pattern: /^(0987|0123|0169|0188)/i },
    ];
    
    phonePatterns.forEach(p => {
      const matched = p.pattern.test(content.replace(/\s/g, ''));
      patterns.push({
        name: p.name,
        matched,
        description: p.name
      });
      
      if (matched) {
        indicators.push({
          category: p.name,
          severity: 'medium',
          description: p.name
        });
      }
    });
  }
  
  // Calculate probability
  const matchedCount = patterns.filter(p => p.matched).length;
  const highSeverityCount = indicators.filter(i => i.severity === 'high').length;
  
  let probability = Math.min(95, matchedCount * 10 + highSeverityCount * 15 + 5);
  
  // Boost probability for high severity indicators
  if (highSeverityCount >= 2) probability = Math.min(95, probability + 20);
  
  const verdict = probability >= 50 ? 'scam' : probability >= 25 ? 'suspicious' : 'safe';
  
  const recommendation = verdict === 'scam' 
    ? '⚠️ Cảnh báo: Nội dung này có nhiều dấu hiệu lừa đảo. KHÔNG cung cấp thông tin cá nhân hoặc chuyển tiền cho bất kỳ ai.'
    : verdict === 'suspicious'
    ? '⚡ Cẩn thận: Nội dung có một số dấu hiệu đáng ngờ. Hãy xác minh kỹ nguồn gốc trước khi hành động.'
    : '✅ Nội dung này có vẻ an toàn nhưng vẫn nên cảnh giác với các yêu cầu đáng ngờ.';
  
  return { 
    probability, 
    verdict, 
    indicators, 
    patterns, 
    recommendation,
    aiModel: 'ScamGuard-ML-v1',
    analysisMethod: 'local_ml'
  };
}

// OpenAI Analysis (when API key is available)
async function analyzeWithOpenAI(content: string, type: 'message' | 'url' | 'phone'): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return analyzeWithLocalML(content, type);
  }
  
  const systemPrompt = `Bạn là một chuyên gia phân tích lừa đảo của ScamGuard. Phân tích nội dung dưới đây và xác định xem có phải là lừa đảo hay không.

Hãy phân tích và trả về kết quả JSON với cấu trúc sau:
{
  "probability": (0-100),
  "verdict": "safe" | "suspicious" | "scam",
  "indicators": [
    {
      "category": "tên category",
      "severity": "high" | "medium" | "low", 
      "description": "mô tả"
    }
  ],
  "patterns": [
    {
      "name": "tên pattern",
      "matched": true/false,
      "description": "mô tả"
    }
  ],
  "recommendation": "khuyến nghị"
}

Phân tích các dấu hiệu sau:
1. Ngôn ngữ khẩn cấp (urgency)
2. Lừa đảo giải thưởng (prize scam)  
3. Mạo danh cơ quan chức năng (fake authority)
4. Yêu cầu OTP/mã xác minh
5. Liên kết đáng ngờ
6. Yêu cầu chuyển tiền
7. Thu thập thông tin cá nhân
8. Ngôn ngữ đe dọa
9. Việc làm lừa đảo
10. Đầu tư lừa đảo

Trả về JSON hợp lệ, không có markdown code blocks.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Phân tích nội dung ${type}: ${content}` }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return analyzeWithLocalML(content, type);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return analyzeWithLocalML(content, type);
    }

    // Parse AI response
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        ...parsed,
        aiModel: 'GPT-3.5-Turbo',
        analysisMethod: 'openai' as const
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return analyzeWithLocalML(content, type);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return analyzeWithLocalML(content, type);
  }
}

export const POST = withApiObservability(async (request: NextRequest) => {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body: AnalysisRequest = await request.json();
    const { type, content } = body;

    if (!content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: type and content' },
        { status: 400 }
      );
    }

    if (!['message', 'url', 'phone'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be message, url, or phone' },
        { status: 400 }
      );
    }

    // Use OpenAI if API key is available, otherwise use local ML
    const result = process.env.OPENAI_API_KEY 
      ? await analyzeWithOpenAI(content, type)
      : analyzeWithLocalML(content, type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
});

export const GET = withApiObservability(async () => {
  return NextResponse.json({
    service: 'ScamGuard AI Analysis API',
    version: '1.0.0',
    status: 'operational',
    methods: {
      openai: !!process.env.OPENAI_API_KEY,
      local_ml: true
    },
    endpoints: {
      POST: '/api/ai/analyze - Phân tích nội dung (message/url/phone)'
    }
  });
});