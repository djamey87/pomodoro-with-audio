import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { playChime } from '../chime';

export function useTimer(audioRef: React.React.RefObject<HTMLAudioElement>) {
  const isRunning = useAppStore(s => s.timer.isRunning);
  const wasAudioPlayingOnPause = useAppStore(s => s.timer.wasAudioPlayingOnPause);
  const prevIsRunning = useRef(false);

  // Countdown interval — reads latest state via getState() to avoid stale closures
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const store = useAppStore.getState();
      if (store.timer.secondsRemaining <= 1) {
        const phase = store.timer.phase;
        store.recordFocusSession('completed');
        store.advancePhase();
        playChime();
        const label = phase === 'focus' ? 'Break time!' : 'Time to focus!';
        window.api.notifyPhase(label);
      } else {
        store.tickTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Resume audio when timer starts, if it was playing before the last pause
  useEffect(() => {
    const justStarted = isRunning && !prevIsRunning.current;
    if (justStarted && wasAudioPlayingOnPause && audioRef.current) {
      audioRef.current.play().catch(() => undefined);
    }
    prevIsRunning.current = isRunning;
  }, [isRunning, wasAudioPlayingOnPause]);
}
