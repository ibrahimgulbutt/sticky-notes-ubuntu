import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
} from 'lucide-react';

interface NoteToolbarProps {
  editor: Editor | null;
}

export const NoteToolbar: React.FC<NoteToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center space-x-1 p-1.5 border-b border-white border-opacity-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('bold') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('italic') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('underline') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('strike') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        <Strikethrough size={14} />
      </button>

      <div className="w-px h-4 bg-white bg-opacity-20" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('bulletList') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Bullet List"
      >
        <List size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('orderedList') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1 rounded text-xs hover:bg-white hover:bg-opacity-10 ${
          editor.isActive('taskList') ? 'text-cyan-accent' : 'text-text-secondary'
        }`}
        title="Task List"
      >
        <CheckSquare size={14} />
      </button>
    </div>
  );
};
