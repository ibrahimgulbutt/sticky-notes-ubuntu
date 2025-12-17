<p align="center">
  <img src="src/assets/icon.png" alt="Sticky Notes Logo" width="128" height="128" />
</p>

<h1 align="center">Sticky Notes</h1>
<p align="center"><strong>A clean, lightweight, and elegant desktop sticky notes application.</strong></p>
<p align="center">Available for <strong>Windows</strong>, <strong>macOS</strong>, and <strong>Linux</strong></p>

<p align="center">
  <img src="screenshot.png" alt="Sticky Notes App Screenshot" />
</p>

---

## Overview

**Sticky Notes** is a cross-platform desktop application designed to help you quickly capture thoughts, tasks, and reminders without distraction. It focuses on simplicity, speed, and aesthetics—providing a modern note-taking experience that stays out of your way.

The application runs entirely offline and stores all data locally, ensuring privacy and fast performance.

---

## Key Features

* **Minimal & Modern UI** – Matte dark theme with subtle cyan accents
* **Rich Text Editing** – Support for bold, italics, lists, and checklists
* **Always-on-Top Notes** – Keep important notes visible while working
* **Automatic Persistence** – Notes are saved instantly as you type
* **Offline-First** – No internet connection or account required
* **Cross-Platform** – Native installers for Windows, macOS, and Linux

## Installation

### Windows

1. Download the latest installer (`Sticky Notes Setup 1.0.0.exe`) from the **Releases** page.
2. Run the installer and follow the on-screen instructions.
3. The application will launch automatically after installation.

---


### Linux (Ubuntu / Debian)

#### Option 1: `.deb` Package (Recommended)

```bash
sudo dpkg -i sticky-notes-electron_1.0.0_amd64.deb
sudo apt-get install -f
```

#### Option 2: AppImage (Portable)

1. Download the `.AppImage` file
2. Make it executable:

```bash
chmod +x Sticky-Notes.AppImage
```

3. Run the application:

```bash
./Sticky-Notes.AppImage
```

---

### macOS

1. Download `Sticky Notes-1.0.0-mac.zip` from the **Releases** page.
2. Extract the archive.
3. Drag **Sticky Notes.app** into your **Applications** folder.

> **Security Notice**
> This app is not currently signed with an Apple Developer certificate. If macOS blocks it:
>
> * Right-click the app → **Open**
> * Confirm by clicking **Open** again

---

## Build from Source

You can build Sticky Notes locally for development or custom distribution.

### Prerequisites

* Node.js (LTS recommended)
* npm

### Setup

```bash
git clone https://github.com/ibrahimgulbutt/sticky-notes-ubuntu.git
cd sticky-notes-ubuntu
npm install
```

### Development

```bash
npm run dev
```

### Production Builds

```bash
npm run dist:win     # Windows
npm run dist:mac     # macOS
npm run dist:linux   # Linux
```

---

## Technology Stack

* **Electron** – Cross-platform desktop framework
* **JavaScript / HTML / CSS** – Core application logic and UI
* **electron-builder** – Application packaging and distribution

---

## License

This project is licensed under the **MIT License**.

---

## Author

Developed and maintained by **Ibrahim Gul Butt**.

If you find this project useful, consider starring the repository ⭐
