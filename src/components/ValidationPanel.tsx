import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useQueryStore } from '../store/queryStore';

export const ValidationPanel: React.FC = () => {
  const { validation, sql } = useQueryStore();

  if (!sql.trim()) return null;

  const Icon = {
    valid: CheckCircle,
    warning: AlertTriangle,
    error: XCircle
  }[validation.state];

  const colors = {
    valid: 'text-success',
    warning: 'text-warning',
    error: 'text-error'
  }[validation.state];

  return (
    <div className={`flex items-center gap-2 px-1 py-1 transition-all animate-in fade-in slide-in-from-top-1`}>
      <Icon size={14} className={colors} />
      <span className={`text-[13px] font-medium ${colors}`}>
        {validation.state === 'valid' ? 'SQL syntax is valid and ready to execute' : validation.message}
      </span>
    </div>
  );
};
