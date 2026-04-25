import React from 'react';
import { QueryInput } from '../components/QueryInput';
import { SQLEditor } from '../components/SQLEditor';
import { ResultTable } from '../components/ResultTable';
import { QueryHistory } from '../components/QueryHistory';
import { ValidationPanel } from '../components/ValidationPanel';
import { useQueryStore } from '../store/queryStore';
import { Copy, Check, Bookmark } from 'lucide-react';
import { AIInsight } from '../components/AIInsight';

export const Workspace: React.FC = () => {
  const { explanation, sql, status } = useQueryStore();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!sql || !useQueryStore.getState().query) return;
    const queryText = useQueryStore.getState().query;
    const title = queryText.split('\n')[0].slice(0, 50) || 'Untitled Query';
    useQueryStore.getState().saveQuery(title, queryText, sql);
    alert('Query saved successfully!');
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Column 1: Query & History */}
      <div className="w-[400px] border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-6 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar">
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Query</h2>
            <QueryInput />
          </section>

          <section className="flex-1 flex flex-col gap-4 min-h-0 border-t border-border pt-8">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">History</h2>
            <div className="flex-1 overflow-y-auto pr-2">
              <QueryHistory />
            </div>
          </section>
        </div>
      </div>

      {/* Column 2: Result & Editor */}
      <div className="flex-1 bg-background overflow-y-auto custom-scrollbar">
        <div className="max-w-[1000px] mx-auto p-8 space-y-8">
          
          {/* SQL Editor Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">SQL Output</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-primary transition-colors uppercase"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <div className="w-px h-3 bg-border" />
              <button 
                onClick={handleSave}
                disabled={!sql}
                className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-primary transition-colors uppercase disabled:opacity-30"
              >
                <Bookmark size={12} />
                Save
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-surface">
              <SQLEditor />
              <ValidationPanel />
            </div>
          </section>

          {/* AI Insight Section */}
          <AIInsight explanation={explanation} status={status} />

          {/* Results Section */}
          <section className="space-y-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Execution Result</span>
            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
              <ResultTable />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
