import { contextBridge, ipcRenderer } from 'electron';
import type { Note, Settings } from '../types';

// Get the current window ID from the renderer process
const getCurrentWindowId = () => {
  return ipcRenderer.invoke('window:get-current-id');
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Note operations
  createNote: (noteData: Partial<Note>) => ipcRenderer.invoke('note:create', noteData),
  updateNote: (id: string, updates: Partial<Note>) => ipcRenderer.invoke('note:update', id, updates),
  deleteNote: (id: string) => ipcRenderer.invoke('note:delete', id),
  getNote: (id: string) => ipcRenderer.invoke('note:get', id),
  getAllNotes: () => ipcRenderer.invoke('note:getAll'),
  searchNotes: (query: string) => ipcRenderer.invoke('note:search', query),

  // Window operations
  createNoteWindow: (noteId?: string) => ipcRenderer.invoke('window:create-note', noteId),
  closeWindow: (windowId: number) => ipcRenderer.invoke('window:close', windowId),
  togglePin: (windowId?: number) => {
    if (windowId) {
      return ipcRenderer.invoke('window:toggle-pin', windowId);
    } else {
      return ipcRenderer.invoke('window:toggle-pin-current');
    }
  },
  toggleLock: (windowId?: number) => {
    if (windowId) {
      return ipcRenderer.invoke('window:toggle-lock', windowId);
    } else {
      return ipcRenderer.invoke('window:toggle-lock-current');
    }
  },
  openSettings: () => ipcRenderer.invoke('window:open-settings'),
  getCurrentWindowId,

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<Settings>) => ipcRenderer.invoke('settings:update', settings),

  // Export/Import
  exportNotes: (format: 'json' | 'markdown') => ipcRenderer.invoke('export:notes', format),
  importNotes: () => ipcRenderer.invoke('import:notes'),

  // Focus Widget
  startFocus: (duration: number, mode: string) => ipcRenderer.send('focus:start', duration, mode),
  pauseFocus: () => ipcRenderer.send('focus:pause'),
  resumeFocus: () => ipcRenderer.send('focus:resume'),
  stopFocus: () => ipcRenderer.send('focus:stop'),
  hideFocusWidget: () => ipcRenderer.send('focus:hide'),
  showFocusWidget: () => ipcRenderer.send('focus:show'),
  getFocusState: () => ipcRenderer.invoke('focus:get-state'),
  onFocusUpdate: (callback: (remaining: number, state: string) => void) => {
    const listener = (_: any, remaining: number, state: string) => callback(remaining, state);
    ipcRenderer.on('focus:update-timer', listener);
    return () => ipcRenderer.removeListener('focus:update-timer', listener);
  },

  // Event listeners
  onLockStateChanged: (callback: (data: { noteId: string; locked: boolean }) => void) => {
    const listener = (event: any, data: { noteId: string; locked: boolean }) => callback(data);
    ipcRenderer.on('note:lock-state-changed', listener);
    return () => ipcRenderer.removeListener('note:lock-state-changed', listener);
  },
  onSettingsUpdated: (callback: (settings: Settings) => void) => {
    const listener = (event: any, settings: Settings) => callback(settings);
    ipcRenderer.on('settings:updated', listener);
    return () => ipcRenderer.removeListener('settings:updated', listener);
  },
  onNoteUpdated: (callback: (note: Note) => void) => {
    const listener = (event: any, note: Note) => callback(note);
    ipcRenderer.on('note:updated', listener);
    return () => ipcRenderer.removeListener('note:updated', listener);
  },

  // Window info
  getNoteId: () => {
    // Note ID will be passed via additional arguments and accessed in renderer
    return null;
  },

  // Utility
  platform: process.platform,
});