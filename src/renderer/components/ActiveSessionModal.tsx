import React, { useEffect, useState } from 'react';
import { X, Clock, Play, Eye, Square } from 'lucide-react';
import { FocusSession } from '../../types';

interface ActiveSessionModalProps {
  onClose: () => void;
}

export const ActiveSessionModal: React.FC<ActiveSessionModalProps> = ({ onClose }) => {
  const [session, setSession] = useState<FocusSession | null>(null);

  useEffect(() => {
    // Initial fetch
    window.electronAPI.getFocusState().then((s: any) => setSession(s));
    
    // Set up listener
    const removeListener = window.electronAPI.onFocusUpdate((remaining: number, state: string) => {
      setSession(prev => {
        if (!prev) return { remaining, state: state as any, isActive: true, duration: 25, mode: 'plant', startTime: Date.now() };
        return { ...prev, remaining, state: state as any };
      });
    });

    return () => {
      removeListener();
    };
  }, []);

  const handleShowWidget = () => {
    window.electronAPI.showFocusWidget();
    onClose();
  };

  const handleStopSession = () => {
    window.electronAPI.stopFocus();
    onClose();
  };

  if (!session) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-matte-card border border-matte-border rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Clock size={20} className="text-cyan-accent" />
            Active Session
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl font-mono font-bold text-white mb-2">
            {formatTime(session.remaining)}
          </div>
          <div className="text-sm text-text-secondary capitalize">
            {session.state} • {session.mode} Mode
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleShowWidget}
            className="w-full py-3 bg-cyan-accent hover:bg-cyan-hover text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Show Widget
          </button>
          
          <button
            onClick={handleStopSession}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Square size={18} />
            Stop Session
          </button>
        </div>
      </div>
    </div>
  );
};
