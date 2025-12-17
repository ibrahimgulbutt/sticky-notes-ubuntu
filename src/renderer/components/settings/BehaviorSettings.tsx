import React from 'react';
import type { Settings } from '../../../types';

interface BehaviorSettingsProps {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
}

export const BehaviorSettings: React.FC<BehaviorSettingsProps> = ({ settings, updateSetting }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">Behavior Settings</h2>
      
      {/* Auto Start */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Auto Start</div>
          <div className="text-sm text-text-secondary">Launch app when computer starts</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => updateSetting('autoStart', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-matte-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-accent"></div>
        </label>
      </div>

      {/* Sound Effects */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Sound Effects</div>
          <div className="text-sm text-text-secondary">Play sounds for actions</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-matte-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-accent"></div>
        </label>
      </div>

      {/* Completed Item Behavior */}
      <div>
        <label className="block text-sm font-medium mb-2">Completed Task Behavior</label>
        <select
          value={settings.completedItemBehavior}
          onChange={(e) => updateSetting('completedItemBehavior', e.target.value)}
          className="w-full px-3 py-2 bg-matte-border border border-matte-border rounded-lg text-text-primary focus:border-cyan-accent focus:outline-none"
        >
          <option value="strike">Strikethrough</option>
        </select>
      </div>

      {/* Cyan Bold Text */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Cyan Bold Text</div>
          <div className="text-sm text-text-secondary">Color bold text with cyan accent</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.cyanBold}
            onChange={(e) => updateSetting('cyanBold', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-matte-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-accent"></div>
        </label>
      </div>
    </div>
  );
};
