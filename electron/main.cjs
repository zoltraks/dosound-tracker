const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 950,
    minWidth: 1300,
    minHeight: 950,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  const session = mainWindow.webContents.session;

  if (session && typeof session.setPermissionRequestHandler === 'function') {
    session.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'midi' || permission === 'midiSysex') {
        callback(true);
      } else {
        callback(false);
      }
    });
  }

  if (session && typeof session.setPermissionCheckHandler === 'function') {
    session.setPermissionCheckHandler((webContents, permission) => {
      if (permission === 'midi' || permission === 'midiSysex') {
        return true;
      }
      return false;
    });
  }

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  } else {
    // Match Vite dev server port from vite.config.ts (server.port = 8008)
    mainWindow.loadURL('http://localhost:8008/');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();

    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('app-close-requested');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('app-close-confirmed', () => {
  isQuitting = true;
  if (mainWindow) {
    mainWindow.close();
  } else {
    app.quit();
  }
});

ipcMain.on('app-close-cancelled', () => {
  if (mainWindow) {
    mainWindow.focus();
  }
});
