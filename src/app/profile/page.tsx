'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  createdAt: string;
  lastActive?: string | null;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  reportUpdates: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  trustedDevices: number;
  passwordSet?: boolean;
}

interface Activity {
  id: string;
  type: 'login' | 'report' | 'search' | 'update' | 'security' | string;
  description: string;
  timestamp: string;
  device?: string;
  ip?: string;
}

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  lastActive: string;
  current: boolean;
}

interface UserPreferences {
  language: string;
  timezone: string;
  theme: string;
}

interface ApiError extends Error {
  status?: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
  theme: 'system',
};

function formatRelativeTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Vừa xong';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error('Unauthorized') as ApiError;
    err.status = 401;
    throw err;
  }
  if (!res.ok || data?.success === false) {
    const err = new Error(data?.error || 'Request failed') as ApiError;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

function normalizeNotificationSettings(raw: any): NotificationSettings {
  return {
    email: Boolean(raw?.email ?? raw?.emailAlerts ?? false),
    push: Boolean(raw?.push ?? raw?.pushAlerts ?? false),
    sms: Boolean(raw?.sms ?? false),
    reportUpdates: Boolean(raw?.reportUpdates ?? false),
    weeklyDigest: Boolean(raw?.weeklyDigest ?? raw?.weeklySummary ?? false),
    securityAlerts: Boolean(raw?.securityAlerts ?? false),
  };
}

// Icons as components
const Icons = {
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Palette: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Device: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-4 right-4 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}
    >
      <Icons.Check />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <Icons.X />
      </button>
    </motion.div>
  );
}

// Tab Navigation
function TabNav({ tabs, activeTab, onTabChange }: { tabs: { id: string; label: string; icon: ReactNode }[]; activeTab: string; onTabChange: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-1 w-64 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
            activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          {tab.icon}
          <span className="font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// Personal Info Tab
function PersonalInfoTab({
  user,
  onSave,
  onAvatarChange,
}: {
  user: UserProfile;
  onSave: (data: { name: string; phone: string }) => Promise<void>;
  onAvatarChange: (file: File) => Promise<void>;
}) {
  const [formData, setFormData] = useState({ name: user.name, phone: user.phone });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData({ name: user.name, phone: user.phone });
  }, [user.name, user.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch {
      // errors are surfaced via toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onAvatarChange(file);
    } catch {
      // errors are surfaced via toast
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Icons.Edit />
          <span>{isEditing ? 'Hủy' : 'Chỉnh sửa'}</span>
        </button>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.charAt(0)}</span>
            )}
          </div>
          <button
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-60"
            disabled={isUploading}
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{user.name}</h3>
          <p className="text-slate-500">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
            {user.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Họ và tên</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing || isSaving}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Số điện thoại</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing || isSaving}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Ngày tham gia</label>
            <input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString('vi-VN')}
              disabled
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// Appearance Tab
function AppearanceTab({ theme, onThemeChange }: { theme: string; onThemeChange: (theme: string) => Promise<void> }) {
  const themes = [
    { id: 'light', name: 'Sáng', description: 'Giao diện màu sáng' },
    { id: 'dark', name: 'Tối', description: 'Giao diện màu tối' },
    { id: 'system', name: 'Hệ thống', description: 'Theo cài đặt thiết bị' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Giao diện</h2>

      <div className="space-y-4">
        {themes.map((t) => (
          <label
            key={t.id}
            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
              theme === t.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="theme"
                value={t.id}
                checked={theme === t.id}
                onChange={() => onThemeChange(t.id)}
                className="w-5 h-5 text-blue-600"
              />
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-slate-500">{t.description}</p>
              </div>
            </div>
            {theme === t.id && <Icons.Check />}
          </label>
        ))}
      </div>
    </div>
  );
}

// Notifications Tab
function NotificationsTab({ settings, onSave }: { settings: NotificationSettings; onSave: (settings: NotificationSettings) => Promise<void> }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingKey, setSavingKey] = useState<keyof NotificationSettings | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    const previous = localSettings;
    setLocalSettings(updated);
    setSavingKey(key);
    try {
      await onSave(updated);
    } catch {
      setLocalSettings(previous);
    } finally {
      setSavingKey(null);
    }
  };

  const notificationTypes = [
    { key: 'email', label: 'Email', description: 'Nhận thông báo qua email' },
    { key: 'push', label: 'Push', description: 'Nhận thông báo đẩy trên trình duyệt' },
    { key: 'sms', label: 'SMS', description: 'Nhận thông báo qua tin nhắn SMS' },
    { key: 'reportUpdates', label: 'Cập nhật báo cáo', description: 'Thông báo khi báo cáo của bạn được cập nhật' },
    { key: 'weeklyDigest', label: 'Tóm tắt hàng tuần', description: 'Nhận tóm tắt hoạt động hàng tuần' },
    { key: 'securityAlerts', label: 'Cảnh báo bảo mật', description: 'Thông báo về các hoạt động bảo mật' },
  ] as const;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Cài đặt thông báo</h2>

      <div className="space-y-4">
        {notificationTypes.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings[item.key]
                  ? 'bg-blue-600'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
              disabled={savingKey === item.key}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  localSettings[item.key] ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Security Tab
function SecurityTab({
  settings,
  onTwoFactorSetup,
  onTwoFactorConfirm,
  onTwoFactorDisable,
  onTwoFactorBackup,
  onLoginAlertsChange,
  onChangePassword,
}: {
  settings: SecuritySettings;
  onTwoFactorSetup: (password: string) => Promise<{ otpauthUrl: string; backupCodes: string[] }>;
  onTwoFactorConfirm: (code: string, password: string) => Promise<void>;
  onTwoFactorDisable: (password: string) => Promise<void>;
  onTwoFactorBackup: (password: string) => Promise<string[]>;
  onLoginAlertsChange: (enabled: boolean) => Promise<void>;
  onChangePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState<'twofa' | 'login' | 'password' | null>(null);
  const [twofaModalOpen, setTwofaModalOpen] = useState(false);
  const [twofaPassword, setTwofaPassword] = useState('');
  const [twofaCode, setTwofaCode] = useState('');
  const [twofaData, setTwofaData] = useState<{ otpauthUrl: string; backupCodes: string[] } | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState<'setup' | 'disable' | 'backup' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const openPasswordModal = (action: 'setup' | 'disable' | 'backup') => {
    setPasswordModalAction(action);
    setPasswordInput('');
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPasswordModalAction(null);
  };

  const runTwoFactorAction = async (action: 'setup' | 'disable' | 'backup', password: string) => {
    if (action === 'setup') {
      const data = await onTwoFactorSetup(password);
      setTwofaPassword(password);
      setTwofaData({ otpauthUrl: data.otpauthUrl, backupCodes: data.backupCodes });
      setTwofaCode('');
      setTwofaModalOpen(true);
      return;
    }
    if (action === 'disable') {
      await onTwoFactorDisable(password);
      return;
    }
    const codes = await onTwoFactorBackup(password);
    setBackupCodes(codes);
    setBackupModalOpen(true);
  };

  const handlePasswordConfirm = async () => {
    if (!passwordModalAction) return;
    setSaving('twofa');
    try {
      await runTwoFactorAction(passwordModalAction, passwordInput);
      closePasswordModal();
    } catch {
      // errors handled by toast in parent
    } finally {
      setSaving(null);
    }
  };

  const startTwoFactorSetup = async () => {
    if (settings.passwordSet) {
      openPasswordModal('setup');
      return;
    }
    setSaving('twofa');
    try {
      await runTwoFactorAction('setup', '');
    } catch {
      // errors handled by toast in parent
    } finally {
      setSaving(null);
    }
  };

  const startTwoFactorDisable = async () => {
    if (settings.passwordSet) {
      openPasswordModal('disable');
      return;
    }
    setSaving('twofa');
    try {
      await runTwoFactorAction('disable', '');
    } catch {
      // errors handled by toast in parent
    } finally {
      setSaving(null);
    }
  };

  const startShowBackupCodes = async () => {
    if (settings.passwordSet) {
      openPasswordModal('backup');
      return;
    }
    setSaving('twofa');
    try {
      await runTwoFactorAction('backup', '');
    } catch {
      // errors handled by toast in parent
    } finally {
      setSaving(null);
    }
  };

  const handleTwoFactorConfirm = async () => {
    setSaving('twofa');
    try {
      await onTwoFactorConfirm(twofaCode, twofaPassword);
      setTwofaModalOpen(false);
      setTwofaPassword('');
      setTwofaData(null);
      setTwofaCode('');
    } catch {
      // errors handled by toast in parent
    } finally {
      setSaving(null);
    }
  };

  const toggleLoginAlerts = async () => {
    const nextValue = !localSettings.loginAlerts;
    const previous = localSettings.loginAlerts;
    setLocalSettings({ ...localSettings, loginAlerts: nextValue });
    setSaving('login');
    try {
      await onLoginAlertsChange(nextValue);
    } catch {
      setLocalSettings({ ...localSettings, loginAlerts: previous });
    } finally {
      setSaving(null);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('password');
    try {
      await onChangePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
        confirmPassword: passwords.confirm,
      });
      setPasswords({ current: '', next: '', confirm: '' });
    } catch {
      // errors are surfaced via toast
    } finally {
      setSaving(null);
    }
  };

  const copyBackupCodes = async () => {
    if (!twofaData?.backupCodes?.length) return;
    const text = twofaData.backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
  };

  const passwordModalTitle =
    passwordModalAction === 'disable'
      ? 'Xác nhận tắt 2FA'
      : passwordModalAction === 'backup'
      ? 'Xác nhận xem backup codes'
      : 'Xác nhận bật 2FA';

  const passwordModalDescription =
    passwordModalAction === 'disable'
      ? 'Nhập mật khẩu để tắt xác thực 2FA.'
      : passwordModalAction === 'backup'
      ? 'Nhập mật khẩu để xem backup codes.'
      : 'Nhập mật khẩu để tạo mã QR 2FA.';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Bảo mật</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                <Icons.Shield />
              </div>
              <div>
                <p className="font-medium">Xác thực hai yếu tố (2FA)</p>
                <p className="text-sm text-slate-500">Bảo vệ tài khoản bằng mã OTP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${localSettings.twoFactorEnabled ? 'text-green-600' : 'text-slate-500'}`}>
                {localSettings.twoFactorEnabled ? 'Đang bật' : 'Chưa bật'}
              </span>
              {localSettings.twoFactorEnabled ? (
                <button
                  onClick={startTwoFactorDisable}
                  className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                  disabled={saving === 'twofa'}
                >
                  Tắt 2FA
                </button>
              ) : (
                <button
                  onClick={startTwoFactorSetup}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  disabled={saving === 'twofa'}
                >
                  Thiết lập
                </button>
              )}
            </div>
          </div>

          {localSettings.twoFactorEnabled && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600">
                  <Icons.Check />
                </div>
                <div>
                  <p className="font-medium">Backup codes</p>
                  <p className="text-sm text-slate-500">Dùng để đăng nhập khi mất OTP</p>
                </div>
              </div>
              <button
                onClick={startShowBackupCodes}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                disabled={saving === 'twofa'}
              >
                Xem backup codes
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                <Icons.Bell />
              </div>
              <div>
                <p className="font-medium">Cảnh báo đăng nhập</p>
                <p className="text-sm text-slate-500">Nhận thông báo khi có đăng nhập mới</p>
              </div>
            </div>
            <button
              onClick={toggleLoginAlerts}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.loginAlerts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              disabled={saving === 'login'}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  localSettings.loginAlerts ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Đổi mật khẩu</h2>

        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <div>
            <label className="block text-sm font-medium mb-2">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              placeholder="Nhập mật khẩu hiện tại"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              disabled={saving === 'password'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              placeholder="Nhập mật khẩu mới"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              disabled={saving === 'password'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              placeholder="Xác nhận mật khẩu mới"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              disabled={saving === 'password'}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            disabled={saving === 'password'}
          >
            {saving === 'password' ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {twofaModalOpen && twofaData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Xác nhận bật 2FA</h3>
                <button
                  onClick={() => setTwofaModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  disabled={saving === 'twofa'}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <QRCodeCanvas value={twofaData.otpauthUrl} size={180} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-2">Quét mã QR bằng Google Authenticator hoặc Authy.</p>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Backup codes</span>
                        <button
                          onClick={copyBackupCodes}
                          className="text-xs text-blue-600 hover:underline"
                          type="button"
                        >
                          Sao chép
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {twofaData.backupCodes.map((code) => (
                          <span key={code} className="bg-white dark:bg-slate-800 rounded-md px-2 py-1 border border-slate-200">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mã xác thực (OTP)</label>
                  <input
                    type="text"
                    value={twofaCode}
                    onChange={(e) => setTwofaCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="Nhập 6 chữ số"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setTwofaModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                    type="button"
                    disabled={saving === 'twofa'}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleTwoFactorConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    disabled={saving === 'twofa'}
                  >
                    {saving === 'twofa' ? 'Đang xác nhận...' : 'Xác nhận bật 2FA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {backupModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Backup codes</h3>
                <button
                  onClick={() => setBackupModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Icons.X />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Sao lưu các mã này để dùng khi mất OTP.</span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(backupCodes.join('\n'));
                      } catch {
                        // ignore clipboard errors
                      }
                    }}
                    className="text-xs text-blue-600 hover:underline"
                    type="button"
                  >
                    Sao chép
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {backupCodes.map((code) => (
                    <span key={code} className="bg-white dark:bg-slate-800 rounded-md px-2 py-1 border border-slate-200">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {passwordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{passwordModalTitle}</h3>
                <button
                  onClick={closePasswordModal}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  disabled={saving === 'twofa'}
                >
                  <Icons.X />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">{passwordModalDescription}</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="Nhập mật khẩu tài khoản"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                  type="button"
                  disabled={saving === 'twofa'}
                >
                  Hủy
                </button>
                <button
                  onClick={handlePasswordConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  disabled={saving === 'twofa'}
                >
                  {saving === 'twofa' ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Language Tab
function LanguageTab({
  language,
  timezone,
  onSave,
}: {
  language: string;
  timezone: string;
  onSave: (data: { language: string; timezone: string }) => Promise<void>;
}) {
  const [localLanguage, setLocalLanguage] = useState(language);
  const [localTimezone, setLocalTimezone] = useState(timezone);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalLanguage(language);
    setLocalTimezone(timezone);
  }, [language, timezone]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ language: localLanguage, timezone: localTimezone });
    } catch {
      // errors are surfaced via toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Ngôn ngữ và múi giờ</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Ngôn ngữ</label>
          <select
            value={localLanguage}
            onChange={(e) => setLocalLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Múi giờ</label>
          <select
            value={localTimezone}
            onChange={(e) => setLocalTimezone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
            <option value="Asia/Bangkok">Thái Lan (GMT+7)</option>
            <option value="Asia/Singapore">Singapore (GMT+8)</option>
            <option value="Asia/Tokyo">Nhật Bản (GMT+9)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}

// Devices Tab
function DevicesTab({ devices, onRevoke }: { devices: Device[]; onRevoke: (id: string) => Promise<void> }) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await onRevoke(id);
    } catch {
      // errors are surfaced via toast
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Thiết bị đã đăng nhập</h2>

      {devices.length === 0 && (
        <div className="text-sm text-slate-500">Chưa có thiết bị nào được ghi nhận.</div>
      )}

      <div className="space-y-4">
        {devices.map((device) => (
          <div key={device.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <Icons.Device />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{device.name}</p>
                  {device.current && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs rounded-full">
                      Hiện tại
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{device.browser} • {device.lastActive}</p>
              </div>
            </div>
            {!device.current && (
              <button
                onClick={() => handleRevoke(device.id)}
                className="text-red-500 hover:text-red-600 text-sm disabled:opacity-60"
                disabled={revokingId === device.id}
              >
                {revokingId === device.id ? 'Đang thu hồi...' : 'Thu hồi'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Tab
function ActivityTab({ activities }: { activities: Activity[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Icons.User />;
      case 'report':
        return <Icons.Edit />;
      case 'search':
        return <Icons.Globe />;
      case 'security':
        return <Icons.Shield />;
      default:
        return <Icons.Clock />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Lịch sử hoạt động</h2>

      {activities.length === 0 && (
        <div className="text-sm text-slate-500">Chưa có hoạt động nào.</div>
      )}

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{activity.description}</p>
              <div className="flex gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                <span>{activity.device || 'Thiết bị không rõ'}</span>
                <span>•</span>
                <span>{activity.ip || '—'}</span>
                <span>•</span>
                <span>{activity.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Profile Page
export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    reportUpdates: true,
    weeklyDigest: true,
    securityAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    trustedDevices: 0,
    passwordSet: false,
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  const applyTheme = useCallback((theme: string) => {
    if (typeof document === 'undefined') return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const tasks = [
      apiFetch<any>('/api/user/profile'),
      apiFetch<any>('/api/user/notifications'),
      apiFetch<any>('/api/user/security-status'),
      apiFetch<any>('/api/user/preferences'),
      apiFetch<any>('/api/user/devices'),
      apiFetch<any>('/api/user/activity'),
    ];

    const results = await Promise.allSettled(tasks);
    const unauthorized = results.some(
      (res) => res.status === 'rejected' && (res.reason as ApiError)?.status === 401
    );
    if (unauthorized) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const profileResult = results[0];
    if (profileResult.status === 'fulfilled') {
      const profile = profileResult.value?.user;
      setUser({
        id: profile?.id || '',
        name: profile?.name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        avatar: profile?.avatar || profile?.image || undefined,
        role: profile?.role || 'user',
        createdAt: profile?.createdAt || new Date().toISOString(),
        lastActive: profile?.lastActive || null,
      });
    } else {
      setLoadError('Không thể tải thông tin tài khoản.');
    }

    const notificationsResult = results[1];
    if (notificationsResult.status === 'fulfilled') {
      const normalized = normalizeNotificationSettings(notificationsResult.value?.settings);
      setNotificationSettings(normalized);
      setSecuritySettings((prev) => ({ ...prev, loginAlerts: normalized.securityAlerts }));
    }

    const securityResult = results[2];
    if (securityResult.status === 'fulfilled') {
      const security = securityResult.value?.security;
      setSecuritySettings((prev) => ({
        ...prev,
        twoFactorEnabled: Boolean(security?.twoFactorEnabled),
        passwordSet: Boolean(security?.passwordSet),
      }));
    }

    const preferencesResult = results[3];
    if (preferencesResult.status === 'fulfilled') {
      const prefs = preferencesResult.value?.preferences;
      const theme = prefs?.theme || DEFAULT_PREFERENCES.theme;
      setPreferences({
        language: prefs?.language || DEFAULT_PREFERENCES.language,
        timezone: prefs?.timezone || DEFAULT_PREFERENCES.timezone,
        theme,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
      applyTheme(theme);
    } else if (typeof window !== 'undefined') {
      const localTheme = localStorage.getItem('theme') || DEFAULT_PREFERENCES.theme;
      setPreferences({ ...DEFAULT_PREFERENCES, theme: localTheme });
      applyTheme(localTheme);
    }

    const devicesResult = results[4];
    if (devicesResult.status === 'fulfilled') {
      const items = devicesResult.value?.devices || [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        browser: item.browser || item.name,
        lastActive: formatRelativeTime(item.lastActiveAt),
        current: Boolean(item.current),
      }));
      setDevices(mapped);
      setSecuritySettings((prev) => ({ ...prev, trustedDevices: mapped.length }));
    }

    const activityResult = results[5];
    if (activityResult.status === 'fulfilled') {
      const items = activityResult.value?.items || [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        timestamp: formatRelativeTime(item.createdAt),
        device: item.device || null,
        ip: item.ip || null,
      }));
      setActivities(mapped);
    }

    setLoading(false);
  }, [applyTheme, router]);

  useEffect(() => {
    if (!mounted) return;
    loadData().catch(() => {
      setLoadError('Không thể tải thông tin tài khoản.');
      setLoading(false);
    });
  }, [mounted, loadData]);

  const handleProfileSave = async (data: { name: string; phone: string }) => {
    try {
      const res = await apiFetch<any>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: data.name, phone: data.phone }),
      });
      const updated = res?.user || {};
      setUser((prev) => (prev ? { ...prev, name: updated.name || prev.name, phone: updated.phone || '' } : prev));
      showToast('Cập nhật thông tin thành công!', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể cập nhật thông tin', 'error');
      throw error;
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc tệp'));
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await apiFetch<any>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ avatar: dataUrl }),
      });
      const updated = res?.user || {};
      setUser((prev) => (prev ? { ...prev, avatar: updated.avatar || updated.image || prev.avatar } : prev));
      showToast('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể cập nhật ảnh đại diện', 'error');
      throw error;
    }
  };

  const handleNotificationsSave = async (settings: NotificationSettings) => {
    try {
      const res = await apiFetch<any>('/api/user/notifications', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      const normalized = normalizeNotificationSettings(res?.settings || settings);
      setNotificationSettings(normalized);
      setSecuritySettings((prev) => ({ ...prev, loginAlerts: normalized.securityAlerts }));
      showToast('Cập nhật cài đặt thông báo thành công!', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể cập nhật cài đặt thông báo', 'error');
      throw error;
    }
  };

  const handleTwoFactorSetup = async (password: string) => {
    try {
      const res = await apiFetch<any>('/api/user/security/twofa/setup', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      showToast('Đã tạo mã 2FA, vui lòng xác nhận', 'info');
      return { otpauthUrl: res?.otpauthUrl, backupCodes: res?.backupCodes || [] };
    } catch (error: any) {
      showToast(error?.message || 'Không thể tạo mã 2FA', 'error');
      throw error;
    }
  };

  const handleTwoFactorConfirm = async (code: string, password: string) => {
    try {
      await apiFetch<any>('/api/user/security/twofa/confirm', {
        method: 'POST',
        body: JSON.stringify({ code, password }),
      });
      setSecuritySettings((prev) => ({ ...prev, twoFactorEnabled: true }));
      showToast('Đã bật 2FA thành công', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể xác nhận 2FA', 'error');
      throw error;
    }
  };

  const handleTwoFactorDisable = async (password: string) => {
    try {
      await apiFetch<any>('/api/user/security/twofa/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setSecuritySettings((prev) => ({ ...prev, twoFactorEnabled: false }));
      showToast('Đã tắt 2FA', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể tắt 2FA', 'error');
      throw error;
    }
  };

  const handleTwoFactorBackup = async (password: string) => {
    try {
      const res = await apiFetch<any>('/api/user/security/twofa/backup', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      return res?.backupCodes || [];
    } catch (error: any) {
      showToast(error?.message || 'Không thể lấy backup codes', 'error');
      throw error;
    }
  };

  const handleLoginAlertsChange = async (enabled: boolean) => {
    const updated = { ...notificationSettings, securityAlerts: enabled };
    await handleNotificationsSave(updated);
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      throw new Error('Password mismatch');
    }
    try {
      await apiFetch<any>('/api/user/security/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      showToast('Đổi mật khẩu thành công!', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể đổi mật khẩu', 'error');
      throw error;
    }
  };

  const handlePreferencesSave = async (data: { language: string; timezone: string }) => {
    const previous = preferences;
    setPreferences((prev) => ({ ...prev, ...data }));
    try {
      const res = await apiFetch<any>('/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ language: data.language, timezone: data.timezone }),
      });
      const prefs = res?.preferences || data;
      setPreferences((prev) => ({ ...prev, ...prefs }));
      showToast('Cập nhật ngôn ngữ và múi giờ thành công!', 'success');
    } catch (error: any) {
      setPreferences(previous);
      showToast(error?.message || 'Không thể cập nhật ngôn ngữ và múi giờ', 'error');
      throw error;
    }
  };

  const handleThemeChange = async (theme: string) => {
    const previous = preferences.theme;
    setPreferences((prev) => ({ ...prev, theme }));
    applyTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    try {
      const res = await apiFetch<any>('/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ theme }),
      });
      const prefs = res?.preferences || {};
      if (prefs?.theme) {
        setPreferences((prev) => ({ ...prev, theme: prefs.theme }));
      }
      showToast('Đã lưu giao diện', 'success');
    } catch (error: any) {
      setPreferences((prev) => ({ ...prev, theme: previous }));
      applyTheme(previous);
      showToast(error?.message || 'Không thể lưu giao diện', 'error');
      throw error;
    }
  };

  const handleRevokeDevice = async (id: string) => {
    try {
      await apiFetch<any>(`/api/user/devices/${id}`, { method: 'DELETE' });
      setDevices((prev) => prev.filter((device) => device.id !== id));
      setSecuritySettings((prev) => ({ ...prev, trustedDevices: Math.max(prev.trustedDevices - 1, 0) }));
      showToast('Đã thu hồi quyền truy cập thiết bị!', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể thu hồi thiết bị', 'error');
      throw error;
    }
  };

  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: <Icons.User /> },
    { id: 'appearance', label: 'Giao diện', icon: <Icons.Palette /> },
    { id: 'notifications', label: 'Thông báo', icon: <Icons.Bell /> },
    { id: 'security', label: 'Bảo mật', icon: <Icons.Shield /> },
    { id: 'language', label: 'Ngôn ngữ & Múi giờ', icon: <Icons.Globe /> },
    { id: 'devices', label: 'Thiết bị', icon: <Icons.Device /> },
    { id: 'activity', label: 'Lịch sử hoạt động', icon: <Icons.Clock /> },
  ];

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
          <p className="text-slate-700 dark:text-slate-200">{loadError || 'Không thể tải dữ liệu.'}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 md:p-8">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
          <p className="text-slate-500 mt-1">Quản lý thông tin và cài đặt tài khoản của bạn</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'personal' && (
                  <PersonalInfoTab
                    user={user}
                    onSave={handleProfileSave}
                    onAvatarChange={handleAvatarChange}
                  />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceTab theme={preferences.theme} onThemeChange={handleThemeChange} />
                )}
                {activeTab === 'notifications' && (
                  <NotificationsTab
                    settings={notificationSettings}
                    onSave={handleNotificationsSave}
                  />
                )}
                {activeTab === 'security' && (
                  <SecurityTab
                    settings={securitySettings}
                    onTwoFactorSetup={handleTwoFactorSetup}
                    onTwoFactorConfirm={handleTwoFactorConfirm}
                    onTwoFactorDisable={handleTwoFactorDisable}
                    onTwoFactorBackup={handleTwoFactorBackup}
                    onLoginAlertsChange={handleLoginAlertsChange}
                    onChangePassword={handleChangePassword}
                  />
                )}
                {activeTab === 'language' && (
                  <LanguageTab
                    language={preferences.language}
                    timezone={preferences.timezone}
                    onSave={handlePreferencesSave}
                  />
                )}
                {activeTab === 'devices' && (
                  <DevicesTab
                    devices={devices}
                    onRevoke={handleRevokeDevice}
                  />
                )}
                {activeTab === 'activity' && <ActivityTab activities={activities} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
