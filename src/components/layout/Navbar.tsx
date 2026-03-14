'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Search, FileText, AlertTriangle, LifeBuoy, User, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSession } from 'next-auth/react';

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-white/80 via-white/70 to-white/80 dark:from-slate-900/80 dark:via-slate-950/80 dark:to-slate-900/80 backdrop-blur border-b border-bg-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg">SG</span>
          <span className="text-text-main">ScamGuard</span>
        </Link>

          <nav className="hidden md:flex items-center gap-3">
            {navItems.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                link.isActive
                  ? 'bg-primary text-white shadow-inner shadow-primary/40'
                  : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <Link
            href="/faq"
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
              pathname === '/faq'
                ? 'bg-primary text-white shadow-inner shadow-primary/40'
                : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
            )}
          >
            <LifeBuoy className="h-4 w-4" /> FAQ
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1 rounded-full border border-bg-border px-3 py-2 text-sm font-medium text-green-700 bg-emerald-50 hover:bg-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
          <ThemeToggle className="ml-2" />
          <Link
            href="/profile"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-bg-card border border-bg-border shadow-sm"
            aria-label="Hồ sơ của bạn">
            <User className="h-5 w-5 text-text-secondary" />
          </Link>
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
          'fixed inset-0 z-40 transition-opacity duration-200',
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={closeMobileMenu} />
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex w-full max-w-[22rem] flex-col rounded-tl-[28px] rounded-bl-[28px] p-5 transition-transform duration-200 ease-out',
            'border border-slate-200/70 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.35)] ring-1 ring-black/5',
            'supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150',
            'dark:border-slate-800/70 dark:bg-slate-950/90 dark:ring-white/10',
            'dark:supports-[backdrop-filter]:bg-slate-950/55',
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-900/10 dark:bg-white/10" />
          <div className="mb-6 flex items-end justify-between">
            <span className="text-sm font-semibold text-text-secondary">Menu</span>
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
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-shadow duration-200',
                    'border-slate-200/70 bg-white/90 shadow-sm shadow-slate-900/10 ring-1 ring-black/5',
                    'supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-xl',
                    isActive
                      ? 'border-primary/25 bg-primary text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] ring-0'
                      : 'text-text-main hover:bg-white hover:shadow-[0_18px_36px_rgba(15,23,42,0.14)] dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-950/75'
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

          <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-dashed border-bg-border p-4 bg-white/80 dark:bg-[#0d1322]/80">
            <span className="text-sm font-medium text-text-secondary">Giao diện</span>
            <ThemeToggle className="ml-auto" />
          </div>
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
