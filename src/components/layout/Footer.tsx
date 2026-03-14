'use client';

import Link from 'next/link';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  FooterContactEntry,
  FooterNavLink,
  defaultFooterContacts,
  defaultFooterLinks,
} from '@/lib/footerConfig';

type IconComponent = typeof Shield;

const ICON_MAP: Record<string, IconComponent> = {
  shield: Shield,
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  'map_pin': MapPin,
};

const normalizeIconName = (name?: string): IconComponent => {
  if (!name) return Shield;
  const key = name.toLowerCase().replace('_', '-');
  return ICON_MAP[key] ?? Shield;
};

const cloneEntries = <T extends object>(items: T[]) => items.map((item) => ({ ...item }));

export function Footer() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [contacts, setContacts] = useState<FooterContactEntry[]>(() => cloneEntries(defaultFooterContacts));
  const [navLinks, setNavLinks] = useState<FooterNavLink[]>(() => cloneEntries(defaultFooterLinks));

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/settings/public', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (payload?.success && payload.settings) {
          if (Array.isArray(payload.settings.footerContacts) && payload.settings.footerContacts.length) {
            setContacts(cloneEntries(payload.settings.footerContacts));
          }
          if (Array.isArray(payload.settings.footerLinks) && payload.settings.footerLinks.length) {
            setNavLinks(cloneEntries(payload.settings.footerLinks));
          }
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      active = false;
    };
  }, []);

  const renderNavItem = (link: FooterNavLink, idx: number) => {
    const isInternal = link.href.startsWith('/');
    const content = (
      <span className="hover:text-[#0a95ff] transition-colors">{link.label}</span>
    );

    if (isInternal) {
      return (
        <Link key={`nav-${idx}`} href={link.href} className="text-[#3c4043]">
          {content}
        </Link>
      );
    }

    return (
      <a
        key={`nav-${idx}`}
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className="text-[#3c4043]"
      >
        {content}
      </a>
    );
  };

  const renderContact = (contact: FooterContactEntry, idx: number) => {
    const Icon = normalizeIconName(contact.icon);
    const badge = (
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-[#0a95ff]" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {contact.label}
          </span>
          <span className="text-xs text-slate-900">{contact.value}</span>
        </div>
      </div>
    );

    const badgeClass =
      'rounded-full border border-white/60 bg-white/40 px-3 py-1 text-[11px] text-[#3c4043] shadow-sm transition hover:border-[#0a95ff] hover:text-[#0a95ff]';

    return contact.href ? (
      <a key={`contact-${idx}`} href={contact.href} className={badgeClass}>
        {badge}
      </a>
    ) : (
      <div key={`contact-${idx}`} className={badgeClass}>
        {badge}
      </div>
    );
  };

  return (
    <footer className="bg-gradient-to-b from-bg-card to-bg-main border-t border-bg-border mt-auto">
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5">
              <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-primary to-blue-400 rounded-md flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-text-main text-sm md:text-base leading-none">
                Scam<span className="text-primary">Guard</span>
              </span>
            </Link>

            {isDesktop && (
              <>
                <span className="text-[#6a737c] shrink-0">|</span>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {navLinks.map(renderNavItem)}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">{contacts.map(renderContact)}</div>

          <p className="text-[#6a737c] truncate min-w-0 lg:ml-auto">© 2025 ScamGuard.</p>
        </div>
      </div>
    </footer>
  );
}
