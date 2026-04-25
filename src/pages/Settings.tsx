import React from 'react';
import { useQueryStore } from '../store/queryStore';
import { Settings, Cpu, Thermometer, ShieldCheck, Hash, Globe, Database, CheckCircle2, XCircle, Moon, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { fetchHealth } from '../api/db';

export const SettingsPage: React.FC = () => {
  const { modelConfig, setModelConfig, dataSource, theme, setTheme } = useQueryStore();

  const { data: health, status: healthStatus } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 5000
  });

  const localModels = [
    { id: 'qwen2.5-coder:3b', name: 'Fast', desc: 'Qwen 2.5 3B - Rapid SQL generation' },
    { id: 'qwen2.5-coder:7b', name: 'Balanced', desc: 'Qwen 2.5 7B - Higher accuracy' },
  ] as const;

  const cloudModels = [
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', name: 'Nemotron', desc: 'NVIDIA - High performance (Free)' },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2', desc: 'Google - Intelligent coding' },
    { id: 'openrouter/free', name: 'Auto', desc: 'Dynamic free model selection' },
  ] as const;

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-[800px] mx-auto p-10 space-y-10">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-text-secondary border border-border shadow-sm">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-sm text-text-secondary">Manage your workspace and model configurations.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Active Connection */}
          <section className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
              <Database size={14} /> Active Connection
            </div>
            <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Database size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-text-primary">{dataSource?.name || 'Local DuckDB'}</h4>
                <p className="text-xs text-text-secondary">{dataSource?.details || 'data.db'}</p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">
                CONNECTED
              </span>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
              <Moon size={14} /> Appearance
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-text-secondary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Sun size={20} />
                  </div>
                  <div className="text-sm font-bold text-text-primary">Light Mode</div>
                </div>
                {theme === 'light' && <CheckCircle2 size={18} className="text-primary" />}
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-text-secondary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Moon size={20} />
                  </div>
                  <div className="text-sm font-bold text-text-primary">Dark Mode</div>
                </div>
                {theme === 'dark' && <CheckCircle2 size={18} className="text-primary" />}
              </button>
            </div>
          </section>

          {/* Model Configuration */}
          <section className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-8">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
              <Cpu size={14} /> Model Configuration
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-text-primary">Analytical Engine (LLM)</label>
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest border-b border-border pb-1">Local (Ollama)</div>
                  <div className="grid grid-cols-2 gap-3">
                    {localModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setModelConfig({ type: model.id as any })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          modelConfig.type === model.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-text-secondary/20'
                        }`}
                      >
                        <div className={`text-sm font-bold uppercase mb-1 ${modelConfig.type === model.id ? 'text-primary' : 'text-text-primary'}`}>
                          {model.name}
                        </div>
                        <div className="text-[10px] text-text-secondary leading-tight">
                          {model.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest border-b border-border pb-1 pt-2">Cloud (OpenRouter)</div>
                  <div className="grid grid-cols-3 gap-3">
                    {cloudModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setModelConfig({ type: model.id as any })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          modelConfig.type === model.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-text-secondary/20'
                        }`}
                      >
                        <div className={`text-sm font-bold uppercase mb-1 ${modelConfig.type === model.id ? 'text-primary' : 'text-text-primary'}`}>
                          {model.name}
                        </div>
                        <div className="text-[10px] text-text-secondary leading-tight">
                          {model.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-bold text-text-primary">
                      <Thermometer size={14} className="text-text-secondary" /> Temperature
                    </label>
                    <span className="text-sm font-mono font-bold text-primary">{modelConfig.temperature}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    value={modelConfig.temperature}
                    onChange={(e) => setModelConfig({ temperature: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-subtle-surface rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-text-secondary">Higher values result in more creative SQL (DuckDB optimized).</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-bold text-text-primary">
                      <Hash size={14} className="text-text-secondary" /> Max Tokens
                    </label>
                    <span className="text-sm font-mono font-bold text-primary">{modelConfig.maxTokens}</span>
                  </div>
                  <input 
                    type="range" min="100" max="4000" step="100"
                    value={modelConfig.maxTokens}
                    onChange={(e) => setModelConfig({ maxTokens: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-subtle-surface rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-text-secondary">Limit the context window for complex analytical reasoning.</p>
                </div>
              </div>
            </div>
          </section>

          {/* API Status */}
          <section className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
              <Globe size={14} /> System Status
            </div>
            <div className="p-4 bg-background rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">API Endpoint</span>
                <span className="text-xs font-mono text-text-primary">{health?.endpoint || 'http://localhost:3001'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Backend Server</span>
                <div className="flex items-center gap-1.5">
                  {healthStatus === 'success' ? (
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} /> Operational
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                      <XCircle size={12} /> Offline
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Local LLM (Ollama)</span>
                <div className="flex items-center gap-1.5">
                  {health?.ollama ? (
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                      <XCircle size={12} /> Disconnected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
