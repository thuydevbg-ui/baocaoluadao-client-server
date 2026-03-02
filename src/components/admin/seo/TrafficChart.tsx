'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TrafficData {
  date: string;
  organic: number;
  direct: number;
}

interface TrafficChartProps {
  data: TrafficData[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.organic, d.direct))
  );
  
  const totalOrganic = data.reduce((sum, d) => sum + d.organic, 0);
  const totalDirect = data.reduce((sum, d) => sum + d.direct, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-400">Organic:</span>
          <span className="text-lg font-bold text-white">
            {totalOrganic.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm text-gray-400">Direct:</span>
          <span className="text-lg font-bold text-white">
            {totalDirect.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] flex items-end gap-1">
        {data.map((day, index) => {
          const organicHeight = (day.organic / maxValue) * 100;
          const directHeight = (day.direct / maxValue) * 100;
          
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              className="flex-1 flex flex-col justify-end group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {day.date}: {day.organic + day.direct} visits
              </div>
              
              {/* Bars */}
              <div className="flex flex-col gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${organicHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  className="bg-blue-500 rounded-t min-h-[4px]"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${directHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 + 0.1 }}
                  className="bg-purple-500 rounded-t min-h-[4px]"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default TrafficChart;