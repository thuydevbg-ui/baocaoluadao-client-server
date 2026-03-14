'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, UserRound, Mail, Lock, ShieldPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) setRegistrationEnabled(Boolean(data.settings.registrationEnabled));
      })
      .catch(() => {});
  }, []);

  const validate = () => {
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return false;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(password)) {
      setError('Mật khẩu cần tối thiểu 8 ký tự, có chữ và số.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationEnabled) {
      setError('Đăng ký đang tạm tắt.');
      return;
    }
    setError('');
    setSuccess('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Không thể tạo tài khoản.');
        return;
      }

      setSuccess('Đăng ký thành công. Bạn sẽ được chuyển sang đăng nhập.');
      setTimeout(() => router.push('/login?registered=1'), 900);
    } catch {
      setError('Có lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-10`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(56,189,248,0.07),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(52,211,153,0.08),transparent_22%)]" />
      </div>

      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100">
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
          <span>Đã có tài khoản? <Link href="/login" className="text-amber-200 hover:text-amber-100">Đăng nhập</Link></span>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">Tạo tài khoản</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Đồng bộ báo cáo và cảnh báo</h1>
            <p className="mt-2 text-sm text-slate-300/90">Miễn phí, đồng bộ mọi thiết bị, bật được cảnh báo cá nhân hoá.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            <ShieldPlus className="h-4 w-4 text-emerald-300" />
            Dữ liệu đăng nhập được mã hoá với bcrypt + cookie HTTP-only
          </div>
        </div>

        {!registrationEnabled && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-100">
            <ShieldPlus className="h-4 w-4" />
            <span>Đăng ký đang tạm tắt. Vui lòng quay lại sau.</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-100">
            <ShieldPlus className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-200">Họ và tên</span>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-200">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
                placeholder="ban@scamguard.vn"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-200">Mật khẩu</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
                placeholder="••••••••"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-200">Nhập lại mật khẩu</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
                placeholder="••••••••"
              />
            </div>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading || !registrationEnabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-400 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldPlus className="h-5 w-5" />}
              {isLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
