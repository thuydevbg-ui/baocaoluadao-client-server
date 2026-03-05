'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-bg-cardHover text-text-secondary border-bg-border',
    success: 'bg-success/10 text-success border-success/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    danger: 'bg-danger/10 text-danger border-danger/30',
    primary: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface RiskBadgeProps {
  risk: 'safe' | 'suspicious' | 'scam' | 'unknown';
  label: string;
}

export function RiskBadge({ risk, label }: RiskBadgeProps) {
  const variants = {
    safe: 'bg-success/10 text-success border-success/30',
    suspicious: 'bg-warning/10 text-warning border-warning/30',
    scam: 'bg-danger/10 text-danger border-danger/30',
    unknown: 'bg-bg-cardHover text-text-secondary border-bg-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border',
        variants[risk]
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          risk === 'safe' && 'bg-success',
          risk === 'suspicious' && 'bg-warning',
          risk === 'scam' && 'bg-danger',
          risk === 'unknown' && 'bg-gray-400'
        )}
      />
      {label}
    </span>
  );
}
