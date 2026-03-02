'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Tra cứu', href: '/search' },
  { label: 'Báo cáo', href: '/report' },
  { label: 'AI', href: '/ai' },
  { label: 'FAQ', href: '/faq' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-white/80 via-white/70 to-white/80 backdrop-blur border-b border-bg-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg">SG</span>
          <span className="text-text-main">ScamGuard</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Tooltip key={link.href} label={`Đi đến ${link.label}`}>
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium px-3 py-1 rounded-full transition-colors',
                  'hover:bg-primary/10 hover:text-primary text-text-secondary'
                )}
              >
                {link.label}
              </Link>
            </Tooltip>
          ))}
        </div>

        <button
          className="md:hidden p-2 rounded-full bg-bg-card border border-bg-border text-text-muted"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-bg-border bg-white/80 backdrop-blur shadow-lg">
          <div className="flex flex-col px-4 py-3 space-y-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-text-main hover:bg-bg-card transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
