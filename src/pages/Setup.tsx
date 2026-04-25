import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryStore } from '../store/queryStore';
import { useQueryClient } from '@tanstack/react-query';
import { uploadFile } from '../api/db';
import { 
  UploadCloud, 
  Database, 
  DatabaseZap, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Thermometer, 
  Hash,
  CheckCircle2
} from 'lucide-react';

type Step = 1 | 2;

export const Setup: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dataSource, setDataSource, modelConfig, setModelConfig } = useQueryStore();
  const [step, setStep] = useState<Step>(dataSource ? 2 : 1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  React.useEffect(() => {
    if (dataSource && step === 1) {
      setStep(2);
    }
  }, [dataSource, step]);

  const [isUploading, setIsUploading] = useState(false);

  const handleSelectSource = (type: 'file' | 'database' | 'sample', name: string, details: string) => {
    setDataSource({ type, name, details });
    setStep(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const res = await uploadFile(file);
      
      // Update store with new table info
      const { setSelectedTable, setQuery, setSql, addUploadedFile } = useQueryStore.getState();
      setSelectedTable(res.table);
      setQuery(`Show me the first 100 rows from ${res.table}`);
      setSql(`SELECT * FROM ${res.table} LIMIT 100;`);
      addUploadedFile(file.name, res.table, file.size);
      
      // Invalidate cache to ensure schema viewer is updated
      queryClient.invalidateQueries({ queryKey: ['schema'] });
      
      // Transition to next step
      handleSelectSource('file', file.name, `Loaded into table: ${res.table}`);
    } catch (err: any) {
      console.error('Upload Error:', err);
      useQueryStore.getState().setLastError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (target) target.value = '';
    }
  };

  const handleStartExploring = () => {
    navigate('/workspace');
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[640px] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {step === 1 ? (
          <>
            {/* Step 1: Choose Data */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-text-primary">Connect your data</h1>
              <p className="text-text-secondary">Start by choosing where your data comes from</p>
            </div>

            <div className="flex flex-col gap-4">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".csv,.parquet"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
                className="group flex items-start gap-5 p-6 bg-surface rounded-2xl border border-transparent hover:border-primary/20 hover:bg-subtle-surface hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {isUploading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={24} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary text-lg">Upload a file</h3>
                  <p className="text-text-secondary">CSV or Parquet (optimized for DuckDB)</p>
                </div>
              </button>

              <button 
                onClick={() => handleSelectSource('sample', 'E-commerce Sample DB', 'Auto-seeded tables: users, orders')}
                className="group flex items-start gap-5 p-6 bg-surface rounded-2xl border border-transparent hover:border-primary/20 hover:bg-subtle-surface hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <DatabaseZap size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary text-lg">Use sample dataset</h3>
                  <p className="text-text-secondary">Explore without setup</p>
                </div>
              </button>

              <button 
                disabled
                className="group flex items-start gap-5 p-6 bg-surface/50 rounded-2xl border border-transparent cursor-not-allowed text-left opacity-60"
              >
                <div className="w-12 h-12 bg-text-secondary/10 rounded-xl flex items-center justify-center text-text-secondary">
                  <Database size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary text-lg">External Database</h3>
                  <p className="text-text-secondary">Postgres, MySQL — Coming Soon</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Configure Workspace */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-text-primary">Set up your workspace</h1>
              <p className="text-text-secondary">You can change these later</p>
            </div>

            <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-8 space-y-8">
                
                {/* Data Confirmation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Selected Data Source
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-subtle-surface rounded-2xl border border-border">
                    <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center text-primary shadow-sm border border-border">
                      {dataSource?.type === 'file' && <UploadCloud size={20} />}
                      {dataSource?.type === 'sample' && <DatabaseZap size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary">{dataSource?.name}</h4>
                      <p className="text-xs text-text-secondary">{dataSource?.details}</p>
                    </div>
                    <CheckCircle2 size={20} className="ml-auto text-green-500" />
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <Cpu size={14} /> Model Configuration
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary border-b border-border pb-2">
                      Local Models (Requires Ollama)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'qwen2.5-coder:3b', title: 'Qwen 2.5 (3B)', desc: 'Fast, low latency' },
                        { id: 'qwen2.5-coder:7b', title: 'Qwen 2.5 (7B)', desc: 'Balanced accuracy' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setModelConfig({ type: m.id as any })}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            modelConfig.type === m.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-subtle-surface'
                          }`}
                        >
                          <div className={`text-sm font-bold mb-1 ${modelConfig.type === m.id ? 'text-primary' : 'text-text-primary'}`}>
                            {m.title}
                          </div>
                          <div className="text-[11px] leading-tight text-text-secondary">
                            {m.desc}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary border-b border-border pb-2 pt-2">
                      Free Cloud Models (OpenRouter API)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', title: 'NVIDIA Nemotron', desc: 'Premium quality (Free)' },
                        { id: 'google/gemma-2-9b-it:free', title: 'Gemma 2 (9B)', desc: 'Optimized by Google' },
                        { id: 'qwen/qwen-2-7b-instruct:free', title: 'Qwen 2 Cloud', desc: 'Powerful coding model' },
                        { id: 'openrouter/free', title: 'Auto-Router', desc: 'Best available free model' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setModelConfig({ type: m.id as any })}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            modelConfig.type === m.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-subtle-surface'
                          }`}
                        >
                          <div className={`text-sm font-bold mb-1 ${modelConfig.type === m.id ? 'text-primary' : 'text-text-primary'}`}>
                            {m.title}
                          </div>
                          <div className="text-[11px] leading-tight text-text-secondary">
                            {m.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="pt-2">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                  >
                    Advanced settings
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary">
                          <div className="flex items-center gap-2"><Thermometer size={14} /> Temperature</div>
                          <span className="text-primary font-mono">{modelConfig.temperature}</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.1"
                          value={modelConfig.temperature}
                          onChange={(e) => setModelConfig({ temperature: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-subtle-surface rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary">
                          <div className="flex items-center gap-2"><Hash size={14} /> Max Tokens</div>
                          <span className="text-primary font-mono">{modelConfig.maxTokens}</span>
                        </div>
                        <input 
                          type="range" min="100" max="4000" step="100"
                          value={modelConfig.maxTokens}
                          onChange={(e) => setModelConfig({ maxTokens: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-subtle-surface rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-8 bg-subtle-surface border-t border-border flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleStartExploring}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                  Start Exploring
                </button>
                <button 
                  onClick={() => {
                    setDataSource(null);
                    setStep(1);
                  }}
                  className="px-8 py-4 bg-surface text-text-secondary font-bold rounded-2xl border border-border hover:bg-subtle-surface transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
