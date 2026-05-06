export interface Track {
  id: string;
  title: string;
  url: string;
  savedPosition: number;
  playCount: number;
}

export interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
}

export type SessionEndReason = 'completed' | 'skipped' | 'stopped';

export interface SessionRecord {
  id: string;
  endedAt: number;
  durationSeconds: number;
  configuredSeconds: number;
  endReason: SessionEndReason;
  task: string;
  trackId?: string;
  trackTitle?: string;
}

export interface AppData {
  playlist: Track[];
  settings: TimerSettings;
  sessions: SessionRecord[];
}

export type TimerPhase = 'focus' | 'short-break' | 'long-break';

export interface BrowseResult {
  folders: { name: string; base64: string }[];
  files: { name: string; url: string; id: string }[];
  currentPath: string;
}
