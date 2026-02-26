'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  User,
  Shield,
  ChevronDown,
  Smartphone,
  Building2,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { cn } from '@/lib/utils';
import { mockSearchResults, mockNotifications } from '@/lib/mockData';

interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const notifications = mockNotifications;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const storageKey = pathname && pathname.startsWith('/admin') ? 'adminTheme' : 'theme';
    const savedTheme = window.localStorage.getItem(storageKey);
    const nextTheme: 'light' | 'dark' = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        setShowNotifications(false);
        setShowLangMenu(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setShowSearchResults(searchQuery.length > 0);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSearchResults(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    const storageKey = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'adminTheme' : 'theme';
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
  };

  const initials =
    (session?.user?.name &&
      session.user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()) ||
    (session?.user?.email ? session.user.email[0]?.toUpperCase() : 'U');

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-normal',
        isScrolled ? 'glass shadow-lg border-b border-bg-border/70' : 'bg-bg-card/90 backdrop-blur border-b border-bg-border/70'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 6 }}
              className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-text-main hidden sm:block">
              Scam<span className="text-primary">Guard</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div ref={searchRef} className="hidden lg:block flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => debouncedQuery && setShowSearchResults(true)}
                placeholder={t('home.search_placeholder')}
                className="w-full h-12 pl-12 pr-4 bg-bg-card border border-bg-border rounded-button text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <AnimatePresence>
                {showSearchResults && debouncedQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-bg-border rounded-card shadow-xl overflow-hidden"
                  >
                    {mockSearchResults.map((result, i) => (
                      <Link
                        key={i}
                        href={`/detail/${result.type}/${encodeURIComponent(result.value)}`}
                        className="flex items-center gap-3 p-3 hover:bg-bg-cardHover transition-colors border-b border-bg-border last:border-0"
                        onClick={() => setShowSearchResults(false)}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            result.risk === 'scam'
                              ? 'bg-danger/10 text-danger'
                              : result.risk === 'suspicious'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-success/10 text-success'
                          )}
                        >
                          {result.type === 'phone' && <Smartphone className="w-5 h-5" />}
                          {result.type === 'bank' && <Building2 className="w-5 h-5" />}
                          {result.type === 'website' && <Globe className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-main font-medium">{result.value}</p>
                          <p className="text-xs text-text-muted">
                            {result.reports} {t('risk.reports').toLowerCase()}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            result.risk === 'scam'
                              ? 'bg-danger/10 text-danger'
                              : result.risk === 'suspicious'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-success/10 text-success'
                          )}
                        >
                          {t(`risk.${result.risk}`)}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => router.push('/report')}
              className="hidden lg:flex"
            >
              {t('nav.report')}
            </Button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-button text-text-muted hover:text-text-main hover:bg-bg-card transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full animate-pulse" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-bg-border rounded-card shadow-xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-bg-border">
                      <h3 className="font-semibold text-text-main">{t('nav.notifications')}</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            'p-3 border-b border-bg-border hover:bg-bg-cardHover transition-colors cursor-pointer',
                            notif.unread && 'bg-primary/5'
                          )}
                        >
                          <p className="text-sm text-text-main">{notif.text}</p>
                          {notif.unread && <span className="w-2 h-2 bg-primary rounded-full inline-block mt-1" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-button text-text-muted hover:text-text-main hover:bg-bg-card transition-colors"
              aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLangMenu((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-button text-sm font-medium text-text-muted hover:text-text-main hover:bg-bg-card transition-colors"
              >
                {locale.toUpperCase()}
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-24 bg-bg-card border border-bg-border rounded-card shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setLocale('vi');
                        setShowLangMenu(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-bg-cardHover transition-colors',
                        locale === 'vi' ? 'text-primary font-medium' : 'text-text-muted'
                      )}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      onClick={() => {
                        setLocale('en');
                        setShowLangMenu(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-bg-cardHover transition-colors',
                        locale === 'en' ? 'text-primary font-medium' : 'text-text-muted'
                      )}
                    >
                      English
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {status === 'loading' ? (
              <div className="h-9 w-24 rounded-button bg-bg-card animate-pulse" />
            ) : session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-bg-border bg-bg-card px-2 py-1.5 hover:border-primary/60 transition-colors"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || session.user.email || 'user'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-sm font-semibold text-white">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-text-main line-clamp-1 max-w-[140px]">
                    {session.user.name || session.user.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-card border border-bg-border bg-bg-card shadow-xl overflow-hidden"
                    >
                      <div className="px-3 py-3 border-b border-bg-border">
                        <p className="text-sm font-semibold text-text-main line-clamp-1">{session.user.name || session.user.email}</p>
                        <p className="text-xs text-text-muted line-clamp-1">{session.user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-text-main hover:bg-bg-cardHover transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Hồ sơ & cài đặt
                      </Link>
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-text-main hover:bg-bg-cardHover transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Bảng điều khiển
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-2 rounded-button border border-bg-border px-3 py-2 text-sm font-semibold text-text-main hover:border-primary/60 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-button bg-primary px-3 py-2 text-sm font-semibold text-white hover:brightness-110 transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
