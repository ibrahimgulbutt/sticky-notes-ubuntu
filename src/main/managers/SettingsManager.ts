import Store from 'electron-store';
import type { Settings, Note } from '../../types';

export class SettingsManager {
  private store: Store<{notes: Note[], settings: Settings}>;

  constructor(store: Store<{notes: Note[], settings: Settings}>) {
    this.store = store;
  }

  getSettings(): Settings {
    return this.store.get('settings') as Settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    this.store.set('settings', newSettings);
    return newSettings;
  }

  getDefaultNoteColor(): string {
    const settings = this.getSettings();
    return settings?.defaultNoteColor || '#111214';
  }

  getCompletedItemBehavior(): 'strike' | 'archive' | 'delete' {
    const settings = this.getSettings();
    return settings?.completedItemBehavior || 'strike';
  }
}
