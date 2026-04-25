import { API_BASE_URL } from './config';

const API_URL = API_BASE_URL;

export const generateSQL = async (query: string, model: string): Promise<{ sql: string; explanation: string }> => {
  const res = await fetch(`${API_URL}/sql/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, model })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate SQL');
  }
  
  const data = await res.json();
  return {
    sql: data.sql,
    explanation: data.explanation || "SQL generated successfully. Review the query and click 'Run Query' to execute it."
  };
};

export const fixSQL = async (sql: string, error: string, model: string): Promise<string> => {
  const res = await fetch(`${API_URL}/sql/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query: `The following SQL failed:\nSQL:\n${sql}\n\nError:\n${error}\n\nFix the query using the schema. Return only corrected SQL.`, 
      model 
    })
  });
  
  if (!res.ok) {
    throw new Error('Failed to fix SQL');
  }
  
  const data = await res.json();
  return data.sql;
};

import { useQueryStore } from '../store/queryStore';

export const runPipelineStream = async (
  query: string, 
  model: string, 
  callbacks: {
    onStatus?: (status: string) => void;
    onSqlChunk?: (chunk: string) => void;
    onSqlDone?: (sql: string) => void;
    onValidation?: (valid: boolean) => void;
    onResult?: (rows: any[], columns: string[]) => void;
    onExpChunk?: (chunk: string) => void;
    onError?: (error: string) => void;
  },
  abortSignal?: AbortSignal
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(`${API_URL}/sql/stream`, window.location.origin);
      url.searchParams.append('query', query);
      url.searchParams.append('model', model);

      const response = await fetch(url.toString(), {
        signal: abortSignal,
        headers: {
          'X-Session-ID': useQueryStore.getState().sessionId
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to start stream');
      }

      if (!response.body) throw new Error("ReadableStream not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') {
              resolve();
              return;
            }
            
            try {
              const payload = JSON.parse(dataStr);
              switch (payload.event) {
                case 'status':
                  callbacks.onStatus?.(payload.data);
                  break;
                case 'sql_chunk':
                  callbacks.onSqlChunk?.(payload.data);
                  break;
                case 'sql_done':
                  callbacks.onSqlDone?.(payload.data);
                  break;
                case 'validation':
                  callbacks.onValidation?.(payload.data.valid);
                  break;
                case 'result':
                  callbacks.onResult?.(payload.data.rows, payload.data.columns);
                  break;
                case 'exp_chunk':
                  callbacks.onExpChunk?.(payload.data);
                  break;
                case 'error':
                  callbacks.onError?.(payload.data);
                  reject(new Error(payload.data));
                  return;
                case 'done':
                  resolve();
                  return;
              }
            } catch (e) {
              console.error("Failed to parse SSE payload:", e);
            }
          }
        }
      }
      resolve();
    } catch (e: any) {
      if (e.name === 'AbortError') {
        resolve(); // Resolve cleanly on abort
      } else {
        callbacks.onError?.(e.message);
        reject(e);
      }
    }
  });
};
