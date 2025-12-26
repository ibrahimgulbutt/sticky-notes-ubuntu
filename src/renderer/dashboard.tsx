import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Search, 
  Settings, 
  X,
  Pin,
  Lock,
  MoreVertical,
  FileText,
  Tag,
  Calendar,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import type { Note, Settings as AppSettings } from '../types';
import './styles.css';
import { useSettingsStore } from './store/useSettingsStore';
import { FocusSetupModal } from './components/FocusSetupModal';
import { ActiveSessionModal } from './components/ActiveSessionModal';

// Utility function for date formatting
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

interface InfoModalProps {
  note: Note;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ note, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-matte-card border border-matte-border rounded-lg p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Note Details</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-text-muted">Title:</span>
            <span className="col-span-2 text-text-primary font-medium truncate">{note.title || 'Untitled'}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <span className="text-text-muted">Created:</span>
            <span className="col-span-2 text-text-primary">{new Date(note.createdAt).toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <span className="text-text-muted">Last Updated:</span>
            <span className="col-span-2 text-text-primary">{new Date(note.updatedAt).toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <span className="text-text-muted">Versions:</span>
            <span className="col-span-2 text-text-primary">{note.versions.length}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <span className="text-text-muted">Status:</span>
            <div className="col-span-2 flex gap-2">
              {note.pinned && <span className="text-cyan-accent">Pinned</span>}
              {note.locked && <span className="text-yellow-500">Locked</span>}
              {!note.pinned && !note.locked && <span className="text-text-secondary">Normal</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
             <span className="text-text-muted">Tags:</span>
             <div className="col-span-2 flex flex-wrap gap-1">
               {note.tags.length > 0 ? (
                 note.tags.map(tag => (
                   <span key={tag} className="px-1.5 py-0.5 bg-matte-light rounded text-xs text-text-secondary">
                     {tag}
                   </span>
                 ))
               ) : (
                 <span className="text-text-muted italic">No tags</span>
               )}
             </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-matte-light hover:bg-matte-border text-text-primary rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const { settings, init: initSettings, updateSettings } = useSettingsStore();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [isScrollable, setIsScrollable] = useState(false);
  const [infoNote, setInfoNote] = useState<Note | null>(null);
  const [showFocusSetup, setShowFocusSetup] = useState(false);
  const [showActiveSession, setShowActiveSession] = useState(false);

  const loadNotes = useCallback(async () => {
    const allNotes = await window.electronAPI.getAllNotes();
    setNotes(allNotes);
  }, []);

  useEffect(() => {
    loadNotes();
    initSettings();
  }, [loadNotes, initSettings]);

  // Initialize sort from settings
  useEffect(() => {
    if (settings?.dashboardSortBy) {
      setSortBy(settings.dashboardSortBy);
    }
  }, [settings?.dashboardSortBy]);

  const handleSortChange = (newSort: 'updated' | 'created' | 'title') => {
    setSortBy(newSort);
    updateSettings({ dashboardSortBy: newSort });
  };

  // Filter and search notes
  useEffect(() => {
    let filtered = notes;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.body.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(note => note.tags.includes(selectedTag));
    }

    // Sort notes
    const sortedNotes = [...filtered].sort((a, b) => {
      // Always prioritize pinned notes at the top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Prioritize title matches when searching
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const aTitleMatch = (a.title || '').toLowerCase().includes(query);
        const bTitleMatch = (b.title || '').toLowerCase().includes(query);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
      }

      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    setFilteredNotes(sortedNotes);
  }, [notes, searchQuery, selectedTag, sortBy]);

  const createNewNote = async (pinned = false) => {
    // Check if there's already an empty note
    const emptyNote = notes.find(note => 
      (!note.title || note.title.trim() === '' || note.title === 'New Note') && 
      (!note.body || note.body.trim() === '' || note.body === '<p></p>' || note.body === '<p><br></p>')
    );
    
    if (emptyNote) {
      // Open the existing empty note instead of creating a new one
      await window.electronAPI.createNoteWindow(emptyNote.id);
      return;
    }
    
    // Create new note only if no empty note exists
    const newNote = await window.electronAPI.createNote({ pinned });
    await window.electronAPI.createNoteWindow(newNote.id);
    await loadNotes();
  };

  const openNote = async (noteId: string) => {
    // This will now check if window is already open and focus it instead of creating new one
    await window.electronAPI.createNoteWindow(noteId);
  };

  const deleteNote = async (noteId: string) => {
    await window.electronAPI.deleteNote(noteId);
    await loadNotes();
  };

  const toggleNotePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const newPinnedState = !note.pinned;
      
      if (newPinnedState) {
        // If pinning, unpin all other notes first (enforce single pin)
        const currentlyPinned = notes.find(n => n.pinned && n.id !== noteId);
        if (currentlyPinned) {
          await window.electronAPI.updateNote(currentlyPinned.id, { pinned: false });
        }
      }
      
      await window.electronAPI.updateNote(noteId, { pinned: newPinnedState });
      await loadNotes();
    }
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const handleCloseWindow = () => {
    window.close();
  };

  const handleOpenSettings = async () => {
    await window.electronAPI.openSettings();
  };

  const exportNotes = async () => {
    try {
      await window.electronAPI.exportNotes('json');
      alert('Notes exported successfully! Check your Downloads folder for the JSON file.');
    } catch (error) {
      alert('Export failed: ' + error);
    }
  };

  const importNotes = async () => {
    try {
      await window.electronAPI.importNotes();
      await loadNotes();
      alert('Notes imported successfully! Your imported notes should now appear in the list.');
    } catch (error) {
      alert('Import failed: ' + error);
    }
  };

  const allTags = getAllTags();

  return (
    <div className="w-full h-full bg-matte-dark text-text-primary flex flex-col relative">
      {infoNote && (
        <InfoModal note={infoNote} onClose={() => setInfoNote(null)} />
      )}

      {showFocusSetup && (
        <FocusSetupModal 
          onClose={() => setShowFocusSetup(false)}
          onStart={(duration, mode) => window.electronAPI.startFocus(duration, mode)}
        />
      )}

      {showActiveSession && (
        <ActiveSessionModal onClose={() => setShowActiveSession(false)} />
      )}

      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-matte-border"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <h1 className="text-lg font-semibold text-text-primary">Sticky Notes</h1>
        <div 
          className="flex items-center space-x-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => createNewNote(false)}
            className="p-2 hover:bg-matte-light rounded-lg transition-colors"
            title="New Note (Ctrl+N)"
          >
            <Plus size={18} className="text-cyan-accent" />
          </button>
          <button
            onClick={async () => {
              const state = await window.electronAPI.getFocusState();
              if (state && state.isActive) {
                setShowActiveSession(true);
              } else {
                setShowFocusSetup(true);
              }
            }}
            className="p-2 hover:bg-matte-light rounded-lg transition-colors"
            title="Focus Session"
          >
            <span className="text-lg">🍅</span>
          </button>
          <button
            onClick={handleOpenSettings}
            className="p-2 hover:bg-matte-light rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={handleCloseWindow}
            className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors"
            title="Close Dashboard"
          >
            <X size={18} className="text-text-secondary hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-3 border-b border-matte-border">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-matte-card border border-matte-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 text-sm">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as 'updated' | 'created' | 'title')}
            className="bg-matte-card border border-matte-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-cyan-accent"
          >
            <option value="updated">Last Updated</option>
            <option value="created">Date Created</option>
            <option value="title">Title</option>
          </select>

          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-matte-card border border-matte-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-cyan-accent"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{filteredNotes.length} of {notes.length} notes</span>
        </div>
      </div>

      {/* Notes List */}
      <div 
        className="flex-1 p-4 pb-8 space-y-3 relative overflow-y-auto overflow-x-hidden" 
        style={{ 
          scrollbarWidth: 'auto',
          maxHeight: 'calc(100vh - 200px)'
        }}
        onScroll={(e) => {
          const element = e.currentTarget;
          setIsScrollable(element.scrollHeight > element.clientHeight);
        }}
      >
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery || selectedTag ? 'No notes match your search' : 'No notes yet'}
            </p>
            <button
              onClick={() => createNewNote(false)}
              className="mt-4 px-4 py-2 bg-cyan-accent text-white rounded-lg hover:bg-cyan-hover transition-colors"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <>
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={() => openNote(note.id)}
                onDelete={() => deleteNote(note.id)}
                onTogglePin={() => toggleNotePin(note.id)}
                onShowInfo={() => setInfoNote(note)}
              />
            ))}
            
            {/* Scroll indicator gradient */}
            {filteredNotes.length > 5 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-matte-dark to-transparent pointer-events-none" />
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onShowInfo: () => void;
  isOpen?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onOpen, onDelete, onTogglePin, onShowInfo, isOpen = false }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getPreviewText = (html: string) => {
    // Simple HTML to text conversion for preview
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const previewText = getPreviewText(note.body);

  return (
    <div 
      className={`group bg-matte-card rounded-lg p-3 border transition-all cursor-pointer ${
        isOpen 
          ? 'border-cyan-accent border-opacity-70 shadow-lg shadow-cyan-accent shadow-opacity-20' 
          : 'border-matte-border hover:border-cyan-accent hover:border-opacity-50'
      }`}
      style={{ backgroundColor: note.color }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-text-primary truncate flex-1 mr-2">
          {note.title || 'Untitled'}
        </h3>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOpen && (
            <div className="w-2 h-2 bg-cyan-accent rounded-full animate-pulse" title="Currently open" />
          )}
          {note.pinned && (
            <Pin size={12} className="text-cyan-accent" />
          )}
          {note.locked && (
            <Lock size={12} className="text-text-muted" />
          )}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-black hover:bg-opacity-20 rounded"
            >
              <MoreVertical size={12} className="text-text-secondary" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-matte-card border border-matte-border rounded-lg shadow-lg z-10 min-w-24">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-matte-light flex items-center space-x-2"
                >
                  <Pin size={12} />
                  <span>{note.pinned ? 'Unpin' : 'Pin'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowInfo();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-matte-light flex items-center space-x-2"
                >
                  <Info size={12} />
                  <span>Info</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-500 hover:bg-opacity-20 text-red-400 flex items-center space-x-2"
                >
                  <X size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewText && (
        <div className="text-text-secondary text-sm mb-2 overflow-hidden" style={{ maxHeight: '4.5em' }}>
          {previewText}
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map(tag => (
            <span
              key={tag}
              className="inline-block px-2 py-1 bg-cyan-accent bg-opacity-20 text-cyan-accent text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{formatDate(note.updatedAt)}</span>
        <div className="flex items-center space-x-2">
          {note.versions.length > 0 && (
            <span>{note.versions.length} versions</span>
          )}
          <Calendar size={10} />
        </div>
      </div>
    </div>
  );
};

// Initialize the dashboard app
const root = createRoot(document.getElementById('root')!);
root.render(<DashboardApp />);