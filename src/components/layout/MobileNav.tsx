'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Search, PlusCircle, Bell, User, X, Menu } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/search', icon: Search, label: 'Tra cứu' },
  { href: '/report', icon: PlusCircle, label: 'Báo cáo' },
  { href: '/alerts', icon: Bell, label: 'Cảnh báo' },
  { href: '/profile', icon: User, label: 'Hồ sơ' },
];

// Safe zone constants
const SAFE_ZONE_PADDING = 16; // px from edges
const MAX_HEIGHT_PERCENT = 0.2; // 20% from bottom
const SNAP_THRESHOLD = 50; // px to snap to edge
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

  // Initialize position to bottom-right
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initialX = window.innerWidth - BUTTON_SIZE - SAFE_ZONE_PADDING;
    const initialY = window.innerHeight - (window.innerHeight * MAX_HEIGHT_PERCENT);
    
    setPosition({ x: initialX, y: initialY });
    positionRef.current = { x: initialX, y: initialY };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      
      const maxX = window.innerWidth - BUTTON_SIZE - SAFE_ZONE_PADDING;
      const maxY = window.innerHeight - (window.innerHeight * MAX_HEIGHT_PERCENT);
      const minY = window.innerHeight - SAFE_ZONE_PADDING - BUTTON_SIZE;
      
      setPosition(prev => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(Math.max(prev.y, maxY), minY)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect if content is overlapping and auto-adjust
  useEffect(() => {
    const detectOverlap = () => {
      if (!containerRef.current || isDragging) return;
      
      const buttonRect = containerRef.current.getBoundingClientRect();
      const centerX = buttonRect.left + buttonRect.width / 2;
      const centerY = buttonRect.top + buttonRect.height / 2;
      
      // Get all potential overlapping elements (cards, buttons, etc.)
      const elements = document.querySelectorAll('[data-mobile-card], button, a');
      let hasOverlap = false;
      
      elements.forEach(el => {
        if (el === containerRef.current || containerRef.current?.contains(el as Node)) return;
        
        const rect = el.getBoundingClientRect();
        const overlap = !(buttonRect.right < rect.left || 
                         buttonRect.left > rect.right || 
                         buttonRect.bottom < rect.top || 
                         buttonRect.top > rect.bottom);
        
        if (overlap) hasOverlap = true;
      });
      
      // If overlap detected, move to opposite side
      if (hasOverlap && !isDragging) {
        const windowWidth = window.innerWidth;
        const newIsRight = centerX > windowWidth / 2;
        
        if (newIsRight !== isRightSide) {
          setIsRightSide(newIsRight);
          const newX = newIsRight 
            ? windowWidth - BUTTON_SIZE - SAFE_ZONE_PADDING 
            : SAFE_ZONE_PADDING;
          
          setPosition(prev => ({ ...prev, x: newX }));
          positionRef.current = { ...positionRef.current, x: newX };
        }
      }
    };

    const interval = setInterval(detectOverlap, 500);
    return () => clearInterval(interval);
  }, [isDragging, isRightSide]);

  // Touch/Mouse event handlers
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || typeof window === 'undefined') return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const newX = positionRef.current.x + deltaX;
    const newY = positionRef.current.y + deltaY;
    
    // Constrain to safe zones
    const maxX = window.innerWidth - BUTTON_SIZE - SAFE_ZONE_PADDING;
    const minX = SAFE_ZONE_PADDING;
    const maxY = window.innerHeight - SAFE_ZONE_PADDING - BUTTON_SIZE;
    const minY = window.innerHeight * (1 - MAX_HEIGHT_PERCENT);
    
    const constrainedX = Math.min(Math.max(newX, minX), maxX);
    const constrainedY = Math.min(Math.max(newY, minY), maxY);
    
    setPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || typeof window === 'undefined') return;
    
    setIsDragging(false);
    
    // Snap to nearest edge
    const windowWidth = window.innerWidth;
    const centerX = position.x + BUTTON_SIZE / 2;
    const shouldSnapRight = centerX > windowWidth / 2;
    
    setIsRightSide(shouldSnapRight);
    
    const snappedX = shouldSnapRight 
      ? windowWidth - BUTTON_SIZE - SAFE_ZONE_PADDING 
      : SAFE_ZONE_PADDING;
    
    // Animate to snapped position
    setPosition(prev => ({ ...prev, x: snappedX }));
    positionRef.current = { ...positionRef.current, x: snappedX };
  }, [isDragging, position.x]);

  // Touch events
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

  // Mouse events
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

  // Global mouse up handler
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

  const toggleMenu = () => setIsOpen(prev => !prev);
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
      if (event.key === 'Escape') {
        closeMenu();
      }
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

  // Calculate menu position based on button position
  const menuPositionClass = isRightSide ? 'right-0 items-end' : 'left-0 items-start';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 sm:hidden"
          onClick={closeMenu}
        />
      )}
      
      {/* Floating Button Container */}
      <div
        ref={containerRef}
        className="fixed z-50 sm:hidden touch-none"
        style={{
          left: position.x,
          top: position.y,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Menu Items */}
        <div 
          className={cn(
            'absolute flex flex-col gap-2 mb-3 transition-all duration-200',
            'opacity-0 translate-y-2 scale-95 pointer-events-none',
            menuPositionClass,
            isOpen && 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          )}
        >
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={closeMenu}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300',
                    'border border-white/40 min-w-[160px]',
                    isActive 
                      ? 'bg-primary/90 text-white' 
                      : 'bg-white/85 text-text-main hover:bg-white/95'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-primary')} />
                  <span className="font-medium text-sm whitespace-nowrap">{tab.label}</span>
                </Link>
              );
            })}
          </div>

        {/* AssistiveTouch Button */}
        <button
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onClick={() => !isDragging && toggleMenu()}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300',
            'backdrop-blur-xl bg-white/70 border border-white/50',
            'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
            'active:scale-95 hover:bg-white/80',
            isOpen && 'bg-white/90 rotate-45',
            isDragging && 'scale-110 cursor-grabbing'
          )}
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }}
          aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-text-main" />
          ) : (
            <Menu className="w-6 h-6 text-text-main" />
          )}
        </button>
      </div>

    </>
  );
}
