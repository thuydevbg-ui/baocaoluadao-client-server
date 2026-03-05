'use client';

import React, { useEffect, useState } from 'react';
import { Bell, KeyRound, Lock, Save, Settings, ShieldCheck, UserCog } from 'lucide-react';

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
  };
  error?: string;
};

type TabKey = 'general' | 'security' | 'auth' | 'notifications' | 'api';

const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'auth', label: 'Authentication', icon: UserCog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API', icon: KeyRound },
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

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">System Settings</h2>
          <p className="text-xs text-slate-500">Tune moderation behavior without changing backend logic.</p>
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
            {loading && <p className="text-sm text-slate-500">Loading settings...</p>}

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
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Site Name</span>
                      <input
                        value={siteName}
                        onChange={(event) => setSiteName(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Site Description
                      </span>
                      <textarea
                        value={siteDescription}
                        onChange={(event) => setSiteDescription(event.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Email</span>
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
                      Save General Settings
                    </button>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Rate Limiting</p>
                        <p className="text-xs text-slate-500">Prevent abuse on sign-in and reports</p>
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
                        <p className="text-sm font-medium text-slate-800">Auto Moderation</p>
                        <p className="text-xs text-slate-500">Enable automatic triage rules</p>
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
                      Save Security Settings
                    </button>
                  </div>
                )}

                {activeTab === 'auth' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Allow Registration</p>
                        <p className="text-xs text-slate-500">Enable new user sign-up</p>
                      </div>
                      <Toggle checked={registrationEnabled} onChange={setRegistrationEnabled} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Allow Login</p>
                        <p className="text-xs text-slate-500">Disable to lock all sign-ins</p>
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
                      Save Authentication Settings
                    </button>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Email Notifications</p>
                        <p className="text-xs text-slate-500">Notify admins on critical events</p>
                      </div>
                      <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Auto Moderation Alerts</p>
                        <p className="text-xs text-slate-500">Send internal warning signals</p>
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
                      Save Notification Settings
                    </button>
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-800">API Docs Access IPs</p>
                      <p className="text-xs text-slate-500">Comma or newline separated allow-list</p>

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
                      Save API Settings
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
