import React from 'react';
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
            <span
              key={i}
              className={`text-[10px] ${i < filledDots ? PHASE_COLOR[phase] : 'text-slate-600'}`}
            >
              ●
            </span>
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
            className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
          >
            {isRunning ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={stopTimer}
            title="Stop & reset"
            className="px-2 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            ■
          </button>
          <button
            onClick={skipPhase}
            title="Skip phase"
            className="px-2 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
