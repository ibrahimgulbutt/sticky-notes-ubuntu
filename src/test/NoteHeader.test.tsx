import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteHeader } from '../renderer/components/NoteHeader';
import type { Note } from '../types';

const mockNote: Note = {
  id: '1',
  title: 'Test Note',
  body: 'Test Body',
  tags: [],
  color: '#ffffff',
  accent: '#000000',
  pinned: false,
  locked: false,
  position: { x: 0, y: 0, width: 200, height: 200 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  versions: [],
};

describe('NoteHeader', () => {
  it('renders the note title', () => {
    render(
      <NoteHeader
        note={mockNote}
        showToolbar={true}
        isMinimized={false}
        onTitleChange={() => {}}
        onTogglePin={() => {}}
        onToggleLock={() => {}}
        onMinimize={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
  });

  it('calls onTitleChange when input changes', () => {
    const onTitleChange = vi.fn();
    render(
      <NoteHeader
        note={mockNote}
        showToolbar={true}
        isMinimized={false}
        onTitleChange={onTitleChange}
        onTogglePin={() => {}}
        onToggleLock={() => {}}
        onMinimize={() => {}}
        onClose={() => {}}
      />
    );
    
    const input = screen.getByDisplayValue('Test Note');
    fireEvent.change(input, { target: { value: 'New Title' } });
    expect(onTitleChange).toHaveBeenCalled();
  });
});
