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
        'bg-bg-card/95 border border-slate-200 rounded-[32px] p-4 sm:p-5 shadow-[0_25px_70px_rgba(15,23,42,0.12)] transition duration-500 transform will-change-transform',
        'hover:-translate-y-1 hover:shadow-[0_40px_90px_rgba(15,23,42,0.18)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40',
        hover && 'cursor-pointer',
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
