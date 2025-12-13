import { create } from 'zustand';
import type { Note, Settings } from '../../types';

interface NoteState {
  note: Note | null;
  settings: Settings | null;
  isLoading: boolean;
  isMinimized: boolean;
  
  // Actions
  setNote: (note: Note | null) => void;
  updateNoteLocal: (updates: Partial<Note>) => void;
  setSettings: (settings: Settings) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleMinimize: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  note: null,
  settings: null,
  isLoading: true,
  isMinimized: false,

  setNote: (note) => set({ note }),
  
  updateNoteLocal: (updates) => 
    set((state) => ({
      note: state.note ? { ...state.note, ...updates } : null
    })),

  setSettings: (settings) => set({ settings }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
}));
