'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Search, FileText, AlertTriangle, LifeBuoy, User, ShieldCheck, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { signOut, useSession } from 'next-auth/react';

const navLinks = [
  { label: 'Trang chủ', href: '/', icon: Home },
  { label: 'Tra cứu', href: '/search', icon: Search },
  { label: 'Báo cáo', href: '/report', icon: FileText },
  { label: 'Danh sách lừa đảo', href: '/report-lua-dao', icon: AlertTriangle },
  { label: 'FAQ', href: '/faq', icon: LifeBuoy },
];

const primaryLinks = navLinks.slice(0, 4);
const secondaryLinks = navLinks.slice(4);

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const adminRoles = ['admin', 'super_admin', 'moderator'];
  const isAdmin = adminRoles.includes(String(session?.user?.role || '').toLowerCase());
  const isAuthed = Boolean(session?.user?.email);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = useMemo(
    () =>
      navLinks.map((link) => ({
        ...link,
        isActive: pathname === link.href,
      })),
    [pathname]
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!mobilePanelRef.current || !target) return;
      if (!mobilePanelRef.current.contains(target)) {
        closeMobileMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-bg-border/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            SG
          </span>
          <span className="text-text-main tracking-tight">ScamGuard</span>
        </Link>

          <nav className="hidden md:flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2 py-1 shadow-sm shadow-slate-900/10 ring-1 ring-black/5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70 dark:ring-white/10">
            {navItems.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                link.isActive
                  ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]'
                  : 'text-text-secondary hover:-translate-y-0.5 hover:bg-primary/10 hover:text-primary'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <Link
            href="/faq"
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
              pathname === '/faq'
                ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]'
                : 'text-text-secondary hover:-translate-y-0.5 hover:bg-primary/10 hover:text-primary'
            )}
          >
            <LifeBuoy className="h-4 w-4" /> FAQ
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
          <ThemeToggle className="ml-1" />
          <Link
            href="/profile"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-bg-card border border-bg-border shadow-sm ring-1 ring-black/5"
            aria-label="Hồ sơ của bạn">
            <User className="h-5 w-5 text-text-secondary" />
          </Link>
          {isAuthed && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm hover:-translate-y-0.5 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Mở menu"
            className={cn(
              'rounded-full p-2 shadow-sm shadow-slate-900/10 transition',
              'border border-slate-200/70 bg-white/90 text-text-muted ring-1 ring-black/5',
              'supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-xl',
              'hover:bg-white',
              'dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-200 dark:ring-white/10',
              'dark:hover:bg-slate-950/80'
            )}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-[100] transition-opacity duration-200',
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          className="absolute inset-0 bg-slate-900/55"
          onClick={closeMobileMenu}
          onTouchStart={closeMobileMenu}
        />
        <div
          ref={mobilePanelRef}
          className={cn(
            'absolute inset-y-0 right-0 z-[110] flex w-[86vw] max-w-[360px] flex-col rounded-tl-[24px] rounded-bl-[24px] p-5 transition-transform duration-200 ease-out',
            'border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]',
            'dark:border-slate-800/90 dark:bg-slate-950',
            'overflow-y-auto overscroll-contain',
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-800/90 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400 text-white shadow-lg shadow-blue-500/30">
                SG
              </span>
              <div>
                <div className="text-sm font-semibold text-text-main">ScamGuard</div>
                <div className="text-xs text-text-secondary">Menu nhanh</div>
              </div>
            </div>
            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="Đóng menu"
              className="rounded-full border border-bg-border bg-bg-main/70 p-1 text-text-muted shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {primaryLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-4 text-base font-semibold transition-all duration-200',
                    'border-slate-200/90 bg-white shadow-sm',
                    isActive
                      ? 'border-primary/40 bg-gradient-to-r from-primary to-emerald-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.3)]'
                      : 'text-text-main hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800/90 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900'
                  )}
                >
                  <link.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-primary')} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {secondaryLinks.length > 0 && (
            <div className="mt-6 border-t border-bg-border pt-5">
            {secondaryLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary/90 text-white shadow-lg shadow-primary/30'
                      : 'text-text-secondary hover:bg-primary/10 hover:text-primary dark:text-text-secondary'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-dashed border-bg-border p-4 bg-white dark:bg-slate-950">
            <span className="text-sm font-semibold text-text-secondary">Giao diện</span>
            <ThemeToggle className="ml-auto" />
          </div>
          {isAuthed && (
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                signOut({ callbackUrl: '/' });
              }}
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-semibold text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          )}
          {isAdmin && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm font-medium text-emerald-800 shadow-inner">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin panel</span>
              </div>
              <p className="text-xs text-emerald-700/80">Truy cập nhanh dashboard admin</p>
              <Link href="/admin" className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-600">
                Mở admin
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
