import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import type { Note, Settings } from '../../types';
import type { INoteService } from '../interfaces';

export class NoteService implements INoteService {
  private store: Store<{notes: Note[], settings: Settings}>;

  constructor(store: Store<{notes: Note[], settings: Settings}>) {
    this.store = store;
  }

  // CRUD Operations
  async createNote(noteData: Partial<Note> = {}): Promise<Note> {
    const note: Note = {
      id: uuidv4(),
      title: noteData.title || 'New Note',
      body: noteData.body || '',
      tags: noteData.tags || [],
      color: noteData.color || '#111214',
      accent: noteData.accent || '#00E5FF',
      pinned: noteData.pinned || false,
      locked: noteData.locked || false,
      position: noteData.position || {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 320,
        height: 200,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [],
    };

    const notes = await this.getAllNotes();
    notes.push(note);
    this.store.set('notes', notes);

    return note;
  }

  async getNote(id: string): Promise<Note | null> {
    const notes = await this.getAllNotes();
    return notes.find(note => note.id === id) || null;
  }

  async getAllNotes(): Promise<Note[]> {
    return this.store.get('notes', []) as Note[];
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    const notes = await this.getAllNotes();
    const index = notes.findIndex(note => note.id === id);
    
    if (index !== -1) {
      const currentNote = notes[index];
      
      // Save version if body or title changed
      if (updates.body !== undefined || updates.title !== undefined) {
        const settings = this.store.get('settings') as Settings;
        currentNote.versions.push({
          at: new Date().toISOString(),
          body: currentNote.body,
          title: currentNote.title,
        });

        // Limit version history
        if (currentNote.versions.length > settings.versionHistoryLength) {
          currentNote.versions = currentNote.versions.slice(-settings.versionHistoryLength);
        }
      }

      notes[index] = {
        ...currentNote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.store.set('notes', notes);
    }
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getAllNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    this.store.set('notes', filteredNotes);
  }

  // Search & Filter
  async searchNotes(query: string): Promise<Note[]> {
    const notes = await this.getAllNotes();
    const lowercaseQuery = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.body.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getNotesWithTag(tag: string): Promise<Note[]> {
    const notes = await this.getAllNotes();
    return notes.filter(note => 
      note.tags.some(noteTag => noteTag.toLowerCase() === tag.toLowerCase())
    );
  }

  // Batch Operations
  async deleteMultipleNotes(ids: string[]): Promise<void> {
    const notes = await this.getAllNotes();
    const filteredNotes = notes.filter(note => !ids.includes(note.id));
    this.store.set('notes', filteredNotes);
  }

  async exportNotes(format: 'json' | 'markdown'): Promise<string> {
    const notes = await this.getAllNotes();
    
    if (format === 'json') {
      return JSON.stringify(notes, null, 2);
    } else if (format === 'markdown') {
      return notes.map(note => `# ${note.title}\n\n${note.body}\n\n---\n`).join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  async importNotes(data: string, format: 'json' | 'markdown'): Promise<void> {
    if (format === 'json') {
      try {
        const importedNotes = JSON.parse(data) as Note[];
        const currentNotes = await this.getAllNotes();
        
        // Add imported notes with new IDs to avoid conflicts
        const newNotes = importedNotes.map(note => ({
          ...note,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        this.store.set('notes', [...currentNotes, ...newNotes]);
      } catch (error) {
        throw new Error(`Failed to import JSON notes: ${error}`);
      }
    } else {
      throw new Error(`Import format ${format} not yet implemented`);
    }
  }

  // Utility methods
  async getPinnedNotes(): Promise<Note[]> {
    const notes = await this.getAllNotes();
    return notes.filter(note => note.pinned);
  }

  async getRecentNotes(limit: number = 10): Promise<Note[]> {
    const notes = await this.getAllNotes();
    return notes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  async findEmptyNote(): Promise<Note | null> {
    const notes = await this.getAllNotes();
    return notes.find(note => 
      (!note.title || note.title.trim() === '' || note.title === 'New Note') && 
      (!note.body || note.body.trim() === '' || note.body === '<p></p>' || note.body === '<p><br></p>')
    ) || null;
  }
}