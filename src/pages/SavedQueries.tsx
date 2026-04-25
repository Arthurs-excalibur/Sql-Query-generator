import React from 'react';
import { useQueryStore } from '../store/queryStore';
import { Bookmark, Trash2, Play, Calendar, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SavedQueriesPage: React.FC = () => {
  const { savedQueries, removeSavedQuery, setQuery, setSql } = useQueryStore();
  const navigate = useNavigate();

  const handleLoad = (q: any) => {
    setQuery(q.query);
    setSql(q.sql);
    navigate('/workspace');
  };

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[1000px] mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <Bookmark size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Saved Queries</h1>
              <p className="text-sm text-text-secondary">Access and reuse your favorite analysis workflows</p>
            </div>
          </div>
          <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            {savedQueries.length} Saved Items
          </div>
        </div>

        {savedQueries.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-border p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-subtle-surface rounded-2xl flex items-center justify-center text-text-secondary mx-auto opacity-50">
              <Bookmark size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-text-primary">No saved queries yet</h3>
              <p className="text-text-secondary text-sm">Save queries from the workspace to see them here.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedQueries.map((q) => (
              <div key={q.id} className="bg-surface rounded-2xl border border-border p-6 space-y-6 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-text-primary truncate pr-4">{q.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(q.timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Database size={12} /> SQL</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeSavedQuery(q.id)}
                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="bg-subtle-surface rounded-xl p-4 border border-border">
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed italic">
                    "{q.query}"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleLoad(q)}
                    className="flex-1 py-3 bg-primary/5 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                  >
                    <Play size={14} fill="currentColor" />
                    Load Workspace
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
