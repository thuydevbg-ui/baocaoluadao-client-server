'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Globe, Mail, Key, Save, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [require2FA, setRequire2FA] = useState(true);
  const [loginLimit, setLoginLimit] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  const [systemAlert, setSystemAlert] = useState(false);
  const tabs = [
    { id: 'general', label: 'Chung', icon: Settings },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'api', label: 'API', icon: Key },
  ];

  return (
    <div className='space-y-6'>
      <div><h2 className='text-2xl font-bold text-white'>Cài đặt hệ thống</h2><p className='text-gray-400 mt-1'>Quản lý cấu hình</p></div>
      <div className='flex flex-col lg:flex-row gap-6'>
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className='lg:w-64 bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>
          <nav className='space-y-1'>{tabs.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors '+(activeTab===t.id?'bg-blue-600/20 text-blue-400':'text-gray-400 hover:text-white hover:bg-gray-800')}><t.icon className='w-5 h-5'/>{t.label}</button>))}</nav>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className='flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6'>
          {activeTab==='general'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-white'>Cài đặt chung</h3><div><label className='block text-sm text-gray-400 mb-2'>Tên website</label><input type='text' defaultValue='ScamGuard' className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div><div><label className='block text-sm text-gray-400 mb-2'>Mô tả</label><textarea rows={3} defaultValue='Nền tảng báo cáo lừa đảo trực tuyến' className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white resize-none'/></div><div><label className='block text-sm text-gray-400 mb-2'>Ngôn ngữ mặc định</label><select className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'><option>Tiếng Việt</option><option>English</option></select></div></div>)}
          {activeTab==='security'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-white'>Cài đặt bảo mật</h3><div className='flex items-center justify-between p-4 bg-gray-800/50 rounded-xl'><div><p className='text-white font-medium'>Bắt buộc 2FA</p><p className='text-sm text-gray-400'>Yêu cầu xác thực 2 bước</p></div><button onClick={()=>setRequire2FA(!require2FA)} className={'w-12 h-6 rounded-full relative transition-colors ' + (require2FA ? 'bg-blue-600' : 'bg-gray-600')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (require2FA ? 'right-1' : 'left-1')}/></button></div><div className='flex items-center justify-between p-4 bg-gray-800/50 rounded-xl'><div><p className='text-white font-medium'>Giới hạn đăng nhập</p><p className='text-sm text-gray-400'>Khóa sau 5 lần thất bại</p></div><button onClick={()=>setLoginLimit(!loginLimit)} className={'w-12 h-6 rounded-full relative transition-colors ' + (loginLimit ? 'bg-blue-600' : 'bg-gray-600')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (loginLimit ? 'right-1' : 'left-1')}/></button></div><div><label className='block text-sm text-gray-400 mb-2'>Thời gian session (phút)</label><input type='number' defaultValue={60} className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div></div>)}
          {activeTab==='email'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-white'>Cài đặt SMTP</h3><div><label className='block text-sm text-gray-400 mb-2'>SMTP Host</label><input type='text' placeholder='smtp.gmail.com' className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div><div><label className='block text-sm text-gray-400 mb-2'>SMTP Port</label><input type='text' placeholder='587' className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div><div><label className='block text-sm text-gray-400 mb-2'>Email</label><input type='email' placeholder='admin@example.com' className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div><div><label className='block text-sm text-gray-400 mb-2'>Mật khẩu</label><div className='relative'><input type='password' placeholder='Nhập mật khẩu' className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white pr-10'/><button className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'><Eye className='w-5 h-5'/></button></div></div></div>)}
          {activeTab==='notifications'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-white'>Cài đặt thông báo</h3><div className='flex items-center justify-between p-4 bg-gray-800/50 rounded-xl'><div><p className='text-white font-medium'>Email thông báo</p><p className='text-sm text-gray-400'>Gửi email khi có báo cáo mới</p></div><button onClick={()=>setEmailNotification(!emailNotification)} className={'w-12 h-6 rounded-full relative transition-colors ' + (emailNotification ? 'bg-blue-600' : 'bg-gray-600')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (emailNotification ? 'right-1' : 'left-1')}/></button></div><div className='flex items-center justify-between p-4 bg-gray-800/50 rounded-xl'><div><p className='text-white font-medium'>Cảnh báo hệ thống</p><p className='text-sm text-gray-400'>Thông báo khi có vấn đề</p></div><button onClick={()=>setSystemAlert(!systemAlert)} className={'w-12 h-6 rounded-full relative transition-colors ' + (systemAlert ? 'bg-blue-600' : 'bg-gray-600')}><span className={'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (systemAlert ? 'right-1' : 'left-1')}/></button></div></div>)}
          {activeTab==='api'&&(<div className='space-y-6'><h3 className='text-lg font-semibold text-white'>Cài đặt API</h3><div><label className='block text-sm text-gray-400 mb-2'>API Key</label><div className='flex gap-2'><div className='flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-mono'>{showApiKey ? 'API_KEY_SET' : '••••••••••••••••••••'}</div><button onClick={()=>setShowApiKey(!showApiKey)} className='p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white'>{showApiKey?<EyeOff className='w-5 h-5'/>:<Eye className='w-5 h-5'/>}</button></div><p className='text-xs text-gray-500 mt-2'>Liên hệ quản trị viên để cập nhật API key</p></div><div><label className='block text-sm text-gray-400 mb-2'>Rate Limit (req/min)</label><input type='number' defaultValue={100} className='w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div></div>)}
          <div className='mt-6 pt-6 border-t border-gray-800'><button className='flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl'><Save className='w-4 h-4'/>Lưu thay đổi</button></div>
        </motion.div>
      </div>
    </div>
  );
}
