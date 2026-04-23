import React from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { TimerPhase } from '../types';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const PHASE_LABEL: Record<TimerPhase, string> = {
  focus: 'FOCUS',
  'short-break': 'SHORT BREAK',
  'long-break': 'LONG BREAK',
};

const PHASE_COLOR: Record<TimerPhase, string> = {
  focus: 'text-orange-400',
  'short-break': 'text-sky-400',
  'long-break': 'text-sky-300',
};

interface Props {
  isAudioPlaying: boolean;
}

export function Timer({ isAudioPlaying }: Props) {
  const { timer, settings, task, startTimer, pauseTimer, stopTimer, skipPhase } = useAppStore();
  const { phase, secondsRemaining, pomodoroCount, isRunning } = timer;

  const totalDots = settings.longBreakInterval;
  const filledDots = pomodoroCount % settings.longBreakInterval;

  function handleStartPause() {
    if (isRunning) {
      pauseTimer(isAudioPlaying);
    } else {
      startTimer();
    }
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      {/* Phase + dots */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold tracking-widest ${PHASE_COLOR[phase]}`}>
          {PHASE_LABEL[phase]}
        </span>
        <span className="flex gap-0.5">
          {Array.from({ length: totalDots }).map((_, i) => (
            <svg key={i} width="6" height="6" viewBox="0 0 6 6">
              <circle
                cx="3" cy="3" r="2.5"
                className={i < filledDots ? PHASE_COLOR[phase] : 'text-slate-600'}
                fill="currentColor"
              />
            </svg>
          ))}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-4xl font-mono font-bold tracking-tight text-slate-50">
            {fmt(secondsRemaining)}
          </span>
          {task && (
            <span className="text-[10px] text-slate-500 truncate max-w-[180px]" title={task}>
              {task}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-1.5 items-center no-drag">
          <button
            onClick={handleStartPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
          >
            {isRunning ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Start</>}
          </button>
          <button
            onClick={stopTimer}
            title="Stop & reset"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <Square size={11} />
          </button>
          <button
            onClick={skipPhase}
            title="Skip phase"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <SkipForward size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
