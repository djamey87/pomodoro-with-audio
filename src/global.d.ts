import type { AppData, BrowseResult } from './types';

declare global {
  interface Window {
    api: {
      minimize: () => void;
      close: () => void;
      resizeWindow: (expanded: boolean) => void;
      getStore: () => Promise<AppData>;
      setStore: (data: AppData) => Promise<void>;
      browseSoundtracks: (folderBase64: string) => Promise<BrowseResult>;
      notifyPhase: (body: string) => void;
    };
  }
}
