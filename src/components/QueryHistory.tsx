import React from 'react';
import { useQueryStore } from '../store/queryStore';
import { History, Terminal, ChevronRight } from 'lucide-react';

export const QueryHistory: React.FC = () => {
  const { history, setQuery, setSql } = useQueryStore();

  const handleSelect = (item: { query: string; sql: string }) => {
    setQuery(item.query);
    setSql(item.sql);
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center gap-2">
        <History size={14} className="text-text-secondary" />
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Recent History
        </label>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {history.length > 0 ? (
          <div className="flex flex-col gap-1">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="flex flex-col gap-1 p-2 rounded-md hover:bg-subtle-surface text-left group transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-text-secondary/40 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-medium text-text-primary line-clamp-1 truncate w-48">
                      {item.query}
                    </span>
                  </div>
                  <ChevronRight size={12} className="text-text-secondary/20 group-hover:text-primary transition-colors" />
                </div>
                <code className="text-[10px] font-mono text-text-secondary/60 line-clamp-1 overflow-hidden">
                  {item.sql.replace(/\n/g, ' ')}
                </code>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center border border-dashed border-border rounded-md text-[11px] text-text-secondary/50 uppercase tracking-widest italic">
            No history yet
          </div>
        )}
      </div>
    </div>
  );
};
