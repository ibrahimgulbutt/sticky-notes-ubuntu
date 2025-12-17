import React from 'react';
import type { Settings } from '../../../types';

interface DataSettingsProps {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
}

export const DataSettings: React.FC<DataSettingsProps> = ({ settings, updateSetting }) => {
  const handleExport = async (format: 'json' | 'markdown') => {
    try {
      await window.electronAPI.exportNotes(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async () => {
    try {
      await window.electronAPI.importNotes();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium mb-4">Data Management</h2>
      
      {/* Export/Import */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary uppercase">Export / Import</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-matte-border hover:bg-opacity-80 rounded-lg transition-colors text-sm"
          >
            Export as JSON
          </button>
          <button
            onClick={() => handleExport('markdown')}
            className="px-4 py-2 bg-matte-border hover:bg-opacity-80 rounded-lg transition-colors text-sm"
          >
            Export as Markdown
          </button>
        </div>

        <button
          onClick={handleImport}
          className="w-full px-4 py-2 border border-cyan-accent text-cyan-accent hover:bg-cyan-accent hover:bg-opacity-10 rounded-lg transition-colors text-sm"
        >
          Import Notes
        </button>
      </div>
    </div>
  );
};
