'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick
    ? {
        whileHover: { y: -4, scale: 1.01 },
        whileTap: { scale: 0.99 },
      }
    : {};

  return (
    <Component
      className={cn(
        'bg-bg-card border border-bg-border rounded-card p-5',
        'shadow-card transition-shadow duration-normal',
        hover && 'cursor-pointer hover:shadow-card-hover hover:border-primary/30',
        className
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass border border-white/10 rounded-card p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
