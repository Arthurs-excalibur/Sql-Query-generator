import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { fetchHealth } from '../api/db';

export const HealthBanner: React.FC = () => {
  const { data: health, status } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000,
  });

  const isOffline = status === 'error' || (health && !health.ollama);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle size={14} className="text-amber-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {status === 'error' ? 'Backend Server Offline' : 'Ollama Service Disconnected'}
        </span>
        <span className="text-[11px] opacity-70">
          {status === 'error' ? 'Generation and execution are disabled.' : 'SQL generation will fail. Check if Ollama is running.'}
        </span>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 hover:text-amber-900 transition-colors uppercase"
      >
        <RefreshCw size={12} /> Reconnect
      </button>
    </div>
  );
};
