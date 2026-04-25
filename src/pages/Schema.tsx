import React, { useState } from 'react';
import { 
  Database, Search, ChevronRight, Table as TableIcon,
  Fingerprint, Link2, ListOrdered, Eye, Code, Copy, Check, Settings,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { useQueryStore } from '../store/queryStore';
import { useQuery } from '@tanstack/react-query';
import { fetchSchema } from '../api/db';

const generateDDL = (tableName: string, columns: any[]) => {
  const columnDefs = columns.map(c => `  ${c.name} ${c.type}`).join(',\n');
  return `CREATE TABLE "${tableName}" (\n${columnDefs}\n);`;
};

export const SchemaPage: React.FC = () => {
  const { selectedTable, setSelectedTable } = useQueryStore();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: schemaData, isLoading, isError, refetch } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">Loading Schema...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="bg-surface p-8 rounded-3xl border border-border shadow-xl max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">Schema Sync Failed</h2>
            <p className="text-sm text-text-secondary">We couldn't reach the database to fetch the latest schema information.</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tables = schemaData?.tables || [];
  
  // Task 3.5: Use enriched backend data
  const enrichedSchema = tables.map((t: any) => ({
    name: t.name,
    schema: 'public',
    rows: t.rowCount?.toLocaleString() || '0',
    size: '~',
    columns: t.columns || [],
    pk: 'N/A', // DuckDB doesn't always show these via PRAGMA easily without more logic
    fk: 'N/A',
    indexes: 'N/A',
    preview: t.preview || [],
    ddl: generateDDL(t.name, t.columns || [])
  }));

  const currentTable = enrichedSchema.find((t: any) => t.name === selectedTable) || enrichedSchema[0] || { 
    name: 'No data', 
    columns: [], 
    rows: '0', 
    preview: [], 
    ddl: '-- No schema available' 
  };

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(currentTable.ddl || '');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Column 1: Table List */}
      <div className="w-[300px] border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text"
              placeholder="Search tables..."
              className="w-full bg-subtle-surface border border-border py-2 pl-9 pr-4 rounded-lg text-xs focus:outline-none focus:border-primary text-text-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">PUBLIC</h3>
              <div className="space-y-1">
                {enrichedSchema.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase())).map((table: any) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                      selectedTable === table.name 
                        ? 'bg-primary/5 text-primary font-bold' 
                        : 'text-text-secondary hover:bg-subtle-surface hover:text-text-primary'
                    }`}
                  >
                    <TableIcon size={14} className={selectedTable === table.name ? 'text-primary' : 'text-text-secondary'} />
                    <span className="text-[13px]">{table.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Table Details */}
      <div className="flex-1 bg-background overflow-y-auto custom-scrollbar">
        <div className="max-w-[1000px] mx-auto p-8 space-y-8">
          
          {/* Header */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                <TableIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">Table: {currentTable.name}</h1>
                <p className="text-xs text-text-secondary flex items-center gap-3 mt-1">
                  <span>Schema: <span className="text-text-primary font-medium">{currentTable.schema}</span></span>
                  <span className="w-1 h-1 bg-border rounded-full" />
                  <span>Rows: <span className="text-text-primary font-medium">{currentTable.rows}</span></span>
                </p>
              </div>
            </div>
            <button className="p-2 text-text-secondary hover:bg-subtle-surface rounded-lg transition-colors border border-border">
              <Settings size={20} />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <TableIcon size={12} className="text-primary" /> COLUMNS
              </div>
              <div className="text-sm font-bold text-text-primary">{currentTable.columns?.length || 0} fields</div>
            </div>
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Database size={12} className="text-primary" /> ENGINE
              </div>
              <div className="text-sm font-bold text-text-primary">DuckDB</div>
            </div>
          </div>

          {/* Raw Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
                <Eye size={14} /> Raw Preview (Sample)
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase">Read-Only</span>
            </div>
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="border-b border-border bg-subtle-surface">
                    {currentTable.columns?.map((col: any) => (
                      <th key={col.name} className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                        {col.name} <span className="text-[8px] opacity-60 ml-1">[{col.type}]</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTable.preview?.length > 0 ? (
                    currentTable.preview.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-subtle-surface/50 transition-colors">
                        {currentTable.columns?.map((col: any) => (
                          <td key={col.name} className="px-6 py-4 text-[13px] text-text-primary whitespace-nowrap">
                            {String(row[col.name] ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={currentTable.columns?.length || 1} className="px-6 py-10 text-center text-text-secondary text-sm italic">
                        No preview data available for this table.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Generated DDL */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
                <Code size={14} /> Generated DDL
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-primary transition-colors uppercase"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-code-bg p-6 rounded-2xl border border-border shadow-lg overflow-hidden">
              <pre className="text-[13px] text-code-text font-mono leading-relaxed whitespace-pre-wrap">
                {currentTable.ddl}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
