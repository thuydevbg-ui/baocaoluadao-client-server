'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Shield, ChevronDown, Smartphone, Building2, Globe, Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { cn } from '@/lib/utils';
import { mockSearchResults, mockNotifications } from '@/lib/mockData';

interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock notifications
  const notifications = mockNotifications;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // FIX: Prevent hydration mismatch by only applying theme after mount
    const storageKey = pathname && pathname.startsWith('/admin') ? 'adminTheme' : 'theme';
    const savedTheme = window.localStorage.getItem(storageKey);
    const nextTheme: 'light' | 'dark' = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    setTheme(nextTheme);
  }, []);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        setShowNotifications(false);
        setShowLangMenu(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounce search query
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setShowSearchResults(searchQuery.length > 0);
    }, 300);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    const storageKey = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'adminTheme' : 'theme';
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-normal',
        isScrolled
          ? 'glass shadow-lg border-b border-bg-border/70'
          : 'bg-bg-card/90 backdrop-blur border-b border-bg-border/70'
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onFocus={() => debouncedQuery && setShowSearchResults(true)}
                placeholder={t('home.search_placeholder')}
                className="w-full h-12 pl-12 pr-4 bg-bg-card border border-bg-border rounded-button text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {/* Search Results Dropdown */}
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
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          result.risk === 'scam' ? 'bg-danger/10 text-danger' :
                          result.risk === 'suspicious' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        )}>
                          {result.type === 'phone' && <Smartphone className="w-5 h-5" />}
                          {result.type === 'bank' && <Building2 className="w-5 h-5" />}
                          {result.type === 'website' && <Globe className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-main font-medium">{result.value}</p>
                          <p className="text-xs text-text-muted">{result.reports} {t('risk.reports').toLowerCase()}</p>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          result.risk === 'scam' ? 'bg-danger/10 text-danger' :
                          result.risk === 'suspicious' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        )}>
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
            {/* Report Button */}
            <Button
              variant="danger"
              size="sm"
              onClick={() => router.push('/report')}
              className="hidden lg:flex"
            >
              {t('nav.report')}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
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
                          {notif.unread && (
                            <span className="w-2 h-2 bg-primary rounded-full inline-block mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-button text-text-muted hover:text-text-main hover:bg-bg-card transition-colors"
              aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
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
                      onClick={() => { setLocale('vi'); setShowLangMenu(false); }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-bg-cardHover transition-colors',
                        locale === 'vi' ? 'text-primary font-medium' : 'text-text-muted'
                      )}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      onClick={() => { setLocale('en'); setShowLangMenu(false); }}
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

            {/* Login/Avatar */}
            <button className="p-2 rounded-button text-text-muted hover:text-text-main hover:bg-bg-card transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
