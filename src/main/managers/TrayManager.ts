import { Tray, Menu, nativeImage, app } from 'electron';
import { join } from 'path';
import type { ITrayManager } from '../interfaces';

export class TrayManager implements ITrayManager {
  private tray: Tray | null = null;
  private onClickCallback: (() => void) | null = null;
  private onRightClickCallback: (() => void) | null = null;
  private callbacks: {
    newNote: () => void;
    newPinnedNote: () => void;
    showDashboard: () => void;
    hideDashboard: () => void;
    toggleAllNotes: () => void;
    openSettings: () => void;
    quit: () => void;
  } | null = null;

  private getIconPath(): string {
    if (app.isPackaged) {
      return join(process.resourcesPath, 'assets/tray-icon.png');
    }
    return join(__dirname, '../../assets/tray-icon.png');
  }

  createTray(): void {
    if (this.tray) {
      return; // Already created
    }

    const iconPath = this.getIconPath();
    this.tray = new Tray(iconPath);
    
    this.updateTrayMenu();
    this.updateTrayTooltip('Sticky Notes');
    
    // Handle tray clicks
    this.tray.on('click', () => {
      if (this.onClickCallback) {
        this.onClickCallback();
      }
    });

    this.tray.on('right-click', () => {
      if (this.onRightClickCallback) {
        this.onRightClickCallback();
      }
    });
  }

  updateTrayMenu(focusState?: { isActive: boolean; isPaused: boolean }): void {
    if (!this.tray) return;

    const menuItems: Electron.MenuItemConstructorOptions[] = [];

    if (this.callbacks) {
      menuItems.push(
        {
          label: 'New Note',
          accelerator: 'CommandOrControl+N',
          click: this.callbacks.newNote,
        },
        {
          label: 'New Pinned Note',
          accelerator: 'CommandOrControl+Shift+N',
          click: this.callbacks.newPinnedNote,
        },
        { type: 'separator' }
      );
    }

    // Removed dynamic focus controls to prevent menu rebuilding glitches
    // Focus controls are available in the widget itself

    if (this.callbacks) {
      menuItems.push(
        {
          label: 'Show Dashboard',
          click: this.callbacks.showDashboard,
        },
        {
          label: 'Hide Dashboard',
          click: this.callbacks.hideDashboard,
        },
        {
          label: 'Toggle All Notes',
          click: this.callbacks.toggleAllNotes,
        },
        { type: 'separator' },
        {
          label: 'Settings',
          click: this.callbacks.openSettings,
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CommandOrControl+Q',
          click: this.callbacks.quit,
        },
      );
    } else {
      // Fallback if callbacks are not set yet
      menuItems.push({
        label: 'Quit',
        click: () => app.quit()
      });
    }

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(contextMenu);
  }

  private onFocusActionCallback: ((action: 'pause' | 'resume' | 'stop') => void) | null = null;
  private onDashboardActionCallback: ((action: 'show' | 'hide') => void) | null = null;

  setFocusActionCallback(callback: (action: 'pause' | 'resume' | 'stop') => void) {
    this.onFocusActionCallback = callback;
  }

  setDashboardActionCallback(callback: (action: 'show' | 'hide') => void) {
    this.onDashboardActionCallback = callback;
  }

  private lastTooltip: string = '';

  updateTrayTooltip(text: string): void {
    if (this.tray && this.lastTooltip !== text) {
      this.tray.setToolTip(text);
      this.lastTooltip = text;
    }
  }

  private lastFocusState: { isActive: boolean; isPaused: boolean } | null = null;

  updateFocusState(isActive: boolean, isPaused: boolean, remainingTime?: string): void {
    // Only update menu if state changed
    // Since we removed dynamic menu items, we might not need to call updateTrayMenu at all here
    // unless we want to re-enable them later. For now, we'll skip menu updates to be safe.
    /*
    if (
      !this.lastFocusState ||
      this.lastFocusState.isActive !== isActive ||
      this.lastFocusState.isPaused !== isPaused
    ) {
      this.updateTrayMenu({ isActive, isPaused });
      this.lastFocusState = { isActive, isPaused };
    }
    */
    
    if (isActive) {
      this.updateTrayTooltip(`Focus: ${isPaused ? 'Paused' : 'Running'}`);
    } else {
      this.updateTrayTooltip('Sticky Notes');
    }
  }

  destroyTray(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  // Event handlers
  onTrayClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  onTrayRightClick(callback: () => void): void {
    this.onRightClickCallback = callback;
  }

  // Method to update menu with actual callbacks (called from main app)
  setMenuCallbacks(callbacks: {
    newNote: () => void;
    newPinnedNote: () => void;
    showDashboard: () => void;
    hideDashboard: () => void;
    toggleAllNotes: () => void;
    openSettings: () => void;
    quit: () => void;
  }): void {
    this.callbacks = callbacks;
    this.updateTrayMenu();
  }
}