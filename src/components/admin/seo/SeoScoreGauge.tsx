'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SeoScoreGaugeProps {
  score: number;
  size?: number;
}

export function SeoScoreGauge({ score, size = 200 }: SeoScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'Tuyệt vờii';
    if (score >= 60) return 'Khá tốt';
    if (score >= 40) return 'Cần cải thiện';
    return 'Kém';
  };

  const color = getColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 40 }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="#374151"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <motion.path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-5xl font-bold"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-gray-400 mt-1">{getLabel(score)}</span>
      </div>
    </div>
  );
}

export default SeoScoreGauge;