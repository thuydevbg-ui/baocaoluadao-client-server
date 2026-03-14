'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const isDark = theme === 'dark';
  
  // Hide header on admin pages, auth pages, and certain other pages
  const hideOnPaths = ['/admin', '/api', '/login', '/register', '/profile', '/search', '/report', '/detail', '/ai', '/alerts', '/blog', '/about', '/faq', '/help', '/privacy', '/terms', '/cookies', '/press', '/careers'];
  const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));
  
  if (shouldHide) {
    return null;
  }

  const navItems = [
    { href: '/', icon: 'ph-house', label: 'Trang chủ' },
    { href: '/search', icon: 'ph-magnifying-glass', label: 'Tra cứu' },
    { href: '/reports', icon: 'ph-file-text', label: 'Tố giác' },
    { href: '/blacklist', icon: 'ph-prohibit', label: 'Blacklist' },
    { href: '/profile', icon: 'ph-user', label: 'Tài khoản' },
  ];

  return (
    <>
      {/* Top Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: isDark ? '#1c1c1e' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#38383a' : '#e5e5ea'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none'
        }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            color: isDark ? '#fff' : '#000'
          }}>
            BaoCaoLuaDao
          </span>
        </Link>

        {/* Emergency Button */}
        <Link href="/emergency" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: '#ff3b30',
          borderRadius: '20px',
          textDecoration: 'none',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <i className="ph-fill ph-warning" style={{ fontSize: '16px' }} />
          <span style={{ display: 'none' }}>Khẩn cấp</span>
          <span>113</span>
        </Link>
      </header>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65px',
        background: isDark ? '#1c1c1e' : '#ffffff',
        borderTop: `1px solid ${isDark ? '#38383a' : '#e5e5ea'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                textDecoration: 'none',
                borderRadius: '12px',
                background: isActive ? (isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.1)') : 'transparent',
                transition: 'all 0.2s',
                minWidth: '60px'
              }}
            >
              <i 
                className={`ph ${isActive ? 'fill' : ''} ${item.icon}`} 
                style={{
                  fontSize: '22px',
                  color: isActive ? '#007aff' : (isDark ? '#8e8e98' : '#8e8e93'),
                  marginBottom: '2px'
                }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#007aff' : (isDark ? '#8e8e98' : '#8e8e93')
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer for fixed header/footer */}
      <div style={{ height: '135px' }} />
    </>
  );
}
