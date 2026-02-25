'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type FiVariant = 'rr' | 'br' | 'sr';
type FiEffect = 'none' | 'hover' | 'pulse' | 'float' | 'ring';

interface FiIconProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  name: string;
  variant?: FiVariant;
  effect?: FiEffect;
}

const effectClass: Record<FiEffect, string> = {
  none: '',
  hover: 'fi-hover',
  pulse: 'fi-pulse',
  float: 'fi-float',
  ring: 'fi-ring',
};

function resolveClass(name: string, variant: FiVariant): string {
  if (name.startsWith('fi-')) return name;
  if (/^(rr|br|sr)-/.test(name)) return `fi-${name}`;
  return `fi-${variant}-${name}`;
}

export function FiIcon({
  name,
  variant = 'br',
  effect = 'hover',
  className,
  ...props
}: FiIconProps) {
  return (
    <i
      className={cn('fi', resolveClass(name, variant), 'fi-icon', effectClass[effect], className)}
      aria-hidden
      {...props}
    />
  );
}

