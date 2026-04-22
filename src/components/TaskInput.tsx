import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';

export function TaskFooter() {
  const { showPlaylist, showSettings, setShowPlaylist, setShowSettings } = useAppStore();
  const [task, setTask] = useState(() => localStorage.getItem('pomello.task') ?? '');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function saveTask(value: string) {
    setTask(value);
    localStorage.setItem('pomello.task', value);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-700 bg-slate-900 shrink-0">
      {/* Task input */}
      <div className="flex-1 no-drag">
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={task}
            onChange={e => setTask(e.target.value)}
            onBlur={e => saveTask(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTask(task);
              if (e.key === 'Escape') setEditing(false);
            }}
            placeholder="What are you working on?"
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-left w-full text-slate-400 hover:text-slate-200 transition-colors truncate"
            title={task || 'Set task'}
          >
            {task || '+ Add task'}
          </button>
        )}
      </div>

      {/* Music toggle */}
      <button
        onClick={() => setShowPlaylist(!showPlaylist)}
        title="Music"
        className={`text-sm no-drag transition-colors ${showPlaylist ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
      >
        ♫
      </button>

      {/* Settings */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
        className={`text-xs no-drag transition-colors ${showSettings ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
      >
        ⚙
      </button>
    </div>
  );
}
