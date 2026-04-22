import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';

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
        store.advancePhase();
        const label = phase === 'focus' ? 'Break time!' : 'Time to focus!';
        window.api.notifyPhase(label);
      } else {
        store.tickTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Save timer state to localStorage every 10 seconds while running
  useEffect(() => {
    if (!isRunning) return;
    const saveInterval = setInterval(() => {
      const timer = useAppStore.getState().timer;
      localStorage.setItem('pomello.timer', JSON.stringify(timer));
    }, 10_000);
    return () => clearInterval(saveInterval);
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
