'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25',
    secondary: 'bg-bg-card hover:bg-bg-cardHover text-text-main border border-bg-border',
    danger: 'bg-danger hover:bg-danger-600 text-white shadow-lg shadow-danger/25',
    ghost: 'bg-transparent hover:bg-bg-card text-text-secondary hover:text-text-main',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg font-semibold',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-button font-medium transition-all duration-normal',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:none disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      type={type}
      onClick={onClick}
      aria-label={isLoading ? 'Loading' : undefined}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <i className="fi fi-rr-loading animate-spin"></i>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
}
