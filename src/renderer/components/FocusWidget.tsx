import React, { useEffect, useState } from 'react';
import { FocusSession, TimerState } from '../../types';
import { X } from 'lucide-react';
import PlantVisualization from './PlantVisualization';
import BlobVisualization from './BlobVisualization';

const FocusWidget: React.FC = () => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [hovered, setHovered] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(30); // Default size

  useEffect(() => {
    // Initial state
    window.electronAPI.getFocusState().then((s: any) => setSession(s));

    // Listen for updates
    const removeListener = window.electronAPI.onFocusUpdate((remaining: number, state: string) => {
      setSession(prev => prev ? { ...prev, remaining, state: state as TimerState } : null);
    });

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Calculate font size based on smallest dimension (approx 15%)
      const newSize = Math.min(width, height) * 0.15;
      setFontSize(Math.max(16, newSize)); // Minimum 16px
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => {
      removeListener();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!session) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = session.duration * 60;
  const progress = Math.max(0, Math.min(1, (totalSeconds - session.remaining) / totalSeconds));
  const isPaused = session.state === 'paused';

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Visualization Layer */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${hovered ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
        {session.mode === 'plant' && (
          <PlantVisualization progress={progress} isPaused={isPaused} />
        )}
        {session.mode === 'blob' && (
          <BlobVisualization progress={progress} isPaused={isPaused} />
        )}
        {/* Fallback or overlay for time if needed */}
      </div>

      {/* Time Display (Always visible but styled differently based on hover) */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${hovered ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
         <span 
           className="text-white font-mono font-bold tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] select-none"
           style={{ fontSize: `${fontSize}px` }}
         >
            {formatTime(session.remaining)}
         </span>
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-200 ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
           {session.state === 'running' && (
             <button 
               onClick={(e) => { e.stopPropagation(); window.electronAPI.pauseFocus(); }}
               className="p-3 bg-yellow-500/80 hover:bg-yellow-500 text-white rounded-full transition-colors shadow-lg transform hover:scale-110"
               title="Pause"
               style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
             >
               ⏸
             </button>
           )}
           {session.state === 'paused' && (
             <button 
               onClick={(e) => { e.stopPropagation(); window.electronAPI.resumeFocus(); }}
               className="p-3 bg-green-500/80 hover:bg-green-500 text-white rounded-full transition-colors shadow-lg transform hover:scale-110"
               title="Resume"
               style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
             >
               ▶
             </button>
           )}
           <button 
             onClick={(e) => { e.stopPropagation(); window.electronAPI.stopFocus(); }}
             className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors shadow-lg transform hover:scale-110"
             title="Stop Session"
             style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
           >
             ⏹
           </button>
      </div>

      {/* Close Button (Hide Widget) */}
      <div 
        className={`absolute top-0 right-0 p-4 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); window.electronAPI.hideFocusWidget(); }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          title="Hide Widget (Timer continues)"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default FocusWidget;
