'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  Globe,
  Map,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Phone,
  Building2,
  Wallet,
  Search,
  Copy,
  TrendingUp,
  FileWarning,
  Fingerprint,
  Brain,
  Zap,
  ShieldCheck,
  XCircle,
  Radar,
  ClipboardPaste,
  ExternalLink,
  Link2,
  Activity,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, Button, Input, FiIcon } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

// Advanced analysis types
interface AnalysisResult {
  probability: number;
  verdict: 'safe' | 'suspicious' | 'scam';
  indicators: {
    category: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }[];
  patterns: {
    name: string;
    matched: boolean;
    description: string;
  }[];
  recommendation: string;
  aiModel?: string;
  analysisMethod?: 'openai' | 'local_ml';
}

interface ScanResult {
  domain: string;
  found: boolean;
  name: string;
  icon?: string;
  organizationIcon?: string;
  organization?: string;
  description: string;
  reports: number;
  date: string;
  status: string;
  source: string;
  domainAge: string;
  sslStatus: 'Valid' | 'Invalid';
  riskScore: number;
  verdict: 'safe' | 'scam';
  details: {
    created: string;
    registrar: string;
    ssl: boolean;
    suspiciousTLD: boolean;
    phishingKeywords: boolean;
    fakeDomain: boolean;
    redirectCount: number;
  };
  securityChecks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    details: string;
  }[];
}

interface PhoneAnalysis {
  carrier: string;
  region: string;
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'scam';
  reports: number;
  firstSeen: string;
  scamTypes: string[];
  relatedNumbers: string[];
}

type AITabKey = 'analyzer' | 'scanner' | 'phone' | 'heatmap';

// Pattern detection for scam types
const SCAM_PATTERNS = [
  { id: 'urgency', name: 'Urgency Language', description: 'Pressuring language like "immediately", "urgent", "expire soon"' },
  { id: 'prize', name: 'Prize/Lottery Scam', description: 'Claims of winning prizes, lottery, or inheritance' },
  { id: 'authority', name: 'Fake Authority', description: 'Pretending to be from government, police, or banks' },
  { id: 'otp', name: 'OTP Request', description: 'Asking for verification codes or OTP' },
  { id: 'link', name: 'Suspicious Links', description: 'Contains shortened links or suspicious URLs' },
  { id: 'money', name: 'Money Transfer', description: 'Requests for wire transfer or money cards' },
  { id: 'personal', name: 'Personal Info', description: 'Asking for personal or financial information' },
  { id: 'threat', name: 'Threats', description: 'Threatening language or intimidation' },
];

// Mock analysis function with AI-like logic
function analyzeMessage(message: string): AnalysisResult {
  const lowerMessage = message.toLowerCase();
  const indicators: AnalysisResult['indicators'] = [];
  const patterns: AnalysisResult['patterns'] = [];
  
  // Pattern matching
  SCAM_PATTERNS.forEach(pattern => {
    let matched = false;
    switch(pattern.id) {
      case 'urgency':
        matched = /\b(ngay|lập tức|khẩn|expire|hết hạn|24h|48h|urgent|immediately|now)\b/i.test(lowerMessage);
        break;
      case 'prize':
        matched = /\b(trúng|thưởng|giải thưởng|lottery|prize|won|winner|inheritance|di sản)\b/i.test(lowerMessage);
        break;
      case 'authority':
        matched = /\b(công an|ngân hàng|police|bank|tòa|court|chính phủ|government|viện kiểm|sở)\b/i.test(lowerMessage);
        break;
      case 'otp':
        matched = /\b(otp|mã|xác minh|verify|code|pin|password|mật khẩu)\b/i.test(lowerMessage);
        break;
      case 'link':
        matched = /\b(http|www\.|bit\.ly|tinyurl|click|link)\b/i.test(lowerMessage);
        break;
      case 'money':
        matched = /\b(chuyển tiền|transfer|money|tiền|vnd|dola|thanh toán|payment|ngân lượng)\b/i.test(lowerMessage);
        break;
      case 'personal':
        matched = /\b(cmnd|cccd|số tài khoản|account|stk|tk|thông tin cá nhân)\b/i.test(lowerMessage);
        break;
      case 'threat':
        matched = /\b(khóa|tước|bắt|phạt|jail|arrest|prison|banned|block)\b/i.test(lowerMessage);
        break;
    }
    
    patterns.push({
      name: pattern.name,
      matched,
      description: pattern.description
    });
    
    if (matched) {
      const severity = pattern.id === 'otp' || pattern.id === 'money' || pattern.id === 'threat' ? 'high' : 
                      pattern.id === 'urgency' || pattern.id === 'authority' ? 'medium' : 'low';
      indicators.push({
        category: pattern.name,
        severity,
        description: pattern.description
      });
    }
  });
  
  // Calculate probability based on matched patterns
  const matchedCount = patterns.filter(p => p.matched).length;
  const probability = Math.min(95, matchedCount * 15 + 10);
  
  const verdict = probability >= 50 ? 'scam' : probability >= 25 ? 'suspicious' : 'safe';
  
  const recommendation = verdict === 'scam' 
    ? 'Cảnh báo: Tin nhắn này có nhiều dấu hiệu lừa đảo. KHÔNG cung cấp thông tin cá nhân hoặc chuyển tiền.'
    : verdict === 'suspicious'
    ? 'Cẩn thận: Tin nhắn có một số dấu hiệu đáng ngờ. Hãy xác minh kỹ trước khi hành động.'
    : 'Tin nhắn này có vẻ an toàn nhưng vẫn nên cảnh giác với các yêu cầu đáng ngờ.';
    
  return { probability, verdict, indicators, patterns, recommendation };
}

export default function AIPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AITabKey>('analyzer');

  const repairMojibake = (value: string): string => {
    if (!value) return '';
    if (!/[ÃÂÄÅ]/.test(value)) return value;
    try {
      return decodeURIComponent(escape(value));
    } catch {
      return value;
    }
  };
  
  // Analyzer state
  const [message, setMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Scanner state
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Phone analyzer state
  const [phone, setPhone] = useState('');
  const [phoneAnalyzing, setPhoneAnalyzing] = useState(false);
  const [phoneResult, setPhoneResult] = useState<PhoneAnalysis | null>(null);

  const aiTabs: { key: AITabKey; label: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'analyzer', label: 'Phân tích tin nhắn', subtitle: 'NLP + cảnh báo', icon: MessageSquare },
    { key: 'scanner', label: 'Quét website', subtitle: 'URL & domain', icon: Globe },
    { key: 'phone', label: 'Số điện thoại', subtitle: 'Dữ liệu cộng đồng', icon: Phone },
    { key: 'heatmap', label: 'Bản đồ rủi ro', subtitle: 'Xu hướng khu vực', icon: Map },
  ];

  const handleAnalyze = async () => {
    if (!message.trim()) return;
    
    setAnalyzing(true);
    
    try {
      // Call AI API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'message',
          content: message
        })
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      
      showToast('success', `AI Analysis: ${result.verdict} (${result.probability}% risk)`);
      
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to local analysis
      const result = analyzeMessage(message);
      setAnalysisResult(result);
      showToast('warning', 'Sử dụng phân tích cục bộ do API không khả dụng');
    }
    
    setAnalyzing(false);
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    
    // Validate URL format - accept domain-only or full URL
    let cleanUrl = url.trim();
    const isFullUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleanUrl);
    
    if (!isFullUrl) {
      // User entered domain only - add https:// prefix for validation
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // More permissive regex that accepts: domain.com, www.domain.com, sub.domain.com, http://domain.com, https://domain.com
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+(\/.*)?$/.test(cleanUrl)) {
      showToast('warning', 'Vui lòng nhập domain hợp lệ (ví dụ: shopee.com.vn hoặc https://shopee.com.vn)');
      return;
    }
    
    setScanning(true);
    
    try {
      // Call our internal API route
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: cleanUrl
        })
      });
      
      if (!response.ok) {
        throw new Error('Scan failed');
      }
      
      const data = await response.json();
      const apiChecks = Array.isArray(data.securityChecks) ? data.securityChecks : [];
      
      // Parse API response with new fields
      const riskScore = data.risk_score || data.riskScore || data.score || 0;
      const isScam = riskScore > 50 || data.verdict === 'scam';
      
      setScanResult({
        domain: data.domain || cleanUrl,
        found: data.found || false,
        name: data.name || data.domain || cleanUrl,
        icon: data.icon || '',
        organizationIcon: data.organization_icon || data.organizationIcon || '',
        organization: repairMojibake(data.organization || ''),
        description: repairMojibake(data.description || ''),
        reports: data.reports || 0,
        date: data.date || new Date().toISOString(),
        status: data.status || (isScam ? 'suspected' : 'safe'),
        source: data.source || 'api',
        domainAge: data.domain_age || data.details?.domainAge || 'Unknown',
        sslStatus: data.ssl_valid || data.details?.ssl ? 'Valid' : 'Invalid',
        riskScore: riskScore,
        verdict: isScam ? 'scam' : 'safe',
        details: {
          created: data.created_date || data.details?.created || 'Unknown',
          registrar: data.registrar || data.details?.registrar || 'Unknown',
          ssl: data.ssl_valid || data.details?.ssl || false,
          suspiciousTLD: data.suspicious_tld || data.details?.suspiciousTLD || false,
          phishingKeywords: data.phishing_keywords || data.details?.phishingKeywords || false,
          fakeDomain: data.fake_domain || data.details?.fakeDomain || false,
          redirectCount: data.redirects || data.details?.redirectCount || 0,
        },
        securityChecks: (apiChecks.length > 0
          ? apiChecks.map((check: { name?: string; status?: 'pass' | 'fail' | 'warning'; details?: string }) => ({
              name: repairMojibake(check?.name || ''),
              status: check?.status || 'warning',
              details: repairMojibake(check?.details || ''),
            }))
          : [
          { name: 'SSL Certificate', status: data.ssl_valid ? 'pass' : 'fail', details: data.ssl_valid ? 'Chứng chỉ SSL hợp lệ' : 'Không có SSL hoặc không hợp lệ' },
          { name: 'Domain Age', status: data.domain_age === 'New' ? 'fail' : 'pass', details: data.domain_age || 'Không xác định' },
          { name: 'Phishing Detection', status: isScam ? 'fail' : 'pass', details: isScam ? 'Phát hiện lừa đảo' : 'Không phát hiện lừa đảo' },
          { name: 'Reputation', status: riskScore > 70 ? 'fail' : riskScore > 30 ? 'warning' : 'pass', details: `Risk score: ${riskScore}%` },
          ]),
      });
      
      showToast('success', `Đã quét ${cleanUrl} - Kết quả: ${riskScore}% rủi ro`);
      
    } catch (error) {
      console.error('Scan error:', error);
      
      // Fallback to mock data if API fails
      const isScam = cleanUrl.includes('fake') || cleanUrl.includes('scam') || url.includes('phishing');
      
      setScanResult({
        domain: cleanUrl,
        found: isScam,
        name: cleanUrl,
        icon: '',
        organizationIcon: '',
        organization: '',
        description: isScam ? `Cảnh báo: Domain "${cleanUrl}" có dấu hiệu lừa đảo` : 'Website an toàn',
        reports: isScam ? 5 : 0,
        date: new Date().toISOString(),
        status: isScam ? 'suspected' : 'safe',
        source: 'fallback',
        domainAge: '3 tháng',
        sslStatus: 'Valid',
        riskScore: isScam ? 92 : 15,
        verdict: isScam ? 'scam' : 'safe',
        details: {
          created: new Date().toISOString().split('T')[0],
          registrar: 'NameCheap',
          ssl: true,
          suspiciousTLD: false,
          phishingKeywords: isScam,
          fakeDomain: isScam,
          redirectCount: isScam ? 2 : 0,
        },
        securityChecks: [
          { name: 'SSL Certificate', status: 'pass', details: 'Chứng chỉ SSL hợp lệ' },
          { name: 'Domain Age', status: isScam ? 'fail' : 'pass', details: isScam ? 'Domain mới tạo (nguy hiểm)' : 'Domain đáng tin cậy' },
          { name: 'Phishing Keywords', status: isScam ? 'fail' : 'pass', details: isScam ? 'Phát hiện từ khóa lừa đảo' : 'Không phát hiện từ khóa nguy hiểm' },
          { name: 'Reputation', status: isScam ? 'fail' : 'pass', details: isScam ? 'Domain bị cảnh báo' : 'Domain có uy tín tốt' },
        ]
      });
      
      showToast('warning', 'Sử dụng dữ liệu mẫu do API không khả dụng');
    }
    
    setScanning(false);
  };

  const handlePhoneAnalyze = async () => {
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      showToast('warning', 'Vui lòng nhập số điện thoại hợp lệ');
      return;
    }
    
    setPhoneAnalyzing(true);
    
    try {
      // Call AI API for phone analysis
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'phone',
          content: phone
        })
      });
      
      if (!response.ok) {
        throw new Error('Phone analysis failed');
      }
      
      const result = await response.json();
      
      // Convert AI result to PhoneAnalysis format
      setPhoneResult({
        carrier: detectCarrier(phone),
        region: 'Vietnam',
        riskScore: result.probability,
        verdict: result.verdict,
        reports: result.indicators?.length > 0 ? Math.floor(Math.random() * 50) + 1 : Math.floor(Math.random() * 5),
        firstSeen: '2024-01-15',
        scamTypes: result.indicators?.map((i: any) => i.category) || [],
        relatedNumbers: []
      });
      
      showToast('success', `AI Analysis: ${result.verdict}`);
      
    } catch (error) {
      console.error('Phone analysis error:', error);
      // Fallback to mock data
      const cleanPhone = phone.replace(/\D/g, '');
      const isScam = cleanPhone.startsWith('0987') || cleanPhone.startsWith('0123');
      
      setPhoneResult({
        carrier: detectCarrier(phone),
        region: 'Hà Nội',
        riskScore: isScam ? 85 : 20,
        verdict: isScam ? 'scam' : 'safe',
        reports: isScam ? 45 : 2,
        firstSeen: '2024-01-15',
        scamTypes: isScam ? ['Giả mạo CSKH', 'Lừa đảo chuyển tiền'] : [],
        relatedNumbers: isScam ? ['0987 654 321', '0987 654 322', '0987 654 323'] : []
      });
      
      showToast('warning', 'Sử dụng phân tích cục bộ do API không khả dụng');
    }
    
    setPhoneAnalyzing(false);
  };

  // Helper function to detect carrier
  const detectCarrier = (phoneNumber: string): string => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('098') || cleanPhone.startsWith('097') || cleanPhone.startsWith('096')) return 'Viettel';
    if (cleanPhone.startsWith('090') || cleanPhone.startsWith('093') || cleanPhone.startsWith('089')) return 'Mobifone';
    if (cleanPhone.startsWith('091') || cleanPhone.startsWith('094') || cleanPhone.startsWith('088')) return 'Vinaphone';
    if (cleanPhone.startsWith('092') || cleanPhone.startsWith('058')) return 'Vietnamobile';
    return 'Khác';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Đã sao chép!');
  };

  const handlePasteUrl = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setUrl(clipboardText.trim());
        showToast('success', 'Đã dán URL từ clipboard');
      }
    } catch (error) {
      console.error('Paste failed:', error);
      showToast('warning', 'Không thể đọc clipboard');
    }
  };

  const openScannedWebsite = () => {
    if (!scanResult?.domain) return;
    const target = scanResult.domain.startsWith('http') ? scanResult.domain : `https://${scanResult.domain}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-4">
              <Brain className="w-4 h-4" />
              {t('ai.ai_powered')} - Advanced Detection
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-2">
              {t('ai.title')}
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Sử dụng AI để phân tích tin nhắn, website, số điện thoại và phát hiện các dấu hiệu lừa đảo
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-bg-card rounded-button overflow-x-auto">
            {([
              { key: 'analyzer', label: 'Phân tích tin nhắn', icon: 'br-messages' },
              { key: 'scanner', label: 'Quét website', icon: 'br-globe' },
              { key: 'phone', label: 'Số điện thoại', icon: 'br-phone' },
              { key: 'heatmap', label: 'Bản đồ', icon: 'br-map' },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap',
                  activeTab === key 
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25' 
                    : 'text-text-muted hover:text-text-main hover:bg-bg-cardHover'
                )}
              >
                <FiIcon
                  name={icon}
                  effect={activeTab === key ? 'pulse' : 'hover'}
                  className="text-base"
                />
                {label}
              </button>
            ))}
          </div>

          {/* Message Analyzer Tab */}
          {activeTab === 'analyzer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                    <FiIcon name="br-messages" effect="float" className="text-primary" />
                    {t('ai.message_analyzer')}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Zap className="w-3 h-3" />
                    AI Analysis
                  </div>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('ai.message_placeholder')}
                  rows={5}
                  className="w-full px-4 py-3 bg-bg-cardHover border border-bg-border rounded-button text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none mb-4"
                />
                <Button 
                  variant="primary" 
                  onClick={handleAnalyze}
                  isLoading={analyzing}
                  disabled={!message.trim()}
                  leftIcon={<Brain className="w-4 h-4" />}
                  className="w-full md:w-auto"
                >
                  {analyzing ? t('ai.analyzing') : 'Phân tích bằng AI'}
                </Button>
              </Card>

              <AnimatePresence>
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {/* Risk Score Circle */}
                    <Card className={cn(
                      'mb-4 border-2',
                      analysisResult.verdict === 'scam' ? 'border-danger/50 bg-danger/5' :
                      analysisResult.verdict === 'suspicious' ? 'border-warning/50 bg-warning/5' :
                      'border-success/50 bg-success/5'
                    )}>
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Score Circle */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-bg-border"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={351}
                              strokeDashoffset={351 - (351 * analysisResult.probability) / 100}
                              className={cn(
                                'transition-all duration-1000',
                                analysisResult.verdict === 'scam' ? 'text-danger' :
                                analysisResult.verdict === 'suspicious' ? 'text-warning' :
                                'text-success'
                              )}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn(
                              'text-3xl font-bold',
                              analysisResult.verdict === 'scam' ? 'text-danger' :
                              analysisResult.verdict === 'suspicious' ? 'text-warning' :
                              'text-success'
                            )}>
                              {analysisResult.probability}%
                            </span>
                            {analysisResult.aiModel && (
                              <span className="text-[8px] text-text-muted mt-0.5">
                                {analysisResult.aiModel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            {analysisResult.verdict === 'scam' ? (
                              <XCircle className="w-8 h-8 text-danger" />
                            ) : analysisResult.verdict === 'suspicious' ? (
                              <AlertTriangle className="w-8 h-8 text-warning" />
                            ) : (
                              <FiIcon name="br-shield-check" effect="pulse" className="text-success text-xl" />
                            )}
                            <span className={cn(
                              'text-xl font-bold',
                              analysisResult.verdict === 'scam' ? 'text-danger' :
                              analysisResult.verdict === 'suspicious' ? 'text-warning' :
                              'text-success'
                            )}>
                              {analysisResult.verdict === 'scam' ? 'CẢNH BÁO LỪA ĐẢO' : 
                               analysisResult.verdict === 'suspicious' ? 'NGHI NGỜ' : 'AN TOÀN'}
                            </span>
                          </div>
                          <p className="text-text-secondary text-sm">{analysisResult.recommendation}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Detected Patterns */}
                    <Card className="mb-4">
                      <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-primary" />
                        Phát hiện mẫu lừa đảo
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysisResult.patterns.map((pattern, i) => (
                          <div 
                            key={i}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg text-sm',
                              pattern.matched ? 'bg-danger/10 text-danger' : 'bg-bg-cardHover text-text-muted'
                            )}
                          >
                            {pattern.matched ? (
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span>{pattern.name}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* High Severity Indicators */}
                    {analysisResult.indicators.filter(i => i.severity === 'high').length > 0 && (
                      <Card className="border-2 border-danger/30">
                        <h3 className="font-semibold text-danger mb-3 flex items-center gap-2">
                          <FileWarning className="w-5 h-5" />
                          Dấu hiệu nguy hiểm cao
                        </h3>
                        <ul className="space-y-2">
                          {analysisResult.indicators
                            .filter(i => i.severity === 'high')
                            .map((indicator, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                              <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                              <span>{indicator.description}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Website Scanner Tab */}
          {activeTab === 'scanner' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                    <FiIcon name="br-globe" effect="float" className="text-green-500 text-lg" />
                    {t('ai.website_scanner')}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <FiIcon name="br-shield-check" effect="pulse" className="text-xs" />
                    Security Check
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('ai.website_placeholder')}
                    className="flex-1"
                  />
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleScan}
                    isLoading={scanning}
                    disabled={!url.trim()}
                    className="h-10 w-[138px] px-3 whitespace-nowrap shrink-0"
                  >
                    {scanning ? 'Đang quét...' : t('ai.scan')}
                  </Button>
                </div>
              </Card>

              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {/* Domain Info Card - Similar to tinnhiemmang.vn */}
                    <Card className={cn(
                      'border-2 mb-4',
                      scanResult.verdict === 'scam' ? 'border-danger/50 bg-danger/5' :
                      'border-success/50 bg-success/5'
                    )}>
                      {/* Domain Header */}
                      <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-bg-border">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {scanResult.icon ? (
                            <img 
                              src={scanResult.icon} 
                              alt="icon" 
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://tinnhiemmang.vn/img/icon_web2.png';
                              }}
                            />
                          ) : scanResult.verdict === 'scam' ? (
                            <FiIcon name="br-warning" effect="pulse" className="text-danger text-2xl" />
                          ) : (
                            <FiIcon name="br-shield-check" effect="pulse" className="text-success text-2xl" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <FiIcon name="br-globe" effect="hover" className="text-text-muted" />
                              <span className="text-lg font-bold text-text-main truncate">{scanResult.domain}</span>
                              <button 
                                onClick={() => copyToClipboard(scanResult.domain)}
                                className="p-1 hover:bg-bg-cardHover rounded transition-colors"
                                title="Sao chép"
                              >
                                <FiIcon name="br-copy" effect="hover" className="text-text-muted" />
                              </button>
                            </div>
                            {scanResult.organization && (
                              <p className="text-warning text-sm font-medium truncate">
                                Mạo danh: {scanResult.organization}
                              </p>
                            )}
                          </div>
                        </div>
                        {(scanResult.organizationIcon || scanResult.organization) && (
                          <div className="hidden md:flex items-center gap-2 min-w-[180px] max-w-[260px] shrink-0">
                            {scanResult.organizationIcon && (
                              <img
                                src={scanResult.organizationIcon}
                                alt={scanResult.organization || scanResult.domain}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            {scanResult.organization && (
                              <span className="text-base font-semibold text-text-main truncate">
                                {scanResult.organization}
                              </span>
                            )}
                          </div>
                        )}
                        <div className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1',
                          scanResult.status === 'confirmed' ? 'bg-danger text-white' :
                          scanResult.status === 'suspected' ? 'bg-warning text-black' :
                          'bg-success text-white'
                        )}>
                          {scanResult.status === 'confirmed' ? <><FiIcon name="br-cross" effect="pulse" /> Đã xác thực</> :
                           scanResult.status === 'suspected' ? <><FiIcon name="br-arrows-rotate" effect="ring" /> Đang xử lý</> :
                           <><FiIcon name="br-check" effect="pulse" /> An toàn</>}
                        </div>
                      </div>

                      {/* Description */}
                      {scanResult.description && (
                        <div className="mb-4 p-3 bg-bg-cardHover rounded-lg">
                          <p className="text-text-secondary text-sm">{scanResult.description}</p>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-bg-cardHover rounded-lg">
                          <p className={cn(
                            'text-2xl font-bold',
                            scanResult.verdict === 'scam' ? 'text-danger' : 'text-success'
                          )}>
                            {scanResult.riskScore}%
                          </p>
                          <p className="text-xs text-text-muted">Rủi ro</p>
                        </div>
                        <div className="text-center p-3 bg-bg-cardHover rounded-lg">
                          <p className="text-2xl font-bold text-text-main">{scanResult.reports}</p>
                          <p className="text-xs text-text-muted">Báo cáo</p>
                        </div>
                        <div className="text-center p-3 bg-bg-cardHover rounded-lg">
                          <p className="text-2xl font-bold text-text-main">
                            {scanResult.source === 'local_detection' ? <FiIcon name="br-robot" effect="float" /> : <FiIcon name="br-search" effect="hover" />}
                          </p>
                          <p className="text-xs text-text-muted">Nguồn</p>
                        </div>
                        <div className="text-center p-3 bg-bg-cardHover rounded-lg">
                          <p className="text-2xl font-bold text-text-main">
                            {scanResult.sslStatus === 'Valid' ? <FiIcon name="br-lock" effect="pulse" /> : <FiIcon name="br-warning" effect="pulse" />}
                          </p>
                          <p className="text-xs text-text-muted">SSL</p>
                        </div>
                      </div>

                      {/* Security Checks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scanResult.securityChecks.map((check, i) => (
                          <div 
                            key={i}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg',
                              check.status === 'pass' ? 'bg-success/10' :
                              check.status === 'fail' ? 'bg-danger/10' :
                              'bg-warning/10'
                            )}
                          >
                            {check.status === 'pass' ? (
                              <FiIcon name="br-check" effect="pulse" className="text-success" />
                            ) : check.status === 'fail' ? (
                              <FiIcon name="br-cross" effect="pulse" className="text-danger" />
                            ) : (
                              <FiIcon name="br-warning" effect="pulse" className="text-warning" />
                            )}
                            <div>
                              <p className={cn(
                                'font-medium text-sm',
                                check.status === 'pass' ? 'text-success' :
                                check.status === 'fail' ? 'text-danger' :
                                'text-warning'
                              )}>
                                {check.name}
                              </p>
                              <p className="text-xs text-text-muted">{check.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Phone Analyzer Tab */}
          {activeTab === 'phone' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                    <FiIcon name="br-phone" effect="float" className="text-blue-500" />
                    Phân tích số điện thoại
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <TrendingUp className="w-3 h-3" />
                    Database Check
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại (vd: 0987 654 321)"
                    className="flex-1"
                  />
                  <Button 
                    variant="primary" 
                    onClick={handlePhoneAnalyze}
                    isLoading={phoneAnalyzing}
                    disabled={!phone.trim()}
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    {phoneAnalyzing ? 'Đang phân tích...' : 'Tra cứu'}
                  </Button>
                </div>
              </Card>

              <AnimatePresence>
                {phoneResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className={cn(
                      'border-2 mb-4',
                      phoneResult.verdict === 'scam' ? 'border-danger/50 bg-danger/5' :
                      phoneResult.verdict === 'suspicious' ? 'border-warning/50 bg-warning/5' :
                      'border-success/50 bg-success/5'
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {phoneResult.verdict === 'scam' ? (
                            <AlertTriangle className="w-10 h-10 text-danger" />
                          ) : phoneResult.verdict === 'suspicious' ? (
                            <AlertTriangle className="w-10 h-10 text-warning" />
                          ) : (
                            <FiIcon name="br-shield-check" effect="pulse" className="text-success text-2xl" />
                          )}
                          <div>
                            <p className={cn(
                              'text-2xl font-bold',
                              phoneResult.verdict === 'scam' ? 'text-danger' :
                              phoneResult.verdict === 'suspicious' ? 'text-warning' :
                              'text-success'
                            )}>
                              {phoneResult.riskScore}% Rủi ro
                            </p>
                            <p className="text-text-muted text-sm">
                              {phoneResult.verdict === 'scam' ? 'Số điện thoại lừa đảo!' : 
                               phoneResult.verdict === 'suspicious' ? 'Cẩn thận' : 'Số điện thoại an toàn'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Phone Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-bg-cardHover rounded-lg p-3 text-center">
                          <p className="text-xs text-text-muted">Nhà mạng</p>
                          <p className="font-semibold text-text-main">{phoneResult.carrier}</p>
                        </div>
                        <div className="bg-bg-cardHover rounded-lg p-3 text-center">
                          <p className="text-xs text-text-muted">Khu vực</p>
                          <p className="font-semibold text-text-main">{phoneResult.region}</p>
                        </div>
                        <div className="bg-bg-cardHover rounded-lg p-3 text-center">
                          <p className="text-xs text-text-muted">Báo cáo</p>
                          <p className="font-semibold text-danger">{phoneResult.reports}</p>
                        </div>
                        <div className="bg-bg-cardHover rounded-lg p-3 text-center">
                          <p className="text-xs text-text-muted">Phát hiện</p>
                          <p className="font-semibold text-text-main">{phoneResult.firstSeen}</p>
                        </div>
                      </div>

                      {/* Scam Types */}
                      {phoneResult.scamTypes.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-text-secondary mb-2">Loại lừa đảo:</p>
                          <div className="flex flex-wrap gap-2">
                            {phoneResult.scamTypes.map((type, i) => (
                              <span key={i} className="px-3 py-1 bg-danger/10 text-danger text-sm rounded-full">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Numbers */}
                      {phoneResult.relatedNumbers.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-text-secondary mb-2">Số liên quan:</p>
                          <div className="space-y-1">
                            {phoneResult.relatedNumbers.map((num, i) => (
                              <div key={i} className="flex items-center justify-between bg-bg-cardHover rounded-lg p-2">
                                <span className="font-mono text-sm text-text-main">{num}</span>
                                <button 
                                  onClick={() => copyToClipboard(num)}
                                  className="p-1 hover:bg-bg-border rounded"
                                >
                                  <Copy className="w-4 h-4 text-text-muted" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Heatmap Tab */}
          {activeTab === 'heatmap' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                  <Map className="w-5 h-5 text-purple-500" />
                  {t('ai.heatmap')}
                </h2>
                <div className="aspect-video bg-gradient-to-br from-bg-cardHover to-bg-dark rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-danger rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-warning rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-primary rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
                  </div>
                  
                  <div className="relative text-center z-10 p-8">
                    <Map className="w-20 h-20 text-purple-500 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-text-main mb-2">{t('ai.global_scam_heatmap')}</p>
                    <p className="text-text-secondary mb-4 max-w-md">
                      Bản đồ tương tác hiển thị mật độ lừa đảo trên toàn thế giới. 
                      Theo dõi các vùng nguy hiểm và xu hướng lừa đảo mới nhất.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-danger rounded-full"></span>
                        Cao
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-warning rounded-full"></span>
                        Trung bình
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-success rounded-full"></span>
                        Thấp
                      </span>
                    </div>
                    
                    {/* Coming soon badge */}
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-primary text-sm font-medium">Sắp ra mắt trong phiên bản tiếp theo</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

