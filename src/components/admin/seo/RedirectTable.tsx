'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Redirect {
  id: string;
  from_url: string;
  to_url: string;
  type: '301' | '302' | '307' | '308';
  hits: number;
  is_active: boolean;
}

interface RedirectTableProps {
  redirects: Redirect[];
  onEdit: (redirect: Redirect) => void;
  onDelete: (id: string) => void;
}

export function RedirectTable({ redirects, onEdit, onDelete }: RedirectTableProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case '301':
        return 'bg-green-500/20 text-green-400';
      case '302':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">From URL</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">To URL</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Type</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Hits</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Status</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {redirects.map((redirect, index) => (
            <motion.tr
              key={redirect.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-800/50 hover:bg-gray-800/30"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 max-w-[200px]">
                  <span className="text-gray-300 truncate">{redirect.from_url}</span>
                  <a
                    href={redirect.from_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 max-w-[200px]">
                  <span className="text-gray-300 truncate">{redirect.to_url}</span>
                  <a
                    href={redirect.to_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(redirect.type)}`}>
                  {redirect.type}
                </span>
              </td>
              <td className="py-3 px-4 text-center text-gray-300">
                {redirect.hits.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    redirect.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(redirect)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(redirect.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      
      {redirects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No redirects found
        </div>
      )}
    </div>
  );
}

export default RedirectTable;