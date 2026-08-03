import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.merancestudios.hellboundbible')
}

const isDev = !app.isPackaged

// Data directory setup
const userDataPath = app.getPath('userData')
const workspacePath = join(userDataPath, 'workspace.json')
const settingsPath = join(userDataPath, 'settings.json')

function ensureDataDirectory(): void {
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
}

function loadWorkspace(): object {
  ensureDataDirectory()
  if (existsSync(workspacePath)) {
    try {
      return JSON.parse(readFileSync(workspacePath, 'utf-8'))
    } catch {
      return getDefaultWorkspace()
    }
  }
  return getDefaultWorkspace()
}

function getDefaultWorkspace(): object {
  const now = new Date().toISOString()
  return {
    items: {
      root: {
        id: 'root',
        name: 'Hellbound',
        type: 'folder',
        parentId: null,
        children: [],
        color: '#dc143c',
        icon: 'folder',
        isPinned: false,
        isFavorite: false,
        isExpanded: true,
        createdAt: now,
        updatedAt: now,
      }
    },
    openTabs: [],
    activeTabId: null,
    recentPages: [],
    settings: {}
  }
}

function saveWorkspace(data: object): void {
  ensureDataDirectory()
  writeFileSync(workspacePath, JSON.stringify(data, null, 2), 'utf-8')
}

function loadSettings(): object {
  ensureDataDirectory()
  if (existsSync(settingsPath)) {
    try {
      return JSON.parse(readFileSync(settingsPath, 'utf-8'))
    } catch {
      return {}
    }
  }
  return {}
}

function saveSettings(data: object): void {
  ensureDataDirectory()
  writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8')
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    show: false,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../../out/renderer/index.html'))
  }
}

// IPC Handlers
ipcMain.handle('workspace:load', () => loadWorkspace())
ipcMain.handle('workspace:save', (_event, data) => {
  saveWorkspace(data)
  return true
})

ipcMain.handle('settings:load', () => loadSettings())
ipcMain.handle('settings:save', (_event, data) => {
  saveSettings(data)
  return true
})

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }
    ]
  })
  if (!result.canceled) {
    return result.filePaths.map(fp => {
      const data = readFileSync(fp)
      const ext = fp.split('.').pop()?.toLowerCase() || 'png'
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml'
      }
      return `data:${mimeTypes[ext] || 'image/png'};base64,${data.toString('base64')}`
    })
  }
  return []
})

ipcMain.handle('shell:openExternal', (_event, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => mainWindow?.close())

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
