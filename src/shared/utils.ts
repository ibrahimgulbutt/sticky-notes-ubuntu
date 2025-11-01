import type { Note, Settings, Theme } from '../types';

export const defaultThemes: Theme[] = [
  {
    id: 'matte-dark',
    name: 'Matte Dark',
    background: '#0B0C0D',
    cardBackground: '#111214',
    accent: '#00E5FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
  },
  {
    id: 'warm-dark',
    name: 'Warm Dark',
    background: '#1A1612',
    cardBackground: '#2D2520',
    accent: '#FF9500',
    textPrimary: '#FFFFFF',
    textSecondary: '#C4B5A0',
    textMuted: '#8B7355',
  },
  {
    id: 'light-minimal',
    name: 'Light Minimal',
    background: '#FAFAFA',
    cardBackground: '#FFFFFF',
    accent: '#0066CC',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    background: '#F8F5FF',
    cardBackground: '#FFFFFF',
    accent: '#8B5CF6',
    textPrimary: '#2D1B69',
    textSecondary: '#6B46C1',
    textMuted: '#A78BFA',
  },
];

export const defaultSettings: Settings = {
  theme: 'matte-dark',
  autoSave: true,
  autoSaveInterval: 5000,
  versionHistoryLength: 10,
  globalShortcuts: {
    newNote: 'CommandOrControl+Alt+N',
    showHide: 'CommandOrControl+Alt+B',
    newPinnedNote: 'CommandOrControl+Shift+Alt+N',
  },
  completedItemBehavior: 'strike',
  autoStart: false,
  restoreLastNotes: true,
  fontSize: 14,
  fontFamily: 'Inter',
};

export function createDefaultNote(overrides: Partial<Note> = {}): Omit<Note, 'id'> {
  return {
    title: 'New Note',
    body: '',
    tags: [],
    color: '#111214',
    accent: '#00E5FF',
    pinned: false,
    locked: false,
    position: {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 320,
      height: 200,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [],
    ...overrides,
  };
}

export function validateNote(note: any): note is Note {
  return (
    typeof note === 'object' &&
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.body === 'string' &&
    Array.isArray(note.tags) &&
    typeof note.color === 'string' &&
    typeof note.accent === 'string' &&
    typeof note.pinned === 'boolean' &&
    typeof note.locked === 'boolean' &&
    typeof note.position === 'object' &&
    typeof note.position.x === 'number' &&
    typeof note.position.y === 'number' &&
    typeof note.position.width === 'number' &&
    typeof note.position.height === 'number' &&
    typeof note.createdAt === 'string' &&
    typeof note.updatedAt === 'string' &&
    Array.isArray(note.versions)
  );
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in a real app, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getThemeById(id: string): Theme | null {
  return defaultThemes.find(theme => theme.id === id) || null;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  root.style.setProperty('--bg-primary', theme.background);
  root.style.setProperty('--bg-card', theme.cardBackground);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--text-muted', theme.textMuted);
}