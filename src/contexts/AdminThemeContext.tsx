"use client";

import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

type AdminThemeContextValue = {
  theme: Theme;
};

const AdminThemeContext = createContext<AdminThemeContextValue | undefined>(undefined);

export function AdminThemeProvider({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  // Keep <html> .dark class in sync for components and global CSS that rely on it.
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch {
      // Ignore in non-browser environments
    }
  }, [theme]);

  return <AdminThemeContext.Provider value={{ theme }}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme(): AdminThemeContextValue {
  const context = useContext(AdminThemeContext);
  if (!context) {
    // Return dark as default for admin to match the admin layout's default theme
    return { theme: 'dark' };
  }
  return context;
}
