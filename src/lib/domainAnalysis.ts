/**
 * Domain Analysis Utilities
 * Analyzes domains for risk assessment and scam detection
 */

// Cheap/TLD domains often used for scams
const CHEAP_TLDS_LIST = [
  '.top', '.xyz', '.click', '.loan', '.gq', '.ml', '.cf', '.tk', '.ga', '.work',
  '.live', '.fun', '.tech', '.pro', '.vip', '.icu', '.buzz', '.site', '.online',
  '.shop', '.store', '.link', '.click', '.pw', '.cc', '.ws', '.tk', '.ml',
  '.ga', '.cf', '.gq', '.info', '.biz', '.us', '.uk', '.au', '.ru', '.cn'
];

// Gambling-related keywords
const GAMBLING_KEYWORDS_LIST = [
  'casino', 'bet', 'betting', 'poker', 'lottery', 'loto', 'xoso', 'k8', 'fb88',
  'vn88', 'w88', '12bet', 'm88', '188bet', 'fun88', 'cmd368', 'sbobet', 'crown',
  'macao', 'macau', 'thethao', 'bongda', 'bóng đá', 'cá cược', 'đánh bài',
  'game bài', 'slots', 'slot', 'nổ hũ', 'xo so', 'xổ số', 'keno', 'vietlott',
  'lucky', 'winner', 'jackpot', 'huu', 'nohu', 'ban ca', 'bắn cá', 'game',
  'bingo', 'roulette', 'blackjack', 'baccara', 'sicbo', 'dragon tiger'
];

// High-risk keywords
const SCAM_KEYWORDS_LIST = [
  'scam', 'fake', 'phishing', 'hack', 'clone', 'shopee', 'lazada', 'tiki',
  'shop', 'sale', 'discount', 'khuyenmai', 'giamgia', 'deal', 'free', 'gift',
  'giftcode', ' voucher', 'napthe', 'thecao', 'doimatkhau', 'xacminh', 'otp',
  'banking', 'vietcombank', 'vietinbank', 'bidv', 'mbbank', 'acb', 'Sacombank',
  'dangnhap', 'dangky', 'verify', 'security', 'account', 'wallet', 'metamask',
  'binance', 'coinbase', 'remitano', 'trade', 'invest', 'dao', 'airdrop'
];

/**
 * Extract domain from URL or string
 */
export function extractDomain(input: string): string {
  if (!input) return '';
  
  // Remove protocol
  let domain = input.toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/^(\d+\.)+\d+\//, ''); // Remove IP addresses
  
  // Remove path, query, and fragment
  domain = domain.split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/:\d+$/, ''); // Remove port
  
  return domain;
}

/**
 * Get TLD from domain
 */
export function getTLD(domain: string): string {
  const parts = domain.split('.');
  return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
}

/**
 * Check if domain uses a cheap TLD often used for scams
 */
export function isCheapTLD(domain: string): boolean {
  const tld = getTLD(domain).toLowerCase();
  return CHEAP_TLDS_LIST.some(cheap => tld === cheap || tld.endsWith(cheap));
}

/**
 * Check if domain contains gambling-related keywords
 */
export function hasGamblingKeywords(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/[-.]/g, ' ');
  return GAMBLING_KEYWORDS_LIST.some(keyword => 
    normalized.includes(keyword.toLowerCase())
  );
}

/**
 * Check if domain contains scam-related keywords
 */
export function hasScamKeywords(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/[-.]/g, ' ');
  return SCAM_KEYWORDS_LIST.some(keyword => 
    normalized.includes(keyword.toLowerCase())
  );
}

/**
 * Check if domain is newly registered (suspicious pattern)
 * Domains with very short second-level domain or random-looking patterns
 */
export function isNewlyRegisteredPattern(domain: string): boolean {
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  
  const sld = parts[parts.length - 2]; // Second-level domain
  
  // Check for random patterns (common in cheap domain scams)
  // - Too short (< 4 chars)
  // - Contains many numbers
  // - Contains random consonants
  if (sld.length < 4) return true;
  
  const numCount = (sld.match(/\d/g) || []).length;
  if (numCount > 3) return true; // More than 3 digits is suspicious
  
  // Check for common legitimate brands (should NOT be flagged)
  const trustedBrands = [
    'google', 'facebook', 'amazon', 'microsoft', 'apple', 'netflix', 'shopee',
    'lazada', 'tiki', 'vietnampost', 'vnpost', 'agribank', 'vietcombank',
    'vietinbank', 'bidv', 'mbbank', 'vpbank', 'acb', 'techcombank',
    'zalopay', 'momo', 'vnpay', 'grab', 'gojek', 'telegram', 'zalo'
  ];
  
  for (const brand of trustedBrands) {
    if (sld.includes(brand)) return false;
  }
  
  return false;
}

/**
 * Analyze domain and return risk assessment
 */
export interface DomainAnalysis {
  domain: string;
  tld: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  isGambling: boolean;
  isCheapTLD: boolean;
  hasScamKeywords: boolean;
  needsDeepAnalysis: boolean;
}

export function analyzeDomain(input: string): DomainAnalysis {
  const domain = extractDomain(input);
  const tld = getTLD(domain);
  
  const isGamblingDomain = hasGamblingKeywords(domain);
  const isCheapTLDDomain = isCheapTLD(domain);
  const hasScamKeywordsDomain = hasScamKeywords(domain);
  const isNewPattern = isNewlyRegisteredPattern(domain);
  
  const flags: string[] = [];
  let riskScore = 0;
  
  // Check gambling
  if (isGamblingDomain) {
    flags.push('Cờ bạc/Cá cược');
    riskScore += 30;
  }
  
  // Check cheap TLD
  if (isCheapTLDDomain) {
    flags.push('Tên miền giá rẻ');
    riskScore += 20;
  }
  
  // Check scam keywords
  if (hasScamKeywordsDomain) {
    flags.push('Từ khóa lừa đảo');
    riskScore += 25;
  }
  
  // Check new registration pattern
  if (isNewPattern) {
    flags.push('Mẫu hình đăng ký mới');
    riskScore += 15;
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 40) {
    riskLevel = 'high';
  } else if (riskScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }
  
  // Needs deep analysis if any flag is present
  const needsDeepAnalysis = riskScore >= 20;
  
  return {
    domain,
    tld,
    riskLevel,
    flags,
    isGambling: isGamblingDomain,
    isCheapTLD: isCheapTLDDomain,
    hasScamKeywords: hasScamKeywordsDomain,
    needsDeepAnalysis
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskColor(riskLevel: DomainAnalysis['riskLevel']): string {
  switch (riskLevel) {
    case 'critical':
      return 'text-danger';
    case 'high':
      return 'text-warning';
    case 'medium':
      return 'text-orange-500';
    case 'low':
      return 'text-success';
    default:
      return 'text-text-secondary';
  }
}

/**
 * Get risk level background color for UI
 */
export function getRiskBgColor(riskLevel: DomainAnalysis['riskLevel']): string {
  switch (riskLevel) {
    case 'critical':
      return 'bg-danger/10 border-danger/30';
    case 'high':
      return 'bg-warning/10 border-warning/30';
    case 'medium':
      return 'bg-orange-50 border-orange-200';
    case 'low':
      return 'bg-success/10 border-success/30';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}
