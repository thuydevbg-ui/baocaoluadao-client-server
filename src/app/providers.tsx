'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { I18nProvider } from '@/contexts/I18nContext';
import { ToastProvider } from '@/components/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
