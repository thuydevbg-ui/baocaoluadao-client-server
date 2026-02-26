'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getProviders, type ClientSafeProvider } from 'next-auth/react';
import { Mail, Lock, ShieldCheck, Loader2, Sparkles, KeyRound, Wand2, ArrowLeft } from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleProvider, setGoogleProvider] = useState<ClientSafeProvider | null>(null);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const registered = searchParams.get('registered') === '1';
  const showSessionExpired = searchParams.get('expired') === '1';

  useEffect(() => {
    getProviders().then((providers) => {
      if (providers?.google) setGoogleProvider(providers.google);
    });

    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setLoginEnabled(Boolean(data.settings.loginEnabled));
          setRegistrationEnabled(Boolean(data.settings.registrationEnabled));
          setGoogleEnabled(Boolean(data.settings.googleAuthEnabled && data.settings.googleClientIdSet));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEnabled) {
      setError('Ðang nh?p dang t?m t?t.');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError('Email ho?c m?t kh?u chua chính xác.');
      setIsLoading(false);
      return;
    }

    router.push(result?.url || callbackUrl);
  };

  const handleGoogle = async () => {
    if (!googleEnabled || !googleProvider) {
      setError('Google chua du?c kích ho?t. Vui lòng dang nh?p b?ng email.');
      return;
    }
    setError('');
    setIsLoading(true);
    await signIn('google', { callbackUrl });
  };

  return (
    <div className={`${grotesk.variable} min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-10`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute -top-28 -left-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.06),transparent_20%)]" />
      </div>

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-emerald-200/80">ScamGuard</p>
              <h1 className="text-2xl font-semibold text-white">Ðang nh?p an toàn</h1>
            </div>
          </div>

          <div className="mt-8 space-y-5 text-sm leading-6 text-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">M?t ch?m v?i Google</p>
                <p>Ðang nh?p nhanh, không c?n nh? m?t kh?u; v?n luu l?ch s? và c?nh báo cá nhân hoá.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-200">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">M?t kh?u mã hoá</p>
                <p>M?i tài kho?n thu?ng d?u du?c bam b?ng bcrypt, kèm gi?i h?n t?c d? dang nh?p.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-200">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Tr?i nghi?m tinh g?n</p>
                <p>Giao di?n t?i uu cho mobile, kèm ph?n h?i l?i rõ ràng d? b?n vào vi?c ngay.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-slate-300/80">
            <span className="rounded-full border border-white/10 px-3 py-1">B?o v? 2 l?p cookie HTTP-only</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Ða ngôn ng?</span>
            <span className="rounded-full border border-white/10 px-3 py-1">UI s?n cho Admin & User</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <Link href="/" className="inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100">
              <ArrowLeft className="h-4 w-4" />
              V? trang ch?
            </Link>
            <span>
              Chua có tài kho?n?{' '}
              <Link
                href="/register"
                className={`text-amber-200 hover:text-amber-100 ${registrationEnabled ? '' : 'opacity-50 pointer-events-none'}`}
              >
                Ðang ký
              </Link>
            </span>
          </div>

          <h2 className="mt-6 text-2xl font-semibold text-white">Chào m?ng tr? l?i</h2>
          <p className="mt-2 text-sm text-slate-300/90">Ðang nh?p d? d?ng b? tìm ki?m, luu báo cáo và nh?n c?nh báo m?i nh?t.</p>

          {registered && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              <span>T?o tài kho?n thành công. B?n có th? dang nh?p ngay.</span>
            </div>
          )}

          {showSessionExpired && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100">
              <ShieldCheck className="h-4 w-4" />
              <span>Phiên dã h?t h?n. Vui lòng dang nh?p l?i.</span>
            </div>
          )}

          {!loginEnabled && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-100">
              <ShieldCheck className="h-4 w-4" />
              <span>Ðang nh?p dang t?m t?t. Vui lòng quay l?i sau.</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-100">
              <ShieldCheck className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              <span className="text-slate-200">M?t kh?u</span>
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

            <button
              type="submit"
              disabled={isLoading || !loginEnabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-400 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              {isLoading ? 'Ðang x? lý...' : 'Ðang nh?p'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Ho?c</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-6 space-y-3">
            {googleProvider && googleEnabled && (
              <button
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                Ðang nh?p v?i Google
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
