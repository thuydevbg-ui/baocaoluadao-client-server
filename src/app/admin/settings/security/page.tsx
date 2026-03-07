'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Lock, Clock, Key, Save, Eye, EyeOff, Cloud } from 'lucide-react';

type SettingsState = {
  minPasswordLength: string;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  sessionTimeout: string;
  maxLoginAttempts: string;
  lockoutDuration: string;
  enable2FA: boolean;
  ipWhitelist: string;
  googleAuthEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  facebookAuthEnabled: boolean;
  facebookClientId: string;
  facebookClientSecret: string;
  twitterAuthEnabled: boolean;
  twitterClientId: string;
  twitterClientSecret: string;
  telegramAuthEnabled: boolean;
  telegramBotToken: string;
};

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    minPasswordLength: '8',
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    lockoutDuration: '15',
    enable2FA: false,
    ipWhitelist: '',
    googleAuthEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    facebookAuthEnabled: false,
    facebookClientId: '',
    facebookClientSecret: '',
    twitterAuthEnabled: false,
    twitterClientId: '',
    twitterClientSecret: '',
    telegramAuthEnabled: false,
    telegramBotToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data.settings) {
          const s = data.settings;
          setSettings((prev) => ({
            ...prev,
            enable2FA: s.loginEnabled, // map loosely
            googleAuthEnabled: s.googleAuthEnabled,
            googleClientId: s.googleClientIdSet ? '********' : '',
            googleClientSecret: s.googleClientSecretSet ? '********' : '',
            facebookAuthEnabled: s.facebookAuthEnabled ?? false,
            facebookClientId: s.facebookClientIdSet ? '********' : '',
            facebookClientSecret: s.facebookClientSecretSet ? '********' : '',
            twitterAuthEnabled: s.twitterAuthEnabled ?? false,
            twitterClientId: s.twitterClientIdSet ? '********' : '',
            twitterClientSecret: s.twitterClientSecretSet ? '********' : '',
            telegramAuthEnabled: s.telegramAuthEnabled ?? false,
            telegramBotToken: s.telegramBotTokenSet ? '********' : '',
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        googleAuthEnabled: settings.googleAuthEnabled,
        googleClientId: redact(settings.googleClientId),
        googleClientSecret: redact(settings.googleClientSecret),
        facebookAuthEnabled: settings.facebookAuthEnabled,
        facebookClientId: redact(settings.facebookClientId),
        facebookClientSecret: redact(settings.facebookClientSecret),
        twitterAuthEnabled: settings.twitterAuthEnabled,
        twitterClientId: redact(settings.twitterClientId),
        twitterClientSecret: redact(settings.twitterClientSecret),
        telegramAuthEnabled: settings.telegramAuthEnabled,
        telegramBotToken: redact(settings.telegramBotToken),
        // legacy fields we don’t manage here kept untouched by backend when undefined
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Không lưu được cài đặt');
      alert('Đã lưu cài đặt bảo mật & OAuth');
    } catch (e: any) {
      alert(e?.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const redact = (value: string) => {
    if (!value || value === '********') return undefined;
    return value.trim();
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
        {loading && <p className="text-sm text-gray-500">Đang tải cài đặt...</p>}

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

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Đăng nhập OAuth / Social</h2>
              <p className="text-sm text-gray-500">Quản lý kết nối Google, Facebook, X, Telegram</p>
            </div>
          </div>

          {[
            {
              key: 'google',
              title: 'Google OAuth',
              enabled: settings.googleAuthEnabled,
              idKey: 'googleClientId',
              secretKey: 'googleClientSecret',
            },
            {
              key: 'facebook',
              title: 'Facebook OAuth',
              enabled: settings.facebookAuthEnabled,
              idKey: 'facebookClientId',
              secretKey: 'facebookClientSecret',
            },
            {
              key: 'twitter',
              title: 'X (Twitter) OAuth 2.0',
              enabled: settings.twitterAuthEnabled,
              idKey: 'twitterClientId',
              secretKey: 'twitterClientSecret',
            },
          ].map((item) => (
            <div key={item.key} className="rounded-lg border p-4 space-y-3">
              <label className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item.title}</span>
                <input
                  type="checkbox"
                  checked={settings[`${item.key}AuthEnabled` as keyof typeof settings] as boolean}
                  onChange={(e) =>
                    setSettings({ ...settings, [`${item.key}AuthEnabled`]: e.target.checked } as any)
                  }
                  className="w-5 h-5 text-blue-600"
                />
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={(settings as any)[item.idKey]}
                    onChange={(e) => setSettings({ ...settings, [item.idKey]: e.target.value } as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Client Secret</label>
                  <div className="relative">
                    <input
                      type={showSecret[item.secretKey] ? 'text' : 'password'}
                      value={(settings as any)[item.secretKey]}
                      onChange={(e) => setSettings({ ...settings, [item.secretKey]: e.target.value } as any)}
                      className="w-full px-3 py-2 border rounded-lg pr-10 focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                      onClick={() => setShowSecret({ ...showSecret, [item.secretKey]: !showSecret[item.secretKey] })}
                    >
                      {showSecret[item.secretKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg border p-4 space-y-3">
            <label className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Telegram Login (Bot)</span>
              <input
                type="checkbox"
                checked={settings.telegramAuthEnabled}
                onChange={(e) => setSettings({ ...settings, telegramAuthEnabled: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
            </label>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Bot Token</label>
              <input
                type={showSecret.telegramBotToken ? 'text' : 'password'}
                value={settings.telegramBotToken}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123456:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
}
