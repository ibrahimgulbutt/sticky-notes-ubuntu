import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import type { Settings } from '../../../types';

interface AppearanceSettingsProps {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, updateSetting }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">Appearance Settings</h2>
      
      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium mb-2">Font Size</label>
        <input
          type="range"
          min="10"
          max="24"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
          className="w-full h-2 bg-matte-border rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>10px</span>
          <span className="text-cyan-accent">{settings.fontSize}px</span>
          <span>24px</span>
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium mb-2">Font Family</label>
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          className="w-full px-3 py-2 bg-matte-border border border-matte-border rounded-lg text-text-primary focus:border-cyan-accent focus:outline-none"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="system-ui">System Default</option>
          <option value="Consolas">Consolas (Monospace)</option>
          <option value="Fira Code">Fira Code (Monospace)</option>
        </select>
      </div>

      {/* Default Note Color */}
      <div>
        <label className="block text-sm font-medium mb-2">Default Note Color</label>
        <div className="flex space-x-2">
          {['#111214', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#7209b7'].map((color) => (
            <button
              key={color}
              onClick={() => {
                console.log('Setting default note color to:', color);
                updateSetting('defaultNoteColor', color);
              }}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                settings.defaultNoteColor === color
                  ? 'border-cyan-accent scale-110'
                  : 'border-matte-border hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
