'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Globe, Shield, AlertTriangle, Phone, Mail, User, Building2 } from 'lucide-react';

interface MobileSearchResultProps {
  id: string;
  value: string;
  type: 'website' | 'phone' | 'email' | 'social' | 'organization' | 'bank' | string;
  risk: 'safe' | 'suspicious' | 'scam' | string;
  reports?: number;
  sourceIcon?: string;
  sourceOrganization?: string;
  sourceStatus?: string;
  href: string;
  selected?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  website: <Globe className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  social: <User className="w-5 h-5" />,
  organization: <Building2 className="w-5 h-5" />,
  bank: <Shield className="w-5 h-5" />,
};

const riskConfig = {
  safe: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-500',
    label: 'An toàn',
  },
  suspicious: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    badge: 'bg-amber-500',
    label: 'Nghi ngờ',
  },
  scam: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: 'text-rose-500',
    badge: 'bg-rose-500',
    label: 'Lừa đảo',
  },
};

export function MobileSearchResult({
  value,
  type,
  risk,
  reports = 0,
  sourceIcon,
  sourceOrganization,
  href,
  selected = false,
}: MobileSearchResultProps) {
  const config = riskConfig[risk as keyof typeof riskConfig] || riskConfig.safe;
  const TypeIcon = typeIcons[type] || <Globe className="w-5 h-5" />;

  return (
    <Link
      href={href}
      data-mobile-card
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98]',
        'min-h-[64px] touch-manipulation',
        config.bg,
        config.border,
        selected && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
      )}
    >
      {/* Icon/Image - Fixed size 44px */}
      <div
        className={cn(
          'flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden',
          'bg-white/80 shadow-sm'
        )}
      >
        {sourceIcon ? (
          <img
            src={sourceIcon}
            alt={value}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className={config.icon}>{TypeIcon}</span>
        )}
      </div>

      {/* Content - Single line, truncate */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm truncate', config.text)}>
          {value}
        </p>
        {sourceOrganization && (
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {sourceOrganization}
          </p>
        )}
      </div>

      {/* Status Badge - Compact */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-semibold text-white uppercase tracking-wide',
            config.badge
          )}
        >
          {config.label}
        </span>
        {risk !== 'safe' && reports > 0 && (
          <span className="text-[10px] text-text-secondary flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" />
            {reports}
          </span>
        )}
      </div>
    </Link>
  );
}

// Mobile-only list wrapper
export function MobileResultList({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:hidden space-y-2" data-mobile-card-list>
      {children}
    </div>
  );
}
