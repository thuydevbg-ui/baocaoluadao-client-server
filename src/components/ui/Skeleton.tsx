'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-slate-200 dark:bg-slate-700';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationStyles = {
    pulse: {
      scale: [1, 0.95, 1],
      opacity: [1, 0.7, 1],
    },
    wave: {
      x: [-1000, 1000],
    },
    none: {},
  };

  const MotionComponent = motion.div;

  return (
    <MotionComponent
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      animate={animation === 'wave' ? undefined : animationStyles[animation]}
      transition={{
        duration: animation === 'wave' ? 1.5 : 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
  spacing = 'normal',
}: {
  lines?: number;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}) {
  const spacingStyles = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-4',
  };

  return (
    <div className={clsx('flex flex-col', spacingStyles[spacing], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="1rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      variant="circular"
      className={clsx(sizeStyles[size], className)}
    />
  );
}

export function SkeletonButton({
  className,
  width = '100px',
}: {
  className?: string;
  width?: string | number;
}) {
  return (
    <Skeleton
      variant="rectangular"
      height="2.5rem"
      width={width}
      className={className}
    />
  );
}

/**
 * CardSkeleton - Skeleton for card components
 */
export function CardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow p-4', className)}>
      <div className="mb-4">
        <Skeleton height="160px" className="w-full" />
      </div>
      <Skeleton variant="text" width="70%" height="1.5rem" className="mb-2" />
      <SkeletonText lines={3} />
    </div>
  );
}

/**
 * DetailSkeleton - Skeleton for detail/detail pages
 */
export function DetailSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow p-6', className)}>
      <div className="flex items-center gap-4 mb-6">
        <SkeletonAvatar size="xl" />
        <div className="flex-1">
          <Skeleton variant="text" width="200px" height="1.5rem" className="mb-2" />
          <Skeleton variant="text" width="150px" height="1rem" />
        </div>
      </div>
      <div className="space-y-4">
        <SkeletonText lines={4} />
        <Skeleton height="200px" className="w-full" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

/**
 * SearchResultSkeleton - Skeleton for search results
 */
export function SearchResultSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={clsx('flex gap-4 p-4 border-b border-slate-200 dark:border-slate-700', className)}>
      <Skeleton variant="rectangular" width="60px" height="60px" className="rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <Skeleton variant="text" width="80%" height="1.25rem" className="mb-2" />
        <SkeletonText lines={2} spacing="tight" />
      </div>
      <Skeleton variant="text" width="60px" height="1rem" />
    </div>
  );
}
