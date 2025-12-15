<p align="center">
  <img src="src/assets/icon.png" alt="Sticky Notes Logo" width="128" height="128" />
</p>

# Sticky Notes

**A minimal, beautiful sticky notes app for your desktop.**

Available on **Windows**, **macOS**, and **Linux**.

![Sticky Notes Screenshot](screenshot.png)

## 📥 Download & Installation

### 🪟 Windows
1.  **Download**: Get the latest installer (`Sticky Notes Setup 1.0.0.exe`) from the [Releases Page](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/releases).
2.  **Install**: Double-click the `.exe` file. The app will install and launch automatically.

### 🍎 macOS
1.  **Download**: Get the latest archive (`Sticky Notes-1.0.0-mac.zip`) from the [Releases Page](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/releases).
2.  **Install**:
    *   Unzip the file.
    *   Drag `Sticky Notes.app` to your **Applications** folder.
    *   **Note**: Since this app is not signed by Apple, you may see a warning. To open it:
        *   **Right-click** (or Control-click) the app icon.
        *   Select **Open**.
        *   Click **Open** in the dialog box.

### 🐧 Linux (Ubuntu/Debian)
**Option 1: .deb Package (Recommended)**
1.  **Download**: Get the `.deb` file (`sticky-notes-electron_1.0.0_amd64.deb`) from the [Releases Page](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/releases).
2.  **Install**: Double-click the file or run:
    ```bash
    sudo dpkg -i sticky-notes-electron_1.0.0_amd64.deb
    sudo apt-get install -f # Fix dependencies if needed
    ```

**Option 2: AppImage (Portable)**
1.  **Download**: Get the `.AppImage` file.
2.  **Run**: Right-click → Properties → Permissions → Allow executing file as program. Then double-click to run.

---

## ✨ Features

*   **Beautiful Design**: Matte dark theme with cyan accents.
*   **Rich Text Editor**: Bold, italic, lists, and checklists.
*   **Always-on-Top**: Pin important notes to keep them visible.
*   **Auto-Save**: Notes are saved automatically as you type.
*   **Local Storage**: Your data stays on your machine. No cloud account required.

## ⌨️ Key Shortcuts

| Action | Shortcut |
|--------|----------|
| **New Note** | `Ctrl` + `Alt` + `N` |
| **Show Dashboard** | `Ctrl` + `Alt` + `B` |
| **Bold** | `Ctrl` + `B` |
| **Italic** | `Ctrl` + `I` |
| **Checklist** | `Ctrl` + `Shift` + `L` |
| **Pin Note** | `Ctrl` + `P` |
| **Close Note** | `Ctrl` + `W` |

## 🛠️ Build from Source

If you want to build the app yourself:

```bash
# Clone the repo
git clone https://github.com/ibrahimgulbutt/sticky-notes-ubuntu.git
cd sticky-notes-ubuntu

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for your platform
npm run dist:win   # Windows
npm run dist:mac   # macOS
npm run dist:linux # Linux
```

## License

MIT License. Made with ❤️ by Ibrahim Butt.
