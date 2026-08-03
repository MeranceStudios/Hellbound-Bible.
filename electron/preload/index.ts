import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  workspace: {
    load: () => ipcRenderer.invoke('workspace:load'),
    save: (data: object) => ipcRenderer.invoke('workspace:save', data),
  },
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (data: object) => ipcRenderer.invoke('settings:save', data),
  },
  dialog: {
    openImage: () => ipcRenderer.invoke('dialog:openImage'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  platform: process.platform,
})
