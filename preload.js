const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sk', {
  api: (method, endpoint, body, token) =>
    ipcRenderer.invoke('api', { method, endpoint, body, token }),
  openUrl: url => ipcRenderer.invoke('open-url', url),
  openConsole: url => ipcRenderer.invoke('open-console', url),
  winAction: act => ipcRenderer.send('win-action', act),
  onWinState: cb => ipcRenderer.on('win-state', (_, s) => cb(s)),
  platform: process.platform
})
