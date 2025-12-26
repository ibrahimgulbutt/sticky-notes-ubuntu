# Focus Widget Checkpoint

## Current Status
*   **Widget**: Implemented as a transparent, always-on-top window.
*   **Controls**: Pause, Resume, Stop, and Close (Hide) buttons are functional.
*   **Dashboard**: Shows "Active Session" modal if a session is running.
*   **Settings**: Configurable default duration.

## Issues Identified
1.  **Draggability**: The widget is not draggable on Linux/Ubuntu.
    *   *Cause*: `WebkitAppRegion: 'drag'` might be failing due to `type: 'utility'` or transparency settings on Linux.
2.  **Tray Icon**: Does not show active session status.
    *   *Cause*: `FocusManager` is not connected to `TrayManager`.
3.  **Active Session Visibility**: User wants clearer indication of active session when widget is hidden.

## Plan

### 1. Fix Draggability
*   **Action**: Modify `WindowManager.ts` to ensure the window is draggable.
    *   Try removing `type: 'utility'` temporarily to test if it blocks dragging (though it's needed for "widget" behavior).
    *   Ensure `transparent: true` is compatible with dragging.
    *   Add a specific "drag handle" area if the whole window drag is problematic.

### 2. Integrate Tray Icon
*   **Action**: Connect `FocusManager` to `TrayManager`.
*   **Implementation**:
    *   Update `TrayManager` to accept a `FocusSession` state.
    *   Update `TrayManager.updateTrayTooltip` to show "Focus: 24:00 remaining".
    *   Update `TrayManager.updateTrayMenu` to include "Pause/Resume/Stop Focus" items.
    *   In `FocusManager.broadcastState()`, call `trayManager.updateStatus()`.

### 3. Improve Active Session Visibility
*   **Action**: Ensure the Dashboard button clearly indicates an active session (e.g., change icon color or add a badge).
*   **Action**: Ensure the "Active Session" modal is robust.

## Next Steps
1.  Update `TrayManager` to handle focus state.
2.  Inject `TrayManager` into `FocusManager`.
3.  Debug dragging issue (likely requires `setIgnoreMouseEvents(false)` verification).
