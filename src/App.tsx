import React, { useEffect } from 'react';
import { Minus, X } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTimer } from './hooks/useTimer';
import { Timer } from './components/Timer';
import { AudioPlayer } from './components/AudioPlayer';
import { TaskFooter } from './components/TaskInput';
import { PlaylistBrowser } from './components/PlaylistBrowser';
import { NextTrackPrompt } from './components/NextTrackPrompt';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const { setPlaylist, updateSettings, showPlaylist, showSettings, audio } = useAppStore();

  // Load persisted playlist + settings from main process on mount
  useEffect(() => {
    window.api.getStore().then(data => {
      setPlaylist(data.playlist);
      updateSettings(data.settings);
    });
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

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 select-none overflow-hidden relative">
      {/* Titlebar — drag region */}
      <div className="drag-region flex items-center justify-between px-3 shrink-0 h-8 bg-slate-800 border-b border-slate-700">
        <span className="text-[11px] text-slate-400 font-medium tracking-wide">Pomodoro</span>
        <div className="no-drag flex items-center gap-0.5">
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
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTogglePlay={togglePlay}
        onPlayNext={playNext}
        onPlayPrev={playPrev}
        onSeek={seek}
        onVolumeChange={setVolume}
      />
      <TaskFooter />

      {/* Playlist drawer — shown below main content when expanded */}
      {showPlaylist && <PlaylistBrowser onSelectTrack={goToTrack} />}

      {/* Settings overlay */}
      {showSettings && <SettingsPanel />}

      {/* Next-track prompt overlay */}
      {audio.showNextTrackPrompt && (
        <NextTrackPrompt onAccept={handleAcceptNextTrack} onDismiss={handleDismissNextTrack} />
      )}
    </div>
  );
}
