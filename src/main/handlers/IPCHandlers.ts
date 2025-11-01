import { ipcMain, BrowserWindow } from 'electron';
import type { INoteService, IWindowManager } from '../interfaces';
import type { Note, Settings } from '../../types';

export class IPCHandlers {
  private noteService: INoteService;
  private windowManager: IWindowManager;

  constructor(noteService: INoteService, windowManager: IWindowManager) {
    this.noteService = noteService;
    this.windowManager = windowManager;
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Note operations
    ipcMain.handle('note:create', async (_, noteData: Partial<Note>) => {
      return await this.noteService.createNote(noteData);
    });

    ipcMain.handle('note:update', async (_, id: string, updates: Partial<Note>) => {
      await this.noteService.updateNote(id, updates);
    });

    ipcMain.handle('note:delete', async (_, id: string) => {
      await this.noteService.deleteNote(id);
      // Also close the note window if it's open
      this.windowManager.closeNoteWindow(id);
    });

    ipcMain.handle('note:get', async (_, id: string) => {
      return await this.noteService.getNote(id);
    });

    ipcMain.handle('note:getAll', async () => {
      return await this.noteService.getAllNotes();
    });

    ipcMain.handle('note:search', async (_, query: string) => {
      return await this.noteService.searchNotes(query);
    });

    // Window operations
    ipcMain.handle('window:create-note', (_, noteId?: string) => {
      const window = this.windowManager.createNoteWindow(noteId);
      return window.id;
    });

    ipcMain.handle('window:close', (_, windowId: number) => {
      const window = this.windowManager.getWindowById(windowId);
      if (window) {
        window.close();
      }
    });

    ipcMain.handle('window:open-settings', () => {
      this.windowManager.createSettingsWindow();
    });

    // Pin/Lock operations with proper window detection
    ipcMain.handle('window:toggle-pin-current', async (event) => {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      if (window) {
        await this.handleTogglePin(window);
      }
    });

    ipcMain.handle('window:toggle-lock-current', async (event) => {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      if (window) {
        await this.handleToggleLock(window);
      }
    });

    ipcMain.handle('window:get-current-id', (event) => {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      return window ? window.id : null;
    });

    // Legacy pin/lock handlers for backward compatibility
    ipcMain.handle('window:toggle-pin', async (_, windowId: number) => {
      const window = this.windowManager.getWindowById(windowId);
      if (window) {
        await this.handleTogglePin(window);
      }
    });

    ipcMain.handle('window:toggle-lock', async (_, windowId: number) => {
      const window = this.windowManager.getWindowById(windowId);
      if (window) {
        await this.handleToggleLock(window);
      }
    });

    // Export/Import
    ipcMain.handle('export:notes', async (_, format: 'json' | 'markdown') => {
      try {
        const data = await this.noteService.exportNotes(format);
        // Handle file save dialog in the main process
        return data;
      } catch (error) {
        throw error;
      }
    });

    ipcMain.handle('import:notes', async (_, data: string, format: 'json' | 'markdown') => {
      try {
        await this.noteService.importNotes(data, format);
      } catch (error) {
        throw error;
      }
    });
  }

  private async handleTogglePin(window: BrowserWindow): Promise<void> {
    const isPinned = window.isAlwaysOnTop();
    const newPinnedState = !isPinned;
    
    window.setAlwaysOnTop(newPinnedState);
    window.setSkipTaskbar(newPinnedState);
    
    // Find the note ID for this window and update the pinned state
    const noteId = await this.findNoteIdForWindow(window);
    if (noteId) {
      await this.noteService.updateNote(noteId, { pinned: newPinnedState });
    }
  }

  private async handleToggleLock(window: BrowserWindow): Promise<void> {
    const noteId = await this.findNoteIdForWindow(window);
    console.log('Toggle lock - noteId found:', noteId);
    
    if (noteId) {
      const note = await this.noteService.getNote(noteId);
      console.log('Current note state:', { id: note?.id, locked: note?.locked });
      
      // Since the renderer is handling the state update, we don't need to do anything here
      // The renderer will call updateNote directly
      console.log('Lock toggle handled by renderer');
    } else {
      console.error('Could not find noteId for window');
    }
  }

  private async findNoteIdForWindow(window: BrowserWindow): Promise<string | null> {
    // This is a simplified approach - in a real implementation, you might want to
    // pass the noteId through the window's webContents or store it in a map
    const url = window.webContents.getURL();
    console.log('Window URL:', url);
    
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const noteId = urlParams.get('noteId');
    console.log('Extracted noteId:', noteId);
    
    return noteId;
  }

  // Method to add settings handlers (will be called when SettingsService is ready)
  addSettingsHandlers(getSettings: () => Promise<Settings>, updateSettings: (settings: Partial<Settings>) => Promise<void>): void {
    ipcMain.handle('settings:get', async () => {
      return await getSettings();
    });

    ipcMain.handle('settings:update', async (_, settings: Partial<Settings>) => {
      await updateSettings(settings);
    });
  }
}