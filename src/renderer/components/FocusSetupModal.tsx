import React, { useState } from 'react';
import { X, Clock, Play } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface FocusSetupModalProps {
  onClose: () => void;
  onStart: (duration: number, mode: 'plant' | 'blob') => void;
}

export const FocusSetupModal: React.FC<FocusSetupModalProps> = ({ onClose, onStart }) => {
  const { settings } = useSettingsStore();
  const [duration, setDuration] = useState<string | number>(settings?.focusDuration || 25);
  const [mode, setMode] = useState<'plant' | 'blob'>('plant');

  const handleStart = () => {
    const finalDuration = typeof duration === 'string' ? parseInt(duration) || 25 : duration;
    onStart(finalDuration, mode);
    onClose();
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setDuration('');
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) {
        setDuration(num);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-matte-card border border-matte-border rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Clock size={20} className="text-cyan-accent" />
            Start Focus Session
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Duration (minutes)</label>
            <div className="flex gap-2">
              {[15, 25, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`flex-1 py-2 rounded text-sm transition-colors ${
                    duration === mins
                      ? 'bg-cyan-accent text-black font-medium'
                      : 'bg-matte-dark text-text-secondary hover:bg-matte-light'
                  }`}
                >
                  {mins}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
               <span className="text-xs text-text-muted">Custom:</span>
               <input 
                 type="number" 
                 min="1" 
                 max="180" 
                 value={duration} 
                 onChange={handleDurationChange}
                 className="w-16 bg-matte-dark border border-matte-border rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-cyan-accent"
               />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Visual Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('plant')}
                className={`p-3 rounded border transition-all text-left ${
                  mode === 'plant'
                    ? 'bg-cyan-accent bg-opacity-10 border-cyan-accent'
                    : 'bg-matte-dark border-transparent hover:bg-matte-light'
                }`}
              >
                <div className="font-medium text-text-primary mb-1">🌱 Plant</div>
                <div className="text-xs text-text-muted">Grow a plant while you focus</div>
              </button>
              <button
                onClick={() => setMode('blob')}
                className={`p-3 rounded border transition-all text-left ${
                  mode === 'blob'
                    ? 'bg-cyan-accent bg-opacity-10 border-cyan-accent'
                    : 'bg-matte-dark border-transparent hover:bg-matte-light'
                }`}
              >
                <div className="font-medium text-text-primary mb-1">💧 Blob</div>
                <div className="text-xs text-text-muted">Calm, breathing abstract shape</div>
              </button>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-cyan-accent hover:bg-cyan-hover text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Start Focusing
          </button>
        </div>
      </div>
    </div>
  );
};
