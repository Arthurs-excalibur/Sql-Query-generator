import React, { useState, useMemo } from 'react';
import { useQueryStore } from '../store/queryStore';
import { 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const history = useQueryStore(s => s.history);
  const setQuery = useQueryStore(s => s.setQuery);
  const setSql = useQueryStore(s => s.setSql);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  const handleReuse = (item: { query: string, sql: string }) => {
    setQuery(item.query);
    setSql(item.sql);
    navigate('/workspace');
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sql.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[1000px] mx-auto p-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-text-secondary border border-border shadow-sm">
                <Clock size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Query History</h1>
                <p className="text-sm text-text-secondary">Review and reuse your previous analytical computations.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary text-sm font-bold rounded-lg hover:bg-subtle-surface transition-all">
                <Filter size={16} />
                Filter
              </button>
              <button 
                onClick={() => navigate('/workspace')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
              >
                <Play size={16} fill="currentColor" />
                New Query
              </button>
            </div>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text"
              placeholder="Search in history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border py-3.5 pl-12 pr-4 rounded-xl text-sm focus:outline-none focus:border-primary shadow-sm text-text-primary"
            />
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item, idx) => (
              <div 
                key={idx}
                className="group bg-surface p-6 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => handleReuse({ query: item.query, sql: item.sql })}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                      {item.query}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                      <CheckCircle2 size={14} />
                      Success
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary font-medium">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="p-1 text-text-secondary hover:bg-subtle-surface rounded transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-subtle-surface p-4 rounded-lg border border-border relative group-hover:border-primary/10 transition-all">
                  <code className="text-[13px] font-mono text-text-secondary line-clamp-1 block pr-12">
                    {item.sql}
                  </code>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                    REUSE <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border">
              <p className="text-text-secondary text-sm">No queries found in history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
