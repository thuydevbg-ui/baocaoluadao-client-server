'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Server, Save, TestTube, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

type EmailSettingsState = {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  enableTLS: boolean;
  enableAuth: boolean;
  secure: boolean;
};

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettingsState>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromName: 'ScamGuard',
    fromEmail: '',
    enableTLS: true,
    enableAuth: true,
    secure: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không tải được cài đặt');
        const s = data.settings || {};

        setSettings((prev) => ({
          ...prev,
          smtpHost: s.smtpHost || '',
          smtpPort: String(s.smtpPort ?? '587'),
          smtpUser: s.smtpUser || '',
          smtpPassword: s.smtpPasswordSet ? '********' : '',
          fromName: s.smtpFromName || prev.fromName,
          fromEmail: s.smtpFromEmail || '',
          enableTLS: Boolean(s.smtpRequireTLS ?? true),
          enableAuth: Boolean(s.smtpAuthEnabled ?? true),
          secure: Boolean(s.smtpSecure ?? false),
        }));

        if (!testTo) setTestTo(s.contactEmail || '');
      } catch (e: any) {
        setNotice({ type: 'error', message: e?.message || 'Không tải được cài đặt' });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildPasswordPayload = () => {
    if (settings.smtpPassword === '********') return undefined;
    // allow empty string to clear password
    return settings.smtpPassword;
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const smtpPort = Number(settings.smtpPort);
      const payload = {
        smtpHost: settings.smtpHost,
        smtpPort: Number.isFinite(smtpPort) ? smtpPort : undefined,
        smtpSecure: settings.secure,
        smtpRequireTLS: settings.enableTLS,
        smtpAuthEnabled: settings.enableAuth,
        smtpUser: settings.smtpUser,
        smtpPassword: buildPasswordPayload(),
        smtpFromName: settings.fromName,
        smtpFromEmail: settings.fromEmail,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Không lưu được cài đặt');
      setNotice({ type: 'success', message: 'Đã lưu cài đặt SMTP' });
      setSettings((prev) => ({
        ...prev,
        smtpPassword: prev.smtpPassword && prev.smtpPassword !== '********' ? '********' : prev.smtpPassword,
      }));
    } catch (e: any) {
      setNotice({ type: 'error', message: e?.message || 'Không lưu được cài đặt' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gửi email test thất bại');
      setNotice({ type: 'success', message: 'Đã gửi email test' });
    } catch (e: any) {
      setNotice({ type: 'error', message: e?.message || 'Gửi email test thất bại' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Cài đặt Email</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình SMTP để gửi email từ hệ thống</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {notice && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              notice.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : notice.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
            <div className="text-sm">{notice.message}</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Cấu hình SMTP</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                placeholder="587"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="noreply@domain.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3 py-2 border rounded-lg pr-10 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableTLS}
                onChange={(e) => setSettings({ ...settings, enableTLS: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Bật TLS</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableAuth}
                onChange={(e) => setSettings({ ...settings, enableAuth: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Xác thực SMTP</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.secure}
                onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">SSL (secure)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Mật khẩu SMTP được lưu dạng mã hóa. Nếu không thay đổi, giữ nguyên giá trị `********`.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Thông tin người gửi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên người gửi</label>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                placeholder="ScamGuard"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email người gửi</label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                placeholder="noreply@domain.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TestTube className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold">Test Email</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gửi tới</label>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dùng để kiểm tra kết nối SMTP trước khi bật xác minh email.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleTest}
                disabled={testing || loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />{testing ? 'Đang gửi...' : 'Gửi email test'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <div className="text-xs text-gray-500">{loading ? 'Đang tải...' : ' '}</div>
        </div>
      </div>
    </div>
  );
}
