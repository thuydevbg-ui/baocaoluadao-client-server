'use client';

import React, { useState, useCallback } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';

export type DateRange = {
  from: string;
  to: string;
};

export type AdvancedSearchField = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange' | 'multiselect';
  placeholder?: string;
  options?: { value: string; label: string }[];
};

type AdvancedSearchProps = {
  fields: AdvancedSearchField[];
  onSearch: (values: Record<string, string | string[] | DateRange | null>) => void;
  onReset: () => void;
  placeholder?: string;
};

export default function AdvancedSearch({ fields, onSearch, onReset, placeholder = 'Tìm kiếm...' }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | string[] | DateRange | null>>({});
  const [quickSearch, setQuickSearch] = useState('');

  const handleQuickSearch = useCallback(() => {
    // Apply quick search to all text fields
    const searchValues: Record<string, string | string[] | DateRange | null> = { ...values };
    fields.forEach(field => {
      if (field.type === 'text') {
        searchValues[field.key] = quickSearch;
      }
    });
    setValues(searchValues);
    onSearch(searchValues);
  }, [quickSearch, fields, values, onSearch]);

  const handleFieldChange = (key: string, value: string | string[] | DateRange | null) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
  };

  const handleApply = () => {
    onSearch(values);
    setIsOpen(false);
  };

  const handleReset = () => {
    setValues({});
    setQuickSearch('');
    onReset();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(values).filter(key => {
    const value = values[key];
    if (value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && 'from' in value && !value.from) return false;
    return true;
  }).length;

  const renderField = (field: AdvancedSearchField) => {
    const value = values[field.key];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
          >
            <option value="">{field.placeholder || `Chọn ${field.label.toLowerCase()}`}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
          />
        );

      case 'daterange':
        const dateRange = (value as DateRange) || { from: '', to: '' };
        return (
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleFieldChange(field.key, { ...dateRange, from: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
            />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleFieldChange(field.key, { ...dateRange, to: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
            />
          </div>
        );

      case 'multiselect':
        const selected = (value as string[]) || [];
        return (
          <div className="relative">
            <div className="min-h-[42px] rounded-lg border border-slate-200 bg-white p-1 flex flex-wrap gap-1">
              {selected.map((val) => {
                const opt = field.options?.find(o => o.value === val);
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    {opt?.label || val}
                    <button
                      type="button"
                      onClick={() => {
                        const newSelected = selected.filter(v => v !== val);
                        handleFieldChange(field.key, newSelected);
                      }}
                      className="ml-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !selected.includes(e.target.value)) {
                    handleFieldChange(field.key, [...selected, e.target.value]);
                  }
                }}
                className="flex-1 border-none bg-transparent text-sm outline-none min-w-[100px]"
              >
                <option value="">Chọn...</option>
                {field.options?.filter(o => !selected.includes(o.value)).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </div>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            isOpen || activeFilterCount > 0
              ? 'border-slate-400 bg-slate-100 text-slate-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Lọc
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {isOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Bộ lọc nâng cao</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
