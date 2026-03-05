import React from 'react';
import { Search } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  statusOptions: Option[];
  typeOptions: Option[];
};

export default function FilterBar({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  typeValue,
  onTypeChange,
  statusOptions,
  typeOptions,
}: FilterBarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/70">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by ID, target, reporter, description..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </label>

        <select
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={typeValue}
          onChange={(event) => onTypeChange(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
