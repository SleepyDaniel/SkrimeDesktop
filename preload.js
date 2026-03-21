const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sk', {
  api: (method, endpoint, body, token) =>
    ipcRenderer.invoke('api', { method, endpoint, body, token }),
  openUrl: url => ipcRenderer.invoke('open-url', url),
  winAction: act => ipcRenderer.send('win-action', act),
  onWinState: cb => ipcRenderer.on('win-state', (_, s) => cb(s)),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateAvailable: cb => ipcRenderer.on('update-available', () => cb()),
  onUpdateDownloaded: cb => ipcRenderer.on('update-downloaded', () => cb()),
  platform: process.platform
})
