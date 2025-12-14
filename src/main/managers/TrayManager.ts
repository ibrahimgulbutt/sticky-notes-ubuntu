import { Tray, Menu, nativeImage, app } from 'electron';
import { join } from 'path';
import type { ITrayManager } from '../interfaces';

export class TrayManager implements ITrayManager {
  private tray: Tray | null = null;
  private onClickCallback: (() => void) | null = null;
  private onRightClickCallback: (() => void) | null = null;

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

  updateTrayMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'New Note',
        accelerator: 'CommandOrControl+N',
        click: () => {
          // This will be connected to the app's note creation method
        },
      },
      {
        label: 'New Pinned Note',
        accelerator: 'CommandOrControl+Shift+N',
        click: () => {
          // This will be connected to the app's pinned note creation method
        },
      },
      { type: 'separator' },
      {
        label: 'Show Dashboard',
        click: () => {
          // This will be connected to the window manager's show dashboard
        },
      },
      {
        label: 'Hide Dashboard',
        click: () => {
          // This will be connected to the window manager's hide dashboard
        },
      },
      {
        label: 'Toggle All Notes',
        click: () => {
          // This will be connected to the window manager's toggle notes
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          // This will be connected to the settings window
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          // This will be connected to the app's quit method
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  updateTrayTooltip(text: string): void {
    if (this.tray) {
      this.tray.setToolTip(text);
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
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'New Note',
        accelerator: 'CommandOrControl+N',
        click: callbacks.newNote,
      },
      {
        label: 'New Pinned Note',
        accelerator: 'CommandOrControl+Shift+N',
        click: callbacks.newPinnedNote,
      },
      { type: 'separator' },
      {
        label: 'Show Dashboard',
        click: callbacks.showDashboard,
      },
      {
        label: 'Hide Dashboard',
        click: callbacks.hideDashboard,
      },
      {
        label: 'Toggle All Notes',
        click: callbacks.toggleAllNotes,
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: callbacks.openSettings,
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        click: callbacks.quit,
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }
}