import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import History from '@tiptap/extension-history';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  CheckSquare,
  Pin,
  Lock,
  X,
  MoreHorizontal,
  Minimize2,
  Maximize2
} from 'lucide-react';
import type { Note, Settings } from '../types';
import './styles.css';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

interface NoteAppProps {
  noteId?: string;
}

const NoteApp: React.FC<NoteAppProps> = ({ noteId }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editorContent, setEditorContent] = useState('');

  // Sound effects system
  const playSound = useCallback((action: 'save' | 'create' | 'delete' | 'pin' | 'lock') => {
    if (!settings?.soundEnabled) return;
    
    try {
      // Create different frequency tones for different actions
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different actions
      const frequencies = {
        save: 800,
        create: 600,
        delete: 400,
        pin: 1000,
        lock: 300
      };
      
      oscillator.frequency.value = frequencies[action];
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
      console.log(`Played ${action} sound`);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }, [settings?.soundEnabled]);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      BoldExtension,
      ItalicExtension,
      Strike,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      History,
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class: 'ProseMirror',
        'data-placeholder': 'Start typing...',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      console.log('Editor content updated, content length:', content.length);
      console.log('Settings loaded:', !!settings, 'auto-save enabled:', settings?.autoSave);
      
      // Auto-save if setting is enabled OR if settings haven't loaded yet (default to true)
      const shouldAutoSave = settings === null || settings?.autoSave === true;
      
      if (shouldAutoSave) {
        console.log('Triggering auto-save...');
        debouncedSave(content);
      } else {
        console.log('Auto-save disabled by setting');
      }
    },
  }, [note?.locked, settings?.autoSave]); // Add settings dependency

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      console.log('Debounced save called - note exists:', !!note, 'settings:', settings);
      
      // Save if we have a note and either settings aren't loaded yet OR auto-save is enabled
      const shouldSave = note && (settings === null || settings?.autoSave === true);
      
      if (shouldSave) {
        console.log('Auto-saving note content...');
        try {
          await updateNote(note.id, { body: content });
          console.log('Auto-save successful');
          
          // Play save sound if enabled and settings are loaded
          if (settings?.soundEnabled) {
            playSound('save');
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      } else {
        console.log('Auto-save skipped - note:', !!note, 'autoSave setting:', settings?.autoSave);
      }
    }, settings?.autoSaveInterval ? settings.autoSaveInterval * 1000 : 1000),
    [note, settings]
  );

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      await window.electronAPI.updateNote(id, updates);
      setNote(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, []);

  // Update editor editable state when lock status changes
  useEffect(() => {
    if (editor) {
      if (note?.locked) {
        // Make editor read-only but allow task item interactions
        editor.setEditable(false);
        
        // Add custom handler for task items
        const handleTaskClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
            e.preventDefault();
            e.stopPropagation();
            
            // Temporarily make editor editable, toggle task, then make read-only again
            editor.setEditable(true);
            
            // Find the task item position
            const pos = editor.view.posAtDOM(target.closest('li') || target, 0);
            if (pos !== -1) {
              // Toggle the task item
              editor.chain().focus().command(({ tr, state, dispatch }) => {
                const resolvedPos = state.doc.resolve(pos);
                const node = resolvedPos.parent;
                
                if (node.type.name === 'taskItem') {
                  const newAttrs = { ...node.attrs, checked: !node.attrs.checked };
                  if (dispatch) {
                    tr.setNodeMarkup(resolvedPos.start() - 1, undefined, newAttrs);
                  }
                  return true;
                }
                return false;
              }).run();
            }
            
            // Make editor read-only again
            setTimeout(() => editor.setEditable(false), 50);
          }
        };

        const editorDom = editor.view.dom;
        editorDom.addEventListener('click', handleTaskClick, true);
        
        return () => {
          editorDom.removeEventListener('click', handleTaskClick, true);
        };
      } else {
        editor.setEditable(true);
      }
    }
  }, [note?.locked, editor]);

  const loadNote = useCallback(async () => {
    console.log('Loading note with ID:', noteId);
    
    // Load settings
    try {
      const appSettings = await window.electronAPI.getSettings();
      setSettings(appSettings);
      console.log('Loaded settings:', appSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    if (!noteId) {
      // Create new note
      const newNote = await window.electronAPI.createNote({});
      console.log('Created new note:', newNote);
      setNote(newNote);
      setEditorContent('');
      
      // Play create sound after settings are loaded
      setTimeout(() => {
        if (settings?.soundEnabled) {
          playSound('create');
        }
      }, 100);
    } else {
      // Load existing note
      const existingNote = await window.electronAPI.getNote(noteId);
      console.log('Loaded existing note:', existingNote);
      
      if (existingNote) {
        setNote(existingNote);
        setEditorContent(existingNote.body || '');
      } else {
        console.error('Note not found:', noteId);
        // Create new note if not found
        const newNote = await window.electronAPI.createNote({});
        setNote(newNote);
        setEditorContent('');
      }
    }
    setIsLoading(false);
  }, [noteId]);

  // Load note on component mount
  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Update editor content when note changes
  useEffect(() => {
    if (editor && editorContent !== editor.getHTML()) {
      editor.commands.setContent(editorContent);
    }
  }, [editor, editorContent]);

  // Apply settings to editor
  useEffect(() => {
    if (settings && editor) {
      const editorElement = editor.view.dom as HTMLElement;
      const editorContainer = editorElement.closest('.ProseMirror') as HTMLElement;
      
      if (editorContainer) {
        // Apply word wrap
        editorContainer.style.whiteSpace = settings.wordWrap ? 'normal' : 'nowrap';
        editorContainer.style.overflowX = settings.wordWrap ? 'visible' : 'auto';
        
        // Apply spell check
        editorContainer.spellcheck = settings.spellCheck;
        
        // Apply font settings
        editorContainer.style.fontSize = `${settings.fontSize}px`;
        editorContainer.style.fontFamily = settings.fontFamily;
      }
      
      console.log('Applied editor settings:', {
        wordWrap: settings.wordWrap,
        spellCheck: settings.spellCheck,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily
      });
    }
  }, [settings, editor]);

  // Apply lock state to editor
  useEffect(() => {
    if (editor && note) {
      editor.setEditable(!note.locked);
      
      // Add visual feedback for locked state
      const editorElement = editor.view.dom as HTMLElement;
      const editorContainer = editorElement.closest('.ProseMirror') as HTMLElement;
      
      if (editorContainer) {
        if (note.locked) {
          editorContainer.style.opacity = '0.6';
          editorContainer.style.pointerEvents = 'none';
          editorContainer.style.userSelect = 'none';
        } else {
          editorContainer.style.opacity = '1';
          editorContainer.style.pointerEvents = 'auto';
          editorContainer.style.userSelect = 'auto';
        }
      }
    }
  }, [editor, note?.locked]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            editor?.chain().focus().toggleBold().run();
            break;
          case 'i':
            e.preventDefault();
            editor?.chain().focus().toggleItalic().run();
            break;
          case 'u':
            e.preventDefault();
            editor?.chain().focus().toggleUnderline().run();
            break;
          case 's':
            if (e.shiftKey) {
              e.preventDefault();
              editor?.chain().focus().toggleStrike().run();
            }
            break;
          case 'w':
            e.preventDefault();
            window.close();
            break;
          case 'p':
            e.preventDefault();
            handleTogglePin();
            break;
          case 'l':
            e.preventDefault();
            handleToggleLock();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, note]);

  // Save content before window closes
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (note && editor) {
        const currentContent = editor.getHTML();
        console.log('Window closing - saving content...');
        try {
          // Use synchronous update for beforeunload
          await updateNote(note.id, { body: currentContent });
          console.log('Content saved on window close');
        } catch (error) {
          console.error('Failed to save on window close:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [note, editor]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (note) {
      console.log('Updating title to:', title);
      setNote(prev => prev ? { ...prev, title } : null);
      await updateNote(note.id, { title });
    }
  };

  const handleTogglePin = async () => {
    if (note) {
      const newPinned = !note.pinned;
      await updateNote(note.id, { pinned: newPinned });
      await window.electronAPI.togglePin(); // Use the current window
      
      // Play pin sound
      playSound('pin');
    }
  };

  const handleToggleLock = async () => {
    console.log('Lock button clicked, current note:', note);
    
    if (note) {
      console.log('Calling toggleLock IPC');
      
      // Toggle the lock state locally and update via IPC
      const newLocked = !note.locked;
      console.log('New lock state will be:', newLocked);
      
      // Update the note in the database
      await updateNote(note.id, { locked: newLocked });
      
      // Update local state immediately for responsive UI
      setNote(prev => prev ? { ...prev, locked: newLocked } : null);
      
      // Also call the IPC to ensure window state is updated
      await window.electronAPI.toggleLock();
      
      // Play lock sound
      playSound('lock');
    }
  };

  const handleClose = async () => {
    // Save current content before closing
    if (note && editor) {
      const currentContent = editor.getHTML();
      console.log('Saving content before closing...');
      try {
        await updateNote(note.id, { body: currentContent });
        console.log('Content saved successfully before closing');
      } catch (error) {
        console.error('Failed to save content before closing:', error);
      }
    }
    window.close();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-matte-card rounded-lg flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="w-full h-full bg-matte-card rounded-lg flex items-center justify-center">
        <div className="text-text-secondary">Note not found</div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full bg-matte-card overflow-hidden flex flex-col note-window-border"
      style={{ backgroundColor: note.color }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between p-1.5 bg-black bg-opacity-20 drag-handle">
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          className="bg-transparent text-text-primary text-sm font-medium border-none outline-none flex-1 min-w-0 no-drag"
          placeholder="Note title"
          disabled={note.locked}
        />
        
        <div className={`flex items-center space-x-1 transition-opacity duration-200 no-drag ${showToolbar ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleTogglePin}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${note.pinned ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Pin note"
          >
            <Pin size={12} />
          </button>
          
          <button
            onClick={handleToggleLock}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${note.locked ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Lock note"
          >
            <Lock size={12} />
          </button>
          
          <button
            onClick={handleMinimize}
            className="p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 text-text-secondary"
            title="Minimize"
          >
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          
          <button
            onClick={handleClose}
            className="p-1 rounded text-xs hover:bg-red-500 hover:bg-opacity-20 text-text-secondary hover:text-red-400"
            title="Close note"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Editor Toolbar */}
      {!isMinimized && !note.locked && (
        <div className={`flex items-center space-x-1 px-1.5 py-0.5 bg-black bg-opacity-10 border-b border-white border-opacity-10 transition-opacity duration-200 no-drag ${showToolbar ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('bold') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('italic') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('underline') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={14} />
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('strike') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Strikethrough (Ctrl+Shift+S)"
          >
            <Strikethrough size={14} />
          </button>
          
          <div className="w-px h-4 bg-white bg-opacity-20" />
          
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('bulletList') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Bullet List"
          >
            <List size={14} />
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('orderedList') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${editor?.isActive('taskList') ? 'text-cyan-accent' : 'text-text-secondary'}`}
            title="Task List"
          >
            <CheckSquare size={14} />
          </button>
        </div>
      )}

      {/* Editor Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-drag">
          <EditorContent 
            editor={editor} 
            className={`h-full no-drag ${note.locked ? 'locked' : ''}`}
            style={{ 
              opacity: note.locked ? 0.7 : 1,
              height: '100%'
            }}
          />
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="p-1.5 text-text-secondary text-xs">
          {note.title || 'Untitled Note'}
        </div>
      )}
    </div>
  );
};

// Get note ID from URL or command line args
const getNoteId = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('noteId') || undefined;
};

// Initialize the note app
const noteId = getNoteId();
const root = createRoot(document.getElementById('root')!);
root.render(<NoteApp noteId={noteId} />);