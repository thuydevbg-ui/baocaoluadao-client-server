'use client';

import React, { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileText, Check, ChevronDown } from 'lucide-react';

export type ExportColumn = {
  key: string;
  label: string;
  selected?: boolean;
};

type ExportButtonProps = {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename?: string;
  onExport?: (data: Record<string, unknown>[], format: 'csv' | 'xlsx') => void;
};

export default function ExportButton({ 
  data, 
  columns: initialColumns, 
  filename = 'export',
  onExport 
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(
    initialColumns.map(col => ({ ...col, selected: col.selected !== false }))
  );
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [exporting, setExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    );
  };

  const selectAll = () => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: true })));
  };

  const deselectAll = () => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: false })));
  };

  const exportToCSV = useCallback((exportData: Record<string, unknown>[]) => {
    const selected = selectedColumns.filter(col => col.selected);
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất một cột để xuất');
      return;
    }

    const headers = selected.map(col => col.label).join(',');
    const rows = exportData.map(row => 
      selected.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedColumns, filename]);

  const exportToXLSX = useCallback((exportData: Record<string, unknown>[]) => {
    const selected = selectedColumns.filter(col => col.selected);
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất một cột để xuất');
      return;
    }

    // Create XML-based Excel file (compatible with Excel)
    const headers = selected.map(col => col.label);
    
    const xmlRows = exportData.map(row => {
      const cells = selected.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape XML special characters
        const escaped = stringValue
          .replace(/&/g, "[AND]")
          .replace(/</g, "[LT]")
          .replace(/>/g, "[GT]")
          .replace(/"/g, "[QUOT]")
          .replace(/'/g, "[APOS]");
        return escaped;
      });
      return `<Row>${cells.map(cell => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join('')}</Row>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${filename}">
    <Table>
      <Row ss:StyleID="Header">
        ${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
      </Row>
      ${xmlRows.join('\n')}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedColumns, filename]);

  const handleExport = async () => {
    setExporting(true);
    
    try {
      if (onExport) {
        onExport(data, format);
      } else if (format === 'csv') {
        exportToCSV(data);
      } else {
        exportToXLSX(data);
      }
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const selectedCount = selectedColumns.filter(col => col.selected).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting || data.length === 0}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Xuất {format.toUpperCase()}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            {/* Format Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Định dạng
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm ${
                    format === 'csv'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('xlsx')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm ${
                    format === 'xlsx'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Column Selection */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chọn cột ({selectedCount}/{selectedColumns.length})
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-blue-600 hover:underline"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-slate-600 hover:underline"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {selectedColumns.map((column) => (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={column.selected}
                      onChange={() => toggleColumn(column.key)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Info */}
            <div className="mb-4 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
              Sẽ xuất {data.length} dòng dữ liệu với {selectedCount} cột
            </div>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || selectedCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Xuất dữ liệu
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
