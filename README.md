<p align="center">
  <img src="src/assets/icon.png" alt="Sticky Notes Logo" width="128" height="128" />
</p>

<h1 align="center">Sticky Notes</h1>

<p align="center">
  <strong>A modern, beautiful, and privacy-focused sticky notes application for your desktop.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-download--installation">Download</a> •
  <a href="#-build-from-source">Build</a>
</p>

---

## 🚀 Overview

Sticky Notes is a lightweight yet powerful desktop application designed to help you capture thoughts, manage tasks, and organize your day. Built with Electron and React, it offers a seamless experience across Windows, macOS, and Linux with a sleek matte dark theme.

## ✨ Features

*   **🎨 Modern Design**: Beautiful matte dark interface with cyan accents, designed to be easy on the eyes.
*   **📝 Rich Text Editor**: Full support for **bold**, *italic*, lists, checklists, and more.
*   **🍅 Focus Mode**: Built-in Pomodoro-style timer with beautiful, calming visualizations (Plant & Blob) to help you stay productive.
*   **📊 Central Dashboard**: A unified view to manage, search, and filter all your notes in one place.
*   **📌 Smart Organization**: 
    *   **Pin** important notes to keep them at the top.
    *   **Lock** notes to prevent accidental edits.
    *   **Color-code** notes for visual categorization.
*   **🔍 Advanced Search & Sort**: Quickly find what you need with real-time search. Sort by Title, Date Created, or Last Updated.
*   **ℹ️ Detailed Metadata**: View note details including creation time, version history, and tags.
*   **💾 Auto-Save & Local**: Your work is saved automatically. All data lives locally on your device for maximum privacy.
*   **⚙️ Customizable**: Adjust font settings, default behaviors, and more to match your workflow.

## 📸 Screenshots

<p align="center">
  <img 
    src="ScreenShots/Screenshot from 2025-12-17 18-46-38.png"
    alt="Dashboard View"
    width="350"
    height="404"
  />
  <br>
  <em>The Dashboard – Your central hub for all notes</em>
</p>


<p align="center">
  <img src="ScreenShots/Screenshot from 2025-12-17 18-47-01.png" alt="Note Editor" width="45%" />
  <img src="ScreenShots/Screenshot from 2025-12-17 18-47-27.png" alt="Settings & Info" width="45%" />
  <br>
  <em>Rich Text Editor and Note Details</em>
</p>

## 📥 Download & Installation

### 🐧 Linux (Ubuntu/Debian)
**Option 1: .deb Package (Recommended)**
1.  **Download**: Get the `.deb` file (`sticky-notes-electron_1.0.0_amd64.deb`) from the [Releases Page](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/releases).
2.  **Install**:
    ```bash
    sudo dpkg -i sticky-notes-electron_1.0.0_amd64.deb
    sudo apt-get install -f # Fix dependencies if needed
    ```

**Option 2: AppImage (Portable)**
1.  **Download**: Get the `.AppImage` file.
2.  **Run**: Right-click → Properties → Permissions → Allow executing file as program. Then double-click to run.

### 🪟 Windows
1.  **Download**: Get the latest installer (`Sticky Notes Setup 1.0.0.exe`) from the [Releases Page](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/releases).
2.  **Install**: Double-click the `.exe` file. The app will install and launch automatically.

   
### 🍎 macOS
1.  **Download**: Get the latest archive (`Sticky Notes-1.0.0-mac.zip`) from the [Releases Page](https://github.com/ibrahimgulbutt/sticky-notes-ubuntu/releases).
2.  **Install**:
    *   Unzip the file.
    *   Drag `Sticky Notes.app` to your **Applications** folder.
    *   *Note: You may need to right-click and select "Open" to bypass security warnings for unsigned apps.*


## 🛠️ Build from Source

Developers can build the app from source using the following steps:

```bash
# Clone the repository
git clone https://github.com/ibrahimgulbutt/sticky-notes-ubuntu.git
cd sticky-notes-ubuntu

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for your platform
npm run dist:win   # Windows
npm run dist:mac   # macOS
npm run dist:linux # Linux
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<p align="center">
  Made with ❤️ by <strong>Ibrahim Butt</strong>
</p>
