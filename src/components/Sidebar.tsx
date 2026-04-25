import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Code2, 
  Database, 
  FileText,
  Bookmark, 
  Clock, 
  Plus, 
  Settings,
  LifeBuoy,
  ChevronRight
} from 'lucide-react';
import { useQueryStore } from '../store/queryStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { dataSource } = useQueryStore();
  
  const navItems = [
    { icon: Code2, label: 'QUERY EDITOR', path: '/workspace' },
    { icon: Database, label: 'SCHEMA BROWSER', path: '/schema' },
    { icon: FileText, label: 'UPLOADED FILES', path: '/uploads' },
    { icon: Bookmark, label: 'SAVED QUERIES', path: '/saved' },
    { icon: Clock, label: 'HISTORY', path: '/history' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'SETTINGS', path: '/settings' },
    { icon: LifeBuoy, label: 'SUPPORT', path: '/support' },
  ];

  return (
    <aside className="w-[260px] border-r border-border bg-surface flex flex-col shrink-0 h-full transition-colors duration-300">
      <div className="p-6 flex flex-col gap-8 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Connection Card */}
        <div className="p-4 bg-subtle-surface rounded-xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Database size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
              {dataSource?.type === 'sample' ? 'SAMPLE DATASET' : (dataSource?.name || 'NO CONNECTION')}
            </span>
            <span className="text-[11px] text-text-secondary font-medium truncate">
              {dataSource?.details || 'cluster-01.db.internal'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link 
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                  active 
                    ? 'text-primary bg-primary/5 font-bold' 
                    : 'text-text-secondary hover:bg-subtle-surface hover:text-text-primary'
                }`}
              >
                <item.icon size={18} className={active ? 'text-primary' : 'text-[#94A3B8] group-hover:text-[#64748B]'} />
                <span className="text-[11px] tracking-widest font-bold">{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* New Connection Action */}
        <div className="pt-4">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all text-[11px] font-bold tracking-widest uppercase"
          >
            <Plus size={16} />
            New Connection
          </Link>
        </div>
      </div>

      <div className="p-6 border-t border-border flex flex-col gap-1">
        {bottomItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link 
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                active 
                  ? 'text-primary bg-primary/5 font-bold' 
                  : 'text-text-secondary hover:bg-subtle-surface hover:text-text-primary'
              }`}
            >
              <item.icon size={18} className={active ? 'text-primary' : 'text-[#94A3B8]'} />
              <span className="text-[11px] tracking-widest font-bold uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
