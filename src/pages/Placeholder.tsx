import React from 'react';
import { Bookmark, LifeBuoy } from 'lucide-react';

export const PlaceholderPage: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => {
  return (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-text-secondary border border-border shadow-sm mx-auto">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary">This feature is coming soon.</p>
        </div>
      </div>
    </div>
  );
};
