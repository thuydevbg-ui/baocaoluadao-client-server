'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiIcon } from '@/components/ui';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', icon: 'br-home', label: 'Trang chủ' },
    { href: '/search', icon: 'br-search', label: 'Tra cứu' },
    { href: '/report', icon: 'br-plus', label: 'Báo cáo' },
    { href: '/alerts', icon: 'br-bell', label: 'Cảnh báo' },
    { href: '/profile', icon: 'br-user', label: 'Hồ sơ' },
  ];

  return (
    <nav className="fixed bottom-2 left-0 right-0 z-40 lg:hidden">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-5 items-center">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;

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
                <FiIcon
                  name={tab.icon}
                  effect={isActive ? 'pulse' : 'hover'}
                  className={cn('text-[16px] md:text-[17px]', isActive && 'text-primary')}
                />
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
