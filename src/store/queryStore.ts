import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DataSource {
  type: 'file' | 'database' | 'sample';
  name: string;
  details?: string;
}

export interface ModelConfig {
  type: 
    | 'qwen2.5-coder:3b' 
    | 'qwen2.5-coder:7b' 
    | 'nvidia/llama-3.1-nemotron-70b-instruct:free'
    | 'google/gemma-2-9b-it:free'
    | 'qwen/qwen-2-7b-instruct:free'
    | 'openrouter/free'
    | 'custom';
  customUrl?: string;
  temperature: number;
  maxTokens: number;
}

export interface Validation {
  state: 'valid' | 'error' | 'warning';
  message: string;
}

export interface SavedQuery {
  id: string;
  title: string;
  query: string;
  sql: string;
  timestamp: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  tableName: string;
  timestamp: number;
  size?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
}

interface QueryState {
  query: string;
  sql: string;
  result: any[];
  explanation: string;
  status: 'idle' | 'loading' | 'ready' | 'executing' | 'error';
  history: Array<{ query: string; sql: string; timestamp: number }>;
  validation: Validation;
  pagination: PaginationState | null;
  modelConfig: ModelConfig;
  dataSource: DataSource | null;
  selectedTable: string;
  lastError: string | null;
  sessionId: string;
  
  // Actions
  setQuery: (query: string) => void;
  setSql: (sql: string) => void;
  setResult: (result: any[], explanation?: string, pagination?: PaginationState | null) => void;
  setExplanation: (explanation: string) => void;
  setStatus: (status: QueryState['status']) => void;
  setValidation: (validation: Validation) => void;
  setModelConfig: (config: Partial<ModelConfig>) => void;
  setDataSource: (dataSource: DataSource | null) => void;
  setSelectedTable: (table: string) => void;
  addToHistory: (query: string, sql: string) => void;
  clearWorkspace: () => void;
  setLastError: (error: string | null) => void;
  savedQueries: SavedQuery[];
  saveQuery: (title: string, query: string, sql: string) => void;
  removeSavedQuery: (id: string) => void;
  uploadedFiles: UploadedFile[];
  addUploadedFile: (name: string, tableName: string, size?: number) => void;
  removeUploadedFile: (id: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useQueryStore = create<QueryState>()(
  persist(
    (set) => ({
      query: '',
      sql: '',
      result: [],
      explanation: '',
      status: 'idle',
      history: [],
      validation: { state: 'valid', message: '' },
      pagination: null,
      modelConfig: {
        type: 'qwen2.5-coder:3b',
        temperature: 0.2,
        maxTokens: 500,
      },
      dataSource: null,
      selectedTable: 'users',
      lastError: null,
      sessionId: crypto.randomUUID(),
      savedQueries: [],

      setQuery: (query) => set({ query }),
      setSql: (sql) => set({ sql }),
      setResult: (result, explanation = '', pagination) => set((state) => ({ 
        result, 
        explanation, 
        pagination: pagination !== undefined ? pagination : state.pagination, 
        status: 'ready', 
        lastError: null 
      })),
      setExplanation: (explanation) => set({ explanation }),
      setStatus: (status) => set({ status }),
      setValidation: (validation) => set({ validation }),
      setModelConfig: (config) => set((state) => ({ 
        modelConfig: { ...state.modelConfig, ...config } 
      })),
      setDataSource: (dataSource) => set({ dataSource }),
      setSelectedTable: (selectedTable) => set({ selectedTable }),
      addToHistory: (query, sql) => set((state) => ({
        history: [{ query, sql, timestamp: Date.now() }, ...state.history].slice(0, 50)
      })),
      setLastError: (lastError) => set({ lastError }),
      clearWorkspace: () => set({ 
        query: '', 
        sql: '', 
        result: [], 
        explanation: '', 
        status: 'idle',
        pagination: null,
        validation: { state: 'valid', message: '' },
        lastError: null
      }),
      saveQuery: (title, query, sql) => set((state) => ({
        savedQueries: [
          { id: crypto.randomUUID(), title, query, sql, timestamp: Date.now() },
          ...state.savedQueries
        ]
      })),
      removeSavedQuery: (id) => set((state) => ({
        savedQueries: state.savedQueries.filter(q => q.id !== id)
      })),
      uploadedFiles: [],
      addUploadedFile: (name, tableName, size) => set((state) => ({
        uploadedFiles: [
          { id: crypto.randomUUID(), name, tableName, timestamp: Date.now(), size },
          ...state.uploadedFiles
        ]
      })),
      removeUploadedFile: (id) => set((state) => ({
        uploadedFiles: state.uploadedFiles.filter(f => f.id !== id)
      })),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sql-query-generator-storage',
      partialize: (state) => ({
        history: state.history,
        modelConfig: state.modelConfig,
        dataSource: state.dataSource,
        selectedTable: state.selectedTable,
        savedQueries: state.savedQueries,
        uploadedFiles: state.uploadedFiles,
        theme: state.theme,
        sessionId: state.sessionId,
      }),
    }
  )
);
