import React from 'react';
import { Pin, Lock, Minimize2, Maximize2, X } from 'lucide-react';
import type { Note } from '../../types';

interface NoteHeaderProps {
  note: Note;
  isMinimized: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePin: () => void;
  onToggleLock: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({
  note,
  isMinimized,
  onTitleChange,
  onTogglePin,
  onToggleLock,
  onMinimize,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between p-1.5 bg-black bg-opacity-20 drag-handle">
      <input
        type="text"
        value={note.title}
        onChange={onTitleChange}
        className="bg-transparent text-text-primary text-sm font-medium border-none outline-none flex-1 min-w-0 no-drag"
        placeholder="Note title"
        disabled={note.locked}
      />

      <div
        className="flex items-center space-x-1 no-drag flex-shrink-0"
      >
        <button
          onClick={onTogglePin}
          className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
            note.pinned ? 'text-cyan-accent' : 'text-text-secondary'
          }`}
          title="Pin note"
        >
          <Pin size={12} />
        </button>

        <button
          onClick={onToggleLock}
          className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
            note.locked ? 'text-cyan-accent' : 'text-text-secondary'
          }`}
          title="Lock note"
        >
          <Lock size={12} />
        </button>

        <button
          onClick={onMinimize}
          className="p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 text-text-secondary"
          title="Minimize"
        >
          {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
        </button>

        <button
          onClick={onClose}
          className="p-1 rounded text-xs hover:bg-red-500 hover:bg-opacity-20 text-text-secondary hover:text-red-400"
          title="Close note"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
