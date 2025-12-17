import { create } from 'zustand';
import type { Settings } from '../../types';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  
  // Actions
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  init: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: true,

  setSettings: (settings) => {
    set({ settings });
    applyTheme(settings);
  },

  updateSettings: async (updates) => {
    try {
      // Optimistic update
      const currentSettings = get().settings;
      if (currentSettings) {
        const newSettings = { ...currentSettings, ...updates };
        set({ settings: newSettings });
        applyTheme(newSettings);
        
        // Send to main process
        await window.electronAPI.updateSettings(updates);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Revert on error could be implemented here
    }
  },

  init: async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      set({ settings, isLoading: false });
      applyTheme(settings);

      // Listen for updates from main process
      window.electronAPI.onSettingsUpdated((newSettings: Settings) => {
        console.log('Settings updated from main process:', newSettings);
        set({ settings: newSettings });
        applyTheme(newSettings);
      });
    } catch (error) {
      console.error('Failed to init settings:', error);
      set({ isLoading: false });
    }
  },
}));

// Helper to apply theme and fonts
const applyTheme = (settings: Settings) => {
  const root = document.documentElement;
  const { theme, fontSize, fontFamily } = settings;

  // Apply Theme Colors
  if (theme === 'light') {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8f9fa');
    root.style.setProperty('--bg-tertiary', '#f1f3f4');
    root.style.setProperty('--text-primary', '#202124');
    root.style.setProperty('--text-secondary', '#5f6368');
    root.style.setProperty('--text-muted', '#9aa0a6');
    root.style.setProperty('--border-color', '#dadce0');
    root.style.setProperty('--accent-color', '#1a73e8');
  } else if (theme === 'dark') {
    root.style.setProperty('--bg-primary', '#111214');
    root.style.setProperty('--bg-secondary', '#1a1b1e');
    root.style.setProperty('--bg-tertiary', '#242529');
    root.style.setProperty('--text-primary', '#e8eaed');
    root.style.setProperty('--text-secondary', '#bdc1c6');
    root.style.setProperty('--text-muted', '#9aa0a6');
    root.style.setProperty('--border-color', '#3c4043');
    root.style.setProperty('--accent-color', '#8ab4f8');
  }

  // Apply Font Settings
  root.style.setProperty('--font-size-base', `${fontSize || 14}px`);
  root.style.setProperty('--font-family-base', fontFamily || 'Inter');
};
