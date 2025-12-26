import { BrowserWindow } from 'electron';
import { FocusSession, FocusMode, TimerState } from '../../types';
import { WindowManager } from './WindowManager';
import { TrayManager } from './TrayManager';

export class FocusManager {
  private session: FocusSession = {
    isActive: false,
    startTime: null,
    duration: 25,
    remaining: 25 * 60,
    mode: 'plant',
    state: 'idle'
  };
  private timer: NodeJS.Timeout | null = null;
  private windowManager: WindowManager;
  private trayManager: TrayManager;

  constructor(windowManager: WindowManager, trayManager: TrayManager) {
    this.windowManager = windowManager;
    this.trayManager = trayManager;
  }

  startSession(duration: number, mode: FocusMode) {
    if (this.session.state === 'running') return;

    this.session = {
      isActive: true,
      startTime: Date.now(),
      duration,
      remaining: duration * 60,
      mode,
      state: 'running'
    };

    this.startTimer();
    this.broadcastState();
    this.updateTray();
    
    // Ensure window is open
    this.windowManager.createFocusWindow();
  }

  pauseSession() {
    if (this.session.state !== 'running') return;
    
    this.stopTimer();
    this.session.state = 'paused';
    this.broadcastState();
    this.updateTray();
  }

  resumeSession() {
    if (this.session.state !== 'paused') return;

    this.session.state = 'running';
    this.startTimer();
    this.broadcastState();
    this.updateTray();
  }

  stopSession() {
    this.stopTimer();
    this.session = {
      isActive: false,
      startTime: null,
      duration: 25,
      remaining: 25 * 60,
      mode: this.session.mode,
      state: 'idle'
    };
    this.broadcastState();
    this.updateTray();
    this.windowManager.closeFocusWindow();
  }

  hideWidget() {
    this.windowManager.hideFocusWindow();
  }

  showWidget() {
    this.windowManager.showFocusWindow();
  }

  getSession(): FocusSession {
    return this.session;
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      if (this.session.remaining > 0) {
        this.session.remaining--;
        this.broadcastState();
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private completeSession() {
    this.stopTimer();
    this.session.state = 'completed';
    this.broadcastState();
    this.updateTray();
    // Show notification?
  }

  private broadcastState() {
    // Broadcast to ALL windows (including Dashboard)
    this.windowManager.broadcast('focus:update-timer', this.session.remaining, this.session.state);
  }

  private updateTray() {
    // Update Tray only on state changes, not every second
    const formattedTime = this.formatTime(this.session.remaining);
    this.trayManager.updateFocusState(
      this.session.isActive,
      this.session.state === 'paused',
      formattedTime
    );
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
