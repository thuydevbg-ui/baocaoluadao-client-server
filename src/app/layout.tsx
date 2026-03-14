import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import Script from 'next/script';

// Use system fonts to avoid external font fetch during build
const inter = { variable: '' };
const jetbrainsMono = { variable: '' };

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'ScamGuard - Kiểm tra lừa đảo ngay lập tức',
  description: 'Bảo vệ bạn và cộng đồng khỏi lừa đảo',
  icons: {
    icon: '/favicon.ico',
  },
};

// Theme script to run before React hydrates
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      document.documentElement.classList.add(theme);
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-bg-main text-text-main antialiased font-body`}>
        {/* Theme script - runs before React hydrates */}
        <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        
        {/* Ensure admin pages default to light before React hydrates to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{ if(location && location.pathname && location.pathname.startsWith('/admin')){ const a=localStorage.getItem('adminTheme'); if(a!=='dark'){ document.documentElement.classList.remove('dark'); } } }catch(e){};`
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
