'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { I18nProvider } from '@/contexts/I18nContext';
import { ToastProvider } from '@/components/ui';

function DeviceSessionInit() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/user/devices', { credentials: 'include' }).catch(() => {});
  }, [status]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DeviceSessionInit />
      <I18nProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
