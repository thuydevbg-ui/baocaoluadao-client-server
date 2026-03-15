'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SearchProgressBarProps {
  isSearching: boolean;
  progress?: number;
  message?: string;
  className?: string;
}

export function SearchProgressBar({
  isSearching,
  progress,
  message = 'Đang tìm kiếm...',
  className
}: SearchProgressBarProps) {
  if (!isSearching) return null;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-border">
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ 
            width: typeof progress === 'number' ? `${Math.min(100, Math.max(0, progress))}%` : '100%',
          }}
        />
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
      
      {/* Loading Message */}
      <div className="mt-2 flex items-center justify-center gap-2 text-sm text-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>{message}</span>
        {typeof progress === 'number' && (
          <span className="text-xs text-text-muted">({Math.round(progress)}%)</span>
        )}
      </div>
    </div>
  );
}

interface SearchButtonProps {
  isSearching: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SearchButton({ isSearching, children, className }: SearchButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSearching}
      className={cn(
        'rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(59,130,246,0.25)] transition hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2',
        className
      )}
    >
      {isSearching ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tra cứu...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
