import { ipcMain, BrowserWindow, dialog } from 'electron';
import { writeFile, readFile } from 'fs/promises';
import type { INoteService, IWindowManager } from '../interfaces';
import type { Note, Settings } from '../../types';
import { FocusManager } from '../managers/FocusManager';

export class IPCHandlers {
  private noteService: INoteService;
  private windowManager: IWindowManager;
  private focusManager: FocusManager;

  constructor(noteService: INoteService, windowManager: IWindowManager, focusManager: FocusManager) {
    this.noteService = noteService;
    this.windowManager = windowManager;
    this.focusManager = focusManager;
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
        
        const { filePath } = await dialog.showSaveDialog({
          title: 'Export Notes',
          defaultPath: `sticky-notes-export.${format === 'json' ? 'json' : 'md'}`,
          filters: [
            { name: format === 'json' ? 'JSON' : 'Markdown', extensions: [format === 'json' ? 'json' : 'md'] }
          ]
        });

        if (filePath) {
          await writeFile(filePath, data, 'utf-8');
          return true;
        }
        return false;
      } catch (error) {
        console.error('Export failed:', error);
        throw error;
      }
    });

    ipcMain.handle('import:notes', async () => {
      try {
        const { filePaths } = await dialog.showOpenDialog({
          title: 'Import Notes',
          filters: [
            { name: 'Sticky Notes Data', extensions: ['json'] }
          ],
          properties: ['openFile']
        });

        if (filePaths && filePaths.length > 0) {
          const data = await readFile(filePaths[0], 'utf-8');
          // Currently only supporting JSON import as per service implementation
          await this.noteService.importNotes(data, 'json');
          return true;
        }
        return false;
      } catch (error) {
        console.error('Import failed:', error);
        throw error;
      }
    });

    // Focus Widget
    ipcMain.on('focus:start', (_, duration, mode) => {
      this.focusManager.startSession(duration, mode);
    });

    ipcMain.on('focus:pause', () => {
      this.focusManager.pauseSession();
    });

    ipcMain.on('focus:resume', () => {
      this.focusManager.resumeSession();
    });

    ipcMain.on('focus:stop', () => {
      this.focusManager.stopSession();
    });

    ipcMain.on('focus:hide', () => {
      this.focusManager.hideWidget();
    });

    ipcMain.on('focus:show', () => {
      this.focusManager.showWidget();
    });

    ipcMain.handle('focus:get-state', () => {
      return this.focusManager.getSession();
    });
  }

  private async handleTogglePin(window: BrowserWindow): Promise<void> {
    const isPinned = window.isAlwaysOnTop();
    const newPinnedState = !isPinned;
    
    window.setAlwaysOnTop(newPinnedState);
    window.setSkipTaskbar(newPinnedState);
    
    // Note state update is handled by renderer
  }

  private async handleToggleLock(window: BrowserWindow): Promise<void> {
    const noteId = await this.findNoteIdForWindow(window);
    
    if (noteId) {
      // Since the renderer is handling the state update, we don't need to do anything here
      // The renderer will call updateNote directly
    }
  }

  private async findNoteIdForWindow(window: BrowserWindow): Promise<string | null> {
    // This is a simplified approach - in a real implementation, you might want to
    // pass the noteId through the window's webContents or store it in a map
    const url = window.webContents.getURL();
    
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