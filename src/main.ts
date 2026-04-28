import { app, BrowserWindow, ipcMain, session, Notification } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initStore, readStore, writeStore } from './storeService';
import { browseSoundtracks } from './soundtrackService';
import type { AppData } from './types';

if (started) app.quit();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 270,
    minWidth: 400,
    minHeight: 270,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Inject CORS headers so the renderer can stream MP3s from listentoamovie.com
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET, HEAD, OPTIONS'],
      },
    });
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

app.whenReady().then(() => {
  initStore();

  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-close', () => mainWindow?.close());

  // Resize window when playlist drawer opens/closes
  ipcMain.on('resize-window', (_e, expanded: boolean) => {
    if (!mainWindow) return;
    const height = expanded ? 560 : 270;
    mainWindow.setSize(400, height, true);
    mainWindow.setResizable(false);
  });

  // Persistent store
  ipcMain.handle('get-store', () => readStore());
  ipcMain.handle('set-store', (_e, data: AppData) => writeStore(data));

  // Soundtrack browser — fetches and parses listentoamovie.com from main process
  ipcMain.handle('browse-soundtracks', (_e, folderBase64: string) =>
    browseSoundtracks(folderBase64),
  );

  // Native phase-change notification + restore window
  ipcMain.on('notify-phase', (_e, body: string) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    if (Notification.isSupported()) {
      new Notification({ title: 'Pomodoro', body }).show();
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
