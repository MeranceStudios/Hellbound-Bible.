const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs/promises')

const isDev = !app.isPackaged
const workspaceFile = path.join(app.getPath('userData'), 'hellbound-workspace.json')
const devUrl = 'http://localhost:5173'
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html')

const loadWorkspace = async () => {
  try {
    const json = await fs.readFile(workspaceFile, 'utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

const saveWorkspace = async (_, state) => {
  try {
    await fs.writeFile(workspaceFile, JSON.stringify(state, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1700,
    height: 1000,
    minWidth: 1120,
    minHeight: 700,
    backgroundColor: '#0f0f11',
    title: 'Hellbound Bible',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const loadApp = async () => {
    if (isDev) {
      try {
        await win.loadURL(devUrl)
      } catch {
        await win.loadFile(distIndexPath)
      }
      win.webContents.openDevTools({ mode: 'detach' })
      return
    }

    await win.loadFile(distIndexPath)
  }

  loadApp().catch(() => {
    win.loadFile(distIndexPath).catch(() => {
      win.webContents.loadURL('data:text/html,<h1>Hellbound Bible failed to load.</h1>')
    })
  })
}

app.whenReady().then(() => {
  ipcMain.handle('workspace:load', loadWorkspace)
  ipcMain.handle('workspace:save', saveWorkspace)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
