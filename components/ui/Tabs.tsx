import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
  color?: 'default' | 'emerald' | 'rose' | 'blue';
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = '' 
}) => {
  const getActiveStyles = (color: Tab['color'] = 'default') => {
    const colors = {
      default: 'bg-slate-900 text-white',
      emerald: 'bg-emerald-600 text-white',
      rose: 'bg-rose-600 text-white',
      blue: 'bg-blue-600 text-white',
    };
    return colors[color];
  };

  return (
    <div className={`inline-flex items-center gap-2 p-1 bg-slate-100 rounded-xl ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isActive 
                ? getActiveStyles(tab.color)
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'text-slate-400'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
