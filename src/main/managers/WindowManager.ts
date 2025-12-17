import { BrowserWindow, app } from 'electron';
import { join } from 'path';
import type { IWindowManager } from '../interfaces';
import type { Note } from '../../types';

export class WindowManager implements IWindowManager {
  private windows: Map<number, BrowserWindow> = new Map();
  private dashboardWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private noteWindows: Map<string, BrowserWindow> = new Map();
  private isQuitting = false;

  constructor() {}

  private getIconPath(): string {
    if (app.isPackaged) {
      return join(process.resourcesPath, 'assets/icon.png');
    }
    return join(__dirname, '../../src/assets/icon.png');
  }

  // Dashboard Window Management
  createDashboardWindow(show: boolean = true): BrowserWindow {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      if (show) {
        this.dashboardWindow.show();
        this.dashboardWindow.focus();
      }
      return this.dashboardWindow;
    }

    this.dashboardWindow = new BrowserWindow({
      width: 380,
      height: 580,
      minWidth: 350,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload.js'),
      },
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0B0C0D',
      show: false, // Don't show immediately, wait for ready-to-show or explicit show
      resizable: true,
      icon: this.getIconPath(),
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.dashboardWindow.loadURL('http://localhost:3000/dashboard.html');
      this.dashboardWindow.webContents.openDevTools();
    } else {
      this.dashboardWindow.loadFile(join(__dirname, '../../renderer/dashboard.html'));
    }

    this.dashboardWindow.once('ready-to-show', () => {
      if (show) {
        this.dashboardWindow?.show();
      }
    });

    // FIXED: Dashboard close behavior - minimize to tray instead of destroying
    this.dashboardWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.hideDashboard();
      }
    });

    this.dashboardWindow.on('closed', () => {
      this.dashboardWindow = null;
    });

    this.windows.set(this.dashboardWindow.id, this.dashboardWindow);
    return this.dashboardWindow;
  }

  showDashboard(): void {
    if (!this.dashboardWindow || this.dashboardWindow.isDestroyed()) {
      this.createDashboardWindow();
    } else {
      this.dashboardWindow.show();
      this.dashboardWindow.focus();
    }
  }

  hideDashboard(): void {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.hide();
    }
  }

  toggleDashboard(): void {
    if (!this.dashboardWindow || this.dashboardWindow.isDestroyed()) {
      this.createDashboardWindow();
    } else if (this.dashboardWindow.isVisible()) {
      this.hideDashboard();
    } else {
      this.showDashboard();
    }
  }

  isDashboardVisible(): boolean {
    return this.dashboardWindow?.isVisible() || false;
  }

  // Settings Window Management
  createSettingsWindow(): BrowserWindow {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return this.settingsWindow;
    }

    this.settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload.js'),
      },
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0B0C0D',
      show: false,
      resizable: true,
      modal: true,
      parent: this.dashboardWindow || undefined,
      icon: this.getIconPath(),
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.settingsWindow.loadURL('http://localhost:3000/settings.html');
      this.settingsWindow.webContents.openDevTools();
    } else {
      this.settingsWindow.loadFile(join(__dirname, '../../renderer/settings.html'));
    }

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow?.show();
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    this.windows.set(this.settingsWindow.id, this.settingsWindow);
    return this.settingsWindow;
  }

  closeSettingsWindow(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }

  // Note Window Management
  createNoteWindow(noteId?: string): BrowserWindow {
    // Check if window for this note is already open
    if (noteId && this.noteWindows.has(noteId)) {
      const existingWindow = this.noteWindows.get(noteId);
      if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        existingWindow.show();
        return existingWindow;
      } else {
        // Remove destroyed window from tracking
        this.noteWindows.delete(noteId);
      }
    }

    const noteWindow = new BrowserWindow({
      width: 280,
      height: 220,
      minWidth: 200,
      minHeight: 120,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload.js'),
      },
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#111214',
      show: false,
      alwaysOnTop: false, // Will be set based on note pinned state
      skipTaskbar: false,
      resizable: true,
      movable: true,
      icon: this.getIconPath(),
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      const noteParam = noteId ? `?noteId=${noteId}` : '';
      noteWindow.loadURL(`http://localhost:3000/index.html${noteParam}`);
    } else {
      const noteParam = noteId ? `?noteId=${noteId}` : '';
      noteWindow.loadFile(join(__dirname, '../../renderer/index.html'), {
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

    this.windows.set(noteWindow.id, noteWindow);
    if (noteId) {
      this.noteWindows.set(noteId, noteWindow);
    }

    return noteWindow;
  }

  closeNoteWindow(noteId: string): void {
    const noteWindow = this.noteWindows.get(noteId);
    if (noteWindow && !noteWindow.isDestroyed()) {
      noteWindow.close();
    }
  }

  focusNoteWindow(noteId: string): void {
    const noteWindow = this.noteWindows.get(noteId);
    if (noteWindow && !noteWindow.isDestroyed()) {
      noteWindow.focus();
      noteWindow.show();
    }
  }

  isNoteWindowOpen(noteId: string): boolean {
    const noteWindow = this.noteWindows.get(noteId);
    return noteWindow ? !noteWindow.isDestroyed() : false;
  }

  // General Window Management
  closeAllWindows(): void {
    this.isQuitting = true;
    
    // Close all note windows
    for (const window of this.noteWindows.values()) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }

    // Close settings window
    this.closeSettingsWindow();

    // Close dashboard window
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.close();
    }
  }

  hideAllNoteWindows(): void {
    for (const window of this.noteWindows.values()) {
      if (!window.isDestroyed() && window.isVisible()) {
        window.hide();
      }
    }
  }

  showAllNoteWindows(): void {
    for (const window of this.noteWindows.values()) {
      if (!window.isDestroyed() && !window.isVisible()) {
        window.show();
      }
    }
  }

  getWindowById(id: number): BrowserWindow | null {
    return this.windows.get(id) || null;
  }

  broadcast(channel: string, ...args: any[]): void {
    this.windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, ...args);
      }
    });
  }

  // Utility methods for IPC handlers
  togglePinForWindow(windowId: number, noteId: string, pinned: boolean): void {
    const window = this.windows.get(windowId);
    if (window) {
      window.setAlwaysOnTop(pinned);
      window.setSkipTaskbar(pinned);
    }
  }

  toggleLockForWindow(windowId: number, locked: boolean): void {
    const window = this.windows.get(windowId);
    if (window) {
      window.setIgnoreMouseEvents(locked);
    }
  }

  // Position management
  saveWindowPosition(noteId: string, bounds: Electron.Rectangle): void {
    // This will be implemented with the storage service
  }

  // Cleanup
  cleanup(): void {
    this.closeAllWindows();
    this.windows.clear();
    this.noteWindows.clear();
    this.dashboardWindow = null;
    this.settingsWindow = null;
  }
}