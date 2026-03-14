'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { EmailSmtpSettingsPanel } from '@/components/admin/settings/EmailSmtpSettingsPanel';
import {
  FooterContactEntry,
  FooterNavLink,
  defaultFooterContacts,
  defaultFooterLinks,
} from '@/lib/footerConfig';

type SettingsPayload = {
  success: boolean;
  settings: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    loginEnabled: boolean;
    emailNotifications: boolean;
    analyticsEnabled: boolean;
    rateLimitEnabled: boolean;
    maxReportsPerDay: number;
    autoModeration: boolean;
    googleAuthEnabled: boolean;
    googleClientIdSet: boolean;
    googleClientSecretSet: boolean;
    allowedDocsIps?: string | null;
    updatedAt: string;
    footerContacts: FooterContactEntry[];
    footerLinks: FooterNavLink[];
  };
  error?: string;
};

type TabKey = 'general' | 'security' | 'auth' | 'notifications' | 'api' | 'email' | 'footer';

const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'general', label: 'Chung', icon: Settings },
  { id: 'security', label: 'Bảo mật', icon: ShieldCheck },
  { id: 'auth', label: 'Xác thực', icon: UserCog },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'email', label: 'Email / SMTP', icon: Mail },
  { id: 'api', label: 'API', icon: KeyRound },
  { id: 'footer', label: 'Chân trang', icon: Globe },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-slate-900' : 'bg-slate-300'}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [maxReportsPerDay, setMaxReportsPerDay] = useState(10);
  const [autoModeration, setAutoModeration] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [allowedDocsIps, setAllowedDocsIps] = useState('');
  const [footerContacts, setFooterContacts] = useState<FooterContactEntry[]>(defaultFooterContacts);
  const [footerLinks, setFooterLinks] = useState<FooterNavLink[]>(defaultFooterLinks);

  const cloneContacts = (items: FooterContactEntry[]) => items.map((entry) => ({ ...entry }));
  const cloneLinks = (items: FooterNavLink[]) => items.map((entry) => ({ ...entry }));

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/settings', {
          cache: 'no-store',
          credentials: 'include',
        });
        const payload = (await response.json()) as SettingsPayload;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Unable to load settings');
        }

        if (!active) return;

        const data = payload.settings;
        setSiteName(data.siteName || '');
        setSiteDescription(data.siteDescription || '');
        setContactEmail(data.contactEmail || '');
        setMaintenanceMode(Boolean(data.maintenanceMode));
        setRegistrationEnabled(Boolean(data.registrationEnabled));
        setLoginEnabled(Boolean(data.loginEnabled));
        setEmailNotifications(Boolean(data.emailNotifications));
        setAnalyticsEnabled(Boolean(data.analyticsEnabled));
        setRateLimitEnabled(Boolean(data.rateLimitEnabled));
        setMaxReportsPerDay(data.maxReportsPerDay || 10);
        setAutoModeration(Boolean(data.autoModeration));
        setGoogleAuthEnabled(Boolean(data.googleAuthEnabled));
        setGoogleClientId(data.googleClientIdSet ? '••••••••••••' : '');
        setGoogleClientSecret(data.googleClientSecretSet ? '••••••••••••' : '');
        setAllowedDocsIps(data.allowedDocsIps || '');
        setFooterContacts(
          cloneContacts((data.footerContacts && data.footerContacts.length ? data.footerContacts : defaultFooterContacts))
        );
        setFooterLinks(
          cloneLinks((data.footerLinks && data.footerLinks.length ? data.footerLinks : defaultFooterLinks))
        );
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load settings');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function saveSettings(partial: Record<string, unknown>) {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(partial),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Unable to save settings');
      }

      setMessage('Settings saved successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  }

  const saveGeneral = () =>
    saveSettings({
      siteName,
      siteDescription,
      contactEmail,
      maintenanceMode,
      analyticsEnabled,
    });

  const saveSecurity = () =>
    saveSettings({
      maintenanceMode,
      rateLimitEnabled,
      maxReportsPerDay,
      autoModeration,
    });

  const saveAuth = () =>
    saveSettings({
      registrationEnabled,
      loginEnabled,
      googleAuthEnabled,
      googleClientId: googleClientId.startsWith('•') ? undefined : googleClientId,
      googleClientSecret: googleClientSecret.startsWith('•') ? undefined : googleClientSecret,
    });

  const saveNotifications = () =>
    saveSettings({
      emailNotifications,
      autoModeration,
    });

  const saveApi = () =>
    saveSettings({
      allowedDocsIps,
    });

  const updateFooterContact = (index: number, field: keyof FooterContactEntry, value: string) => {
    setFooterContacts((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry)));
  };

  const removeFooterContact = (index: number) => {
    setFooterContacts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addFooterContact = () => {
    if (footerContacts.length >= 6) return;
    setFooterContacts((prev) => [...prev, { label: '', value: '', icon: 'shield' }]);
  };

  const updateFooterLink = (index: number, field: keyof FooterNavLink, value: string) => {
    setFooterLinks((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry)));
  };

  const removeFooterLink = (index: number) => {
    setFooterLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addFooterLink = () => {
    if (footerLinks.length >= 8) return;
    setFooterLinks((prev) => [...prev, { label: '', href: '', icon: 'link' }]);
  };

  const saveFooter = () =>
    saveSettings({
      footerContacts,
      footerLinks,
    });

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Cài đặt hệ thống</h2>
          <p className="text-xs text-slate-500">Điều chỉnh hành vi điều hành mà không thay đổi logic backend.</p>
        </div>

        <div className="flex flex-col gap-0 lg:flex-row">
          <aside className="lg:w-[260px] border-b border-slate-200 lg:border-b-0 lg:border-r">
            <nav className="p-3 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="flex-1 p-5">
            {loading && <p className="text-sm text-slate-500">Đang tải cài đặt...</p>}

            {!loading && (
              <>
                {error && (
                  <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
                )}
                {message && (
                  <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {message}
                  </p>
                )}

                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tên trang web</span>
                      <input
                        value={siteName}
                        onChange={(event) => setSiteName(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mô tả trang web
                      </span>
                      <textarea
                        value={siteDescription}
                        onChange={(event) => setSiteDescription(event.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email liên hệ</span>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                      />
                    </label>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Maintenance Mode</p>
                        <p className="text-xs text-slate-500">Temporarily disable public access</p>
                      </div>
                      <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Analytics</p>
                        <p className="text-xs text-slate-500">Track dashboard usage and events</p>
                      </div>
                      <Toggle checked={analyticsEnabled} onChange={setAnalyticsEnabled} />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveGeneral}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Lưu cài đặt chung
                    </button>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Giới hạn tốc độ</p>
                        <p className="text-xs text-slate-500">Ngăn chặn lạm dụng khi đăng nhập và báo cáo</p>
                      </div>
                      <Toggle checked={rateLimitEnabled} onChange={setRateLimitEnabled} />
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Max Reports Per Day
                      </span>
                      <input
                        type="number"
                        value={maxReportsPerDay}
                        onChange={(event) => setMaxReportsPerDay(Number(event.target.value))}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                      />
                    </label>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tự động điều hành</p>
                        <p className="text-xs text-slate-500">Bật quy tắc phân loại tự động</p>
                      </div>
                      <Toggle checked={autoModeration} onChange={setAutoModeration} />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveSecurity}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Lưu cài đặt bảo mật
                    </button>
                  </div>
                )}

                {activeTab === 'auth' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Cho phép đăng ký</p>
                        <p className="text-xs text-slate-500">Bật đăng ký người dùng mới</p>
                      </div>
                      <Toggle checked={registrationEnabled} onChange={setRegistrationEnabled} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Cho phép đăng nhập</p>
                        <p className="text-xs text-slate-500">Tắt để khóa tất cả đăng nhập</p>
                      </div>
                      <Toggle checked={loginEnabled} onChange={setLoginEnabled} />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          Google OAuth
                        </p>
                        <Toggle checked={googleAuthEnabled} onChange={setGoogleAuthEnabled} />
                      </div>

                      <label className="block mt-3">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Google Client ID</span>
                        <input
                          value={googleClientId}
                          onChange={(event) => setGoogleClientId(event.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        />
                      </label>

                      <label className="block mt-3">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Google Client Secret
                        </span>
                        <input
                          type="password"
                          value={googleClientSecret}
                          onChange={(event) => setGoogleClientSecret(event.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveAuth}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Lưu cài đặt xác thực
                    </button>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Thông báo qua email</p>
                        <p className="text-xs text-slate-500">Thông báo cho quản trị viên khi có sự kiện quan trọng</p>
                      </div>
                      <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Cảnh báo tự động điều hành</p>
                        <p className="text-xs text-slate-500">Gửi tín hiệu cảnh báo nội bộ</p>
                      </div>
                      <Toggle checked={autoModeration} onChange={setAutoModeration} />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveNotifications}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Lưu cài đặt thông báo
                    </button>
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-800">IP truy cập tài liệu API</p>
                      <p className="text-xs text-slate-500">Danh sách cho phép ngăn cách bằng dấu phẩy hoặc dòng mới</p>

                      <textarea
                        value={allowedDocsIps}
                        onChange={(event) => setAllowedDocsIps(event.target.value)}
                        rows={5}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none"
                        placeholder="127.0.0.1\n203.0.113.5"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveApi}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Lưu cài đặt API
                    </button>
                  </div>
                )}

                {activeTab === 'footer' && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Liên hệ chân trang</p>
                          <p className="text-xs text-slate-500">
                            Định nghĩa biểu tượng, nhãn, giá trị và liên kết tùy chọn cho mỗi badge liên hệ.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={footerContacts.length >= 6}
                          onClick={addFooterContact}
                          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Thêm liên hệ
                        </button>
                      </div>
                      <div className="space-y-3">
                        {footerContacts.map((contact, index) => (
                          <div
                            key={`contact-${index}`}
                            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-5"
                          >
                            <label className="text-xs font-semibold text-slate-500">
                              Nhãn
                              <input
                                value={contact.label}
                                onChange={(event) => updateFooterContact(index, 'label', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="Hotline"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                              Giá trị
                              <input
                                value={contact.value}
                                onChange={(event) => updateFooterContact(index, 'value', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="1900-xxxx"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                              Biểu tượng
                              <input
                                value={contact.icon}
                                onChange={(event) => updateFooterContact(index, 'icon', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="phone"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                              Link
                              <input
                                value={contact.href || ''}
                                onChange={(event) => updateFooterContact(index, 'href', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="tel:1900xxxx"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeFooterContact(index)}
                              className="self-end text-xs font-semibold text-rose-600 hover:text-rose-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Footer Navigation</p>
                          <p className="text-xs text-slate-500">
                            Control the quick links that appear next to the brand.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={footerLinks.length >= 8}
                          onClick={addFooterLink}
                          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Add Link
                        </button>
                      </div>
                      <div className="space-y-3">
                        {footerLinks.map((link, index) => (
                          <div
                            key={`link-${index}`}
                            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-4"
                          >
                            <label className="text-xs font-semibold text-slate-500">
                              Label
                              <input
                                value={link.label}
                                onChange={(event) => updateFooterLink(index, 'label', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="Tra cứu"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                              URL
                              <input
                                value={link.href}
                                onChange={(event) => updateFooterLink(index, 'href', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="/search"
                              />
                            </label>
                            <label className="text-xs font-semibold text-slate-500">
                              Icon
                              <input
                                value={link.icon || ''}
                                onChange={(event) => updateFooterLink(index, 'icon', event.target.value)}
                                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                                placeholder="link"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeFooterLink(index)}
                              className="self-end text-xs font-semibold text-rose-600 hover:text-rose-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveFooter}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Lưu cài đặt chân trang
                    </button>
                  </div>
                )}

                {activeTab === 'email' && (
                  <EmailSmtpSettingsPanel />
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
