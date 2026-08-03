import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Items (file explorer)
  items: {
    getAll: () => ipcRenderer.invoke('items:getAll'),
    getChildren: (parentId: string | null) => ipcRenderer.invoke('items:getChildren', parentId),
    get: (id: string) => ipcRenderer.invoke('items:get', id),
    getWithTags: (id: string) => ipcRenderer.invoke('items:getWithTags', id),
    create: (item: {
      parent_id: string | null
      type: 'folder' | 'page'
      name: string
      icon?: string
      color?: string
      template_id?: string
    }) => ipcRenderer.invoke('items:create', item),
    update: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('items:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('items:delete', id),
    duplicate: (id: string) => ipcRenderer.invoke('items:duplicate', id),
    move: (id: string, newParentId: string | null) => ipcRenderer.invoke('items:move', id, newParentId),
    reorder: (orders: Array<{ id: string; sort_order: number }>) => ipcRenderer.invoke('items:reorder', orders),
    getBreadcrumb: (id: string) => ipcRenderer.invoke('items:getBreadcrumb', id),
    recordAccess: (id: string) => ipcRenderer.invoke('items:recordAccess', id),
    getRecent: (limit?: number) => ipcRenderer.invoke('items:getRecent', limit),
    getFavorites: () => ipcRenderer.invoke('items:getFavorites'),
    getPinned: () => ipcRenderer.invoke('items:getPinned'),
    getStats: () => ipcRenderer.invoke('items:getStats'),
  },

  // Pages
  pages: {
    get: (itemId: string) => ipcRenderer.invoke('pages:get', itemId),
    save: (itemId: string, content: string) => ipcRenderer.invoke('pages:save', itemId, content),
    getHistory: (itemId: string) => ipcRenderer.invoke('pages:getHistory', itemId),
    restoreVersion: (itemId: string, versionId: string) => ipcRenderer.invoke('pages:restoreVersion', itemId, versionId),
  },

  // Tags
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (name: string, color: string) => ipcRenderer.invoke('tags:create', name, color),
    update: (id: string, name: string, color: string) => ipcRenderer.invoke('tags:update', id, name, color),
    delete: (id: string) => ipcRenderer.invoke('tags:delete', id),
    getForItem: (itemId: string) => ipcRenderer.invoke('tags:getForItem', itemId),
    setForItem: (itemId: string, tagIds: string[]) => ipcRenderer.invoke('tags:setForItem', itemId, tagIds),
    addToItem: (itemId: string, tagId: string) => ipcRenderer.invoke('tags:addToItem', itemId, tagId),
    removeFromItem: (itemId: string, tagId: string) => ipcRenderer.invoke('tags:removeFromItem', itemId, tagId),
  },

  // Templates
  templates: {
    getAll: () => ipcRenderer.invoke('templates:getAll'),
    get: (id: string) => ipcRenderer.invoke('templates:get', id),
    create: (tmpl: { name: string; description: string; icon: string; content: string }) =>
      ipcRenderer.invoke('templates:create', tmpl),
    update: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('templates:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('templates:delete', id),
  },

  // Search
  search: {
    query: (q: string) => ipcRenderer.invoke('search:query', q),
  },

  // Timeline
  timeline: {
    getAll: () => ipcRenderer.invoke('timeline:getAll'),
    create: (event: Record<string, unknown>) => ipcRenderer.invoke('timeline:create', event),
    update: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('timeline:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('timeline:delete', id),
  },

  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
