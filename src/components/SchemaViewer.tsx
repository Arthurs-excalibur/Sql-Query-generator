import React, { useState } from 'react';
import { Database, ChevronRight, ChevronDown, Table as TableIcon, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSchema } from '../api/db';

export const SchemaViewer: React.FC = () => {
  const [expanded, setExpanded] = useState<string[]>(['users', 'orders']);
  const [search, setSearch] = useState('');

  const { data: schemaData, isLoading, isError, refetch } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
    retry: 1
  });

  const toggle = (name: string) => {
    setExpanded(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const schemaTables = schemaData?.tables || [];
  
  const filteredSchema = schemaTables.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-text-secondary" />
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Database Schema
          </label>
        </div>
        {isLoading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </div>
      
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input 
          type="text"
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-subtle-surface border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-3/4 bg-border rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-subtle-surface rounded animate-pulse ml-4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-3">
            <p className="text-[11px] text-text-secondary italic">Failed to load schema</p>
            <button 
              onClick={() => refetch()}
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filteredSchema.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4 text-center">
            <p className="text-[11px] text-text-secondary italic">No tables found</p>
          </div>
        ) : (
          filteredSchema.map((table: any) => (
            <div key={table.name} className="flex flex-col">
              <button 
                onClick={() => toggle(table.name)}
                className="flex items-center gap-2 py-1.5 hover:text-primary transition-colors text-sm font-medium text-text-primary"
              >
                {expanded.includes(table.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <TableIcon size={14} className="text-text-secondary" />
                {table.name}
              </button>
              
              {expanded.includes(table.name) && (
                <div className="ml-6 flex flex-col gap-1 border-l border-border pl-3 pb-2 mt-1">
                  {table.columns.map((col: any) => (
                    <div key={col.name} className="flex items-center justify-between group">
                      <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{col.name}</span>
                      <span className="text-[9px] font-mono text-text-secondary uppercase">{col.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
