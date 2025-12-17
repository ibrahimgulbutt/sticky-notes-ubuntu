import React from 'react';
import type { Settings } from '../../../types';

interface ShortcutSettingsProps {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
}

export const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({ settings, updateSetting }) => {
  const handleShortcutChange = (key: keyof Settings['shortcuts'], value: string) => {
    updateSetting('shortcuts', {
      ...settings.shortcuts,
      [key]: value
    });
  };

  const allowedShortcuts = ['newNote'];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">Keyboard Shortcuts</h2>
      
      <div className="space-y-4">
        {allowedShortcuts.map((key) => {
          const value = settings.shortcuts?.[key as keyof Settings['shortcuts']];
          if (!value) return null;
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <input
                type="text"
                value={value as string}
                onChange={(e) => handleShortcutChange(key as keyof Settings['shortcuts'], e.target.value)}
                className="px-3 py-1 bg-matte-border border border-matte-border rounded text-sm text-center w-32 focus:border-cyan-accent focus:outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
