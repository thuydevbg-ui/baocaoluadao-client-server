'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', icon: Home, label: 'Trang chủ' },
    { href: '/search', icon: Search, label: 'Tra cứu' },
    { href: '/report', icon: PlusCircle, label: 'Báo cáo' },
    { href: '/alerts', icon: Bell, label: 'Cảnh báo' },
    { href: '/profile', icon: User, label: 'Hồ sơ' },
  ];

  return (
    <nav className="fixed bottom-2 left-0 right-0 z-40 lg:hidden">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-5 items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex flex-col items-center justify-center h-12 gap-0.5',
                'text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', isActive && 'scale-105')} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'absolute -bottom-0.5 h-0.5 w-4 rounded-full transition-opacity',
                  isActive ? 'bg-primary opacity-100' : 'opacity-0'
                )}
              />
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
