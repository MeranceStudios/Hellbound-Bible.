const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('hellboundStorage', {
  loadWorkspace: async () => ipcRenderer.invoke('workspace:load'),
  saveWorkspace: async (state) => ipcRenderer.invoke('workspace:save', state),
})
