import React from 'react';
import Editor from '@monaco-editor/react';
import { useQueryStore } from '../store/queryStore';
import { useQuery } from '@tanstack/react-query';
import { fetchSchema } from '../api/db';

export const SQLEditor: React.FC = () => {
  const sql = useQueryStore(s => s.sql);
  const setSql = useQueryStore(s => s.setSql);
  const setValidation = useQueryStore(s => s.setValidation);
  const status = useQueryStore(s => s.status);
  const theme = useQueryStore(s => s.theme);

  const { data: schemaData } = useQuery({ 
    queryKey: ['schema'], 
    queryFn: fetchSchema 
  });

  const handleEditorChange = (value: string | undefined) => {
    const newSql = value || '';
    setSql(newSql);
    
    // Basic real-time validation
    if (newSql.toLowerCase().includes('drop') || newSql.toLowerCase().includes('delete')) {
      setValidation({ state: 'error', message: 'Destructive operations are not allowed in this workspace.' });
    } else if (newSql.length > 0 && !newSql.toLowerCase().includes('limit')) {
      setValidation({ state: 'warning', message: 'Query missing LIMIT clause. Performance may be impacted.' });
    } else {
      setValidation({ state: 'valid', message: '' });
    }
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('precision-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
        { token: 'string', foreground: '10b981' },
        { token: 'comment', foreground: '94a3b8' },
        { token: 'number', foreground: 'f59e0b' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#1A1C1E',
        'editor.lineHighlightBackground': '#F8FAFC',
        'editor.selectionBackground': '#E2E8F0',
        'editorCursor.foreground': '#3B82F6',
        'editorLineNumber.foreground': '#94A3B8',
        'editor.inactiveSelectionBackground': '#F1F5F9',
      }
    });

    monaco.editor.defineTheme('precision-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'comment', foreground: '64748b' },
        { token: 'number', foreground: 'fbbf24' },
      ],
      colors: {
        'editor.background': '#0F172A',
        'editor.foreground': '#F8FAFC',
        'editor.lineHighlightBackground': '#1E293B',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#60A5FA',
        'editorLineNumber.foreground': '#475569',
        'editor.inactiveSelectionBackground': '#1E293B',
      }
    });

    // Task 4.4: Register Completion Provider
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions: any[] = [];
        
        if (schemaData?.tables) {
          schemaData.tables.forEach((table: any) => {
            // Table suggestions
            suggestions.push({
              label: table.name,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: table.name,
              detail: 'Table'
            });

            // Column suggestions
            if (table.columns) {
              table.columns.forEach((col: any) => {
                suggestions.push({
                  label: `${table.name}.${col.name}`,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: col.name,
                  detail: `${col.type} (from ${table.name})`
                });
                // Also add bare column name
                suggestions.push({
                  label: col.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: col.name,
                  detail: col.type
                });
              });
            }
          });
        }

        return { suggestions };
      }
    });
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-surface">
        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">DuckDB Engine</span>
      </div>
      <div className="flex-1 overflow-hidden bg-surface relative">
        {status === 'loading' ? (
          <div className="absolute inset-0 p-6 space-y-4">
            <div className="w-3/4 h-4 bg-subtle-surface rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-subtle-surface rounded animate-pulse" />
            <div className="w-5/6 h-4 bg-subtle-surface rounded animate-pulse" />
            <div className="w-2/3 h-4 bg-subtle-surface rounded animate-pulse" />
            <div className="w-1/3 h-4 bg-subtle-surface rounded animate-pulse" />
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage="sql"
            theme={theme === 'dark' ? 'precision-dark' : 'precision-light'}
            value={sql}
            onChange={handleEditorChange}
            beforeMount={handleEditorWillMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono',
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'all',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
