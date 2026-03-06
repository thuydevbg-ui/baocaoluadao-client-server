import React from 'react';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <div className={roboto.className}>{children}</div>;
}

