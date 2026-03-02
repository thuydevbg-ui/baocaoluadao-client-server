import React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  label: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ label, children, position = 'top', className }: TooltipProps) {
  const placementClass = position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2';

  return (
    <div className={cn('group inline-flex relative', className)}>
      {children}
      <span
        className={cn(
          'pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-xl px-3 py-1.5 text-xs font-medium text-text-main bg-bg-card/90 border border-bg-border shadow-lg opacity-0 transition-all duration-200 z-10 whitespace-nowrap',
          placementClass,
          'group-hover:opacity-100 group-focus-visible:opacity-100'
        )}
      >
        {label}
      </span>
    </div>
  );
}
