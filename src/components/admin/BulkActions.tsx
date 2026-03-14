'use client';

import React, { useState, useCallback } from 'react';
import { CheckSquare, Square, Trash2, RefreshCw, ToggleLeft, ToggleRight, Download, MoreVertical } from 'lucide-react';

export type BulkAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'danger' | 'success' | 'warning';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
};

type BulkActionsProps<T> = {
  items: T[];
  selectedIds: string[];
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
  onAction: (actionId: string, selectedIds: string[]) => Promise<void>;
  actions: BulkAction[];
  getId: (item: T) => string;
  disabled?: boolean;
};

export default function BulkActions<T>({
  items,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onAction,
  actions,
  getId,
  disabled = false,
}: BulkActionsProps<T>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll(items.map(getId));
    }
  };

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation && selectedIds.length > 0) {
      setPendingAction(action);
      return;
    }
    
    await executeAction(action);
  };

  const executeAction = async (action: BulkAction) => {
    setIsProcessing(true);
    try {
      await onAction(action.id, selectedIds);
      onDeselectAll();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const handleConfirm = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
  };

  const getVariantStyles = (variant: BulkAction['variant']) => {
    switch (variant) {
      case 'danger':
        return 'text-rose-600 hover:bg-rose-50 border-rose-200';
      case 'success':
        return 'text-emerald-600 hover:bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-600 hover:bg-amber-50 border-amber-200';
      default:
        return 'text-slate-600 hover:bg-slate-50 border-slate-200';
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {/* Select All */}
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {allSelected || someSelected ? (
            <CheckSquare className="h-4 w-4 text-slate-600" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
          <span className="hidden sm:inline">
            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </span>
        </button>

        {/* Divider */}
        {selectedIds.length > 0 && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            
            {/* Selected Count */}
            <span className="text-sm font-medium text-slate-600">
              {selectedIds.length} đã chọn
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {actions.slice(0, 3).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={isProcessing}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${getVariantStyles(action.variant)} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                );
              })}

              {actions.length > 3 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowActions(!showActions)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {showActions && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                      <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        {actions.slice(3).map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => {
                                handleAction(action);
                                setShowActions(false);
                              }}
                              disabled={isProcessing}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${getVariantStyles(action.variant)} disabled:opacity-50`}
                            >
                              <Icon className="h-4 w-4" />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Xác nhận hành động
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {pendingAction.confirmationMessage || `Bạn có chắc muốn thực hiện hành động "${pendingAction.label}" trên ${selectedIds.length} mục đã chọn?`}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  pendingAction.variant === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-slate-900 hover:bg-slate-800'
                } disabled:opacity-50`}
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper hook for managing bulk selection
export function useBulkSelection<T>(items: T[], getId: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  return {
    selectedIds,
    handleSelectAll,
    handleDeselectAll,
    handleToggle,
    isSelected,
    allSelected,
    someSelected,
    hasSelection: selectedIds.length > 0,
  };
}
