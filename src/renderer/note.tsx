import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import type { Note } from '../types';
import './styles.css';
import { NoteHeader } from './components/NoteHeader';
import { NoteToolbar } from './components/NoteToolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNoteStore } from './store/useNoteStore';

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
  // Use Zustand store
  const { 
    note, 
    settings, 
    isLoading, 
    isMinimized, 
    setNote, 
    setSettings, 
    setIsLoading, 
    updateNoteLocal,
    setIsMinimized,
    toggleMinimize
  } = useNoteStore();

  const [editorContent, setEditorContent] = useState('');
  const isLoaded = useRef(false);

  // Refs for accessing latest state in callbacks without re-creating them
  const noteRef = useRef(note);
  const settingsRef = useRef(settings);

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sound effects system
  const playSound = useCallback(
    (action: 'save' | 'create' | 'delete' | 'pin' | 'lock') => {
      if (!settings?.soundEnabled) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequencies = {
          save: 800,
          create: 600,
          delete: 400,
          pin: 1000,
          lock: 300,
        };

        oscillator.frequency.value = frequencies[action];
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.error('Failed to play sound:', error);
      }
    },
    [settings?.soundEnabled]
  );

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      // Update local state immediately
      updateNoteLocal(updates);
      // Update backend
      await window.electronAPI.updateNote(id, updates);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [updateNoteLocal]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      const currentNote = noteRef.current;
      const currentSettings = settingsRef.current;
      const shouldSave = currentNote && (currentSettings === null || currentSettings?.autoSave === true);

      if (shouldSave && currentNote) {
        try {
          updateNoteLocal({ body: content });
          await window.electronAPI.updateNote(currentNote.id, { body: content });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 1000),
    [updateNoteLocal] 
  );

  const editor = useEditor(
    {
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
        const currentSettings = settingsRef.current;
        const shouldAutoSave = currentSettings === null || currentSettings?.autoSave === true;

        if (shouldAutoSave) {
          debouncedSave(content);
        }
      },
    },
    [] // Empty dependency array to prevent re-creation!
  );

  // Update editor editable state when lock status changes
  useEffect(() => {
    if (editor) {
      // Force update editable state based on lock status
      const isLocked = note?.locked || false;
      
      // Always set editable state explicitly
      editor.setEditable(!isLocked);
      
      if (isLocked) {
        editor.commands.blur();
        
        // Add custom handler for task items
        const handleTaskClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
            e.preventDefault();
            e.stopPropagation();
            
            // Temporarily enable editing for checkbox toggle
            editor.setEditable(true);
            
            const pos = editor.view.posAtDOM(target.closest('li') || target, 0);
            if (pos !== -1) {
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
            
            // Re-lock immediately
            setTimeout(() => {
                if (editor && !editor.isDestroyed) {
                    editor.setEditable(false);
                }
            }, 50);
          }
        };

        const editorDom = editor.view.dom;
        editorDom.addEventListener('click', handleTaskClick, true);
        return () => {
          editorDom.removeEventListener('click', handleTaskClick, true);
        };
      }
    }
  }, [note?.locked, editor]);

  const loadNote = useCallback(async () => {
    if (isLoaded.current) return; // Prevent re-loading

    try {
      const appSettings = await window.electronAPI.getSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    if (!noteId) {
      const newNote = await window.electronAPI.createNote({});
      setNote(newNote);
      setEditorContent('');
      setTimeout(() => {
        if (settings?.soundEnabled) playSound('create');
      }, 100);
    } else {
      const existingNote = await window.electronAPI.getNote(noteId);
      if (existingNote) {
        setNote(existingNote);
        setEditorContent(existingNote.body || '');
        // If editor exists, set content immediately
        if (editor) {
            editor.commands.setContent(existingNote.body || '');
        }
      } else {
        const newNote = await window.electronAPI.createNote({});
        setNote(newNote);
        setEditorContent('');
      }
    }
    setIsLoading(false);
    isLoaded.current = true;
  }, [noteId, setNote, setSettings, setIsLoading, playSound, settings?.soundEnabled, editor]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  useEffect(() => {
    if (settings && editor) {
      const editorElement = editor.view.dom as HTMLElement;
      const editorContainer = editorElement.closest('.ProseMirror') as HTMLElement;

      if (editorContainer) {
        editorContainer.style.whiteSpace = settings.wordWrap ? 'normal' : 'nowrap';
        editorContainer.style.overflowX = settings.wordWrap ? 'visible' : 'auto';
        editorContainer.spellcheck = settings.spellCheck;
        editorContainer.style.fontSize = `${settings.fontSize}px`;
        editorContainer.style.fontFamily = settings.fontFamily;
      }
    }
  }, [settings, editor]);

  // Apply lock state visual feedback
  useEffect(() => {
    if (editor && note) {
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
          case 'b': e.preventDefault(); editor?.chain().focus().toggleBold().run(); break;
          case 'i': e.preventDefault(); editor?.chain().focus().toggleItalic().run(); break;
          case 'u': e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); break;
          case 's': if (e.shiftKey) { e.preventDefault(); editor?.chain().focus().toggleStrike().run(); } break;
          case 'w': e.preventDefault(); window.close(); break;
          case 'p': e.preventDefault(); handleTogglePin(); break;
          case 'l': e.preventDefault(); handleToggleLock(); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, note]);

  // Save content before window closes
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (note && editor) {
        const currentContent = editor.getHTML();
        try {
          await updateNote(note.id, { body: currentContent });
        } catch (error) {
          console.error('Failed to save on window close:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [note, editor, updateNote]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (note) {
      await updateNote(note.id, { title });
    }
  };

  const handleTogglePin = async () => {
    if (note) {
      const newPinned = !note.pinned;
      await updateNote(note.id, { pinned: newPinned });
      await window.electronAPI.togglePin();
      playSound('pin');
    }
  };

  const handleToggleLock = async () => {
    if (note) {
      const newLocked = !note.locked;
      
      // Force editor state immediately to ensure responsiveness
      if (editor) {
        editor.setEditable(!newLocked);
      }

      // Update local state immediately via store
      updateNoteLocal({ locked: newLocked });
      
      // Update backend
      try {
        await window.electronAPI.updateNote(note.id, { locked: newLocked });
        // We don't need to call toggleLock IPC as the renderer handles the state
        // and the main process handler does nothing anyway
      } catch (error) {
        console.error('Failed to update lock state:', error);
        // Revert on error
        updateNoteLocal({ locked: !newLocked });
        if (editor) editor.setEditable(newLocked);
        return;
      }
      
      playSound('lock');
    }
  };

  const handleClose = async () => {
    if (note && editor) {
      const currentContent = editor.getHTML();
      try {
        await updateNote(note.id, { body: currentContent });
      } catch (error) {
        console.error('Failed to save content before closing:', error);
      }
    }
    window.close();
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
      className="w-full h-full bg-matte-card overflow-hidden flex flex-col note-window-border group"
      style={{ backgroundColor: note.color }}
    >
      <NoteHeader
        note={note}
        isMinimized={isMinimized}
        onTitleChange={handleTitleChange}
        onTogglePin={handleTogglePin}
        onToggleLock={handleToggleLock}
        onMinimize={toggleMinimize}
        onClose={handleClose}
      />

      {!isMinimized && !note.locked && (
        <NoteToolbar editor={editor} />
      )}

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-drag">
          <EditorContent
            editor={editor}
            className={`h-full no-drag ${note.locked ? 'locked' : ''}`}
            style={{
              opacity: note.locked ? 0.7 : 1,
              height: '100%',
            }}
          />
        </div>
      )}

      {isMinimized && (
        <div className="p-1.5 text-text-secondary text-xs">
          {note.title || 'Untitled Note'}
        </div>
      )}
    </div>
  );
};

const getNoteId = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('noteId') || undefined;
};

const noteId = getNoteId();
const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <NoteApp noteId={noteId} />
  </ErrorBoundary>
);
