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
import { useSettingsStore } from './store/useSettingsStore';

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
    isLoading, 
    isMinimized, 
    setNote, 
    setIsLoading, 
    updateNoteLocal,
    setIsMinimized,
    toggleMinimize
  } = useNoteStore();

  const { settings, init: initSettings } = useSettingsStore();

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
      }

      // Add custom handler for task items - Apply to BOTH locked and unlocked notes
      const handleTaskClick = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
          // If locked, prevent interaction
          if (note?.locked) {
              e.preventDefault();
              return;
          }

          // Handle completed item behavior
          const behavior = settingsRef.current?.completedItemBehavior || 'strike';
          
          if (behavior === 'delete') {
              // Delete the task item
              e.preventDefault();
              const pos = editor.view.posAtDOM(target.closest('li') || target, 0);
              if (pos !== -1) {
                  // Fix: Set selection to the item before deleting to ensure we delete the correct one
                  editor.chain().setTextSelection(pos).deleteNode('taskItem').run();
              }
              return;
          } 
          
          if (behavior === 'archive') {
              // Move to bottom
              e.preventDefault();
              const pos = editor.view.posAtDOM(target.closest('li') || target, 0);
              if (pos !== -1) {
                  editor.chain().command(({ tr, state, dispatch }) => {
                      const resolvedPos = state.doc.resolve(pos);
                      const taskItem = resolvedPos.parent;
                      if (taskItem.type.name !== 'taskItem') return false;

                      // 1. Toggle checked status
                      const newAttrs = { ...taskItem.attrs, checked: !taskItem.attrs.checked };
                      
                      // 2. Find parent list
                      // taskItem is at depth, taskList is at depth - 1
                      const listPos = resolvedPos.before(resolvedPos.depth);
                      const listNode = state.doc.nodeAt(listPos);
                      
                      if (!listNode || listNode.type.name !== 'taskList') {
                          // Fallback: just toggle if not in a list (shouldn't happen for taskItem)
                          if (dispatch) {
                              tr.setNodeMarkup(resolvedPos.before(resolvedPos.depth), undefined, newAttrs);
                          }
                          return true;
                      }

                      if (dispatch) {
                          const itemStart = resolvedPos.before(resolvedPos.depth);
                          const itemSize = taskItem.nodeSize;
                          
                          // Only move to bottom if we are checking it (marking as done)
                          if (newAttrs.checked) {
                              // Delete the item from current position
                              tr.delete(itemStart, itemStart + itemSize);
                              
                              // Calculate new insertion point: end of list
                              // The list node size has decreased by itemSize
                              // listPos points to start of list. 
                              // New end is listPos + (originalSize - itemSize) - 1 (for closing tag)
                              // But tr.mapping might handle positions? 
                              // Safer to calculate based on original doc and let transaction map it?
                              // No, simpler: listPos is stable (before the deletion).
                              // The list content ends at listPos + listNode.nodeSize - 1.
                              // After deletion, it ends at listPos + listNode.nodeSize - itemSize - 1.
                              const insertPos = listPos + listNode.nodeSize - itemSize - 1;
                              
                              // Create new node with updated attributes
                              const newNode = taskItem.type.create(newAttrs, taskItem.content);
                              tr.insert(insertPos, newNode);
                          } else {
                              // Just toggle if unchecking
                              tr.setNodeMarkup(itemStart, undefined, newAttrs);
                          }
                      }
                      return true;
                  }).run();
              }
              return;
          }

          // Default behavior (strike) is handled by Tiptap
        }
      };

      const editorDom = editor.view.dom;
      editorDom.addEventListener('click', handleTaskClick, true);
      return () => {
        editorDom.removeEventListener('click', handleTaskClick, true);
      };
    }
  }, [note?.locked, editor]);

  const loadNote = useCallback(async () => {
    if (isLoaded.current) return; // Prevent re-loading

    initSettings();

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
        
        // Sync window state with note state
        if (existingNote.pinned) {
          window.electronAPI.setPin(true);
        }

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
  }, [noteId, setNote, initSettings, setIsLoading, playSound, settings?.soundEnabled, editor]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Listen for note updates from main process (e.g. color change from settings)
  useEffect(() => {
    const cleanup = window.electronAPI.onNoteUpdated((updatedNote: Note) => {
      if (noteRef.current && noteRef.current.id === updatedNote.id) {
        setNote(updatedNote);
      }
    });
    return cleanup;
  }, [setNote]);

  useEffect(() => {
    if (settings && editor) {
      const editorElement = editor.view.dom as HTMLElement;
      const editorContainer = editorElement.closest('.ProseMirror') as HTMLElement;

      if (editorContainer) {
        editorContainer.style.whiteSpace = settings.wordWrap ? 'normal' : 'nowrap';
        editorContainer.style.overflowX = settings.wordWrap ? 'visible' : 'auto';
        editorContainer.spellcheck = settings.spellCheck;
        editorContainer.style.fontSize = `${settings.fontSize || 14}px`;
        editorContainer.style.fontFamily = settings.fontFamily || 'Inter';
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

  const handleTitleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const currentNote = noteRef.current;
    if (currentNote) {
      await updateNote(currentNote.id, { title });
    }
  }, [updateNote]);

  const handleTogglePin = useCallback(async () => {
    const currentNote = noteRef.current;
    if (currentNote) {
      const newPinned = !currentNote.pinned;
      await updateNote(currentNote.id, { pinned: newPinned });
      await window.electronAPI.togglePin();
      playSound('pin');
    }
  }, [updateNote, playSound]);

  const handleToggleLock = useCallback(async () => {
    const currentNote = noteRef.current;
    if (currentNote) {
      const newLocked = !currentNote.locked;
      
      // Force editor state immediately to ensure responsiveness
      if (editor) {
        editor.setEditable(!newLocked);
      }

      // Update local state immediately via store
      updateNoteLocal({ locked: newLocked });
      
      // Update backend
      try {
        await window.electronAPI.updateNote(currentNote.id, { locked: newLocked });
      } catch (error) {
        console.error('Failed to update lock state:', error);
        // Revert on error
        updateNoteLocal({ locked: !newLocked });
        if (editor) editor.setEditable(newLocked);
        return;
      }
      
      playSound('lock');
    }
  }, [editor, updateNoteLocal, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 'b': 
            e.preventDefault(); 
            if (editor) editor.chain().focus().toggleBold().run(); 
            break;
          case 'i': 
            e.preventDefault(); 
            if (editor) editor.chain().focus().toggleItalic().run(); 
            break;
          case 'u': 
            e.preventDefault(); 
            if (editor) editor.chain().focus().toggleUnderline().run(); 
            break;
          case 's': 
            if (e.shiftKey) { 
               e.preventDefault(); 
               if (editor) editor.chain().focus().toggleStrike().run(); 
            }
            break;
          case 'n':
            if (e.shiftKey) {
              e.preventDefault();
              // New Pinned Note
              window.electronAPI.createNote({ pinned: true });
            } else {
              e.preventDefault();
              // New Note
              window.electronAPI.createNote({});
            }
            break;
          case 'z': 
            if (e.shiftKey) {
               e.preventDefault(); if (editor) editor.chain().focus().redo().run(); 
            } else {
               e.preventDefault(); if (editor) editor.chain().focus().undo().run(); 
            }
            break;
          case 'y': e.preventDefault(); if (editor) editor.chain().focus().redo().run(); break;
          case 'w': e.preventDefault(); window.close(); break;
          case 'p': e.preventDefault(); handleTogglePin(); break;
          case 'l': e.preventDefault(); handleToggleLock(); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleTogglePin, handleToggleLock, debouncedSave]);

  const handleColorChange = useCallback(async (color: string) => {
    const currentNote = noteRef.current;
    if (currentNote) {
      // Update local state immediately
      updateNoteLocal({ color });
      // Update backend
      await window.electronAPI.updateNote(currentNote.id, { color });
    }
  }, [updateNoteLocal]);

  const handleClose = useCallback(async () => {
    const currentNote = noteRef.current;
    if (currentNote && editor) {
      const currentContent = editor.getHTML();
      try {
        await updateNote(currentNote.id, { body: currentContent });
      } catch (error) {
        console.error('Failed to save content before closing:', error);
      }
    }
    window.close();
  }, [editor, updateNote]);

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
        <NoteToolbar 
          editor={editor} 
          onColorChange={handleColorChange}
          currentColor={note.color}
          defaultColor={settings?.defaultNoteColor}
        />
      )}

      {!isMinimized && (
        <div className={`flex-1 overflow-y-auto overflow-x-hidden no-drag ${settings?.cyanBold ? 'cyan-bold-enabled' : ''}`}>
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
