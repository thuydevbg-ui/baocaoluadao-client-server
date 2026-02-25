'use client';

import React, { useState } from 'react';
import { Shield, Lock, Clock, Key, Save, Eye, EyeOff } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState({
    minPasswordLength: '8',
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    lockoutDuration: '15',
    enable2FA: false,
    ipWhitelist: '',
  });

  const handleSave = () => {
    alert('Đã lưu cài đặt bảo mật!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Cài đặt bảo mật</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình các thiết lập bảo mật cho hệ thống</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">Chính sách mật khẩu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Độ dài tối thiểu</label>
              <input
                type="number"
                value={settings.minPasswordLength}
                onChange={(e) => setSettings({ ...settings, minPasswordLength: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lần đăng nhập tối đa</label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.requireUppercase}
                onChange={(e) => setSettings({ ...settings, requireUppercase: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Yêu cầu chữ hoa (A-Z)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.requireNumber}
                onChange={(e) => setSettings({ ...settings, requireNumber: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Yêu cầu số (0-9)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.requireSpecial}
                onChange={(e) => setSettings({ ...settings, requireSpecial: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Yêu cầu ký tự đặc biệt (!@#$...)</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Quản lý phiên</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian timeout (phút)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian khóa (phút)</label>
              <input
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Bảo mật nâng cao</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Xác thực 2 bước (2FA)</p>
                <p className="text-sm text-gray-500">Yêu cầu mã xác thực khi đăng nhập</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enable2FA}
                onChange={(e) => setSettings({ ...settings, enable2FA: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Whitelist (mỗi IP một dòng)</label>
              <textarea
                value={settings.ipWhitelist}
                onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                placeholder="127.0.0.1&#10;192.168.1.1"
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
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