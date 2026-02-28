'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Mail, Key, Save, Eye, EyeOff, Lock, LogIn, BadgeCheck } from 'lucide-react';

type SettingsResponse = {
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
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showApiKey, setShowApiKey] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');

  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('vi');

  const [require2FA, setRequire2FA] = useState(true);
  const [loginLimit, setLoginLimit] = useState(true); // map to rateLimitEnabled
  const [emailNotification, setEmailNotification] = useState(true);
  const [systemAlert, setSystemAlert] = useState(false); // map to autoModeration
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxReportsPerDay, setMaxReportsPerDay] = useState(10);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const [apiKey] = useState('API_KEY_SET'); // placeholder until backend adds real key
  const [allowedDocsIps, setAllowedDocsIps] = useState('');

  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  const tabs = [
    { id: 'general', label: 'Chung', icon: Settings },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'auth', label: 'Đăng nhập', icon: LogIn },
    { id: 'api', label: 'API', icon: Key },
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings');
        const data: SettingsResponse = await res.json();
        if (!data.success) throw new Error('Không thể tải cài đặt');

        setRegistrationEnabled(data.settings.registrationEnabled);
        setLoginEnabled(data.settings.loginEnabled);
        setGoogleAuthEnabled(data.settings.googleAuthEnabled);
        setGoogleClientId(data.settings.googleClientIdSet ? '•••••••' : '');
        setGoogleClientSecret(data.settings.googleClientSecretSet ? '•••••••' : '');
        setSiteName(data.settings.siteName || '');
        setSiteDescription(data.settings.siteDescription || '');
        setContactEmail(data.settings.contactEmail || '');
        setMaintenanceMode(Boolean(data.settings.maintenanceMode));
        setLoginLimit(Boolean(data.settings.rateLimitEnabled));
        setEmailNotification(Boolean(data.settings.emailNotifications));
        setSystemAlert(Boolean(data.settings.autoModeration));
        setMaxReportsPerDay(data.settings.maxReportsPerDay || 10);
        setAnalyticsEnabled(Boolean(data.settings.analyticsEnabled));
        setAllowedDocsIps(data.settings.allowedDocsIps || '');
      } catch (e) {
        setError('Không tải được cài đặt. Hãy thử lại.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveSettings(partial: Record<string, any>) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lưu thất bại');
      }
      setMessage('Đã lưu cài đặt');
      if (data.settings) {
        setSiteName(data.settings.siteName ?? '');
        setSiteDescription(data.settings.siteDescription ?? '');
        setContactEmail(data.settings.contactEmail ?? '');
        setMaintenanceMode(Boolean(data.settings.maintenanceMode));
        setLoginLimit(Boolean(data.settings.rateLimitEnabled));
        setEmailNotification(Boolean(data.settings.emailNotifications));
        setSystemAlert(Boolean(data.settings.autoModeration));
        setMaxReportsPerDay(data.settings.maxReportsPerDay ?? 10);
        setAnalyticsEnabled(Boolean(data.settings.analyticsEnabled));
        setRegistrationEnabled(Boolean(data.settings.registrationEnabled));
        setLoginEnabled(Boolean(data.settings.loginEnabled));
        setGoogleAuthEnabled(Boolean(data.settings.googleAuthEnabled));
      }
      if (data.settings.googleClientIdSet) setGoogleClientId('•••••••');
      if (data.settings.googleClientSecretSet) setGoogleClientSecret('•••••••');
    } catch (e: any) {
      setError(e.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  }

  const handleSaveGeneral = () =>
    saveSettings({
      siteName,
      siteDescription,
      contactEmail,
      maintenanceMode,
      analyticsEnabled,
    });

  const handleSaveSecurity = () =>
    saveSettings({
      maintenanceMode,
      rateLimitEnabled: loginLimit,
      maxReportsPerDay,
      autoModeration: systemAlert,
    });

  const handleSaveAuth = () =>
    saveSettings({
      registrationEnabled,
      loginEnabled,
      googleAuthEnabled,
      googleClientId: googleClientId.startsWith('•') ? undefined : googleClientId,
      googleClientSecret: googleClientSecret.startsWith('•') ? undefined : googleClientSecret,
    });

  const handleSaveNotifications = () =>
    saveSettings({
      emailNotifications: emailNotification,
      autoModeration: systemAlert,
    });

  const handleSaveApi = () => saveSettings({}); // placeholder until backend supports API key
  const handleSaveDocs = () =>
    saveSettings({
      allowedDocsIps,
    });

  return (
    <div className='space-y-6'>
      <div><h2 className='text-2xl font-bold text-text-main'>Cài đặt hệ thống</h2><p className='text-text-muted mt-1'>Quản lý cấu hình</p></div>
      <div className='flex flex-col lg:flex-row gap-6'>
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className='lg:w-64 bg-bg-card border border-bg-border rounded-2xl p-4 shadow-sm'>
          <nav className='space-y-1'>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors '+(activeTab===t.id?'bg-primary/10 text-primary':'text-text-secondary hover:text-text-main hover:bg-bg-cardHover')}><t.icon className='w-5 h-5'/>{t.label}</button>))}</nav>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className='flex-1 bg-bg-card border border-bg-border rounded-2xl p-6 shadow-sm'>
          {loading && <p className='text-text-muted'>Đang tải cài đặt...</p>}
          {error && <p className='text-red-500 mb-3'>{error}</p>}
          {message && <p className='text-green-600 mb-3'>{message}</p>}
          {activeTab==='general'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-text-main'>Cài đặt chung</h3><div><label className='block text-sm text-text-muted mb-2'>Tên website</label><input type='text' value={siteName} onChange={(e)=>setSiteName(e.target.value)} className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted'/></div><div><label className='block text-sm text-text-muted mb-2'>Mô tả</label><textarea rows={3} value={siteDescription} onChange={(e)=>setSiteDescription(e.target.value)} className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted resize-none'/></div><div><label className='block text-sm text-text-muted mb-2'>Email liên hệ</label><input type='email' value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted'/></div><div><label className='block text-sm text-text-muted mb-2'>Ngôn ngữ mặc định</label><select value={defaultLanguage} onChange={(e)=>setDefaultLanguage(e.target.value)} className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main'><option value='vi'>Tiếng Việt</option><option value='en'>English</option></select></div><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Chế độ bảo trì</p><p className='text-sm text-text-muted'>Tắt toàn bộ truy cập công khai.</p></div><button onClick={()=>setMaintenanceMode(!maintenanceMode)} className={'w-12 h-6 rounded-full relative transition-colors ' + (maintenanceMode ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (maintenanceMode ? 'right-1' : 'left-1')}/></button></div><div className='mt-4 pt-4 border-t border-bg-border'><button onClick={handleSaveGeneral} disabled={saving} className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-60'><Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></div>)}
          {activeTab==='security'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-text-main'>Cài đặt bảo mật</h3><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Bắt buộc 2FA (placeholder)</p><p className='text-sm text-text-muted'>Tùy chọn sẽ được kết nối khi có module 2FA.</p></div><button onClick={()=>setRequire2FA(!require2FA)} className={'w-12 h-6 rounded-full relative transition-colors ' + (require2FA ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (require2FA ? 'right-1' : 'left-1')}/></button></div><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Giới hạn đăng nhập</p><p className='text-sm text-text-muted'>Khóa sau nhiều lần thất bại (rate limit).</p></div><button onClick={()=>setLoginLimit(!loginLimit)} className={'w-12 h-6 rounded-full relative transition-colors ' + (loginLimit ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (loginLimit ? 'right-1' : 'left-1')}/></button></div><div><label className='block text-sm text-text-muted mb-2'>Giới hạn báo cáo/ngày</label><input type='number' value={maxReportsPerDay} onChange={(e)=>setMaxReportsPerDay(Number(e.target.value))} className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted'/></div><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Theo dõi phân tích</p><p className='text-sm text-text-muted'>Bật tắt analytics nội bộ.</p></div><button onClick={()=>setAnalyticsEnabled(!analyticsEnabled)} className={'w-12 h-6 rounded-full relative transition-colors ' + (analyticsEnabled ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (analyticsEnabled ? 'right-1' : 'left-1')}/></button></div><div className='mt-4 pt-4 border-t border-bg-border'><button onClick={handleSaveSecurity} disabled={saving} className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-60'><Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu cài đặt bảo mật'}</button></div></div>)}
          {activeTab==='auth'&&(
            <div className='space-y-6'>
              <h3 className='text-lg font-semibold text-text-main'>Đăng ký / Đăng nhập</h3>

              <div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'>
                <div>
                  <p className='text-text-main font-medium flex items-center gap-2'><Lock className='w-4 h-4'/>Bật đăng ký người dùng</p>
                  <p className='text-sm text-text-muted'>Cho phép người dùng mới tạo tài khoản.</p>
                </div>
                <button onClick={()=>setRegistrationEnabled(!registrationEnabled)} className={'w-12 h-6 rounded-full relative transition-colors ' + (registrationEnabled ? 'bg-blue-600' : 'bg-gray-300')}>
                  <span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (registrationEnabled ? 'right-1' : 'left-1')}/>
                </button>
              </div>

              <div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'>
                <div>
                  <p className='text-text-main font-medium flex items-center gap-2'><LogIn className='w-4 h-4'/>Bật đăng nhập</p>
                  <p className='text-sm text-text-muted'>Tắt để khóa toàn bộ đăng nhập (credentials & Google).</p>
                </div>
                <button onClick={()=>setLoginEnabled(!loginEnabled)} className={'w-12 h-6 rounded-full relative transition-colors ' + (loginEnabled ? 'bg-blue-600' : 'bg-gray-300')}>
                  <span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (loginEnabled ? 'right-1' : 'left-1')}/>
                </button>
              </div>

              <div className='space-y-4 p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-text-main font-medium flex items-center gap-2'><BadgeCheck className='w-4 h-4'/>Google OAuth</p>
                    <p className='text-sm text-text-muted'>Cho phép đăng nhập bằng Google.</p>
                  </div>
                  <button onClick={()=>setGoogleAuthEnabled(!googleAuthEnabled)} className={'w-12 h-6 rounded-full relative transition-colors ' + (googleAuthEnabled ? 'bg-blue-600' : 'bg-gray-300')}>
                    <span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (googleAuthEnabled ? 'right-1' : 'left-1')}/>
                  </button>
                </div>
                <div>
                  <label className='block text-sm text-text-muted mb-2'>Google Client ID</label>
                  <input
                    type='text'
                    value={googleClientId}
                    onChange={(e)=>setGoogleClientId(e.target.value)}
                    placeholder='xxxx.apps.googleusercontent.com'
                    className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted'
                  />
                </div>
                <div>
                  <label className='block text-sm text-text-muted mb-2'>Google Client Secret</label>
                  <input
                    type='password'
                    value={googleClientSecret}
                    onChange={(e)=>setGoogleClientSecret(e.target.value)}
                    placeholder='********'
                    className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted'
                  />
                </div>
                <p className='text-xs text-text-secondary'>Lưu để áp dụng cho luồng đăng nhập Google (cần cả biến môi trường máy chủ).</p>
              </div>

              <div className='pt-2 border-t border-bg-border'>
                <button
                  onClick={handleSaveAuth}
                  disabled={saving}
                  className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-60'
                >
                  <Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu cài đặt đăng nhập'}
                </button>
              </div>
            </div>
          )}
          {activeTab==='email'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-text-main'>Cài đặt SMTP</h3><p className='text-sm text-text-muted'>Hiện tại chỉ lưu cờ thông báo, chưa cấu hình SMTP trong backend.</p><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Email thông báo</p><p className='text-sm text-text-muted'>Gửi email khi có báo cáo mới</p></div><button onClick={()=>setEmailNotification(!emailNotification)} className={'w-12 h-6 rounded-full relative transition-colors ' + (emailNotification ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (emailNotification ? 'right-1' : 'left-1')}/></button></div><div className='mt-4 pt-4 border-t border-bg-border'><button onClick={handleSaveNotifications} disabled={saving} className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-60'><Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu cài đặt thông báo'}</button></div></div>)}
          {activeTab==='notifications'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-text-main'>Cài đặt thông báo</h3><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Email thông báo</p><p className='text-sm text-text-muted'>Gửi email khi có báo cáo mới</p></div><button onClick={()=>setEmailNotification(!emailNotification)} className={'w-12 h-6 rounded-full relative transition-colors ' + (emailNotification ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (emailNotification ? 'right-1' : 'left-1')}/></button></div><div className='flex items-center justify-between p-4 bg-bg-card border border-bg-border rounded-xl shadow-sm'><div><p className='text-text-main font-medium'>Cảnh báo hệ thống</p><p className='text-sm text-text-muted'>Thông báo khi có vấn đề</p></div><button onClick={()=>setSystemAlert(!systemAlert)} className={'w-12 h-6 rounded-full relative transition-colors ' + (systemAlert ? 'bg-blue-600' : 'bg-gray-300')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (systemAlert ? 'right-1' : 'left-1')}/></button></div><div className='mt-4 pt-4 border-t border-bg-border'><button onClick={handleSaveNotifications} disabled={saving} className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-60'><Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu cài đặt thông báo'}</button></div></div>)}
          {activeTab==='api'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-text-main'>Cài đặt API</h3><p className='text-sm text-text-muted'>Hiện backend chưa sinh API key, sẽ lưu khi có endpoint.</p><div><label className='block text-sm text-text-muted mb-2'>API Key</label><div className='flex gap-2'><div className='flex-1 px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main font-mono'>{showApiKey ? apiKey : '••••••••••••••••••••'}</div><button onClick={()=>setShowApiKey(!showApiKey)} className='p-2.5 bg-bg-card border border-bg-border rounded-xl text-text-secondary hover:text-text-main'>{showApiKey?<EyeOff className='w-5 h-5'/>:<Eye className='w-5 h-5'/>}</button></div><p className='text-xs text-text-secondary mt-2'>Liên hệ quản trị viên để cập nhật API key</p></div><div><label className='block text-sm text-text-muted mb-2'>Danh sách IP được phép xem API Docs (mỗi dòng hoặc dấu phẩy)</label><textarea value={allowedDocsIps} onChange={e=>setAllowedDocsIps(e.target.value)} rows={3} className='w-full px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted resize-none' placeholder='127.0.0.1\n203.0.113.5'/></div><div className='mt-4 pt-4 border-t border-bg-border flex flex-wrap gap-3'><button onClick={handleSaveApi} disabled={saving} className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-60'><Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu cài đặt API'}</button><button onClick={handleSaveDocs} disabled={saving} className='flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-60'><Save className='w-4 h-4'/>{saving ? 'Đang lưu...' : 'Lưu IP Docs'}</button></div></div>)}
        </motion.div>
      </div>
    </div>
  );
}
