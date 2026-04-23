import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface Props {
  onAccept: () => void;
  onDismiss: () => void;
}

export function NextTrackPrompt({ onAccept, onDismiss }: Props) {
  const { playlist, audio } = useAppStore();
  const [countdown, setCountdown] = useState(10);
  const nextIndex = (audio.currentTrackIndex + 1) % (playlist.length || 1);
  const nextTrack = playlist[nextIndex];

  useEffect(() => {
    if (countdown <= 0) {
      onAccept();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onAccept]);

  if (!nextTrack) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-50 no-drag">
      <p className="text-xs text-slate-400 tracking-wide">UP NEXT</p>
      <p className="text-sm font-semibold text-slate-100 text-center max-w-[280px] truncate">
        {nextTrack.title}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-slate-600 hover:bg-slate-500 text-xs text-slate-100 font-medium transition-colors"
        >
          <Play size={11} /> Play ({countdown}s)
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
