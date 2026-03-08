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

export function EmailSmtpSettingsPanel() {
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
        const res = await fetch('/api/admin/settings', { cache: 'no-store', credentials: 'include' });
        const data = await res.json().catch(() => ({}));
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
        credentials: 'include',
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
        credentials: 'include',
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
    <div className="space-y-6">
      {notice && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : notice.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5" />
          )}
          <div className="text-sm">{notice.message}</div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="p-2 bg-sky-100 rounded-lg">
            <Server className="h-5 w-5 text-sky-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Cấu hình SMTP</h3>
            <p className="text-xs text-slate-500">Dùng cho xác minh email, thông báo và email hệ thống.</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">SMTP Host</span>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">SMTP Port</span>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                placeholder="587"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Username</span>
              <input
                type="text"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="noreply@domain.com"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Mật khẩu SMTP được lưu dạng mã hóa. Nếu không thay đổi, giữ nguyên giá trị <code>********</code>.
              </p>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.enableTLS}
                onChange={(e) => setSettings({ ...settings, enableTLS: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              Bật TLS
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.enableAuth}
                onChange={(e) => setSettings({ ...settings, enableAuth: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              Xác thực SMTP
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.secure}
                onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              SSL (secure)
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Mail className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Thông tin người gửi</h3>
            <p className="text-xs text-slate-500">Tên và email hiển thị khi gửi.</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tên người gửi</span>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                placeholder="ScamGuard"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/25"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email người gửi</span>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                placeholder="noreply@domain.com"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/25"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="p-2 bg-slate-100 rounded-lg">
            <TestTube className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Test Email</h3>
            <p className="text-xs text-slate-500">Kiểm tra kết nối SMTP trước khi dùng xác minh email.</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gửi tới</span>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <TestTube className="h-4 w-4" />
              {testing ? 'Đang gửi...' : 'Gửi test'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            {loading ? 'Đang tải...' : ' '}
          </div>
        </div>
      </div>
    </div>
  );
}

