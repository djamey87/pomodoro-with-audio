import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';

function loadVolume(): number {
  const raw = localStorage.getItem('pomello.volume');
  const v = raw !== null ? parseFloat(raw) : 0.8;
  return Math.max(0, Math.min(1, isNaN(v) ? 0.8 : v));
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { audio, playlist, setAudioPlaying, setShowNextTrackPrompt, setCurrentTrackIndex } =
    useAppStore();

  const [volume, setVolumeState] = useState(loadVolume);

  const currentTrack = playlist[audio.currentTrackIndex] ?? null;

  // On initial mount, auto-play if audio was playing when the app last closed
  const shouldAutoPlayOnMount = useMemo(() => audio.isPlaying, []);
  const isInitialMount = useRef(true);

  // Apply volume whenever it changes or the audio element mounts
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Restore saved position when the current track changes; auto-play on first mount if needed
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !currentTrack) return;

    const pos = currentTrack.savedPosition ?? 0;
    const autoPlay = isInitialMount.current && shouldAutoPlayOnMount;
    isInitialMount.current = false;

    const applyPosition = () => {
      el.currentTime = pos;
      if (autoPlay) el.play().catch(() => undefined);
    };

    if (el.readyState >= 1) {
      applyPosition();
    } else {
      el.addEventListener('loadedmetadata', applyPosition, { once: true });
    }
  }, [currentTrack?.id]);

  // Persist position every 5 seconds
  useEffect(() => {
    if (!currentTrack) return;
    const interval = setInterval(() => {
      const el = audioRef.current;
      if (!el || !currentTrack) return;
      useAppStore.getState().updateTrackPosition(currentTrack.id, el.currentTime);
    }, 5_000);
    return () => clearInterval(interval);
  }, [currentTrack?.id]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem('pomello.volume', String(clamped));
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  const handlePlay = useCallback(() => setAudioPlaying(true), [setAudioPlaying]);

  const handlePause = useCallback(() => {
    const el = audioRef.current;
    if (el && currentTrack) {
      useAppStore.getState().updateTrackPosition(currentTrack.id, el.currentTime);
    }
    setAudioPlaying(false);
  }, [setAudioPlaying, currentTrack?.id]);

  const maybeCountCurrentTrack = useCallback(() => {
    const el = audioRef.current;
    const store = useAppStore.getState();
    const track = store.playlist[store.audio.currentTrackIndex] ?? null;
    if (!el || !track || !el.duration) return;
    if (el.currentTime / el.duration >= 0.85) {
      store.incrementPlayCount(track.id);
      store.updateTrackPosition(track.id, 0);
    } else {
      store.updateTrackPosition(track.id, el.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    maybeCountCurrentTrack();
    setAudioPlaying(false);
    setShowNextTrackPrompt(true);
  }, [maybeCountCurrentTrack, setAudioPlaying, setShowNextTrackPrompt]);

  const goToTrack = useCallback((index: number, autoPlay = false) => {
    maybeCountCurrentTrack();
    setCurrentTrackIndex(index);
    if (autoPlay) setTimeout(() => audioRef.current?.play(), 50);
  }, [maybeCountCurrentTrack, setCurrentTrackIndex]);

  const playNext = useCallback(() => {
    const { playlist, audio } = useAppStore.getState();
    if (playlist.length === 0) return;
    const next = (audio.currentTrackIndex + 1) % playlist.length;
    goToTrack(next, true);
  }, [goToTrack]);

  const playPrev = useCallback(() => {
    const { playlist, audio } = useAppStore.getState();
    if (playlist.length === 0) return;
    const prev = (audio.currentTrackIndex - 1 + playlist.length) % playlist.length;
    goToTrack(prev, true);
  }, [goToTrack]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }, []);

  const seek = useCallback((fraction: number) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = el.duration * fraction;
  }, []);

  return { audioRef, currentTrack, handlePlay, handlePause, handleEnded, togglePlay, playNext, playPrev, goToTrack, seek, volume, setVolume };
}
