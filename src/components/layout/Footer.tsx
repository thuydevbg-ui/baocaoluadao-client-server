'use client';

import Link from 'next/link';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-bg-card to-bg-main border-t border-bg-border mt-auto">
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-3">
        <div className="flex items-center flex-nowrap whitespace-nowrap gap-2 md:gap-4 text-[11px] md:text-sm overflow-hidden">
          <Link href="/" className="flex items-center gap-1.5 shrink-0 min-w-0">
            <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-primary to-blue-400 rounded-md flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-text-main text-sm md:text-base leading-none">
              Scam<span className="text-primary">Guard</span>
            </span>
          </Link>

          <span className="text-[#6a737c] shrink-0">|</span>

          <div className="flex items-center gap-2 md:gap-3 shrink-0 text-[#3c4043]">
            <Link href="/" className="hover:text-[#0a95ff] transition-colors">Trang chủ</Link>
            <Link href="/search" className="hover:text-[#0a95ff] transition-colors">Tra cứu</Link>
            <Link href="/report" className="hover:text-[#0a95ff] transition-colors hidden sm:inline">Báo cáo</Link>
            <Link href="/faq" className="hover:text-[#0a95ff] transition-colors hidden md:inline">FAQ</Link>
            <Link href="/privacy" className="hover:text-[#0a95ff] transition-colors hidden md:inline">Bảo mật</Link>
          </div>

          <span className="text-[#6a737c] shrink-0 hidden sm:inline">|</span>

          <a href="tel:1900xxxx" className="hidden sm:flex items-center gap-1.5 text-[#3c4043] hover:text-[#0a95ff] transition-colors shrink-0">
            <Phone className="w-3 h-3 text-[#0a95ff]" />
            1900-xxxx
          </a>

          <a href="mailto:support@scamguard.vn" className="hidden md:flex items-center gap-1.5 text-[#3c4043] hover:text-[#0a95ff] transition-colors shrink-0">
            <Mail className="w-3 h-3 text-[#0a95ff]" />
            support@scamguard.vn
          </a>

          <div className="hidden lg:flex items-center gap-1.5 text-[#3c4043] shrink-0">
            <MapPin className="w-3 h-3 text-[#0a95ff]" />
            Hà Nội, Việt Nam
          </div>

          <span className="text-[#6a737c] shrink-0 hidden lg:inline">|</span>

          <p className="text-[#6a737c] truncate min-w-0 ml-auto">
            © 2025 ScamGuard.
          </p>
        </div>
      </div>
    </footer>
  );
}
