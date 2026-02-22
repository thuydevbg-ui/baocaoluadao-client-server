'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';

type Locale = 'vi' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations = { vi, en };

// Default translation function
const defaultT = (key: string): string => {
  const keys = key.split('.');
  let value = translations['vi'] as Record<string, unknown>;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k] as Record<string, unknown>;
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
};

// Default context value - works even without provider
const defaultContextValue: I18nContextType = {
  locale: 'vi',
  setLocale: () => {},
  t: defaultT,
};

const I18nContext = createContext<I18nContextType>(defaultContextValue);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first, then fallback to browser language
    let saved: string | null = null;
    if (typeof window !== 'undefined') {
      saved = localStorage.getItem('scamguard-locale');
    }
    if (saved === 'vi' || saved === 'en') {
      setLocaleState(saved);
    } else if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') {
        setLocaleState('en');
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('scamguard-locale', newLocale);
    }
  }, []);

  // Use consistent translation function to prevent hydration mismatch
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value = translations[locale] as Record<string, unknown>;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k] as Record<string, unknown>;
      } else {
        // Silent fail for missing translations in production
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale: mounted ? locale : 'vi', setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { Locale };
