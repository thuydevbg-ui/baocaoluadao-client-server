'use client';

interface SearchTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function SearchTabs({ tabs, active, onChange }: SearchTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`rounded-full border px-4 py-1.5 text-[12px] font-[500] transition ${
              isActive ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]' : 'border-[#dadce0] bg-white text-[#5f6368] hover:border-[#c7c9cc]'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
