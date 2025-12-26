import React from 'react';
import { Palette, Zap, Keyboard, Database, Clock } from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: 'appearance' | 'behavior' | 'shortcuts' | 'data' | 'focus';
  setActiveTab: (tab: 'appearance' | 'behavior' | 'shortcuts' | 'data' | 'focus') => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'focus', label: 'Focus', icon: Clock }
  ] as const;

  return (
    <div className="w-48 bg-black bg-opacity-20 border-r border-matte-border">
      <nav className="p-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-cyan-accent bg-opacity-20 text-cyan-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white hover:bg-opacity-5'
              }`}
            >
              <Icon size={16} />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
