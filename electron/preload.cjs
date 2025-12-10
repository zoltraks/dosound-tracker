const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onAppCloseRequested(callback) {
    if (typeof callback !== 'function') {
      return;
    }
    ipcRenderer.on('app-close-requested', callback);
  },
  removeAppCloseRequestedListener(callback) {
    if (typeof callback !== 'function') {
      return;
    }
    ipcRenderer.removeListener('app-close-requested', callback);
  },
  confirmAppClose() {
    ipcRenderer.send('app-close-confirmed');
  },
  cancelAppClose() {
    ipcRenderer.send('app-close-cancelled');
  },
  getRuntimeInfo() {
    const versions = process.versions || {};

    return {
      runtime: 'electron',
      electron: typeof versions.electron === 'string' ? versions.electron : undefined,
      node: typeof versions.node === 'string' ? versions.node : undefined,
      chrome: typeof versions.chrome === 'string' ? versions.chrome : undefined,
    };
  },
});
