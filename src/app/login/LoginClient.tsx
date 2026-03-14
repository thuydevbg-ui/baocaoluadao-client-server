'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getProviders, useSession, type ClientSafeProvider } from 'next-auth/react';
import { Mail, Lock, ShieldCheck, Loader2, Sparkles, KeyRound, Wand2, ArrowLeft } from 'lucide-react';
export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [twofaLoading, setTwofaLoading] = useState(false);
  const [twofaCode, setTwofaCode] = useState('');
  const [googleProvider, setGoogleProvider] = useState<ClientSafeProvider | null>(null);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const registered = searchParams.get('registered') === '1';
  const showSessionExpired = searchParams.get('expired') === '1';
  const sessionTwofaEnabled = Boolean((session?.user as any)?.twofaEnabled);
  const sessionTwofaVerified = Boolean((session?.user as any)?.twofaVerifiedAt);
  const needsTwofa = sessionTwofaEnabled && !sessionTwofaVerified;

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
      setError('Login is temporarily disabled. Please try again shortly.');
      return;
    }
    setIsLoading(true);
    setError('');
    setOtpRequired(false);

    const result = await signIn('credentials', {
      email,
      password,
      otp,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      if (result.error === 'TWO_FACTOR_REQUIRED') {
        setError('Two-factor code is required.');
        setOtpRequired(true);
      } else if (result.error === 'TWO_FACTOR_INVALID') {
        setError('Invalid OTP or backup code.');
        setOtpRequired(true);
      } else {
        setError('Email or password is incorrect.');
      }
      setIsLoading(false);
      return;
    }

    router.push(result?.url || callbackUrl);
  };

  const handleGoogle = async () => {
    if (!googleEnabled || !googleProvider) {
      setError('Google sign-in is disabled. Please use your email address.');
      return;
    }
    setError('');
    setIsLoading(true);
    await signIn('google', { callbackUrl });
  };

  const handleTwofaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwofaLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/security/twofa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: twofaCode }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Mã xác thực không đúng.');
      }
      const verifiedAt = data?.verifiedAt || new Date().toISOString();
      await update({ twofaVerifiedAt: verifiedAt });
      router.push(callbackUrl);
    } catch (err: any) {
      setError(err?.message || 'Mã xác thực không đúng.');
    } finally {
      setTwofaLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-10`}
    >
      <div className='absolute inset-0 overflow-hidden'>
        <div className='pointer-events-none absolute -top-28 -left-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl' />
        <div className='pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl' />
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.06),transparent_20%)]' />
      </div>

      <div className='relative grid w-full max-w-5xl gap-8 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30'>
              <ShieldCheck className='h-6 w-6 text-white' />
            </div>
            <div>
              <p className='text-sm uppercase tracking-[0.15em] text-emerald-200/80'>ScamGuard</p>
              <h1 className='text-2xl font-semibold text-white'>Secure login</h1>
            </div>
          </div>

          <div className='mt-8 space-y-5 text-sm leading-6 text-slate-200/80'>
            <div className='flex items-start gap-3'>
              <div className='mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300'>
                <Sparkles className='h-5 w-5' />
              </div>
              <div>
                <p className='font-semibold text-white'>One tap with Google</p>
                <p>Sign in instantly without a password and keep personal alerts synced across devices.</p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-200'>
                <KeyRound className='h-5 w-5' />
              </div>
              <div>
                <p className='font-semibold text-white'>Encrypted credentials</p>
                <p>Every account is protected with bcrypt hashing and rate-limited sign-in checks.</p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-200'>
                <Wand2 className='h-5 w-5' />
              </div>
              <div>
                <p className='font-semibold text-white'>Polished UI</p>
                <p>Responsive layouts surface clear guidance so you can focus on logging in fast.</p>
              </div>
            </div>
          </div>

          <div className='mt-10 flex flex-wrap items-center gap-3 text-xs text-slate-300/80'>
            <span className='rounded-full border border-white/10 px-3 py-1'>Two-factor HTTP-only cookies</span>
            <span className='rounded-full border border-white/10 px-3 py-1'>Multilingual support</span>
            <span className='rounded-full border border-white/10 px-3 py-1'>Admin & user ready UI</span>
          </div>
        </div>

        <div className='rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl'>
          <div className='flex items-center justify-between text-sm text-slate-300'>
            <Link href='/' className='inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100'>
              <ArrowLeft className='h-4 w-4' />
              Back to homepage
            </Link>
            <span>
              Don&apos;t have an account?{' '}
              <Link
                href='/register'
                className={`text-amber-200 hover:text-amber-100 ${registrationEnabled ? '' : 'opacity-50 pointer-events-none'}`}
              >
                Register
              </Link>
            </span>
          </div>

          <h2 className='mt-6 text-2xl font-semibold text-white'>Welcome back</h2>
          <p className='mt-2 text-sm text-slate-300/90'>Log in effortlessly, discover reports faster, and receive the latest alerts.</p>

          {registered && (
            <div className='mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-100'>
              <ShieldCheck className='h-4 w-4' />
              <span>Your account was created successfully. You can sign in now.</span>
            </div>
          )}

          {showSessionExpired && (
            <div className='mt-4 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100'>
              <ShieldCheck className='h-4 w-4' />
              <span>Your session expired. Please sign in again.</span>
            </div>
          )}

          {!loginEnabled && (
            <div className='mt-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-100'>
              <ShieldCheck className='h-4 w-4' />
              <span>Sign-in is temporarily disabled. Please check back soon.</span>
            </div>
          )}

          {error && (
            <div className='mt-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-100'>
              <ShieldCheck className='h-4 w-4' />
              <span>{error}</span>
            </div>
          )}

          {needsTwofa ? (
            <form className='mt-6 space-y-4' onSubmit={handleTwofaVerify}>
              <div className='rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100 text-sm'>
                Tài khoản của bạn đã bật 2FA. Vui lòng nhập OTP hoặc backup code để tiếp tục.
              </div>
              <label className='block space-y-2 text-sm'>
                <span className='text-slate-200'>OTP / Backup code</span>
                <div className='relative'>
                  <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                  <input
                    type='text'
                    value={twofaCode}
                    onChange={(e) => setTwofaCode(e.target.value)}
                    className='w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40'
                    placeholder='123456 hoặc backup code'
                    autoComplete='one-time-code'
                    required
                  />
                </div>
                <span className='text-xs text-slate-400'>
                  Backup code sẽ bị vô hiệu sau khi sử dụng.
                </span>
              </label>

              <button
                type='submit'
                disabled={twofaLoading}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-400 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {twofaLoading ? <Loader2 className='h-5 w-5 animate-spin' /> : <ShieldCheck className='h-5 w-5' />}
                {twofaLoading ? 'Verifying...' : 'Verify 2FA'}
              </button>
            </form>
          ) : (
            <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
            <label className='block space-y-2 text-sm'>
              <span className='text-slate-200'>Email</span>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40'
                  placeholder='you@scamguard.vn'
                />
              </div>
            </label>

            <label className='block space-y-2 text-sm'>
              <span className='text-slate-200'>Password</span>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40'
                  placeholder='••••••••'
                />
              </div>
            </label>

            <label className='block space-y-2 text-sm'>
              <span className='text-slate-200'>OTP / Backup code</span>
              <div className='relative'>
                <KeyRound className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <input
                  type='text'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className='w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40'
                  placeholder='123456 hoặc backup code'
                  autoComplete='one-time-code'
                />
              </div>
              <span className='text-xs text-slate-400'>
                {otpRequired ? 'Please enter your two-factor code to continue.' : 'Only required if you enabled 2FA.'}
                </span>
            </label>

            <button
              type='submit'
              disabled={isLoading || !loginEnabled}
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-400 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isLoading ? <Loader2 className='h-5 w-5 animate-spin' /> : <ShieldCheck className='h-5 w-5' />}
              {isLoading ? 'Processing...' : 'Sign in'}
            </button>
          </form>
          )}

          {!needsTwofa && (
            <>
              <div className='my-4 flex items-center gap-3'>
                <div className='h-px flex-1 bg-white/10' />
                <span className='text-xs uppercase tracking-[0.2em] text-slate-400'>Or</span>
                <div className='h-px flex-1 bg-white/10' />
              </div>

              <div className='mt-6 space-y-3'>
                {googleProvider && googleEnabled && (
                  <button
                    onClick={handleGoogle}
                    className='flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10'
                  >
                    <img src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' alt='Google' className='h-5 w-5' />
                    Continue with Google
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
