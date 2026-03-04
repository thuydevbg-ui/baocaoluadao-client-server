'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_STORAGE_KEY = 'scamguard-theme';

const applyTheme = (value: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', value === 'dark');
};

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export interface ThemeToggleProps {
  className?: string;
  label?: string;
}

export function ThemeToggle({ className, label = 'Chuyển giao diện sáng/tối' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return getPreferredTheme();
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(true);
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = getPreferredTheme() === 'dark';
    const next: 'light' | 'dark' = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';

    setTheme(next);
    applyTheme(next);
    setIsReady(true);

    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (window.localStorage.getItem(THEME_STORAGE_KEY)) {
        return;
      }
      const fallback: 'light' | 'dark' = event.matches ? 'dark' : 'light';
      setTheme(fallback);
      applyTheme(fallback);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
        const nextValue = event.newValue as 'light' | 'dark';
        setTheme(nextValue);
        applyTheme(nextValue);
      }
    };

    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange);
      } else {
        mediaQuery.addListener(handleMediaChange);
      }
    }

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaChange);
        } else {
          mediaQuery.removeListener(handleMediaChange);
        }
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      className={cn(
        'group relative inline-flex items-center rounded-full border border-bg-border bg-bg-card px-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60',
        className
      )}
      disabled={!isReady}
    >
      <span className="relative flex h-10 w-20 items-center justify-between rounded-full border border-bg-border bg-gradient-to-r from-white to-white/90 px-2 text-text-muted shadow-inner shadow-black/5">
        <Sun className={cn('z-10 h-5 w-5 transition-transform duration-300', theme === 'light' ? 'text-yellow-400 scale-110' : 'text-text-muted scale-75')} />
        <Moon className={cn('z-10 h-5 w-5 transition-transform duration-300', theme === 'dark' ? 'text-blue-400 scale-110' : 'text-text-muted scale-75')} />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary shadow-lg transition-transform duration-300',
            theme === 'dark' ? 'translate-x-[110%]' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  );
}
