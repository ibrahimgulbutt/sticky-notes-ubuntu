import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, dialog, shell } from 'electron';
import { join } from 'path';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import type { Note, Settings, WindowData } from '../types';

class StickyNotesApp {
  private store: Store<{notes: Note[], settings: Settings}>;
  private windows: Map<number, BrowserWindow> = new Map();
  private tray: Tray | null = null;
  private dashboardWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private noteWindows: Map<string, BrowserWindow> = new Map();

  constructor() {
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
          // New comprehensive settings with defaults
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

    // Make this app a single instance app
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
    } else {
      this.init();
    }
  }

  private init() {
    app.whenReady().then(() => {
      this.createDashboardWindow();
      this.createTray();
      this.registerGlobalShortcuts();
      this.registerIpcHandlers();
      
      // Restore pinned notes if setting is enabled
      if (this.getSettings().restoreLastNotes) {
        this.restorePinnedNotes();
      }
    });

    app.on('window-all-closed', () => {
      // Keep app running even if all windows are closed (for tray functionality)
      if (process.platform !== 'darwin') {
        // Don't quit the app, keep it running for tray functionality
      }
    });

    app.on('activate', () => {
      // On macOS, recreate window when dock icon is clicked
      this.showDashboard();
    });

    app.on('second-instance', () => {
      // If someone tries to run another instance, focus our window instead
      this.showDashboard();
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
    });
  }

  private createDashboardWindow() {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.focus();
      return;
    }

    this.dashboardWindow = new BrowserWindow({
      width: 380,
      height: 580,
      minWidth: 350,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0B0C0D',
      show: false,
      resizable: true,
      icon: join(__dirname, '../assets/icon.png'),
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.dashboardWindow.loadURL('http://localhost:3000/dashboard.html');
      this.dashboardWindow.webContents.openDevTools();
    } else {
      this.dashboardWindow.loadFile(join(__dirname, '../renderer/dashboard.html'));
    }

    this.dashboardWindow.once('ready-to-show', () => {
      this.dashboardWindow?.show();
    });

    this.dashboardWindow.on('closed', () => {
      this.dashboardWindow = null;
    });

    this.windows.set(this.dashboardWindow.id, this.dashboardWindow);
  }

  private createSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0B0C0D',
      show: false,
      resizable: true,
      icon: join(__dirname, '../assets/icon.png'),
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.settingsWindow.loadURL('http://localhost:3000/settings.html');
      this.settingsWindow.webContents.openDevTools();
    } else {
      this.settingsWindow.loadFile(join(__dirname, '../renderer/settings.html'));
    }

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow?.show();
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    this.windows.set(this.settingsWindow.id, this.settingsWindow);
  }

  private createNoteWindow(noteId?: string): BrowserWindow {
    const note = noteId ? this.getNote(noteId) : null;
    
    const noteWindow = new BrowserWindow({
      width: 280,
      height: 220,
      x: note?.position?.x,
      y: note?.position.y,
      minWidth: 200,
      minHeight: 120,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#111214',
      show: false,
      alwaysOnTop: note?.pinned || false,
      skipTaskbar: note?.pinned || false,
      resizable: true, // Always resizable by default
      movable: true,   // Always movable by default
      icon: join(__dirname, '../assets/icon.png'),
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      const noteParam = noteId ? `?noteId=${noteId}` : '';
      noteWindow.loadURL(`http://localhost:3000/index.html${noteParam}`);
    } else {
      const noteParam = noteId ? `?noteId=${noteId}` : '';
      noteWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        search: noteParam
      });
    }

    noteWindow.once('ready-to-show', () => {
      noteWindow.show();
    });

    noteWindow.on('closed', () => {
      if (noteId) {
        this.noteWindows.delete(noteId);
      }
      this.windows.delete(noteWindow.id);
    });

    // Save window position when moved or resized
    const savePosition = () => {
      if (noteId && !noteWindow.isDestroyed()) {
        const bounds = noteWindow.getBounds();
        this.updateNote(noteId, {
          position: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
        });
      }
    };

    noteWindow.on('moved', savePosition);
    noteWindow.on('resized', savePosition);

    this.windows.set(noteWindow.id, noteWindow);
    if (noteId) {
      this.noteWindows.set(noteId, noteWindow);
    }

    return noteWindow;
  }

  private createTray() {
    this.tray = new Tray(join(__dirname, '../assets/tray-icon.png'));
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'New Note',
        accelerator: 'CommandOrControl+N',
        click: () => this.createNewNote(),
      },
      {
        label: 'New Pinned Note',
        accelerator: 'CommandOrControl+Shift+N',
        click: () => this.createNewNote(true),
      },
      { type: 'separator' },
      {
        label: 'Show Dashboard',
        click: () => this.showDashboard(),
      },
      {
        label: 'Toggle All Notes',
        click: () => this.toggleAllNotes(),
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => this.openSettings(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Sticky Notes');
    
    this.tray.on('click', () => {
      this.toggleDashboard();
    });
  }

  private registerGlobalShortcuts() {
    const settings = this.getSettings();
    
    globalShortcut.register(settings.globalShortcuts.newNote, () => {
      this.createNewNote();
    });

    globalShortcut.register(settings.globalShortcuts.newPinnedNote, () => {
      this.createNewNote(true);
    });

    globalShortcut.register(settings.globalShortcuts.showHide, () => {
      this.toggleDashboard();
    });
  }

  private registerIpcHandlers() {
    // Note operations
    ipcMain.handle('note:create', (_, noteData: Partial<Note>) => {
      return this.createNote(noteData);
    });

    ipcMain.handle('note:update', (_, id: string, updates: Partial<Note>) => {
      this.updateNote(id, updates);
    });

    ipcMain.handle('note:delete', (_, id: string) => {
      this.deleteNote(id);
    });

    ipcMain.handle('note:get', (_, id: string) => {
      return this.getNote(id);
    });

    ipcMain.handle('note:getAll', () => {
      return this.getAllNotes();
    });

    ipcMain.handle('note:search', (_, query: string) => {
      return this.searchNotes(query);
    });

  // Window operations
  ipcMain.handle('window:create-note', (_, noteId?: string) => {
    // Check if window for this note is already open
    if (noteId && this.noteWindows.has(noteId)) {
      const existingWindow = this.noteWindows.get(noteId);
      if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        existingWindow.show();
        return existingWindow.id;
      } else {
        // Remove destroyed window from tracking
        this.noteWindows.delete(noteId);
      }
    }
    
    const window = this.createNoteWindow(noteId);
    return window.id;
  });    ipcMain.handle('window:close', (_, windowId: number) => {
      const window = this.windows.get(windowId);
      if (window) {
        window.close();
      }
    });

    ipcMain.handle('window:open-settings', () => {
      this.createSettingsWindow();
    });

    ipcMain.handle('window:toggle-pin', (_, windowId: number) => {
      const window = this.windows.get(windowId);
      if (window) {
        const isPinned = window.isAlwaysOnTop();
        const newPinnedState = !isPinned;
        
        window.setAlwaysOnTop(newPinnedState);
        window.setSkipTaskbar(newPinnedState);
        
        // Find the note ID for this window and update the pinned state
        for (const [noteId, noteWindow] of this.noteWindows.entries()) {
          if (noteWindow.id === windowId) {
            this.updateNote(noteId, { pinned: newPinnedState });
            break;
          }
        }
      }
    });

    ipcMain.handle('window:toggle-pin-current', (event) => {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      if (window) {
        const isPinned = window.isAlwaysOnTop();
        const newPinnedState = !isPinned;
        
        window.setAlwaysOnTop(newPinnedState);
        window.setSkipTaskbar(newPinnedState);
        
        // Find the note ID for this window and update the pinned state
        for (const [noteId, noteWindow] of this.noteWindows.entries()) {
          if (noteWindow.id === window.id) {
            this.updateNote(noteId, { pinned: newPinnedState });
            break;
          }
        }
      }
    });

    ipcMain.handle('window:toggle-lock', (_, windowId: number) => {
      const window = this.windows.get(windowId);
      if (window) {
        // Find the note ID for this window and check current locked state
        for (const [noteId, noteWindow] of this.noteWindows.entries()) {
          if (noteWindow.id === windowId) {
            const note = this.getNote(noteId);
            const isCurrentlyLocked = note?.locked || false;
            const newLockedState = !isCurrentlyLocked;
            
            // Only toggle mouse events for content interaction, keep resize/move enabled
            window.setIgnoreMouseEvents(newLockedState);
            this.updateNote(noteId, { locked: newLockedState });
            break;
          }
        }
      }
    });

    ipcMain.handle('window:toggle-lock-current', (event) => {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      if (window) {
        // Find the note ID for this window and check current locked state
        for (const [noteId, noteWindow] of this.noteWindows.entries()) {
          if (noteWindow.id === window.id) {
            const note = this.getNote(noteId);
            const isCurrentlyLocked = note?.locked || false;
            const newLockedState = !isCurrentlyLocked;
            
            // Only toggle mouse events for content interaction, keep resize/move enabled
            window.setIgnoreMouseEvents(newLockedState);
            this.updateNote(noteId, { locked: newLockedState });
            break;
          }
        }
      }
    });

    ipcMain.handle('window:get-current-id', (event) => {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      return window ? window.id : null;
    });

    // Settings
    ipcMain.handle('settings:get', () => {
      return this.getSettings();
    });

    ipcMain.handle('settings:update', (_, settings: Partial<Settings>) => {
      this.updateSettings(settings);
    });

    // Export/Import
    ipcMain.handle('export:notes', async (_, format: 'json' | 'markdown') => {
      const result = await dialog.showSaveDialog({
        filters: [
          { name: format.toUpperCase(), extensions: [format] },
        ],
      });

      if (!result.canceled && result.filePath) {
        await this.exportNotes(result.filePath, format);
      }
    });

    ipcMain.handle('import:notes', async () => {
      const result = await dialog.showOpenDialog({
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'Markdown', extensions: ['md', 'markdown'] },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        await this.importNotes(result.filePaths[0]);
      }
    });
  }

  // Note management methods
  private createNote(noteData: Partial<Note> = {}): Note {
    const note: Note = {
      id: uuidv4(),
      title: noteData.title || 'New Note',
      body: noteData.body || '',
      tags: noteData.tags || [],
      color: noteData.color || '#111214',
      accent: noteData.accent || '#00E5FF',
      pinned: noteData.pinned || false,
      locked: noteData.locked || false,
      position: noteData.position || {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 320,
        height: 200,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [],
    };

    const notes = this.getAllNotes();
    notes.push(note);
    this.store.set('notes', notes);

    return note;
  }

  private updateNote(id: string, updates: Partial<Note>) {
    const notes = this.getAllNotes();
    const index = notes.findIndex(note => note.id === id);
    
    if (index !== -1) {
      const currentNote = notes[index];
      
      // Save version if body or title changed
      if (updates.body !== undefined || updates.title !== undefined) {
        const settings = this.getSettings();
        currentNote.versions.push({
          at: new Date().toISOString(),
          body: currentNote.body,
          title: currentNote.title,
        });

        // Limit version history
        if (currentNote.versions.length > settings.versionHistoryLength) {
          currentNote.versions = currentNote.versions.slice(-settings.versionHistoryLength);
        }
      }

      notes[index] = {
        ...currentNote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.store.set('notes', notes);
    }
  }

  private deleteNote(id: string) {
    const notes = this.getAllNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    this.store.set('notes', filteredNotes);

    // Close note window if open
    const noteWindow = this.noteWindows.get(id);
    if (noteWindow && !noteWindow.isDestroyed()) {
      noteWindow.close();
    }
  }

  private getNote(id: string): Note | null {
    const notes = this.getAllNotes();
    return notes.find(note => note.id === id) || null;
  }

  private getAllNotes(): Note[] {
    return this.store.get('notes', []) as Note[];
  }

  private searchNotes(query: string): Note[] {
    const notes = this.getAllNotes();
    const lowercaseQuery = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.body.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Settings management
  private getSettings(): Settings {
    return this.store.get('settings') as Settings;
  }

  private updateSettings(updates: Partial<Settings>) {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    this.store.set('settings', newSettings);

    // Re-register global shortcuts if they changed
    if (updates.globalShortcuts) {
      globalShortcut.unregisterAll();
      this.registerGlobalShortcuts();
    }
  }

  // Window management
  private createNewNote(pinned = false): string {
    // Check if there's already an empty note
    const notes = this.getAllNotes();
    const emptyNote = notes.find(note => 
      (!note.title || note.title.trim() === '' || note.title === 'New Note') && 
      (!note.body || note.body.trim() === '' || note.body === '<p></p>' || note.body === '<p><br></p>')
    );
    
    if (emptyNote) {
      // Check if window for this empty note is already open
      if (this.noteWindows.has(emptyNote.id)) {
        const existingWindow = this.noteWindows.get(emptyNote.id);
        if (existingWindow && !existingWindow.isDestroyed()) {
          existingWindow.focus();
          existingWindow.show();
          return emptyNote.id;
        } else {
          // Remove destroyed window from tracking
          this.noteWindows.delete(emptyNote.id);
        }
      }
      
      // Update pinned status if needed
      if (emptyNote.pinned !== pinned) {
        this.updateNote(emptyNote.id, { pinned });
      }
      
      // Open the existing empty note
      this.createNoteWindow(emptyNote.id);
      return emptyNote.id;
    }
    
    // Create new note only if no empty note exists
    const note = this.createNote({ pinned });
    this.createNoteWindow(note.id);
    return note.id;
  }

  private showDashboard() {
    if (!this.dashboardWindow || this.dashboardWindow.isDestroyed()) {
      this.createDashboardWindow();
    } else {
      this.dashboardWindow.show();
      this.dashboardWindow.focus();
    }
  }

  private toggleDashboard() {
    if (!this.dashboardWindow || this.dashboardWindow.isDestroyed()) {
      this.createDashboardWindow();
    } else if (this.dashboardWindow.isVisible()) {
      this.dashboardWindow.hide();
    } else {
      this.dashboardWindow.show();
      this.dashboardWindow.focus();
    }
  }

  private toggleAllNotes() {
    const noteWindows = Array.from(this.noteWindows.values());
    const anyVisible = noteWindows.some(window => window.isVisible());
    
    noteWindows.forEach(window => {
      if (anyVisible) {
        window.hide();
      } else {
        window.show();
      }
    });
  }

  private restorePinnedNotes() {
    const notes = this.getAllNotes();
    const pinnedNotes = notes.filter(note => note.pinned);
    
    pinnedNotes.forEach(note => {
      this.createNoteWindow(note.id);
    });
  }

  private openSettings() {
    // TODO: Implement settings window
    console.log('Settings window not implemented yet');
  }

  // Export/Import functionality
  private async exportNotes(filePath: string, format: 'json' | 'markdown') {
    const notes = this.getAllNotes();
    const fs = await import('fs/promises');
    
    if (format === 'json') {
      await fs.writeFile(filePath, JSON.stringify(notes, null, 2));
    } else if (format === 'markdown') {
      const markdown = notes.map(note => `# ${note.title}\n\n${note.body}\n\n---\n`).join('\n');
      await fs.writeFile(filePath, markdown);
    }
  }

  private async importNotes(filePath: string) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      if (ext === '.json') {
        const importedNotes = JSON.parse(content) as Note[];
        const currentNotes = this.getAllNotes();
        
        // Add imported notes with new IDs to avoid conflicts
        const newNotes = importedNotes.map(note => ({
          ...note,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        this.store.set('notes', [...currentNotes, ...newNotes]);
      }
      // TODO: Add markdown import support
    } catch (error) {
      console.error('Failed to import notes:', error);
    }
  }
}

// Start the application
new StickyNotesApp();