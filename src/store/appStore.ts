import { create } from 'zustand';
import type { Track, TimerSettings, TimerPhase } from '../types';

interface TimerSlice {
  phase: TimerPhase;
  secondsRemaining: number;
  pomodoroCount: number;
  isRunning: boolean;
  wasAudioPlayingOnPause: boolean;
  savedAt?: number;
}

interface AudioSlice {
  isPlaying: boolean;
  currentTrackIndex: number;
  showNextTrackPrompt: boolean;
}

interface AppState {
  timer: TimerSlice;
  audio: AudioSlice;
  playlist: Track[];
  settings: TimerSettings;
  task: string;
  showPlaylist: boolean;
  showSettings: boolean;

  // Timer actions
  startTimer: () => void;
  pauseTimer: (audioPlaying: boolean) => void;
  stopTimer: () => void;
  tickTimer: () => void;
  advancePhase: () => void;
  skipPhase: () => void;

  // Audio actions
  setAudioPlaying: (playing: boolean) => void;
  setCurrentTrackIndex: (index: number) => void;
  setShowNextTrackPrompt: (show: boolean) => void;
  updateTrackPosition: (id: string, position: number) => void;
  incrementPlayCount: (id: string) => void;

  // Data actions (called after IPC load)
  setPlaylist: (tracks: Track[]) => void;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  updateSettings: (partial: Partial<TimerSettings>) => void;

  // Task
  setTask: (task: string) => void;

  // UI actions
  setShowPlaylist: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
}

const TIMER_DEFAULTS: TimerSlice = { phase: 'focus', secondsRemaining: 25 * 60, pomodoroCount: 0, isRunning: false, wasAudioPlayingOnPause: false };

function loadTimerState(): TimerSlice {
  try {
    const raw = localStorage.getItem('pomello.timer');
    if (!raw) return TIMER_DEFAULTS;

    const saved = JSON.parse(raw) as TimerSlice;

    if (saved.isRunning && saved.savedAt) {
      const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
      const remaining = saved.secondsRemaining - elapsed;
      if (remaining > 0) {
        return { ...saved, secondsRemaining: remaining };
      }
      // Timer expired while closed — leave at 0, not running
      return { ...saved, isRunning: false, secondsRemaining: 0 };
    }

    return saved;
  } catch {
    return TIMER_DEFAULTS;
  }
}

function saveTimerState(state: TimerSlice) {
  localStorage.setItem('pomello.timer', JSON.stringify({ ...state, savedAt: Date.now() }));
}

function loadAudioState(): Pick<AudioSlice, 'currentTrackIndex' | 'isPlaying'> {
  try {
    const raw = localStorage.getItem('pomello.audio');
    if (raw) {
      const s = JSON.parse(raw);
      return {
        currentTrackIndex: typeof s.currentTrackIndex === 'number' ? s.currentTrackIndex : 0,
        isPlaying: typeof s.isPlaying === 'boolean' ? s.isPlaying : false,
      };
    }
  } catch { /* ignore */ }
  return { currentTrackIndex: 0, isPlaying: false };
}

function saveAudioState(currentTrackIndex: number, isPlaying: boolean) {
  localStorage.setItem('pomello.audio', JSON.stringify({ currentTrackIndex, isPlaying }));
}

export const useAppStore = create<AppState>((set, get) => ({
  timer: loadTimerState(),
  audio: { ...loadAudioState(), showNextTrackPrompt: false },
  playlist: [],
  settings: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 20, longBreakInterval: 4 },
  task: localStorage.getItem('pomello.task') ?? '',
  showPlaylist: false,
  showSettings: false,

  startTimer: () => {
    set(s => {
      const next = { ...s.timer, isRunning: true };
      saveTimerState(next);
      return { timer: next };
    });
  },

  pauseTimer: (audioPlaying) => {
    set(s => {
      const next = { ...s.timer, isRunning: false, wasAudioPlayingOnPause: audioPlaying };
      saveTimerState(next);
      return { timer: next };
    });
  },

  stopTimer: () => {
    set(s => {
      const seconds = phaseSeconds(s.timer.phase, s.settings);
      const next = { ...s.timer, isRunning: false, secondsRemaining: seconds, wasAudioPlayingOnPause: false };
      saveTimerState(next);
      return { timer: next };
    });
  },

  tickTimer: () => {
    set(s => {
      const next = { ...s.timer, secondsRemaining: s.timer.secondsRemaining - 1 };
      saveTimerState(next);
      return { timer: next };
    });
  },

  advancePhase: () => {
    set(s => {
      const { phase, pomodoroCount } = s.timer;
      let nextPhase: TimerPhase;
      let nextCount = pomodoroCount;

      if (phase === 'focus') {
        nextCount = pomodoroCount + 1;
        nextPhase = nextCount % s.settings.longBreakInterval === 0 ? 'long-break' : 'short-break';
      } else {
        nextPhase = 'focus';
      }

      const next: TimerSlice = {
        phase: nextPhase,
        secondsRemaining: phaseSeconds(nextPhase, s.settings),
        pomodoroCount: nextCount,
        isRunning: false,
        wasAudioPlayingOnPause: false,
      };
      saveTimerState(next);
      return { timer: next };
    });
  },

  skipPhase: () => {
    get().advancePhase();
  },

  setAudioPlaying: (playing) =>
    set(s => {
      saveAudioState(s.audio.currentTrackIndex, playing);
      return { audio: { ...s.audio, isPlaying: playing } };
    }),

  setCurrentTrackIndex: (index) =>
    set(s => {
      saveAudioState(index, s.audio.isPlaying);
      return { audio: { ...s.audio, currentTrackIndex: index, showNextTrackPrompt: false } };
    }),

  setShowNextTrackPrompt: (show) =>
    set(s => ({ audio: { ...s.audio, showNextTrackPrompt: show } })),

  updateTrackPosition: (id, position) =>
    set(s => {
      const playlist = s.playlist.map(t => (t.id === id ? { ...t, savedPosition: position } : t));
      window.api.setStore({ playlist, settings: s.settings });
      return { playlist };
    }),

  incrementPlayCount: (id) => {
    set(s => {
      const playlist = s.playlist.map(t =>
        t.id === id ? { ...t, playCount: (t.playCount ?? 0) + 1 } : t,
      );
      window.api.setStore({ playlist, settings: s.settings });
      return { playlist };
    });
  },

  setPlaylist: (tracks) => set({ playlist: tracks }),

  addTrack: (track) => {
    set(s => {
      if (s.playlist.some(t => t.id === track.id)) return s;
      const playlist = [...s.playlist, track];
      window.api.setStore({ playlist, settings: s.settings });
      return { playlist };
    });
  },

  removeTrack: (id) => {
    set(s => {
      const playlist = s.playlist.filter(t => t.id !== id);
      window.api.setStore({ playlist, settings: s.settings });
      let currentIndex = s.audio.currentTrackIndex;
      if (currentIndex >= playlist.length) currentIndex = Math.max(0, playlist.length - 1);
      return { playlist, audio: { ...s.audio, currentTrackIndex: currentIndex } };
    });
  },

  updateSettings: (partial) => {
    set(s => {
      const settings = { ...s.settings, ...partial };
      window.api.setStore({ playlist: s.playlist, settings });
      // Reset current phase seconds if not running
      if (!s.timer.isRunning) {
        const seconds = phaseSeconds(s.timer.phase, settings);
        const timer = { ...s.timer, secondsRemaining: seconds };
        saveTimerState(timer);
        return { settings, timer };
      }
      return { settings };
    });
  },

  setTask: (task) => {
    localStorage.setItem('pomello.task', task);
    set({ task });
  },

  setShowPlaylist: (show) => {
    window.api.resizeWindow(show);
    set({ showPlaylist: show });
  },

  setShowSettings: (show) => set({ showSettings: show }),
}));

function phaseSeconds(phase: TimerPhase, settings: TimerSettings): number {
  if (phase === 'focus') return settings.focusMinutes * 60;
  if (phase === 'short-break') return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}
