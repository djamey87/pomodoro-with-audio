import React, { useMemo } from 'react';
import { Music, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { SessionRecord } from '../types';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const today = dayKey(now.getTime());
  const yesterday = dayKey(now.getTime() - 86400000);
  const k = dayKey(ms);
  if (k === today) return 'Today';
  if (k === yesterday) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function SessionHistory() {
  const { sessions, deleteSession } = useAppStore();

  const grouped = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
    const groups: { label: string; rows: SessionRecord[] }[] = [];
    let currentKey = '';
    for (const r of sorted) {
      const k = dayKey(r.endedAt);
      if (k !== currentKey) {
        currentKey = k;
        groups.push({ label: dayLabel(r.endedAt), rows: [] });
      }
      groups[groups.length - 1].rows.push(r);
    }
    return groups;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-xs text-center px-4">
        No sessions yet — finish a focus phase to start logging.
      </div>
    );
  }

  return (
    <div className="py-1">
      {grouped.map(group => (
        <div key={group.label}>
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-850 sticky top-0">
            {group.label}
          </div>
          {group.rows.map(r => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/50 transition-colors group"
            >
              <span className="text-[10px] text-slate-500 tabular-nums w-9 shrink-0">
                {formatTime(r.endedAt)}
              </span>
              <span className="flex-1 text-xs text-slate-300 truncate" title={r.task || '(no task)'}>
                {r.task || <span className="text-slate-600">(no task)</span>}
              </span>
              <span
                className={`text-[10px] tabular-nums shrink-0 ${
                  r.endReason === 'completed' ? 'text-slate-400' : 'text-orange-400/70'
                }`}
                title={r.endReason}
              >
                {formatDuration(r.durationSeconds)}
              </span>
              {r.trackTitle && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500 max-w-[120px] truncate shrink-0" title={r.trackTitle}>
                  <Music size={9} className="shrink-0" />
                  <span className="truncate">{r.trackTitle}</span>
                </span>
              )}
              <button
                onClick={() => deleteSession(r.id)}
                className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 px-1"
                title="Delete entry"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
