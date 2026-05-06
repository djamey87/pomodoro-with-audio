import React, { useEffect } from 'react';
import { Minus, X, Minimize2 } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTimer } from './hooks/useTimer';
import { Timer } from './components/Timer';
import { AudioPlayer } from './components/AudioPlayer';
import { TaskFooter } from './components/TaskInput';
import { PlaylistBrowser } from './components/PlaylistBrowser';
import { NextTrackPrompt } from './components/NextTrackPrompt';
import { SettingsPanel } from './components/SettingsPanel';
import { SessionHistoryPanel } from './components/SessionHistoryPanel';
import { CompactView } from './components/CompactView';

export default function App() {
  const { setPlaylist, updateSettings, setSessions, showPlaylist, showSettings, showHistory, compactMode, setCompactMode, audio } = useAppStore();

  // Load persisted playlist + settings + sessions from main process on mount
  useEffect(() => {
    window.api.getStore().then(data => {
      setPlaylist(data.playlist);
      updateSettings(data.settings);
      setSessions(data.sessions ?? []);
    });
  }, []);

  // Sync persisted compactMode to main process on mount (resizes window)
  useEffect(() => {
    if (compactMode) window.api.setCompactMode(true);
  }, []);

  // Audio player hook — owns the <audio> ref
  const { audioRef, currentTrack, handlePlay, handlePause, handleEnded, togglePlay, playNext, playPrev, goToTrack, seek, volume, setVolume } =
    useAudioPlayer();

  // Timer hook — wires up countdown + audio resume coupling
  useTimer(audioRef);

  function handleAcceptNextTrack() {
    playNext();
    useAppStore.getState().setShowNextTrackPrompt(false);
  }

  function handleDismissNextTrack() {
    useAppStore.getState().setShowNextTrackPrompt(false);
  }

  // The <audio> element lives at the root so it survives switching between
  // compact and normal views — otherwise toggling would unmount and stop playback.
  const audioElement = (
    <audio
      ref={audioRef}
      src={currentTrack?.url}
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
      preload="metadata"
    />
  );

  // Single Fragment root keeps the <audio> element at a stable position in
  // the React tree across compact↔normal toggles, so playback survives the
  // mode switch (different parent shapes would force a remount).
  return (
    <>
      {audioElement}
      {compactMode ? (
        <CompactView
          audioRef={audioRef}
          isAudioPlaying={audio.isPlaying}
          trackTitle={currentTrack?.title ?? null}
          onTogglePlayAudio={togglePlay}
        />
      ) : (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 select-none overflow-hidden relative">
          {/* Titlebar — drag region */}
          <div className="drag-region flex items-center justify-between px-3 shrink-0 h-8 bg-slate-800 border-b border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">Pomodoro</span>
            <div className="no-drag flex items-center gap-0.5">
              <button
                onClick={() => setCompactMode(true)}
                title="Compact mode"
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors"
              >
                <Minimize2 size={11} />
              </button>
              <button
                onClick={() => window.api.minimize()}
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => window.api.close()}
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Main content */}
          <Timer isAudioPlaying={audio.isPlaying} />
          <AudioPlayer
            audioRef={audioRef}
            track={currentTrack}
            isPlaying={audio.isPlaying}
            volume={volume}
            onTogglePlay={togglePlay}
            onPlayNext={playNext}
            onPlayPrev={playPrev}
            onSeek={seek}
            onVolumeChange={setVolume}
          />
          <TaskFooter />

          {showPlaylist && <PlaylistBrowser onSelectTrack={goToTrack} />}
          {showSettings && <SettingsPanel />}
          {showHistory && <SessionHistoryPanel />}
          {audio.showNextTrackPrompt && (
            <NextTrackPrompt onAccept={handleAcceptNextTrack} onDismiss={handleDismissNextTrack} />
          )}
        </div>
      )}
    </>
  );
}
