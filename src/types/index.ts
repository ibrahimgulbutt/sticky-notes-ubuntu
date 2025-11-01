export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  color: string;
  accent: string;
  pinned: boolean;
  locked: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
  versions: NoteVersion[];
}

export interface NoteVersion {
  at: string;
  body: string;
  title: string;
}

export interface Theme {
  id: string;
  name: string;
  background: string;
  cardBackground: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export interface Settings {
  theme: string;
  autoSave: boolean;
  autoSaveInterval: number;
  versionHistoryLength: number;
  globalShortcuts: {
    newNote: string;
    showHide: string;
    newPinnedNote: string;
  };
  completedItemBehavior: 'strike' | 'archive' | 'delete';
  autoStart: boolean;
  restoreLastNotes: boolean;
  fontSize: number;
  fontFamily: string;
  
  // New comprehensive settings
  autoHide: boolean;
  defaultNoteColor: string;
  showLineNumbers: boolean;
  wordWrap: boolean;
  spellCheck: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  autoBackup: boolean;
  backupInterval: number;
  maxBackups: number;
  shortcuts: {
    newNote: string;
    newPinnedNote: string;
    toggleDashboard: string;
    search: string;
    save: string;
  };
}

export interface AppState {
  notes: Note[];
  settings: Settings;
  activeNoteId?: string;
  dashboardVisible: boolean;
}

export type WindowType = 'dashboard' | 'note' | 'settings';

export interface WindowData {
  type: WindowType;
  noteId?: string;
}

export interface IpcEvents {
  // Note operations
  'note:create': (note: Partial<Note>) => Note;
  'note:update': (id: string, updates: Partial<Note>) => void;
  'note:delete': (id: string) => void;
  'note:get': (id: string) => Note | null;
  'note:getAll': () => Note[];
  'note:search': (query: string) => Note[];
  
  // Window operations
  'window:create': (type: WindowType, data?: any) => void;
  'window:close': (windowId: number) => void;
  'window:toggle-pin': (windowId: number) => void;
  'window:toggle-lock': (windowId: number) => void;
  'window:set-always-on-top': (windowId: number, alwaysOnTop: boolean) => void;
  'window:set-ignore-mouse-events': (windowId: number, ignore: boolean) => void;
  'window:show-dashboard': () => void;
  'window:hide-dashboard': () => void;
  
  // Settings
  'settings:get': () => Settings;
  'settings:update': (settings: Partial<Settings>) => void;
  
  // Export/Import
  'export:notes': (format: 'json' | 'markdown') => void;
  'import:notes': (filePath: string) => void;
  
  // Tray
  'tray:create-note': () => void;
  'tray:create-pinned-note': () => void;
  'tray:toggle-visibility': () => void;
  'tray:quit': () => void;
}