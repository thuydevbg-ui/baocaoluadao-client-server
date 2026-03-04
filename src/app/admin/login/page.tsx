"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, 
  CheckCircle, Zap, LockKeyhole, Fingerprint, Globe, 
  ChevronRight, ShieldCheck, Activity
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Use stable initial state to prevent hydration mismatch
  const [stats, setStats] = useState<{scams: number; reports: number; users: number}>({
    scams: 0,
    reports: 0,
    users: 0
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.totalScams !== undefined) setStats({ 
          scams: data.totalScams || 0, 
          reports: data.totalReports || 0, 
          users: data.totalUsers || 0 
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoaded(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Đăng nhập thất bại');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin'), 800);
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center"
      >
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden lg:block text-center lg:text-left"
        >
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">Báo Cáo Lừa Đảo</h1>
              <p className="text-cyan-400 font-medium">Hệ thống quản trị</p>
            </div>
          </Link>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Bảo vệ cộng đồng <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              khỏi lừa đảo
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md">
            Nền tảng tiên phong trong việc phát hiện và cảnh báo các hoạt động lừa đảo trực tuyến tại Việt Nam.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { label: 'Lừa đảo phát hiện', value: statsLoaded ? stats.scams.toLocaleString() : '...', icon: ShieldCheck, color: 'text-red-400' },
              { label: 'Báo cáo xử lý', value: statsLoaded ? stats.reports.toLocaleString() : '...', icon: Activity, color: 'text-amber-400' },
              { label: 'Người dùng tin tưởng', value: statsLoaded ? stats.users.toLocaleString() : '...', icon: Globe, color: 'text-cyan-400' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2 mx-auto`} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-6 mt-8">
            {[
              { icon: LockKeyhole, label: 'Bảo mật SSL' },
              { icon: Fingerprint, label: 'Xác thực 2 lớp' },
              { icon: Zap, label: 'Bảo vệ realtime' }
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-slate-500">
                <badge.icon className="w-4 h-4" />
                <span className="text-xs">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-slate-900">Báo Cáo Lừa Đảo</h1>
                  <p className="text-xs text-cyan-600 font-medium">Admin Panel</p>
                </div>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng trở lại 👋</h2>
              <p className="text-slate-600">Đăng nhập để quản lý hệ thống</p>
            </div>

            <AnimatePresence>
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Đăng nhập thành công!</h3>
                  <p className="text-slate-600">Đang chuyển hướng...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email quản trị</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@baocaoluadao.com"
                        required
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        required
                        className="w-full pl-12 pr-14 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-checked:bg-cyan-500 rounded-full transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                      </div>
                      <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                    </label>
                    <button type="button" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang xác thực...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500">Bảo mật cao</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <LockKeyhole className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Mã hóa SSL</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <ShieldCheck className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Bảo vệ 24/7</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <Fingerprint className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Xác thực</span>
                    </div>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="font-medium">Quay về trang chủ</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
