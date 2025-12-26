import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings, 
  X, 
  Save, 
  RotateCcw
} from 'lucide-react';
import type { Settings as AppSettings } from '../types';
import './styles.css';
import { SettingsSidebar } from './components/settings/SettingsSidebar';
import { AppearanceSettings } from './components/settings/AppearanceSettings';
import { BehaviorSettings } from './components/settings/BehaviorSettings';
import { ShortcutSettings } from './components/settings/ShortcutSettings';
import { DataSettings } from './components/settings/DataSettings';
import { FocusSettings } from './components/settings/FocusSettings';
import { useSettingsStore } from './store/useSettingsStore';

const SettingsApp: React.FC = () => {
  const { settings: storeSettings, updateSettings: updateStoreSettings, init: initSettings } = useSettingsStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'shortcuts' | 'data' | 'focus'>('appearance');
  const [tempSettings, setTempSettings] = useState<AppSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  useEffect(() => {
    if (storeSettings) {
      setSettings(storeSettings);
      // Only set temp settings if not already set (to avoid overwriting work in progress if store updates)
      // But actually, if store updates from outside, we might want to warn or update.
      // For now, let's just set it if it's null.
      if (!tempSettings) {
        setTempSettings(storeSettings);
      }
    }
  }, [storeSettings]);

  // Apply theme changes to the document
  useEffect(() => {
    if (tempSettings) {
      applyTheme(tempSettings.theme);
      applyFontSettings(tempSettings.fontSize, tempSettings.fontFamily);
    }
  }, [tempSettings]);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    // Force dark theme
    root.style.setProperty('--bg-primary', '#111214');
    root.style.setProperty('--bg-secondary', '#1a1b1e');
    root.style.setProperty('--bg-tertiary', '#242529');
    root.style.setProperty('--text-primary', '#e8eaed');
    root.style.setProperty('--text-secondary', '#bdc1c6');
    root.style.setProperty('--text-muted', '#9aa0a6');
    root.style.setProperty('--border-color', '#3c4043');
    root.style.setProperty('--accent-color', '#8ab4f8');
  };

  const applyFontSettings = (fontSize: number, fontFamily: string) => {
    const root = document.documentElement;
    root.style.setProperty('--font-size-base', `${fontSize}px`);
    root.style.setProperty('--font-family-base', fontFamily);
  };

  const updateTempSetting = (key: keyof AppSettings, value: any) => {
    if (!tempSettings) return;
    
    console.log(`Updating setting ${key} to:`, value);
    const newSettings = { ...tempSettings, [key]: value };
    setTempSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
    console.log('New temp settings:', newSettings);
  };

  const saveSettings = async () => {
    if (!tempSettings) return;
    
    try {
      await updateStoreSettings(tempSettings);
      setSettings(tempSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetSettings = () => {
    if (!settings) return;
    setTempSettings(settings);
    setHasChanges(false);
  };

  const resetToDefaults = async () => {
    const defaultSettings: AppSettings = {
      theme: 'dark',
      autoSave: true,
      autoSaveInterval: 5,
      versionHistoryLength: 50,
      globalShortcuts: {
        newNote: 'Ctrl+N',
        showHide: 'Ctrl+H',
        newPinnedNote: 'Ctrl+Shift+N'
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
    };
    
    setTempSettings(defaultSettings);
    setHasChanges(true);
  };

  const closeWindow = () => {
    window.close();
  };

  if (!tempSettings) {
    return (
      <div className="w-full h-full bg-matte-dark text-text-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-matte-dark text-text-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-matte-border">
        <div className="flex items-center space-x-2">
          <Settings size={20} className="text-cyan-accent" />
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <button
          onClick={closeWindow}
          className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors"
          title="Close Settings"
        >
          <X size={18} className="text-text-secondary hover:text-red-400" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <AppearanceSettings settings={tempSettings} updateSetting={updateTempSetting} />
            )}

            {activeTab === 'behavior' && (
              <BehaviorSettings settings={tempSettings} updateSetting={updateTempSetting} />
            )}

            {activeTab === 'shortcuts' && (
              <ShortcutSettings settings={tempSettings} updateSetting={updateTempSetting} />
            )}

            {activeTab === 'data' && (
              <DataSettings settings={tempSettings} updateSetting={updateTempSetting} />
            )}

            {activeTab === 'focus' && (
              <FocusSettings settings={tempSettings} onChange={updateTempSetting} />
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-matte-border bg-matte-card flex items-center justify-between">
            <button
              onClick={resetToDefaults}
              className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCcw size={16} />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center space-x-3">
              {hasChanges && (
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={saveSettings}
                disabled={!hasChanges}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all ${
                  hasChanges
                    ? 'bg-cyan-accent text-black hover:bg-cyan-hover shadow-lg shadow-cyan-accent/20'
                    : 'bg-matte-border text-text-muted cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<SettingsApp />);