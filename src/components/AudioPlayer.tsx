import React, { useState, useRef, useCallback } from 'react';
import type { Track } from '../types';

interface Props {
  audioRef: React.RefObject<HTMLAudioElement>;
  track: Track | null;
  isPlaying: boolean;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onTogglePlay: () => void;
  onSeek: (fraction: number) => void;
  onVolumeChange: (v: number) => void;
}

function fmtTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) return <span title="Muted">🔇</span>;
  if (volume < 0.4) return <span title="Low">🔈</span>;
  if (volume < 0.75) return <span title="Medium">🔉</span>;
  return <span title="High">🔊</span>;
}

export function AudioPlayer({ audioRef, track, isPlaying, volume, onPlay, onPause, onEnded, onPlayNext, onPlayPrev, onTogglePlay, onSeek, onVolumeChange }: Props) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrent(el.currentTime);
    setProgress(el.duration ? el.currentTime / el.duration : 0);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setDuration(el.duration);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction);
    setProgress(fraction);
  }, [onSeek]);

  if (!track) {
    return (
      <div className="flex items-center justify-center h-16 px-4 text-slate-500 text-xs border-t border-slate-700">
        No track selected — add music to your playlist
      </div>
    );
  }

  return (
    <div className="border-t border-slate-700 px-4 py-2.5 flex flex-col gap-1.5">
      <audio
        ref={audioRef}
        src={track.url}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />

      {/* Track name + time */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-300 font-medium truncate max-w-[220px]" title={track.title}>
          ♪ {track.title}
        </span>
        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
          {fmtTime(current)} / {fmtTime(duration)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="h-1 rounded-full bg-slate-700 cursor-pointer no-drag"
        onClick={handleProgressClick}
      >
        <div
          className="h-full rounded-full bg-slate-400 transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls + volume */}
      <div className="flex items-center justify-between no-drag">
        <div className="flex items-center gap-2">
          <button onClick={onPlayPrev} className="text-slate-400 hover:text-slate-200 text-sm transition-colors" title="Previous">
            ⏮
          </button>
          <button
            onClick={onTogglePlay}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm transition-colors"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={onPlayNext} className="text-slate-400 hover:text-slate-200 text-sm transition-colors" title="Next">
            ⏭
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="text-[13px] text-slate-400 hover:text-slate-200 transition-colors leading-none"
          >
            <VolumeIcon volume={volume} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1 accent-slate-400 cursor-pointer"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
}
