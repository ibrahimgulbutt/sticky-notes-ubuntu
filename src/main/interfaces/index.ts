import { BrowserWindow } from 'electron';
import type { Note, Settings } from '../../types';

export interface IWindowManager {
  // Dashboard Window
  createDashboardWindow(show?: boolean): BrowserWindow;
  showDashboard(): void;
  hideDashboard(): void;
  toggleDashboard(): void;
  isDashboardVisible(): boolean;
  
  // Settings Window
  createSettingsWindow(): BrowserWindow;
  closeSettingsWindow(): void;
  
  // Note Windows
  createNoteWindow(noteId?: string): BrowserWindow;
  closeNoteWindow(noteId: string): void;
  focusNoteWindow(noteId: string): void;
  isNoteWindowOpen(noteId: string): boolean;
  
  // General Window Management
  closeAllWindows(): void;
  hideAllNoteWindows(): void;
  showAllNoteWindows(): void;
  getWindowById(id: number): BrowserWindow | null;
  broadcast(channel: string, ...args: any[]): void;
  
  // Cleanup
  cleanup(): void;
}

export interface INoteService {
  // CRUD Operations
  createNote(noteData?: Partial<Note>): Promise<Note>;
  getNote(id: string): Promise<Note | null>;
  getAllNotes(): Promise<Note[]>;
  updateNote(id: string, updates: Partial<Note>): Promise<void>;
  deleteNote(id: string): Promise<void>;
  
  // Search & Filter
  searchNotes(query: string): Promise<Note[]>;
  getNotesWithTag(tag: string): Promise<Note[]>;
  
  // Batch Operations
  deleteMultipleNotes(ids: string[]): Promise<void>;
  updateNotesColor(oldColor: string, newColor: string): Promise<Note[]>;
  exportNotes(format: 'json' | 'markdown'): Promise<string>;
  importNotes(data: string, format: 'json' | 'markdown'): Promise<void>;
}

export interface ISettingsService {
  // Settings Management
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<void>;
  resetSettings(): Promise<void>;
  
  // Specific Setting Operations
  updateGlobalShortcuts(shortcuts: Record<string, string>): Promise<void>;
  updateTheme(theme: string): Promise<void>;
  updateAutoSave(enabled: boolean, interval?: number): Promise<void>;
}

export interface ITrayManager {
  // Tray Management
  createTray(): void;
  updateTrayMenu(): void;
  updateTrayTooltip(text: string): void;
  destroyTray(): void;
  
  // Tray Events
  onTrayClick(callback: () => void): void;
  onTrayRightClick(callback: () => void): void;
}

export interface IShortcutManager {
  // Shortcut Management
  registerGlobalShortcuts(): void;
  unregisterAllShortcuts(): void;
  updateShortcut(action: string, shortcut: string): void;
  
  // Shortcut Actions
  onNewNote(callback: () => void): void;
  onNewPinnedNote(callback: () => void): void;
  onShowHideDashboard(callback: () => void): void;
}

export interface IStorageService {
  // Data Persistence
  saveNote(note: Note): Promise<void>;
  loadNote(id: string): Promise<Note | null>;
  saveSettings(settings: Settings): Promise<void>;
  loadSettings(): Promise<Settings>;
  
  // Backup & Recovery
  createBackup(): Promise<string>;
  restoreFromBackup(backupPath: string): Promise<void>;
  
  // Data Management
  getStorageInfo(): Promise<{size: number, noteCount: number}>;
  cleanupOldBackups(): Promise<void>;
}