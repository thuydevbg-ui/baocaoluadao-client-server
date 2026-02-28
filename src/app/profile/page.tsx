'use client';

import Link from 'next/link';
import { Navbar, MobileNav, Footer } from '@/components/layout';

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
          <div className="rounded-card border border-bg-border bg-bg-card p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-text-main">Hồ sơ tài khoản</h1>
            <p className="mt-3 text-text-secondary">
              Trang hồ sơ đang được hoàn thiện. Bạn có thể vào khu vực quản trị để cập nhật cấu hình hệ thống.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-colors"
              >
                Mở bảng điều khiển
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-button border border-bg-border px-4 py-2 text-sm font-semibold text-text-main hover:border-primary/60 hover:text-primary transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
