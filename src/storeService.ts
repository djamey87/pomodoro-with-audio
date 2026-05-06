import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AppData } from './types';

const DEFAULTS: AppData = {
  playlist: [],
  settings: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 20,
    longBreakInterval: 4,
  },
  sessions: [],
};

let storePath: string;

export function initStore(): void {
  storePath = join(app.getPath('userData'), 'app-data.json');
}

export function readStore(): AppData {
  try {
    if (existsSync(storePath)) {
      const raw = JSON.parse(readFileSync(storePath, 'utf-8')) as Partial<AppData>;
      return {
        playlist: raw.playlist ?? DEFAULTS.playlist,
        settings: { ...DEFAULTS.settings, ...(raw.settings ?? {}) },
        sessions: raw.sessions ?? DEFAULTS.sessions,
      };
    }
  } catch {
    // ignore parse errors, return defaults
  }
  return { ...DEFAULTS, settings: { ...DEFAULTS.settings }, sessions: [] };
}

export function writeStore(data: AppData): void {
  writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
}
