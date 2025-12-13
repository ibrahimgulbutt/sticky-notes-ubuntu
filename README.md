<p align="center">
  <img src="src/assets/icon.png" alt="Sticky Notes Logo" width="128" height="128" />
</p>

# Sticky Notes - Beautiful Desktop Note Taking App

A minimal, modern sticky notes application for Ubuntu Linux built with Electron, React, and TypeScript. Features a beautiful matte dark theme with cyan accents, persistent storage, and powerful keyboard shortcuts.

![Sticky Notes Screenshot](screenshot.png)

## Features

### ✨ **Beautiful Design**
- **Matte Dark Theme**: Deep dark colors with subtle gradients and soft shadows
- **Cyan Accents**: Beautiful cyan highlights for text and interactive elements
- **Minimal Chrome**: Clean interface with hover-activated controls
- **Custom Typography**: Inter/Roboto font stack for excellent readability

### 📝 **Rich Text Editing**
- **TipTap Editor**: Powerful rich text editing with markdown support
- **Formatting**: Bold, italic, underline, strikethrough
- **Lists**: Bullet lists, numbered lists, and interactive checklists
- **Task Management**: Checkboxes with automatic strikethrough on completion
- **Auto-save**: Content saved automatically as you type

### 🪟 **Window Management**
- **Multiple Notes**: Create unlimited floating note windows
- **Always-on-Top**: Pin important notes to stay visible
- **Lock Mode**: Prevent accidental edits with click-through functionality
- **Drag & Resize**: Freely position and size your notes
- **Position Memory**: Notes remember their size and position

### ⌨️ **Keyboard Shortcuts**

#### Global Shortcuts (work anywhere)
- `Ctrl+Alt+N` - Create new note
- `Ctrl+Shift+Alt+N` - Create new pinned note
- `Ctrl+Alt+B` - Show/hide dashboard

#### Note Editing
- `Ctrl+B` - Bold text
- `Ctrl+I` - Italic text  
- `Ctrl+U` - Underline text
- `Ctrl+Shift+S` - Strikethrough text
- `Ctrl+Shift+L` - Toggle checklist
- `Ctrl+Shift+8` - Toggle bullet list
- `Ctrl+Shift+7` - Toggle numbered list

#### Window Controls
- `Ctrl+P` - Toggle pin (always-on-top)
- `Ctrl+L` - Toggle lock mode
- `Ctrl+W` - Close note
- `Ctrl+S` - Save note (auto-save enabled)

### 🗂️ **Organization & Search**
- **Dashboard**: Manage all notes from a central interface
- **Search**: Instant search across all note titles and content
- **Tags**: Organize notes with custom tags
- **Sorting**: Sort by title, creation date, or last modified
- **Version History**: Automatic versioning with restore capability

### 💾 **Data Management**
- **Local Storage**: All data stored locally using electron-store
- **Export/Import**: JSON and Markdown export formats
- **Auto-backup**: Automatic data backups
- **Privacy First**: No data sent to external servers

### ⚙️ **System Integration**
- **System Tray**: Quick access from system tray
- **Auto-start**: Optional launch on system startup
- **Native Packaging**: Proper .deb package for Ubuntu
- **Desktop Integration**: .desktop file for application menu

## Installation

### From .deb Package (Recommended)
```bash
# Download the latest release from the Releases page
# Install with dpkg
sudo dpkg -i sticky-notes_1.0.0_amd64.deb

# Install dependencies if needed
sudo apt-get install -f
```

### From Source
```bash
# Clone the repository
git clone https://github.com/ibrahimgulbutt/sticky-notes-ubuntu.git
cd sticky-notes-ubuntu

# Install dependencies
npm install

# Build the application
npm run build

# Start the app
npm start

# Or build for distribution
npm run dist:linux
```

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Ubuntu 20.04+ (or compatible Linux distribution)

### Setup
```bash
# Clone and install
git clone https://github.com/yourusername/sticky-notes.git
cd sticky-notes
npm install

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Package for distribution
npm run dist
```

### Project Structure
```
src/
├── main/           # Electron main process
│   ├── main.ts     # Application entry point
│   └── preload.ts  # Preload script for IPC
├── renderer/       # React frontend
│   ├── note.tsx    # Note editor component
│   ├── dashboard.tsx # Dashboard component
│   └── styles.css  # Global styles
├── types/          # TypeScript definitions
├── shared/         # Shared utilities
└── assets/         # Icons and static files
```

## Usage

### Creating Notes
- **Quick Create**: Click the system tray icon or use `Ctrl+Alt+N`
- **From Dashboard**: Click the "+" button in the dashboard
- **Pinned Notes**: Use `Ctrl+Shift+Alt+N` for always-on-top notes

### Managing Notes
- **Edit**: Click any note to start editing
- **Pin**: Click the pin icon or press `Ctrl+P`
- **Lock**: Click the lock icon or press `Ctrl+L` to prevent editing
- **Delete**: Use the context menu in the dashboard

### Keyboard Workflows
1. **Quick Note**: `Ctrl+Alt+N` → type → `Ctrl+W` to close
2. **Task List**: Create note → `Ctrl+Shift+L` → add items → check off completed
3. **Pinned Reminder**: `Ctrl+Shift+Alt+N` → type reminder → `Ctrl+P` to pin

## Configuration

### Settings File Location
```bash
~/.config/sticky-notes-electron/config.json
```

### Customizable Options
- Theme selection (matte dark, warm dark, light minimal, pastel)
- Font family and size
- Auto-save interval
- Global keyboard shortcuts
- Completed item behavior
- Auto-start preferences

## Themes

The app includes several built-in themes:

### Matte Dark (Default)
- Background: `#0B0C0D`
- Cards: `#111214`  
- Accent: `#00E5FF` (Cyan)

### Warm Dark
- Background: `#1A1612`
- Cards: `#2D2520`
- Accent: `#FF9500` (Orange)

### Light Minimal
- Background: `#FAFAFA`
- Cards: `#FFFFFF`
- Accent: `#0066CC` (Blue)

### Pastel
- Background: `#F8F5FF`
- Cards: `#FFFFFF`
- Accent: `#8B5CF6` (Purple)

## Troubleshooting

### App Won't Start
```bash
# Check if Electron is installed properly
npm ls electron

# Rebuild native dependencies
npm run postinstall

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Global Shortcuts Not Working
- Check if shortcuts conflict with system shortcuts
- Try customizing shortcuts in settings
- Restart the application after changing shortcuts

### Notes Not Saving
- Check file permissions in `~/.config/sticky-notes-electron/`
- Ensure sufficient disk space
- Try exporting notes as backup

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- **TipTap** - Rich text editor
- **Electron** - Cross-platform desktop framework
- **React** - UI framework
- **Tailwind CSS** - Styling framework
- **Lucide React** - Beautiful icons
- **electron-store** - Persistent storage

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/discussions)

**Made with ❤️ for Ubuntu users who love beautiful, minimal productivity tools.**