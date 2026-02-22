'use client';

import React from 'react';
import { I18nProvider } from '@/contexts/I18nContext';
import { ToastProvider } from '@/components/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </I18nProvider>
  );
}
