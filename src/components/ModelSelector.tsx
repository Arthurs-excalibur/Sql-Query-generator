import React from 'react';
import { useQueryStore } from '../store/queryStore';
import { Cpu, Thermometer, Hash } from 'lucide-react';

export const ModelSelector: React.FC = () => {
  const { modelConfig, setModelConfig } = useQueryStore();

  return (
    <div className="flex flex-col gap-4 p-3 bg-subtle-surface rounded-md border border-border">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary">Model Configuration</span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Model Type */}
          <div className="grid grid-cols-2 gap-1 mb-2">
            <div className="col-span-2 text-[9px] font-bold text-text-secondary uppercase border-b border-border/50 mb-1">Local</div>
            {(['qwen2.5-coder:3b', 'qwen2.5-coder:7b'] as const).map(m => (
              <button
                key={m}
                onClick={() => setModelConfig({ type: m })}
                className={`py-1 text-[9px] font-bold uppercase rounded border transition-all ${
                  modelConfig.type === m 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-surface text-text-secondary border-border hover:border-text-secondary/30'
                }`}
              >
                {m.includes('3b') ? '3B' : '7B'}
              </button>
            ))}
            <div className="col-span-2 text-[9px] font-bold text-text-secondary uppercase border-b border-border/50 mb-1 mt-2">Cloud</div>
            {([
              'nvidia/llama-3.1-nemotron-70b-instruct:free',
              'openrouter/free'
            ] as const).map(m => (
              <button
                key={m}
                onClick={() => setModelConfig({ type: m })}
                className={`py-1 text-[9px] font-bold uppercase rounded border transition-all ${
                  modelConfig.type === m 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-surface text-text-secondary border-border hover:border-text-secondary/30'
                }`}
              >
                {m.includes('nemotron') ? 'Nemotron' : 'Auto'}
              </button>
            ))}
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Thermometer size={12} />
                <span className="text-[10px] font-bold uppercase">Temperature</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-primary">{modelConfig.temperature}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1"
              value={modelConfig.temperature}
              onChange={(e) => setModelConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full h-1 bg-border appearance-none cursor-pointer accent-primary rounded-full"
            />
          </div>

          {/* Max Tokens */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Hash size={12} />
                <span className="text-[10px] font-bold uppercase">Max Tokens</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-primary">{modelConfig.maxTokens}</span>
            </div>
            <input 
              type="range" min="100" max="2000" step="100"
              value={modelConfig.maxTokens}
              onChange={(e) => setModelConfig({ maxTokens: parseInt(e.target.value) })}
              className="w-full h-1 bg-border appearance-none cursor-pointer accent-primary rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
