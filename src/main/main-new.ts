import { app, globalShortcut } from 'electron';
import Store from 'electron-store';
import type { Note, Settings } from '../types';

// Import modular services and managers
import { WindowManager } from './managers/WindowManager';
import { TrayManager } from './managers/TrayManager';
import { NoteService } from './services/NoteService';
import { IPCHandlers } from './handlers/IPCHandlers';

class StickyNotesApp {
  private store: Store<{notes: Note[], settings: Settings}>;
  private windowManager: WindowManager;
  private trayManager: TrayManager;
  private noteService: NoteService;
  private ipcHandlers: IPCHandlers;

  constructor() {
    // Initialize store with defaults
    this.store = new Store<{notes: Note[], settings: Settings}>({
      defaults: {
        notes: [],
        settings: {
          theme: 'dark',
          autoSave: true,
          autoSaveInterval: 5,
          versionHistoryLength: 50,
          globalShortcuts: {
            newNote: 'CommandOrControl+Alt+N',
            showHide: 'CommandOrControl+Alt+B',
            newPinnedNote: 'CommandOrControl+Shift+Alt+N',
          },
          completedItemBehavior: 'strike',
          autoStart: false,
          restoreLastNotes: true,
          fontSize: 14,
          fontFamily: 'Inter',
          autoHide: false,
          defaultNoteColor: '#111214',
          showLineNumbers: false,
          wordWrap: true,
          spellCheck: true,
          notifications: true,
          soundEnabled: false,
          autoBackup: true,
          backupInterval: 30,
          maxBackups: 10,
          shortcuts: {
            newNote: 'Ctrl+N',
            newPinnedNote: 'Ctrl+Shift+N',
            toggleDashboard: 'Ctrl+D',
            search: 'Ctrl+F',
            save: 'Ctrl+S'
          }
        },
      },
    });

    // Initialize services and managers
    this.noteService = new NoteService(this.store);
    this.windowManager = new WindowManager();
    this.trayManager = new TrayManager();
    this.ipcHandlers = new IPCHandlers(this.noteService, this.windowManager);

    // Make this app a single instance app
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
    } else {
      this.init();
    }
  }

  private init(): void {
    app.whenReady().then(() => {
      this.windowManager.createDashboardWindow();
      this.setupTray();
      this.registerGlobalShortcuts();
      this.setupSettingsHandlers();
      
      // Restore pinned notes if setting is enabled
      this.restorePinnedNotes();
    });

    // FIXED: Proper app lifecycle management
    app.on('window-all-closed', () => {
      // Keep app running for tray functionality - don't quit
      // App will only quit when explicitly requested through tray menu
    });

    app.on('activate', () => {
      // On macOS, recreate window when dock icon is clicked
      this.windowManager.showDashboard();
    });

    app.on('second-instance', () => {
      // If someone tries to run another instance, focus our window instead
      this.windowManager.showDashboard();
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
      this.cleanup();
    });
  }

  private setupTray(): void {
    this.trayManager.createTray();
    
    // Set up tray callbacks
    this.trayManager.setMenuCallbacks({
      newNote: () => this.createNewNote(),
      newPinnedNote: () => this.createNewNote(true),
      showDashboard: () => this.windowManager.showDashboard(),
      hideDashboard: () => this.windowManager.hideDashboard(),
      toggleAllNotes: () => this.toggleAllNotes(),
      openSettings: () => this.windowManager.createSettingsWindow(),
      quit: () => this.quit(),
    });

    // FIXED: Tray click behavior - toggle dashboard
    this.trayManager.onTrayClick(() => {
      this.windowManager.toggleDashboard();
    });
  }

  private setupSettingsHandlers(): void {
    this.ipcHandlers.addSettingsHandlers(
      async () => this.getSettings(),
      async (settings) => this.updateSettings(settings)
    );
  }

  private registerGlobalShortcuts(): void {
    const settings = this.getSettings();
    
    globalShortcut.register(settings.globalShortcuts.newNote, () => {
      this.createNewNote();
    });

    globalShortcut.register(settings.globalShortcuts.newPinnedNote, () => {
      this.createNewNote(true);
    });

    globalShortcut.register(settings.globalShortcuts.showHide, () => {
      this.windowManager.toggleDashboard();
    });
  }

  // Note management methods
  private async createNewNote(pinned = false): Promise<string> {
    // Check if there's already an empty note
    const emptyNote = await this.noteService.findEmptyNote();
    
    if (emptyNote) {
      // Update pinned status if needed
      if (emptyNote.pinned !== pinned) {
        await this.noteService.updateNote(emptyNote.id, { pinned });
      }
      
      // Open the existing empty note window
      this.windowManager.createNoteWindow(emptyNote.id);
      return emptyNote.id;
    }
    
    // Create new note only if no empty note exists
    const note = await this.noteService.createNote({ pinned });
    this.windowManager.createNoteWindow(note.id);
    return note.id;
  }

  private toggleAllNotes(): void {
    // This method needs to be implemented in WindowManager
    // For now, we'll implement a basic version
    this.windowManager.showAllNoteWindows(); // or hideAllNoteWindows based on state
  }

  private async restorePinnedNotes(): Promise<void> {
    const settings = this.getSettings();
    if (settings.restoreLastNotes) {
      const pinnedNotes = await this.noteService.getPinnedNotes();
      
      pinnedNotes.forEach(note => {
        this.windowManager.createNoteWindow(note.id);
      });
    }
  }

  // Settings management
  private getSettings(): Settings {
    return this.store.get('settings') as Settings;
  }

  private async updateSettings(updates: Partial<Settings>): Promise<void> {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    this.store.set('settings', newSettings);

    // Re-register global shortcuts if they changed
    if (updates.globalShortcuts) {
      globalShortcut.unregisterAll();
      this.registerGlobalShortcuts();
    }
  }

  // App lifecycle
  private quit(): void {
    this.windowManager.closeAllWindows();
    app.quit();
  }

  private cleanup(): void {
    this.windowManager.cleanup();
    this.trayManager.destroyTray();
    globalShortcut.unregisterAll();
  }
}

// Start the application
new StickyNotesApp();