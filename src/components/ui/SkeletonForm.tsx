'use client';

import { Skeleton, SkeletonText, SkeletonButton } from './Skeleton';

interface FormField {
  label: boolean;
  input: boolean;
  error?: boolean;
  helpText?: boolean;
}

interface SkeletonFormFieldProps {
  type?: 'text' | 'select' | 'textarea' | 'checkbox' | 'date';
  showLabel?: boolean;
  showError?: boolean;
  showHelpText?: boolean;
}

export function SkeletonFormField({
  type = 'text',
  showLabel = true,
  showError = false,
  showHelpText = false,
}: SkeletonFormFieldProps) {
  return (
    <div className="mb-4">
      {showLabel && (
        <Skeleton variant="text" width="100px" height="1rem" className="mb-2" />
      )}
      
      {type === 'textarea' ? (
        <Skeleton height="100px" className="w-full" />
      ) : type === 'select' ? (
        <Skeleton height="2.5rem" className="w-full" />
      ) : type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width="20px" height="20px" />
          <Skeleton variant="text" width="150px" height="1rem" />
        </div>
      ) : (
        <Skeleton height="2.5rem" className="w-full" />
      )}
      
      {showError && (
        <Skeleton variant="text" width="200px" height="0.875rem" className="mt-1 text-red-500" />
      )}
      
      {showHelpText && (
        <Skeleton variant="text" width="250px" height="0.875rem" className="mt-1 text-slate-500" />
      )}
    </div>
  );
}

/**
 * Skeleton Form - Form với nhiều fields
 */
interface SkeletonFormProps {
  fields?: number;
  showButtons?: boolean;
  columns?: 1 | 2;
}

export function SkeletonForm({
  fields = 4,
  showButtons = true,
  columns = 1,
}: SkeletonFormProps) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {Array.from({ length: fields }).map((_, i) => (
          <SkeletonFormField key={i} />
        ))}
      </div>
      
      {showButtons && (
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <SkeletonButton width="100px" />
          <SkeletonButton width="100px" />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton Search Box
 */
export function SkeletonSearchBox() {
  return (
    <div className="flex gap-3 mb-4">
      <Skeleton height="2.5rem" className="flex-1" />
      <Skeleton height="2.5rem" width="100px" />
    </div>
  );
}

/**
 * Skeleton Filter Bar
 */
interface SkeletonFilterBarProps {
  filters?: number;
}

export function SkeletonFilterBar({ filters = 4 }: SkeletonFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {Array.from({ length: filters }).map((_, i) => (
        <Skeleton key={i} height="2.5rem" width={`${120 + Math.random() * 80}px`} />
      ))}
    </div>
  );
}
