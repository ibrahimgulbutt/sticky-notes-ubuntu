import React from 'react';
import { Clock } from 'lucide-react';
import type { Settings } from '../../../types';

interface FocusSettingsProps {
  settings: Settings;
  onChange: (key: keyof Settings, value: any) => void;
}

export const FocusSettings: React.FC<FocusSettingsProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
          <Clock size={20} className="text-cyan-accent" />
          Focus Mode
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-text-primary">Default Duration</label>
              <p className="text-xs text-text-secondary">Set the default timer length in minutes</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="120"
                value={settings.focusDuration || 25}
                onChange={(e) => onChange('focusDuration', parseInt(e.target.value) || 25)}
                className="w-20 bg-matte-dark border border-matte-border rounded px-2 py-1 text-text-primary text-right focus:outline-none focus:border-cyan-accent"
              />
              <span className="text-sm text-text-secondary">min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
