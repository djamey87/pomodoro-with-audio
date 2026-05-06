import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SkipBack, SkipForward, Play, Pause, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import type { Track } from '../types';

interface Props {
  audioRef: React.RefObject<HTMLAudioElement>;
  track: Track | null;
  isPlaying: boolean;
  volume: number;
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
  if (volume === 0) return <VolumeX size={14} />;
  if (volume < 0.4) return <Volume size={14} />;
  if (volume < 0.75) return <Volume1 size={14} />;
  return <Volume2 size={14} />;
}

export function AudioPlayer({ audioRef, track, isPlaying, volume, onPlayNext, onPlayPrev, onTogglePlay, onSeek, onVolumeChange }: Props) {
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

  // Subscribe to time updates from the lifted <audio> element.
  // Must run on every render where the audio element is mounted; placed
  // BEFORE the early return so hook order stays stable.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleLoadedMetadata]);

  if (!track) {
    return (
      <div className="flex items-center justify-center h-16 px-4 text-slate-500 text-xs border-t border-slate-700">
        No track selected — add music to your playlist
      </div>
    );
  }

  return (
    <div className="border-t border-slate-700 px-4 py-2.5 flex flex-col gap-1.5">
      {/* Track name + time */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-300 font-medium truncate" title={track.title}>
          {track.title}
        </span>
        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
          {fmtTime(current)} / {fmtTime(duration)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="h-0.5 rounded-full bg-slate-700 cursor-pointer no-drag"
        onClick={handleProgressClick}
      >
        <div
          className="h-full rounded-full bg-slate-400 transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls + volume */}
      <div className="flex items-center justify-between no-drag">
        <div className="flex items-center gap-3">
          <button onClick={onPlayPrev} className="text-slate-400 hover:text-slate-200 transition-colors" title="Previous">
            <SkipBack size={14} />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button onClick={onPlayNext} className="text-slate-400 hover:text-slate-200 transition-colors" title="Next">
            <SkipForward size={14} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title={`Volume: ${Math.round(volume * 100)}%`}
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
            className="w-20 h-0.5 accent-slate-400 cursor-pointer"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
}
