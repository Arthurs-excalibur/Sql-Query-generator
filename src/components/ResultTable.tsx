import React, { useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender, 
  createColumnHelper 
} from '@tanstack/react-table';
import { useQueryStore } from '../store/queryStore';
import { Download, ChevronLeft, ChevronRight, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

export const ResultTable: React.FC = () => {
  const { result, status, pagination } = useQueryStore();

  const columns = useMemo(() => {
    if (result.length === 0) return [];
    return Object.keys(result[0]).map(key => 
      columnHelper.accessor(key, {
        header: key.toUpperCase().replace(/_/g, ' '),
        cell: info => {
          const value = info.getValue();
          if (value === null || value === undefined) return <span className="text-text-secondary italic opacity-50">—</span>;
          
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            return new Date(value).toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric', year: 'numeric' 
            });
          }

          if (key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
          }

          if (typeof value === 'boolean') {
            return value ? 
              <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded uppercase">True</span> : 
              <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded uppercase">False</span>;
          }

          if (value === 'ACTIVE' || value === 'COMPLETED' || value === 'SUCCESS') {
            return <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded uppercase">{value}</span>;
          }

          return String(value);
        },
      })
    );
  }, [result]);

  const table = useReactTable({
    data: result,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const exportData = (type: 'csv' | 'json') => {
    if (result.length === 0) return;
    let content = '';
    let fileName = `query_results_${new Date().getTime()}`;
    
    if (type === 'json') {
      content = JSON.stringify(result, null, 2);
      fileName += '.json';
    } else {
      const headers = Object.keys(result[0]).join(',');
      const rows = result.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      content = `${headers}\n${rows}`;
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'executing') {
    return (
      <div className="bg-surface overflow-hidden p-4 space-y-4">
        <div className="flex gap-4 border-b border-border pb-4">
          <div className="w-24 h-4 bg-border rounded animate-pulse" />
          <div className="w-32 h-4 bg-border rounded animate-pulse" />
          <div className="w-20 h-4 bg-border rounded animate-pulse" />
          <div className="w-24 h-4 bg-border rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-24 h-3 bg-subtle-surface rounded animate-pulse" />
            <div className="w-32 h-3 bg-subtle-surface rounded animate-pulse" />
            <div className="w-20 h-3 bg-subtle-surface rounded animate-pulse" />
            <div className="w-24 h-3 bg-subtle-surface rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-surface h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-text-primary">Query Execution Failed</h3>
          <p className="text-text-secondary text-xs max-w-[300px] mx-auto">
            The database was unable to process this query. Please check your SQL syntax or table names.
          </p>
        </div>
        <button 
          onClick={() => useQueryStore.getState().setSql('')}
          className="text-[11px] font-bold text-primary hover:underline uppercase tracking-widest"
        >
          Reset Workspace
        </button>
      </div>
    );
  }

  if (result.length === 0) {
    return (
      <div className="bg-surface h-48 flex flex-col items-center justify-center text-text-secondary gap-3">
        <div className="w-12 h-12 bg-subtle-surface rounded-xl flex items-center justify-center opacity-50">
          <FileSpreadsheet size={24} />
        </div>
        <p className="italic text-xs">Run a query to see results</p>
      </div>
    );
  }

  return (
    <div className="bg-surface flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse font-mono text-[12px]">
          <thead className="sticky top-0 bg-subtle-surface z-10 border-b border-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2.5 font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-subtle-surface/50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 text-text-primary whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination & Export Footer */}
      <div className="px-4 py-3 border-t border-border bg-subtle-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 text-text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 text-text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest border-l border-border pl-6">
            {pagination ? pagination.totalRows : result.length} Total Rows
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => exportData('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:text-primary hover:bg-surface rounded-lg border border-transparent hover:border-border transition-all uppercase tracking-wider"
          >
            <FileSpreadsheet size={14} /> CSV
          </button>
          <button 
            onClick={() => exportData('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:text-primary hover:bg-surface rounded-lg border border-transparent hover:border-border transition-all uppercase tracking-wider"
          >
            <FileJson size={14} /> JSON
          </button>
        </div>
      </div>
    </div>
  );
};
