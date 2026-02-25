'use client';

import { AdminLayout } from '@/components/admin';
import { usePathname } from 'next/navigation';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Use regex for precise login route matching - only match /admin/login and its subpaths
  const isAuthRoute = /^\/admin\/login(\/.*)?$/.test(pathname);

  // Login route must bypass protected admin shell to prevent redirect loops.
  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
