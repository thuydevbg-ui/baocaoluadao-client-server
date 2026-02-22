'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  delay?: number;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-400',
    border: 'border-green-500/20'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    border: 'border-yellow-500/20'
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    border: 'border-red-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20'
  }
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  delay = 0
}: StatsCardProps) {
  const colors = colorVariants[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`relative overflow-hidden rounded-2xl bg-gray-900/50 border ${colors.border} p-6 hover:bg-gray-900/70 transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500">so với tuần trước</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
    </motion.div>
  );
}
