'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CoreWebVitals {
  lcp: { value: number; unit: string; status: string };
  cls: { value: number; unit: string; status: string };
  fid: { value: number; unit: string; status: string };
}

interface CoreWebVitalsChartProps {
  vitals: CoreWebVitals;
}

export function CoreWebVitalsChart({ vitals }: CoreWebVitalsChartProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-400 bg-green-400/20';
      case 'needs_improvement':
        return 'text-yellow-400 bg-yellow-400/20';
      default:
        return 'text-red-400 bg-red-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good':
        return 'Tốt';
      case 'needs_improvement':
        return 'Cần cải thiện';
      default:
        return 'Kém';
    }
  };

  const metrics = [
    {
      key: 'lcp',
      label: 'LCP',
      fullName: 'Largest Contentful Paint',
      description: 'Thờii gian hiển thị nội dung lớn nhất',
      threshold: '2.5s',
    },
    {
      key: 'fid',
      label: 'FID',
      fullName: 'First Input Delay',
      description: 'Độ trễ phản hồ lần đầu',
      threshold: '100ms',
    },
    {
      key: 'cls',
      label: 'CLS',
      fullName: 'Cumulative Layout Shift',
      description: 'Độ dịch chuyển bố cục tích lũy',
      threshold: '0.1',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map((metric, index) => {
        const vital = vitals[metric.key as keyof CoreWebVitals];
        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-bold text-white">{metric.label}</h4>
                <p className="text-xs text-gray-400">{metric.fullName}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                  vital.status
                )}`}
              >
                {getStatusLabel(vital.status)}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-3xl font-bold text-white">
                {vital.value}
              </span>
              <span className="text-gray-400 ml-1">{vital.unit}</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-400">{metric.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Ngưỡng tốt:</span>
                <span className="text-green-400">&lt; {metric.threshold}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (vital.value / (metric.key === 'lcp' ? 4 : metric.key === 'fid' ? 300 : 0.25)) * 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full ${
                  vital.status === 'good'
                    ? 'bg-green-400'
                    : vital.status === 'needs_improvement'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default CoreWebVitalsChart;