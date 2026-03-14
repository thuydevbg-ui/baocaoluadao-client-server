export type FooterContactEntry = {
  label: string;
  value: string;
  icon: string;
  href?: string;
};

export type FooterNavLink = {
  label: string;
  href: string;
  icon?: string;
};

export const defaultFooterContacts: FooterContactEntry[] = [
  { label: 'Hotline', value: '1900-xxxx', icon: 'phone', href: 'tel:1900xxxx' },
  { label: 'Email', value: 'support@scamguard.vn', icon: 'mail', href: 'mailto:support@scamguard.vn' },
  { label: 'Địa chỉ', value: 'Hà Nội, Việt Nam', icon: 'map-pin' },
];

export const defaultFooterLinks: FooterNavLink[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Tra cứu', href: '/search' },
  { label: 'Báo cáo', href: '/report' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Bảo mật', href: '/privacy' },
];
