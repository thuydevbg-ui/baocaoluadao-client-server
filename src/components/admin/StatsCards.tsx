import React from 'react';
import { LucideIcon } from 'lucide-react';

type Tone = 'amber' | 'emerald' | 'rose' | 'sky' | 'slate';

const toneStyles: Record<Tone, { card: string; iconWrap: string; icon: string }> = {
  amber: {
    card: 'bg-amber-50/70 border-amber-200/70',
    iconWrap: 'bg-amber-100',
    icon: 'text-amber-600',
  },
  emerald: {
    card: 'bg-emerald-50/70 border-emerald-200/70',
    iconWrap: 'bg-emerald-100',
    icon: 'text-emerald-600',
  },
  rose: {
    card: 'bg-rose-50/70 border-rose-200/70',
    iconWrap: 'bg-rose-100',
    icon: 'text-rose-600',
  },
  sky: {
    card: 'bg-sky-50/80 border-sky-200/70',
    iconWrap: 'bg-sky-100',
    icon: 'text-sky-600',
  },
  slate: {
    card: 'bg-slate-50 border-slate-200/70',
    iconWrap: 'bg-slate-100',
    icon: 'text-slate-600',
  },
};

export type StatCardItem = {
  id: string;
  icon: LucideIcon;
  value: number | string;
  title: string;
  subtitle: string;
  tone?: Tone;
};

export default function StatsCards({ items }: { items: StatCardItem[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const style = toneStyles[item.tone || 'slate'];

        return (
          <article
            key={item.id}
            className={`rounded-xl border px-5 py-4 shadow-sm shadow-slate-200/70 ${style.card}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.title}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${style.iconWrap}`}>
                <Icon className={`h-4 w-4 ${style.icon}`} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
