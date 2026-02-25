'use client';

import React, { useState } from 'react';
import { Key, Plus, Copy, RefreshCw, Trash2, Save, Eye, EyeOff } from 'lucide-react';

const apiKeys = [
  { id: '1', name: 'Production API', key: 'sk_live_xxxxxxxxxxxxx', createdAt: '2024-01-01', lastUsed: '2024-01-15', status: 'active' },
  { id: '2', name: 'Development API', key: 'sk_test_xxxxxxxxxxxxx', createdAt: '2024-01-10', lastUsed: '2024-01-14', status: 'active' },
];

export default function ApiSettingsPage() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState('1000');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('Đã sao chép API key!');
  };

  const handleRegenerate = (id: string) => {
    if (confirm('Bạn có chắc muốn tạo lại API key?')) {
      alert('Đã tạo lại API key!');
    }
  };

  const handleSave = () => {
    alert('Đã lưu cài đặt API!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Cài đặt API</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý API keys và rate limiting</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">API Keys</h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />Tạo API Key
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{apiKey.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                      {showKey === apiKey.id ? apiKey.key : '••••••••••••••••'}
                    </code>
                    <button onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)} className="p-1 text-gray-500 hover:text-gray-700">
                      {showKey === apiKey.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tạo: {apiKey.createdAt} • Lần cuối: {apiKey.lastUsed}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopy(apiKey.key)} className="p-2 text-gray-600 hover:bg-gray-200 rounded" title="Sao chép">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRegenerate(apiKey.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Tạo lại">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <Key className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">Rate Limiting</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số request mỗi phút</label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Giới hạn số lượng API requests mỗi phút</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Webhooks</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Nhận thông báo khi có sự kiện mới</p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}