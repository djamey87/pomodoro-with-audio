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

export interface AppData {
  playlist: Track[];
  settings: TimerSettings;
}

export type TimerPhase = 'focus' | 'short-break' | 'long-break';

export interface BrowseResult {
  folders: { name: string; base64: string }[];
  files: { name: string; url: string; id: string }[];
  currentPath: string;
}
