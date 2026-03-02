'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GooglePreview } from './GooglePreview';
import { Save, X } from 'lucide-react';

interface MetaEditorProps {
  page: {
    id: string;
    url: string;
    title: string;
    description: string;
    keywords: string;
    og_image: string;
    og_title: string;
    og_description: string;
    canonical_url: string;
    robots_meta: string;
    priority: number;
    changefreq: string;
    is_indexed: boolean;
  };
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

const changefreqOptions = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
const robotsOptions = ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'];

export function MetaEditor({ page, onSave, onCancel }: MetaEditorProps) {
  const [formData, setFormData] = useState({
    title: page.title || '',
    description: page.description || '',
    keywords: page.keywords || '',
    og_image: page.og_image || '',
    og_title: page.og_title || '',
    og_description: page.og_description || '',
    canonical_url: page.canonical_url || '',
    robots_meta: page.robots_meta || 'index,follow',
    priority: page.priority || 0.5,
    changefreq: page.changefreq || 'weekly',
    is_indexed: page.is_indexed !== false,
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: page.id, url: page.url });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-xl p-6 border border-gray-800"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Chỉnh sửa Metadata</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
            <Input value={page.url} disabled className="bg-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Tiêu đề (Title) *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={70}
              placeholder="Tiêu đề trang (50-60 ký tự)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Mô tả (Description) *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              maxLength={170}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Mô tả trang (150-160 ký tự)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Từ khóa (Keywords)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => handleChange('keywords', e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseFloat(e.target.value))}
                className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((p) => (
                  <option key={p} value={p}>
                    {p.toFixed(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Change Frequency</label>
              <select
                value={formData.changefreq}
                onChange={(e) => handleChange('changefreq', e.target.value)}
                className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {changefreqOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Robots Meta</label>
            <select
              value={formData.robots_meta}
              onChange={(e) => handleChange('robots_meta', e.target.value)}
              className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              {robotsOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_indexed"
              checked={formData.is_indexed}
              onChange={(e) => handleChange('is_indexed', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600"
            />
            <label htmlFor="is_indexed" className="text-sm text-gray-300">
              Cho phép index (hiển thị trên Google)
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
              Lưu thay đổi
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              Hủy
            </Button>
          </div>
        </form>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Xem trước kết quả tìm kiếm
          </label>
          <GooglePreview
            title={formData.title || page.title || 'Tiêu đề trang'}
            description={formData.description || page.description || 'Mô tả trang'}
            url={page.url}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default MetaEditor;