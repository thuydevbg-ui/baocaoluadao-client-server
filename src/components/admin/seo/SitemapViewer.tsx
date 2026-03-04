'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Globe, Clock } from 'lucide-react';

interface SitemapUrl {
  url: string;
  updated_at: string;
  priority: number;
  changefreq: string;
}

interface SitemapViewerProps {
  urls: SitemapUrl[];
  stats: {
    totalUrls: number;
    lastGenerated: string;
    highPriorityCount: number;
  };
  xmlContent: string;
}

export function SitemapViewer({ urls, stats, xmlContent }: SitemapViewerProps) {
  const [viewMode, setViewMode] = React.useState<'list' | 'xml'>('list');

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.8) return 'text-green-400';
    if (priority >= 0.5) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalUrls}</p>
              <p className="text-sm text-gray-400">Total URLs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Globe className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.highPriorityCount}</p>
              <p className="text-sm text-gray-400">High Priority</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {stats.lastGenerated 
                  ? new Date(stats.lastGenerated).toLocaleDateString('vi-VN')
                  : 'N/A'}
              </p>
              <p className="text-sm text-gray-400">Last Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-primary text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('xml')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'xml'
              ? 'bg-primary text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          XML View
        </button>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">URL</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Priority</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Change Freq</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url, index) => (
                  <motion.tr
                    key={url.url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30"
                  >
                    <td className="py-3 px-4 text-sm text-gray-300 truncate max-w-[300px]">
                      {url.url}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-medium ${getPriorityColor(url.priority)}`}>
                        {url.priority.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-400 capitalize">
                      {url.changefreq}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-400">
                      {url.updated_at 
                        ? new Date(url.updated_at).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
            {xmlContent}
          </pre>
        </div>
      )}
    </div>
  );
}

export default SitemapViewer;