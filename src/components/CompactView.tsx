import React from 'react';
import { Play, Pause, SkipForward, Maximize2, Music } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { TimerPhase } from '../types';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const PHASE_COLOR: Record<TimerPhase, string> = {
  focus: 'text-orange-400',
  'short-break': 'text-sky-400',
  'long-break': 'text-sky-300',
};

interface Props {
  audioRef: React.RefObject<HTMLAudioElement>;
  isAudioPlaying: boolean;
  trackTitle: string | null;
  onTogglePlayAudio: () => void;
}

export function CompactView({ audioRef, isAudioPlaying, trackTitle, onTogglePlayAudio }: Props) {
  const { timer, settings, task, audio, startTimer, pauseTimer, skipPhase, setCompactMode } = useAppStore();
  const { phase, secondsRemaining, pomodoroCount, isRunning } = timer;

  const totalDots = settings.longBreakInterval;
  const filledDots = pomodoroCount % settings.longBreakInterval;

  function handleStartPause() {
    if (isRunning) pauseTimer(audio.isPlaying);
    else startTimer();
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* Drag region with dots and expand button */}
      <div className="drag-region flex items-center justify-between px-2.5 pt-2 pb-1 shrink-0">
        <span className="flex gap-0.5 items-center">
          {Array.from({ length: totalDots }).map((_, i) => (
            <svg key={i} width="5" height="5" viewBox="0 0 6 6">
              <circle
                cx="3" cy="3" r="2.5"
                className={i < filledDots ? PHASE_COLOR[phase] : 'text-slate-600'}
                fill="currentColor"
              />
            </svg>
          ))}
        </span>
        <button
          onClick={() => setCompactMode(false)}
          title="Exit compact mode"
          className="no-drag text-slate-500 hover:text-slate-200 transition-colors"
        >
          <Maximize2 size={10} />
        </button>
      </div>

      {/* Time + timer controls */}
      <div className="flex items-center justify-between px-3">
        <span className="text-2xl font-mono font-bold tracking-tight text-slate-50 tabular-nums">
          {fmt(secondsRemaining)}
        </span>
        <div className="flex gap-1.5 items-center no-drag">
          <button
            onClick={handleStartPause}
            title={isRunning ? 'Pause' : 'Start'}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
          >
            {isRunning ? <Pause size={11} /> : <Play size={11} />}
          </button>
          <button
            onClick={skipPhase}
            title="Skip phase"
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <SkipForward size={11} />
          </button>
        </div>
      </div>

      {/* Task description */}
      <div className="px-3 pt-1 pb-1.5">
        <span
          className={`text-[10px] truncate block ${task ? 'text-slate-400' : 'text-slate-600'}`}
          title={task || '(no task)'}
        >
          {task || '(no task)'}
        </span>
      </div>

      {/* Compact audio strip */}
      {trackTitle && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 mt-auto border-t border-slate-800 no-drag">
          <button
            onClick={onTogglePlayAudio}
            className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            title={isAudioPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isAudioPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <Music size={9} className="text-slate-600 shrink-0" />
          <span className="text-[10px] text-slate-400 truncate" title={trackTitle}>
            {trackTitle}
          </span>
        </div>
      )}
    </div>
  );
}
