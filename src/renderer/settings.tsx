import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings, 
  X, 
  Palette, 
  Zap, 
  Keyboard, 
  Database,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Save,
  RotateCcw
} from 'lucide-react';
import type { Settings as AppSettings } from '../types';
import './styles.css';

const SettingsApp: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'shortcuts' | 'data'>('appearance');
  const [tempSettings, setTempSettings] = useState<AppSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply theme changes to the document
  useEffect(() => {
    if (tempSettings) {
      applyTheme(tempSettings.theme);
      applyFontSettings(tempSettings.fontSize, tempSettings.fontFamily);
    }
  }, [tempSettings]);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
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
    // Auto theme would check system preference - for now default to dark
  };

  const applyFontSettings = (fontSize: number, fontFamily: string) => {
    const root = document.documentElement;
    root.style.setProperty('--font-size-base', `${fontSize}px`);
    root.style.setProperty('--font-family-base', fontFamily);
  };

  const loadSettings = async () => {
    try {
      const currentSettings = await window.electronAPI.getSettings();
      setSettings(currentSettings);
      setTempSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
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
      await window.electronAPI.updateSettings(tempSettings);
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

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'data', label: 'Data', icon: Database }
  ] as const;

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
        <div className="w-48 bg-black bg-opacity-20 border-r border-matte-border">
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-cyan-accent bg-opacity-20 text-cyan-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white hover:bg-opacity-5'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium mb-4">Appearance Settings</h2>
                
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="flex space-x-2">
                    {['dark', 'light', 'auto'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateTempSetting('theme', theme)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                          tempSettings.theme === theme
                            ? 'border-cyan-accent bg-cyan-accent bg-opacity-20 text-cyan-accent'
                            : 'border-matte-border hover:border-text-secondary text-text-secondary'
                        }`}
                      >
                        {theme === 'dark' && <Moon size={16} />}
                        {theme === 'light' && <Sun size={16} />}
                        {theme === 'auto' && <Monitor size={16} />}
                        <span className="capitalize">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={tempSettings.fontSize}
                    onChange={(e) => updateTempSetting('fontSize', parseInt(e.target.value))}
                    className="w-full h-2 bg-matte-border rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>10px</span>
                    <span className="text-cyan-accent">{tempSettings.fontSize}px</span>
                    <span>24px</span>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium mb-2">Font Family</label>
                  <select
                    value={tempSettings.fontFamily}
                    onChange={(e) => updateTempSetting('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 bg-matte-border border border-matte-border rounded-lg text-text-primary focus:border-cyan-accent focus:outline-none"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="system-ui">System Default</option>
                    <option value="Consolas">Consolas (Monospace)</option>
                    <option value="Fira Code">Fira Code (Monospace)</option>
                  </select>
                </div>

                {/* Default Note Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Default Note Color</label>
                  <div className="flex space-x-2">
                    {['#111214', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#7209b7'].map((color) => (
                      <button
                        key={color}
                        onClick={() => updateTempSetting('defaultNoteColor', color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          tempSettings.defaultNoteColor === color
                            ? 'border-cyan-accent scale-110'
                            : 'border-matte-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'behavior' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium mb-4">Behavior Settings</h2>
                
                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Save</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Automatically save notes as you type</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.autoSave}
                      onChange={(e) => updateTempSetting('autoSave', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" 
                         style={{
                           backgroundColor: tempSettings.autoSave ? 'var(--accent-color)' : 'var(--border-color)'
                         }}></div>
                  </label>
                </div>

                {/* Auto Hide Dashboard */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Hide Dashboard</div>
                    <div className="text-sm text-text-secondary">Hide dashboard when creating a note</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.autoHide}
                      onChange={(e) => updateTempSetting('autoHide', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                         style={{
                           backgroundColor: tempSettings.autoHide ? 'var(--accent-color)' : 'var(--border-color)'
                         }}></div>
                  </label>
                </div>

                {/* Word Wrap */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Word Wrap</div>
                    <div className="text-sm text-text-secondary">Wrap long lines in notes</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.wordWrap}
                      onChange={(e) => updateTempSetting('wordWrap', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                         style={{
                           backgroundColor: tempSettings.wordWrap ? 'var(--accent-color)' : 'var(--border-color)'
                         }}></div>
                  </label>
                </div>

                {/* Spell Check */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Spell Check</div>
                    <div className="text-sm text-text-secondary">Enable spell checking in notes</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.spellCheck}
                      onChange={(e) => updateTempSetting('spellCheck', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                         style={{
                           backgroundColor: tempSettings.spellCheck ? 'var(--accent-color)' : 'var(--border-color)'
                         }}></div>
                  </label>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-text-secondary">Show system notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.notifications}
                      onChange={(e) => updateTempSetting('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                         style={{
                           backgroundColor: tempSettings.notifications ? 'var(--accent-color)' : 'var(--border-color)'
                         }}></div>
                  </label>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {tempSettings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <div>
                      <div className="font-medium">Sound Effects</div>
                      <div className="text-sm text-text-secondary">Play sounds for actions</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.soundEnabled}
                      onChange={(e) => updateTempSetting('soundEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                         style={{
                           backgroundColor: tempSettings.soundEnabled ? 'var(--accent-color)' : 'var(--border-color)'
                         }}></div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium mb-4">Keyboard Shortcuts</h2>
                
                {Object.entries(tempSettings.shortcuts || {}).map(([action, shortcut]) => (
                  <div key={action} className="flex items-center justify-between p-3 border border-matte-border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-sm text-text-secondary">
                        {action === 'newNote' && 'Create a new note'}
                        {action === 'newPinnedNote' && 'Create a new pinned note'}
                        {action === 'toggleDashboard' && 'Toggle dashboard visibility'}
                        {action === 'search' && 'Search notes'}
                        {action === 'save' && 'Save current note'}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-matte-border rounded text-sm font-mono">
                      {shortcut}
                    </div>
                  </div>
                ))}
                
                <div className="text-sm text-text-secondary">
                  <p>Note: Keyboard shortcut customization will be available in a future update.</p>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium mb-4">Data Management</h2>
                
                {/* Auto Backup */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Backup</div>
                    <div className="text-sm text-text-secondary">Automatically backup notes</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempSettings.autoBackup}
                      onChange={(e) => updateTempSetting('autoBackup', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-matte-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-accent"></div>
                  </label>
                </div>

                {/* Backup Interval */}
                <div>
                  <label className="block text-sm font-medium mb-2">Backup Interval (minutes)</label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={tempSettings.backupInterval}
                    onChange={(e) => updateTempSetting('backupInterval', parseInt(e.target.value))}
                    className="w-full h-2 bg-matte-border rounded-lg appearance-none cursor-pointer"
                    disabled={!tempSettings.autoBackup}
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>5 min</span>
                    <span className="text-cyan-accent">{tempSettings.backupInterval} min</span>
                    <span>2 hours</span>
                  </div>
                </div>

                {/* Max Backups */}
                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Backups to Keep</label>
                  <input
                    type="range"
                    min="3"
                    max="50"
                    value={tempSettings.maxBackups}
                    onChange={(e) => updateTempSetting('maxBackups', parseInt(e.target.value))}
                    className="w-full h-2 bg-matte-border rounded-lg appearance-none cursor-pointer"
                    disabled={!tempSettings.autoBackup}
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>3</span>
                    <span className="text-cyan-accent">{tempSettings.maxBackups}</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Storage Info */}
                <div className="p-4 bg-black bg-opacity-20 rounded-lg">
                  <h3 className="font-medium mb-2">Storage Information</h3>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <div>Notes are stored locally on your device</div>
                    <div>Data location: ~/.config/sticky-notes-electron</div>
                    <div>Use Export/Import for manual backups</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-matte-border bg-black bg-opacity-10">
            <button
              onClick={resetToDefaults}
              className="flex items-center space-x-2 px-3 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCcw size={16} />
              <span>Reset to Defaults</span>
            </button>
            
            <div className="flex items-center space-x-2">
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  hasChanges
                    ? 'bg-cyan-accent text-white hover:bg-cyan-hover'
                    : 'bg-matte-border text-text-secondary cursor-not-allowed'
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

// Initialize the settings app
const root = createRoot(document.getElementById('root')!);
root.render(<SettingsApp />);