import type { Note, Settings } from './types';

declare global {
  interface Window {
    electronAPI: {
      // Note operations
      createNote: (noteData: Partial<Note>) => Promise<Note>;
      updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
      deleteNote: (id: string) => Promise<void>;
      getNote: (id: string) => Promise<Note | null>;
      getAllNotes: () => Promise<Note[]>;
      searchNotes: (query: string) => Promise<Note[]>;

      // Window operations
      createNoteWindow: (noteId?: string) => Promise<number>;
      closeWindow: (windowId: number) => Promise<void>;
      togglePin: (windowId?: number) => Promise<void>;
      toggleLock: (windowId?: number) => Promise<void>;
      openSettings: () => Promise<void>;
      getCurrentWindowId: () => Promise<number | null>;

      // Settings
      getSettings: () => Promise<Settings>;
      updateSettings: (settings: Partial<Settings>) => Promise<void>;

      // Export/Import
      exportNotes: (format: 'json' | 'markdown') => Promise<void>;
      importNotes: () => Promise<void>;

      // Event listeners
      onLockStateChanged: (callback: (data: { noteId: string; locked: boolean }) => void) => () => void;
      onSettingsUpdated: (callback: (settings: Settings) => void) => () => void;
      onNoteUpdated: (callback: (note: Note) => void) => () => void;

      // Window info
      getCurrentWindowId: () => Promise<number | null>;
      getNoteId: () => string | null;

      // Utility
      platform: string;
    };
  }
}