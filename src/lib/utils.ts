import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Type definitions for the ScamGuard application

export type RiskLevel = 'safe' | 'suspicious' | 'scam';
export type ScamType = 'phone' | 'bank' | 'website' | 'crypto';

export interface SearchResult {
  id: string | number;
  type: ScamType;
  value: string;
  risk: RiskLevel;
  reports: number;
  firstSeen?: string;
  lastReported?: string;
}

export interface ScamDetail extends SearchResult {
  riskScore: number;
  description: string;
  amount?: string;
}

export interface Comment {
  id: string | number;
  user: string;
  avatar: string;
  text: string;
  time: string;
  helpful: number;
}

export interface Notification {
  id: string | number;
  text: string;
  unread: boolean;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function getRiskColor(risk: 'safe' | 'suspicious' | 'scam'): string {
  switch (risk) {
    case 'safe':
      return 'text-success bg-success/10 border-success/30';
    case 'suspicious':
      return 'text-warning bg-warning/10 border-warning/30';
    case 'scam':
      return 'text-danger bg-danger/10 border-danger/30';
    default:
      return 'text-text-secondary bg-bg-card border-bg-border';
  }
}

export function getRiskGradient(risk: 'safe' | 'suspicious' | 'scam'): string {
  switch (risk) {
    case 'safe':
      return 'from-success to-green-400';
    case 'suspicious':
      return 'from-warning to-amber-400';
    case 'scam':
      return 'from-danger to-red-400';
    default:
      return 'from-gray-500 to-gray-400';
  }
}

// Simple XSS sanitization for user-generated content
// Note: For production, consider using a library like 'dompurify' for more robust sanitization
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
    '=': '&#x3D;',
  };
  return input.replace(/[&<>"'`/=]/g, (char) => map[char] || char);
}
