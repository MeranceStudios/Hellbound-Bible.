import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { FileItem, FileItemType, Tab, WorkspaceState, TemplateType, TEMPLATE_DEFINITIONS, Version } from '@/types'

interface AppStore extends WorkspaceState {
  // Computed / UI state
  searchQuery: string
  isSearchOpen: boolean
  isTemplateModalOpen: boolean
  isNewItemParentId: string | null
  contextMenu: { x: number; y: number; itemId: string } | null
  dragState: { draggedId: string | null; dragOverId: string | null }
  selectedItemId: string | null
  leftPanelWidth: number
  isDashboardVisible: boolean

  // Actions
  loadWorkspace: () => Promise<void>
  saveWorkspace: () => Promise<void>

  createItem: (parentId: string, name: string, type: FileItemType, templateType?: TemplateType) => string
  renameItem: (id: string, name: string) => void
  deleteItem: (id: string) => void
  duplicateItem: (id: string) => string
  moveItem: (id: string, newParentId: string) => void
  toggleFavorite: (id: string) => void
  togglePin: (id: string) => void
  setItemColor: (id: string, color: string) => void
  setItemIcon: (id: string, icon: string) => void
  toggleExpand: (id: string) => void

  openTab: (pageId: string) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updatePageContent: (pageId: string, content: string, wordCount?: number) => void
  updatePageTags: (pageId: string, tags: string[]) => void
  saveVersion: (pageId: string, label?: string) => void
  restoreVersion: (pageId: string, versionId: string) => void

  setSearchQuery: (q: string) => void
  setSearchOpen: (open: boolean) => void
  setTemplateModalOpen: (open: boolean) => void
  setNewItemParentId: (id: string | null) => void
  setContextMenu: (menu: { x: number; y: number; itemId: string } | null) => void
  setDragState: (state: { draggedId: string | null; dragOverId: string | null }) => void
  setSelectedItem: (id: string | null) => void
  setLeftPanelWidth: (w: number) => void
  setDashboardVisible: (v: boolean) => void

  getItemPath: (id: string) => string[]
  getFlattenedItems: () => FileItem[]
  getChildren: (parentId: string) => FileItem[]
  getPageCount: () => number
  getFolderCount: () => number
  getTotalWordCount: () => number
  getCharacterCount: () => number
  getEpisodeCount: () => number
  getFavorites: () => FileItem[]
  getPinned: () => FileItem[]
  getRecentPages: () => FileItem[]
}

const defaultItems: Record<string, FileItem> = {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function countWords(content: string): number {
  if (!content) return 0
  try {
    const parsed = JSON.parse(content)
    const extractText = (node: Record<string, unknown>): string => {
      if (node.type === 'text') return (node.text as string) || ''
      if (node.content) return (node.content as Record<string, unknown>[]).map(extractText).join(' ')
      return ''
    }
    const text = extractText(parsed)
    return text.split(/\s+/).filter(w => w.length > 0).length
  } catch {
    return 0
  }
}

function cloneItem(item: FileItem, newId: string, newParentId: string): FileItem {
  return {
    ...item,
    id: newId,
    parentId: newParentId,
    children: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [],
  }
}

function deepDuplicate(
  itemId: string,
  newParentId: string,
  items: Record<string, FileItem>
): Record<string, FileItem> {
  const item = items[itemId]
  if (!item) return {}
  const newId = uuidv4()
  const newItems: Record<string, FileItem> = {}
  const newItem = cloneItem(item, newId, newParentId)
  newItem.name = item.name + ' (Copy)'
  newItems[newId] = newItem
  for (const childId of item.children) {
    const childClones = deepDuplicate(childId, newId, items)
    Object.assign(newItems, childClones)
    const childNewId = Object.keys(childClones).find(
      k => childClones[k].parentId === newId
    )
    if (childNewId) newItem.children.push(childNewId)
  }
  return newItems
}

function deleteItemRecursive(
  itemId: string,
  items: Record<string, FileItem>
): string[] {
  const item = items[itemId]
  if (!item) return []
  const toDelete: string[] = [itemId]
  for (const childId of item.children) {
    toDelete.push(...deleteItemRecursive(childId, items))
  }
  return toDelete
}

export const useAppStore = create<AppStore>((set, get) => ({
  items: defaultItems,
  openTabs: [],
  activeTabId: null,
  recentPages: [],
  settings: {},
  searchQuery: '',
  isSearchOpen: false,
  isTemplateModalOpen: false,
  isNewItemParentId: null,
  contextMenu: null,
  dragState: { draggedId: null, dragOverId: null },
  selectedItemId: null,
  leftPanelWidth: 280,
  isDashboardVisible: true,

  loadWorkspace: async () => {
    try {
      const data = await window.electronAPI.workspace.load()
      if (data && data.items) {
        set({
          items: data.items,
          openTabs: data.openTabs || [],
          activeTabId: data.activeTabId || null,
          recentPages: data.recentPages || [],
          settings: data.settings || {},
        })
      }
    } catch (err) {
      console.error('Failed to load workspace', err)
    }
  },

  saveWorkspace: async () => {
    const { items, openTabs, activeTabId, recentPages, settings } = get()
    try {
      await window.electronAPI.workspace.save({ items, openTabs, activeTabId, recentPages, settings })
    } catch (err) {
      console.error('Failed to save workspace', err)
    }
  },

  createItem: (parentId, name, type, templateType = 'blank') => {
    const id = uuidv4()
    const now = new Date().toISOString()
    const content = type === 'page' && templateType !== 'blank'
      ? TEMPLATE_DEFINITIONS[templateType]?.content || ''
      : ''
    const newItem: FileItem = {
      id,
      name,
      type,
      parentId,
      children: [],
      color: undefined,
      icon: type === 'folder' ? 'folder' : 'file-text',
      isPinned: false,
      isFavorite: false,
      isExpanded: type === 'folder',
      createdAt: now,
      updatedAt: now,
      ...(type === 'page' ? { content, tags: [], templateType, versions: [], wordCount: 0 } : {}),
    }
    set(state => {
      const parent = state.items[parentId]
      if (!parent) return state
      return {
        items: {
          ...state.items,
          [id]: newItem,
          [parentId]: { ...parent, children: [...parent.children, id], updatedAt: now },
        }
      }
    })
    if (type === 'page') {
      get().openTab(id)
    }
    get().saveWorkspace()
    return id
  },

  renameItem: (id, name) => {
    const now = new Date().toISOString()
    set(state => ({
      items: {
        ...state.items,
        [id]: { ...state.items[id], name, updatedAt: now }
      },
      openTabs: state.openTabs.map(t => t.pageId === id ? { ...t, title: name } : t)
    }))
    get().saveWorkspace()
  },

  deleteItem: (id) => {
    if (id === 'root') return
    const { items } = get()
    const item = items[id]
    if (!item) return
    const toDelete = deleteItemRecursive(id, items)
    set(state => {
      const newItems = { ...state.items }
      toDelete.forEach(del => delete newItems[del])
      if (item.parentId && newItems[item.parentId]) {
        newItems[item.parentId] = {
          ...newItems[item.parentId],
          children: newItems[item.parentId].children.filter(c => c !== id)
        }
      }
      return {
        items: newItems,
        openTabs: state.openTabs.filter(t => !toDelete.includes(t.pageId)),
        activeTabId: toDelete.includes(state.activeTabId || '')
          ? (state.openTabs.find(t => !toDelete.includes(t.pageId))?.id || null)
          : state.activeTabId,
        recentPages: state.recentPages.filter(p => !toDelete.includes(p))
      }
    })
    get().saveWorkspace()
  },

  duplicateItem: (id) => {
    const { items } = get()
    const item = items[id]
    if (!item || !item.parentId) return id
    const clones = deepDuplicate(id, item.parentId, items)
    const newRootId = Object.keys(clones).find(k => clones[k].parentId === item.parentId)!
    set(state => ({
      items: {
        ...state.items,
        ...clones,
        [item.parentId!]: {
          ...state.items[item.parentId!],
          children: [...state.items[item.parentId!].children, newRootId]
        }
      }
    }))
    get().saveWorkspace()
    return newRootId
  },

  moveItem: (id, newParentId) => {
    if (id === 'root' || id === newParentId) return
    const { items } = get()
    const item = items[id]
    if (!item) return
    // Prevent moving into own descendant
    let check = newParentId
    while (check) {
      if (check === id) return
      check = items[check]?.parentId || ''
    }
    const oldParentId = item.parentId
    if (oldParentId === newParentId) return
    const now = new Date().toISOString()
    set(state => {
      const newItems = { ...state.items }
      if (oldParentId && newItems[oldParentId]) {
        newItems[oldParentId] = {
          ...newItems[oldParentId],
          children: newItems[oldParentId].children.filter(c => c !== id)
        }
      }
      if (newItems[newParentId]) {
        newItems[newParentId] = {
          ...newItems[newParentId],
          children: [...newItems[newParentId].children, id],
          updatedAt: now
        }
      }
      newItems[id] = { ...newItems[id], parentId: newParentId, updatedAt: now }
      return { items: newItems }
    })
    get().saveWorkspace()
  },

  toggleFavorite: (id) => {
    set(state => ({
      items: {
        ...state.items,
        [id]: { ...state.items[id], isFavorite: !state.items[id].isFavorite }
      }
    }))
    get().saveWorkspace()
  },

  togglePin: (id) => {
    set(state => ({
      items: {
        ...state.items,
        [id]: { ...state.items[id], isPinned: !state.items[id].isPinned }
      }
    }))
    get().saveWorkspace()
  },

  setItemColor: (id, color) => {
    set(state => ({
      items: { ...state.items, [id]: { ...state.items[id], color } }
    }))
    get().saveWorkspace()
  },

  setItemIcon: (id, icon) => {
    set(state => ({
      items: { ...state.items, [id]: { ...state.items[id], icon } }
    }))
    get().saveWorkspace()
  },

  toggleExpand: (id) => {
    set(state => ({
      items: {
        ...state.items,
        [id]: { ...state.items[id], isExpanded: !state.items[id].isExpanded }
      }
    }))
  },

  openTab: (pageId) => {
    const { openTabs, items } = get()
    const existing = openTabs.find(t => t.pageId === pageId)
    if (existing) {
      set({ activeTabId: existing.id, isDashboardVisible: false })
    } else {
      const item = items[pageId]
      if (!item || item.type !== 'page') return
      const tabId = uuidv4()
      const newTab: Tab = { id: tabId, pageId, title: item.name, isDirty: false }
      set(state => ({
        openTabs: [...state.openTabs, newTab],
        activeTabId: tabId,
        isDashboardVisible: false,
        recentPages: [pageId, ...state.recentPages.filter(r => r !== pageId)].slice(0, 20)
      }))
    }
    get().saveWorkspace()
  },

  closeTab: (tabId) => {
    set(state => {
      const newTabs = state.openTabs.filter(t => t.id !== tabId)
      let newActiveId = state.activeTabId
      if (newActiveId === tabId) {
        const idx = state.openTabs.findIndex(t => t.id === tabId)
        newActiveId = newTabs[Math.max(0, idx - 1)]?.id || newTabs[0]?.id || null
      }
      return {
        openTabs: newTabs,
        activeTabId: newActiveId,
        isDashboardVisible: newTabs.length === 0 ? true : state.isDashboardVisible
      }
    })
    get().saveWorkspace()
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId, isDashboardVisible: false })
  },

  updatePageContent: (pageId, content, wordCount) => {
    const wc = wordCount !== undefined ? wordCount : countWords(content)
    const now = new Date().toISOString()
    set(state => ({
      items: {
        ...state.items,
        [pageId]: { ...state.items[pageId], content, wordCount: wc, updatedAt: now }
      },
      openTabs: state.openTabs.map(t => t.pageId === pageId ? { ...t, isDirty: false } : t)
    }))
    get().saveWorkspace()
  },

  updatePageTags: (pageId, tags) => {
    set(state => ({
      items: { ...state.items, [pageId]: { ...state.items[pageId], tags } }
    }))
    get().saveWorkspace()
  },

  saveVersion: (pageId, label) => {
    const { items } = get()
    const page = items[pageId]
    if (!page || page.type !== 'page') return
    const version: Version = {
      id: uuidv4(),
      content: page.content || '',
      savedAt: new Date().toISOString(),
      label
    }
    set(state => ({
      items: {
        ...state.items,
        [pageId]: {
          ...state.items[pageId],
          versions: [...(state.items[pageId].versions || []), version].slice(-50)
        }
      }
    }))
    get().saveWorkspace()
  },

  restoreVersion: (pageId, versionId) => {
    const { items } = get()
    const page = items[pageId]
    if (!page) return
    const version = page.versions?.find(v => v.id === versionId)
    if (!version) return
    get().saveVersion(pageId, 'Pre-restore backup')
    get().updatePageContent(pageId, version.content)
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setTemplateModalOpen: (isTemplateModalOpen) => set({ isTemplateModalOpen }),
  setNewItemParentId: (isNewItemParentId) => set({ isNewItemParentId }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setDragState: (dragState) => set({ dragState }),
  setSelectedItem: (selectedItemId) => set({ selectedItemId }),
  setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth }),
  setDashboardVisible: (isDashboardVisible) => set({ isDashboardVisible }),

  getItemPath: (id) => {
    const { items } = get()
    const path: string[] = []
    let current = items[id]
    while (current) {
      path.unshift(current.name)
      if (!current.parentId) break
      current = items[current.parentId]
    }
    return path
  },

  getFlattenedItems: () => {
    return Object.values(get().items)
  },

  getChildren: (parentId) => {
    const { items } = get()
    const parent = items[parentId]
    if (!parent) return []
    return parent.children.map(id => items[id]).filter(Boolean)
  },

  getPageCount: () => Object.values(get().items).filter(i => i.type === 'page').length,
  getFolderCount: () => Object.values(get().items).filter(i => i.type === 'folder').length,
  getTotalWordCount: () => Object.values(get().items).filter(i => i.type === 'page').reduce((sum, i) => sum + (i.wordCount || 0), 0),
  getCharacterCount: () => Object.values(get().items).filter(i =>
    i.type === 'page' && (i.templateType === 'character' || i.tags?.includes('character'))
  ).length,
  getEpisodeCount: () => Object.values(get().items).filter(i =>
    i.type === 'page' && (i.templateType === 'episode' || i.tags?.includes('episode'))
  ).length,
  getFavorites: () => Object.values(get().items).filter(i => i.isFavorite),
  getPinned: () => Object.values(get().items).filter(i => i.isPinned),
  getRecentPages: () => {
    const { recentPages, items } = get()
    return recentPages.map(id => items[id]).filter(Boolean)
  }
}))

// Global type augmentation for preload API
declare global {
  interface Window {
    electronAPI: {
      workspace: {
        load: () => Promise<WorkspaceState>
        save: (data: object) => Promise<boolean>
      }
      settings: {
        load: () => Promise<object>
        save: (data: object) => Promise<boolean>
      }
      dialog: {
        openImage: () => Promise<string[]>
      }
      shell: {
        openExternal: (url: string) => Promise<void>
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      platform: string
    }
  }
}
