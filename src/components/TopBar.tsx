import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bell, 
  HelpCircle, 
  Download, 
  User,
  Search
} from 'lucide-react';
import { useQueryStore } from '../store/queryStore';

export const TopBar: React.FC = () => {
  const { status } = useQueryStore();
  const location = useLocation();

  const tabs = [
    { label: 'Dashboard', path: '/workspace' },
    { label: 'Documentation', path: '/docs' }
  ];

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-primary">SQL Studio</span>
        </div>
        
        <nav className="flex items-center gap-1 h-full">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === '/workspace' && (location.pathname === '/' || location.pathname === '/setup'));
            return (
              <Link
                key={tab.label}
                to={tab.path}
                className={`px-4 h-16 flex items-center text-sm font-medium transition-all relative ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search? */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search queries..."
            className="pl-10 pr-4 py-2 bg-subtle-surface border border-border rounded-lg text-sm w-64 focus:outline-none focus:border-primary transition-all text-text-primary"
          />
        </div>

        <div className="flex items-center gap-2 border-r border-border pr-4">
          <button className="p-2 text-text-secondary hover:bg-subtle-surface rounded-lg transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-2 text-text-secondary hover:bg-subtle-surface rounded-lg transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary text-sm font-bold rounded-lg hover:bg-subtle-surface transition-all shadow-sm active:scale-[0.98]">
            <Download size={14} />
            Export
          </button>
          
          <div className="w-8 h-8 bg-subtle-surface rounded-full border border-border flex items-center justify-center text-text-secondary cursor-pointer hover:border-primary transition-all ml-2">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};
