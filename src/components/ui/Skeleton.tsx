'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height 
}: SkeletonProps) {
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-button',
  };

  return (
    <div
      className={cn(
        'shimmer',
        variants[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-bg-card border border-bg-border rounded-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={80} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={60} height={24} />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-bg-card border border-bg-border rounded-card">
      <Skeleton variant="circular" width={44} height={44} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="30%" />
      </div>
      <Skeleton variant="rectangular" width={70} height={28} />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-bg-border rounded-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
        <Skeleton variant="rectangular" height={12} />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={60} />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>
    </div>
  );
}
