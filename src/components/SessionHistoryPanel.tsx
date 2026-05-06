import React from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { SessionHistory } from './SessionHistory';

export function SessionHistoryPanel() {
  const { sessions, setShowHistory } = useAppStore();

  return (
    <div className="absolute inset-0 bg-slate-900/97 backdrop-blur-sm flex flex-col z-40 no-drag">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">
          History {sessions.length > 0 && <span className="text-slate-500 font-normal">· {sessions.length}</span>}
        </span>
        <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-300">
          <X size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SessionHistory />
      </div>
    </div>
  );
}
