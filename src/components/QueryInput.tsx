import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryStore } from '../store/queryStore';
import { Sparkles, Play, XCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateSQL, runPipelineStream } from '../api/llm';
import { runQuery, fetchSchema } from '../api/db';

export const QueryInput: React.FC = () => {
  const query = useQueryStore(s => s.query);
  const sql = useQueryStore(s => s.sql);
  const status = useQueryStore(s => s.status);
  const validation = useQueryStore(s => s.validation);
  const modelConfig = useQueryStore(s => s.modelConfig);
  
  const setQuery = useQueryStore(s => s.setQuery);
  const setSql = useQueryStore(s => s.setSql);
  const setStatus = useQueryStore(s => s.setStatus);
  const setResult = useQueryStore(s => s.setResult);
  const setValidation = useQueryStore(s => s.setValidation);
  const addToHistory = useQueryStore(s => s.addToHistory);
  const setLastError = useQueryStore(s => s.setLastError);

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { data: schemaData } = useQuery({ 
    queryKey: ['schema'], 
    queryFn: fetchSchema 
  });

  const generateMutation = useMutation({
    mutationFn: (q: string) => generateSQL(q, modelConfig.type),
    onSuccess: (data) => {
      setSql(data.sql);
      setResult([], data.explanation);
      setStatus('ready');
      setValidation({ state: 'valid', message: '' });
      addToHistory(query, data.sql);
    },
    onError: (error: Error) => {
      if (error.name === 'AbortError') return;
      setStatus('error');
      setValidation({ state: 'error', message: error.message });
      setLastError(`Generation Failed: ${error.message}`);
    },
  });

  const executeMutation = useMutation({
    mutationFn: (s: string) => runQuery(s),
    onSuccess: (data) => {
      setResult(data.rows, '', data.pagination);
      setStatus('ready');
      setValidation({ state: 'valid', message: '' });
    },
    onError: (error: Error) => {
      if (error.name === 'AbortError') return;
      setStatus('error');
      setValidation({ state: 'error', message: error.message });
      setLastError(`Execution Failed: ${error.message}`);
    },
  });

  const handlePipeline = async (q: string) => {
    setStatus('executing');
    setSql('');
    useQueryStore.getState().setResult([], '');
    
    try {
      await runPipelineStream(
        q,
        modelConfig.type,
        {
          onStatus: (statusStr) => {
            // Optional: you could add a status message field in Zustand if you wanted to display this
          },
          onSqlChunk: (chunk) => {
            setSql(useQueryStore.getState().sql + chunk);
          },
          onSqlDone: (fullSql) => {
            setSql(fullSql);
          },
          onValidation: (valid) => {
            setValidation(valid ? { state: 'valid', message: '' } : { state: 'error', message: 'Validation failed' });
          },
          onResult: (rows, columns) => {
            setResult(rows, useQueryStore.getState().explanation);
            addToHistory(q, useQueryStore.getState().sql);
          },
          onExpChunk: (chunk) => {
            const currentExp = useQueryStore.getState().explanation || '';
            useQueryStore.getState().setExplanation(currentExp + chunk);
          },
          onError: (err) => {
            setStatus('error');
            setValidation({ state: 'error', message: err });
            setLastError(`Process Failed: ${err}`);
          }
        },
        abortController?.signal
      );
      if (useQueryStore.getState().status !== 'error') {
        setStatus('ready');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setStatus('error');
        setValidation({ state: 'error', message: e.message });
      }
    }
  };

  const handleExecute = async () => {
    if (!query.trim() || status === 'loading' || status === 'executing') return;
    
    const controller = new AbortController();
    setAbortController(controller);

    if (!sql.trim()) {
      handlePipeline(query);
    } else {
      setStatus('executing');
      executeMutation.mutate(sql);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setStatus('idle');
      setAbortController(null);
    }
  };

  const handleExecuteRef = useRef(handleExecute);
  handleExecuteRef.current = handleExecute;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleReset = () => {
    setQuery('');
    setSql('');
    setResult([], '');
  };

  const isGenerating = status === 'loading';
  const isExecuting = status === 'executing';

  const suggestions = useMemo(() => {
    const tables = schemaData?.tables || [];
    if (tables.length === 0) return ["Show me all available tables"];
    
    const dynamicSuggestions: string[] = [];
    
    tables.slice(0, 4).forEach((t: any) => {
      const colNames = (t.columns || []).map((c: any) => c.name.toLowerCase());
      
      const hasDate = colNames.some((c: string) => c.includes('date') || c.includes('time') || c.includes('year'));
      const hasStatus = colNames.some((c: string) => c.includes('status') || c.includes('state') || c.includes('category'));
      const hasMoney = colNames.some((c: string) => c.includes('price') || c.includes('amount') || c.includes('revenue') || c.includes('sales'));
      const hasId = colNames.some((c: string) => c === 'id' || c.endsWith('_id'));
      
      if (hasMoney && hasDate) {
        dynamicSuggestions.push(`Show total revenue over time from ${t.name}`);
      } else if (hasStatus) {
        dynamicSuggestions.push(`Count records by status in ${t.name}`);
      } else if (hasMoney) {
        dynamicSuggestions.push(`Calculate total amount from ${t.name}`);
      } else if (hasDate) {
        dynamicSuggestions.push(`Show the most recent 10 records from ${t.name}`);
      } else if (hasId) {
        dynamicSuggestions.push(`Count total unique records in ${t.name}`);
      } else {
        dynamicSuggestions.push(`Show me the first 10 rows from ${t.name}`);
      }
    });

    // Ensure we have exactly 4 suggestions if possible, falling back to generics if needed
    if (dynamicSuggestions.length < 4 && tables.length > 0) {
      dynamicSuggestions.push(`Show all columns in ${tables[0].name}`);
    }
    
    return dynamicSuggestions.slice(0, 4);
  }, [schemaData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <textarea
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (sql) setSql('');
          }}
          placeholder="e.g. 'Show me the top 10 users by total spend'"
          className="w-full h-40 p-4 bg-subtle-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all resize-none font-sans leading-relaxed shadow-inner text-text-primary"
        />
        
        {!query && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => setQuery(s)}
                className="text-[10px] px-2 py-1 bg-surface border border-border text-text-secondary rounded-md hover:border-primary hover:text-primary transition-all uppercase font-bold tracking-wider"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {(isGenerating || isExecuting) ? (
          <button
            onClick={handleCancel}
            className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
          >
            <XCircle size={18} />
            Cancel Operation
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExecute}
              disabled={!query.trim() || !!(sql && validation.state === 'error')}
              className="btn-primary w-full py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              {!sql ? (
                <>
                  <Sparkles size={18} />
                  Generate & Run
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Run Query
                </>
              )}
            </button>

            {status === 'error' && (
              <button 
                onClick={() => {
                  const firstTable = schemaData?.tables?.[0]?.name || 'table_name';
                  setSql(`SELECT * FROM ${firstTable} LIMIT 10;`);
                  setValidation({ state: 'warning', message: 'Using basic template fallback due to error.' });
                  setStatus('ready');
                }}
                className="w-full py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              >
                Auto-Fix: Use Basic Template
              </button>
            )}
          </div>
        )}
        
        {query && !isGenerating && !isExecuting && (
          <button 
            onClick={handleReset}
            className="w-full text-[11px] font-bold text-text-secondary hover:text-red-500 transition-colors uppercase tracking-widest text-center"
          >
            Clear Workspace
          </button>
        )}
      </div>
    </div>
  );
};
