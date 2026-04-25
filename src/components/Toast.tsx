import React, { useEffect, useState } from 'react';
import { useQueryStore } from '../store/queryStore';
import { AlertCircle, X, Info, CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const lastError = useQueryStore(s => s.lastError);
  const setLastError = useQueryStore(s => s.setLastError);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastError) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setLastError(null), 300); // Wait for exit animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastError, setLastError]);

  if (!lastError && !isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
    }`}>
      <div className="bg-[#1A1C1E] text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 min-w-[320px] max-w-[480px]">
        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-0.5">System Error</h4>
          <p className="text-sm text-white/90 leading-snug truncate">{lastError}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 text-white/30 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
