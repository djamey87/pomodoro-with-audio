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

export function CompactView({ isAudioPlaying, trackTitle, onTogglePlayAudio }: Props) {
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
      <div className="drag-region flex items-center justify-between px-2 pt-1.5 pb-1 shrink-0">
        <span className="flex gap-0.5 items-center">
          {Array.from({ length: totalDots }).map((_, i) => (
            <svg key={i} width="4" height="4" viewBox="0 0 6 6">
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
          <Maximize2 size={9} />
        </button>
      </div>

      {/* Timer — large, centered */}
      <div className="flex justify-center pt-1 pb-1.5">
        <span className="text-4xl font-mono font-bold tracking-tight text-slate-50 tabular-nums leading-none">
          {fmt(secondsRemaining)}
        </span>
      </div>

      {/* Task description */}
      <div className="px-2">
        <span
          className={`text-[10px] truncate block text-center ${task ? 'text-slate-400' : 'text-slate-600'}`}
          title={task || '(no task)'}
        >
          {task || '(no task)'}
        </span>
      </div>

      {/* Pause/Next controls — below task */}
      <div className="flex justify-center gap-2 mt-2 no-drag">
        <button
          onClick={handleStartPause}
          title={isRunning ? 'Pause' : 'Start'}
          className="w-7 h-7 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={skipPhase}
          title="Skip phase"
          className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <SkipForward size={12} />
        </button>
      </div>

      {/* Compact audio strip pinned to bottom */}
      {trackTitle && (
        <div className="flex items-center gap-1 px-2 py-1 mt-auto border-t border-slate-800 no-drag">
          <button
            onClick={onTogglePlayAudio}
            className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            title={isAudioPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isAudioPlaying ? <Pause size={9} /> : <Play size={9} />}
          </button>
          <Music size={8} className="text-slate-600 shrink-0" />
          <span className="text-[9px] text-slate-400 truncate" title={trackTitle}>
            {trackTitle}
          </span>
        </div>
      )}
    </div>
  );
}
