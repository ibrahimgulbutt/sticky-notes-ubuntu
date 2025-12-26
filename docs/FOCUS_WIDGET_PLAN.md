# Focus Widget Implementation Plan

## 🎯 Overview
This document outlines the plan to implement a floating, always-on-top focus widget for the Sticky Notes app. The widget will feature two visual modes (Plant & Liquid Blob) to visualize time progress in a calm, aesthetic manner.

## 🏗️ Architecture

### 1. Electron Main Process
The main process will handle the timer logic to ensure accuracy and persistence even if the renderer is sluggish.

*   **`FocusManager`**: A new class to handle timer state (running, paused, completed), duration, and progress.
*   **`WindowManager`**: Updated to create the specialized widget window.
*   **IPC Channels**:
    *   `focus:start`, `focus:pause`, `focus:stop` (Renderer -> Main)
    *   `focus:update` (Main -> Renderer, sends `{ progress: 0-100, timeLeft: string, elapsedMs: number, state: 'active'|'idle' }`)

**Linux/Ubuntu Specifics:**
To ensure transparent windows work correctly on Ubuntu 24.04 (GNOME), we must ensure the following flags are set before `app.whenReady()`:
```typescript
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('enable-transparent-visuals'); // Critical for transparency
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
}
```

### 2. Electron Window Configuration
The window needs to be unobtrusive and blend into the desktop.

**📍 Visual Location:**
*   **Widget**: Floats on the desktop (user-draggable). Defaults to bottom-right or center.
*   **Tray Icon**: Appears in the OS system tray (Top-right on Ubuntu/Mac, Bottom-right on Windows).

```typescript
const widgetWindow = new BrowserWindow({
  width: 250,
  height: 350,
  frame: false,           // Frameless
  transparent: true,      // Transparent background
  alwaysOnTop: true,      // Floats above other apps
  skipTaskbar: true,      // Doesn't clutter taskbar
  resizable: false,
  hasShadow: false,       // We'll handle shadows in CSS if needed
  focusable: false,       // Default to false to prevent focus stealing. Toggle on hover/interaction.
  type: 'utility',        // Linux: Helps window managers treat it as a floating tool
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: join(__dirname, '../preload.js'),
  },
});

// Linux Note: Buttons inside a draggable area must explicitly have '-webkit-app-region: no-drag'
```

## 🧩 React Component Structure

```
src/renderer/
  ├── focus/
  │   ├── FocusWidget.tsx       # Main container, handles IPC & State
  │   ├── FocusControls.tsx     # Play/Pause/Stop buttons (hidden on hover?)
  │   ├── modes/
  │   │   ├── PlantMode.tsx     # SVG Plant implementation
  │   │   └── BlobMode.tsx      # p5.js Liquid Blob implementation
  │   └── styles.css            # Widget-specific styles
```

## 🎨 Visual Modes Implementation

### Mode A: 🌱 Plant Mode (SVG + CSS)
**Concept:** A potted plant where the stem grows vertically based on progress.

*   **Implementation:** Pure SVG with React state controlling path attributes.
*   **Progress Mapping:**
    *   **0%**: Just the pot and a tiny sprout.
    *   **1-99%**: The stem path (`d` attribute) elongates using a cubic bezier curve to simulate organic growth.
    *   **25%, 50%, 75%**: Leaf elements (`<g>`) fade in (`opacity`) and scale up (`transform: scale()`).
    *   **100%**: A flower element blooms at the top of the stem.
*   **Animation:** CSS `@keyframes` for a gentle sway (`transform: rotate()`) on the stem group to make it feel alive.

### Mode B: 🫧 Liquid Blob Mode (p5.js)
**Concept:** A container filled with "liquid" time.

*   **Implementation:** Raw `p5` instance inside a `useEffect` hook (avoid `react-p5` for better control and performance).
*   **Logic:**
    *   Use `noise(xoff, yoff)` to generate smooth vertices for a circular/blob shape.
    *   **Progress Mapping:** The "water level" (amplitude or fill height) rises as progress increases.
    *   **Color:** Interpolate (`lerpColor`) between a calm blue/teal at 0% to a warm sunset orange/pink at 100%.
*   **Sketch Logic Snippet:**
    ```javascript
    draw = (p5) => {
      p5.clear();
      // Use Perlin noise for organic wave movement
      p5.beginShape();
      for (let a = 0; a < TWO_PI; a += 0.1) {
        let xoff = map(cos(a), -1, 1, 0, noiseMax);
        let yoff = map(sin(a), -1, 1, 0, noiseMax);
        let r = map(noise(xoff, yoff, zoff), 0, 1, 100, 120);
        let x = r * cos(a);
        let y = r * sin(a);
        p5.vertex(x, y);
      }
      p5.endShape(CLOSE);
      zoff += 0.01; // Animate noise
    }
    ```

## 📋 Implementation Steps

1.  **Setup Main Process:**
    *   Create `src/main/managers/FocusManager.ts`.
    *   Implement timer interval logic.
    *   Add IPC handlers in `IPCHandlers.ts`.

2.  **Setup Window:**
    *   Add `createFocusWindow()` to `WindowManager.ts`.
    *   Ensure it loads a specific route or file (e.g., `focus.html` or check query param).

3.  **Create Renderer Components:**
    *   Install `p5` (for Blob mode).
    *   Build `PlantMode.tsx` with SVG paths.
    *   Build `BlobMode.tsx` using raw p5 instance.

4.  **Integrate & Polish:**
    *   Connect React state to IPC events.
    *   Add "Drag" region (`-webkit-app-region: drag`) to a container div.
    *   Add mode switcher UI.
    *   Implement focus toggling logic (enable focus on hover/click, disable otherwise).

## 📦 Dependencies
*   `p5` (For Blob mode)
*   `framer-motion` (Optional, for smooth transitions between modes)

## 💡 Optional Enhancements

### Tray Integration
*   **Icon Location**: Top-right system panel on Ubuntu.
*   **Tooltip**: Show "Focus Mode • 18:32 left" on hover.
*   **Title (Optional)**: Try to display the timer text next to the icon (`tray.setTitle()`), though support varies by Linux distro.
*   **Context Menu**: Right-click for Pause/Resume/Stop and Mode switching.
*   **Sync**: Visual state should match the floating widget.

### Completion Animation
*   **Concept**: Subtle glow or gentle scale effect when the session ends.
*   **Aesthetic**: Avoid flashy confetti; maintain the calm, cozy vibe.

### Performance
*   **Canvas Size**: Keep p5 canvas small (e.g., 250x250px) to minimize CPU usage.
*   **Optimization**: Pause `requestAnimationFrame` loop when the widget is hidden or minimized.
*   **Rendering**: Only animate visible areas.

