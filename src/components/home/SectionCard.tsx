'use client';

import { ReactNode } from 'react';

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ title, description, actions, children, className = '' }: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm ${className}`}>
      {(title || description || actions) && (
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1">
            {title && <p className="text-[16px] font-semibold text-[#202124]">{title}</p>}
            {description && <p className="text-[13px] text-[#5f6368]">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
