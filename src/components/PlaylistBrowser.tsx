import React, { useState, useEffect, useCallback } from 'react';
import { X, Folder, Music, Check, Plus } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { BrowseResult } from '../types';

const ROOT_BASE64 = 'MS4gTW92aWVz'; // "1. Movies" — default starting folder

interface BreadcrumbItem {
  name: string;
  base64: string;
}

interface PlaylistBrowserProps {
  onSelectTrack: (index: number) => void;
}

export function PlaylistBrowser({ onSelectTrack }: PlaylistBrowserProps) {
  const { playlist, addTrack, removeTrack, audio, setShowPlaylist } = useAppStore();
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { name: 'Movies', base64: ROOT_BASE64 },
  ]);
  const [activeTab, setActiveTab] = useState<'browse' | 'playlist'>('browse');

  const currentFolder = breadcrumb[breadcrumb.length - 1];

  const load = useCallback(async (base64: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.browseSoundtracks(base64);
      setBrowseResult(result);
    } catch (e) {
      setError('Failed to load. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentFolder.base64);
  }, [currentFolder.base64]);

  function navigateTo(name: string, base64: string) {
    setBreadcrumb(prev => [...prev, { name, base64 }]);
  }

  function navigateToBreadcrumb(index: number) {
    setBreadcrumb(prev => prev.slice(0, index + 1));
  }

  function isInPlaylist(id: string) {
    return playlist.some(t => t.id === id);
  }

  return (
    <div className="flex flex-col border-t border-slate-700 h-[290px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex gap-0 rounded overflow-hidden border border-slate-700">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1 text-xs transition-colors ${activeTab === 'browse' ? 'bg-slate-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-3 py-1 text-xs transition-colors ${activeTab === 'playlist' ? 'bg-slate-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Playlist {playlist.length > 0 && `(${playlist.length})`}
          </button>
        </div>
        <button
          onClick={() => setShowPlaylist(false)}
          className="text-slate-500 hover:text-slate-300 no-drag p-1"
          title="Close"
        >
          <X size={13} />
        </button>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-slate-500 bg-slate-850 border-b border-slate-700 overflow-x-auto shrink-0">
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-700">›</span>}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={`hover:text-slate-300 transition-colors whitespace-nowrap ${i === breadcrumb.length - 1 ? 'text-slate-300' : 'hover:underline'}`}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* File listing */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">Loading…</div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-red-400 text-xs px-4 text-center">{error}</div>
            )}
            {!loading && !error && browseResult && (
              <div className="py-1">
                {browseResult.folders.map(f => (
                  <button
                    key={f.base64}
                    onClick={() => navigateTo(f.name, f.base64)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors text-left"
                  >
                    <Folder size={12} className="text-slate-500 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
                {browseResult.files.map(f => {
                  const inPlaylist = isInPlaylist(f.id);
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 transition-colors group"
                    >
                      <Music size={11} className="text-slate-500 shrink-0" />
                      <span className="flex-1 text-xs text-slate-300 truncate" title={f.name}>{f.name}</span>
                      <button
                        onClick={() => {
                          if (inPlaylist) {
                            removeTrack(f.id);
                          } else {
                            addTrack({ id: f.id, title: f.name, url: f.url, savedPosition: 0, playCount: 0 });
                          }
                        }}
                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                          inPlaylist
                            ? 'bg-slate-600 text-slate-300 hover:bg-red-900 hover:text-red-300'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {inPlaylist ? <><Check size={10} /> Added</> : <><Plus size={10} /> Add</>}
                      </button>
                    </div>
                  );
                })}
                {browseResult.folders.length === 0 && browseResult.files.length === 0 && (
                  <div className="text-slate-500 text-xs text-center py-8">Empty folder</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'playlist' && (
        <div className="flex-1 overflow-y-auto">
          {playlist.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs text-center px-4">
              Your playlist is empty. Browse to add soundtracks.
            </div>
          ) : (
            <div className="py-1">
              {playlist.map((track, i) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-2 px-3 py-1.5 transition-colors group cursor-pointer ${
                    i === audio.currentTrackIndex ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                  }`}
                  onClick={() => onSelectTrack(i)}
                >
                  <span className={`w-4 flex items-center justify-center ${i === audio.currentTrackIndex ? 'text-orange-400' : 'text-slate-600'}`}>
                    {i === audio.currentTrackIndex
                      ? <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="1,1 7,4 1,7" fill="currentColor" /></svg>
                      : <span className="text-[10px]">{i + 1}</span>}
                  </span>
                  <span className="flex-1 text-xs text-slate-300 truncate" title={track.title}>{track.title}</span>
                  {(track.playCount ?? 0) > 0 && (
                    <span className="text-[10px] text-slate-500 shrink-0 tabular-nums" title={`Played ${track.playCount} time${track.playCount === 1 ? '' : 's'}`}>
                      ×{track.playCount}
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
                    className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 px-1"
                    title="Remove"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
