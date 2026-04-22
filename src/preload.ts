import { contextBridge, ipcRenderer } from 'electron';
import type { AppData, BrowseResult } from './types';

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  resizeWindow: (expanded: boolean) => ipcRenderer.send('resize-window', expanded),
  getStore: (): Promise<AppData> => ipcRenderer.invoke('get-store'),
  setStore: (data: AppData): Promise<void> => ipcRenderer.invoke('set-store', data),
  browseSoundtracks: (folderBase64: string): Promise<BrowseResult> =>
    ipcRenderer.invoke('browse-soundtracks', folderBase64),
  notifyPhase: (body: string) => ipcRenderer.send('notify-phase', body),
});
