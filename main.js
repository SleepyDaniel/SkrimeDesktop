const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const https = require('https')

let win
let updater = null

if (app.isPackaged) {
  try {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    updater = autoUpdater
  } catch (e) {
    console.error('updater unavailable:', e.message)
  }
}

function mkWin() {
  win = new BrowserWindow({
    width: 1340,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      webviewTag: true
    },
    backgroundColor: '#F9F7F2',
    show: false
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, 'dist/renderer/index.html'))
  }
  win.once('ready-to-show', () => win.show())

  win.on('maximize', () => win.webContents.send('win-state', 'max'))
  win.on('unmaximize', () => win.webContents.send('win-state', 'restore'))

  if (updater) {
    updater.on('update-available', () => win?.webContents.send('update-available'))
    updater.on('update-downloaded', () => win?.webContents.send('update-downloaded'))
    updater.checkForUpdates().catch(() => {})
  }
}

app.whenReady().then(() => {
  mkWin()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mkWin()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('win-action', (_, act) => {
  if (!win) return
  if (act === 'min') win.minimize()
  else if (act === 'max') win.isMaximized() ? win.unmaximize() : win.maximize()
  else if (act === 'close') win.close()
})

ipcMain.handle('api', (_, { method, endpoint, body, token }) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'skrime.eu',
      port: 443,
      path: `/api/${endpoint}`,
      method: method || 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'SkrimeDesktop/1.0'
      }
    }
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data)

    const req = https.request(opts, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) }
        catch { resolve({ state: 'error', message: 'Parse error', raw }) }
      })
    })
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')) })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
})

ipcMain.handle('open-url', (_, url) => shell.openExternal(url))

ipcMain.on('install-update', () => updater?.quitAndInstall())
