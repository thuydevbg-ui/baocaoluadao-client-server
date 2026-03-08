'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Search, PlusCircle, Bell, User, X, Menu, AlertTriangle } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/search', icon: Search, label: 'Tra cứu' },
  { href: '/report', icon: PlusCircle, label: 'Báo cáo' },
  { href: '/report-lua-dao', icon: AlertTriangle, label: 'Danh sách lừa đảo' },
  { href: '/alerts', icon: Bell, label: 'Cảnh báo' },
  { href: '/profile', icon: User, label: 'Hồ sơ' },
];

const SAFE_ZONE_PADDING = 16; // px from edges
const MAX_HEIGHT_PERCENT = 0.2; // 20% from bottom
const BUTTON_SIZE = 56; // px

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isRightSide, setIsRightSide] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialX = window.innerWidth - BUTTON_SIZE - SAFE_ZONE_PADDING;
    const initialY = window.innerHeight - window.innerHeight * MAX_HEIGHT_PERCENT;

    setPosition({ x: initialX, y: initialY });
    positionRef.current = { x: initialX, y: initialY };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;

      const maxX = window.innerWidth - BUTTON_SIZE - SAFE_ZONE_PADDING;
      const maxY = window.innerHeight - window.innerHeight * MAX_HEIGHT_PERCENT;
      const minY = window.innerHeight - SAFE_ZONE_PADDING - BUTTON_SIZE;

      setPosition((prev) => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(Math.max(prev.y, maxY), minY),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const detectOverlap = () => {
      if (!containerRef.current || isDragging || typeof window === 'undefined') return;

      const buttonRect = containerRef.current.getBoundingClientRect();
      const centerX = buttonRect.left + buttonRect.width / 2;

      const elements = document.querySelectorAll('[data-mobile-card], button, a');
      let hasOverlap = false;

      elements.forEach((el) => {
        if (el === containerRef.current || containerRef.current?.contains(el as Node)) return;
        const rect = (el as HTMLElement).getBoundingClientRect();
        const overlap =
          !(buttonRect.right < rect.left || buttonRect.left > rect.right || buttonRect.bottom < rect.top || buttonRect.top > rect.bottom);
        if (overlap) hasOverlap = true;
      });

      if (hasOverlap) {
        const windowWidth = window.innerWidth;
        const newIsRight = centerX > windowWidth / 2;
        if (newIsRight !== isRightSide) {
          setIsRightSide(newIsRight);
          const newX = newIsRight ? windowWidth - BUTTON_SIZE - SAFE_ZONE_PADDING : SAFE_ZONE_PADDING;
          setPosition((prev) => ({ ...prev, x: newX }));
          positionRef.current = { ...positionRef.current, x: newX };
        }
      }
    };

    const interval = window.setInterval(detectOverlap, 500);
    return () => window.clearInterval(interval);
  }, [isDragging, isRightSide]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  }, []);

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || typeof window === 'undefined') return;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      const newX = positionRef.current.x + deltaX;
      const newY = positionRef.current.y + deltaY;

      const maxX = window.innerWidth - BUTTON_SIZE - SAFE_ZONE_PADDING;
      const minX = SAFE_ZONE_PADDING;
      const maxY = window.innerHeight - SAFE_ZONE_PADDING - BUTTON_SIZE;
      const minY = window.innerHeight * (1 - MAX_HEIGHT_PERCENT);

      const constrainedX = Math.min(Math.max(newX, minX), maxX);
      const constrainedY = Math.min(Math.max(newY, minY), maxY);

      setPosition({ x: constrainedX, y: constrainedY });
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || typeof window === 'undefined') return;

    setIsDragging(false);

    const windowWidth = window.innerWidth;
    const centerX = position.x + BUTTON_SIZE / 2;
    const shouldSnapRight = centerX > windowWidth / 2;
    setIsRightSide(shouldSnapRight);

    const snappedX = shouldSnapRight ? windowWidth - BUTTON_SIZE - SAFE_ZONE_PADDING : SAFE_ZONE_PADDING;
    setPosition((prev) => ({ ...prev, x: snappedX }));
    positionRef.current = { ...positionRef.current, x: snappedX };
  }, [isDragging, position.x]);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handleDragStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handleDragMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    handleDragEnd();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => handleDragEnd();
    const handleGlobalMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, handleDragEnd, handleDragMove]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  const menuPositionClass = isRightSide ? 'right-0 items-end' : 'left-0 items-start';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-md transition-opacity duration-300 sm:hidden dark:bg-black/35"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        ref={containerRef}
        className="fixed z-50 select-none sm:hidden touch-none"
        style={{
          left: position.x,
          top: position.y,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          id="mobile-floating-menu"
          className={cn(
            'absolute bottom-full flex flex-col gap-2 pb-3 transition-[opacity,transform] duration-200',
            'opacity-0 translate-y-2 scale-[0.98] pointer-events-none',
            menuPositionClass,
            isOpen && 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={closeMenu}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200',
                  'min-w-[176px] border border-slate-200/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.14)] ring-1 ring-black/5',
                  'supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150',
                  'hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_70px_rgba(15,23,42,0.18)]',
                  'dark:border-slate-800/70 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-white/10',
                  'dark:supports-[backdrop-filter]:bg-slate-950/55 dark:hover:bg-slate-950/85',
                  isActive && 'border-primary/25 bg-primary text-white shadow-[0_20px_70px_rgba(37,99,235,0.35)] ring-0 hover:bg-primary'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
                    isActive
                      ? 'border-white/25 bg-white/15'
                      : 'border-slate-200/70 bg-slate-50/80 group-hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/40'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-primary')} />
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onClick={() => !isDragging && toggleMenu()}
          aria-controls="mobile-floating-menu"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
          className={cn(
            'relative inline-flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300',
            'border border-slate-200/70 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.22)] ring-1 ring-black/5',
            'supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150',
            'before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/60 before:to-transparent before:opacity-90 before:pointer-events-none',
            'hover:shadow-[0_22px_70px_rgba(15,23,42,0.28)] active:scale-[0.97]',
            'dark:border-slate-800/70 dark:bg-slate-950/80 dark:ring-white/10',
            'dark:supports-[backdrop-filter]:bg-slate-950/55 dark:before:from-white/10 dark:before:opacity-70',
            isOpen && 'rotate-45 bg-white',
            isDragging && 'scale-110 cursor-grabbing'
          )}
        >
          {isOpen ? <X className="h-6 w-6 text-text-main" /> : <Menu className="h-6 w-6 text-text-main" />}
        </button>
      </div>
    </>
  );
}
