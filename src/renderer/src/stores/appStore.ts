import { create } from 'zustand'
import type { FileItem, Tab, Tag, Template, SearchResult } from '../types'

type View = 'editor' | 'dashboard' | 'search' | 'timeline' | 'settings'

interface AppState {
  // File tree
  items: FileItem[]
  expandedIds: Set<string>
  selectedId: string | null

  // Tabs
  tabs: Tab[]
  activeTabId: string | null

  // View
  currentView: View

  // Search
  searchQuery: string
  searchResults: SearchResult[]
  isSearching: boolean

  // Tags
  tags: Tag[]

  // Templates
  templates: Template[]

  // UI state
  explorerWidth: number
  isExplorerCollapsed: boolean
  showRightPanel: boolean
  isLoading: boolean

  // Autosave
  pendingSaves: Set<string>

  // Actions
  setItems: (items: FileItem[]) => void
  addItem: (item: FileItem) => void
  updateItem: (id: string, updates: Partial<FileItem>) => void
  removeItem: (id: string) => void

  toggleExpanded: (id: string) => void
  setExpanded: (id: string, expanded: boolean) => void
  expandAll: (id: string) => void

  setSelectedId: (id: string | null) => void

  openTab: (item: FileItem) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabName: (itemId: string, name: string) => void
  markTabDirty: (itemId: string, dirty: boolean) => void

  setCurrentView: (view: View) => void
  setSearchQuery: (q: string) => void
  setSearchResults: (results: SearchResult[]) => void
  setIsSearching: (v: boolean) => void

  setTags: (tags: Tag[]) => void
  setTemplates: (templates: Template[]) => void

  setExplorerWidth: (w: number) => void
  toggleExplorer: () => void
  setShowRightPanel: (v: boolean) => void
  setIsLoading: (v: boolean) => void

  addPendingSave: (itemId: string) => void
  removePendingSave: (itemId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  items: [],
  expandedIds: new Set(),
  selectedId: null,

  tabs: [],
  activeTabId: null,

  currentView: 'dashboard',

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  tags: [],
  templates: [],

  explorerWidth: 280,
  isExplorerCollapsed: false,
  showRightPanel: false,
  isLoading: false,

  pendingSaves: new Set(),

  // Items
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, updates) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      tabs: s.tabs.map((t) =>
        t.item_id === id
          ? { ...t, name: updates.name ?? t.name, icon: updates.icon ?? t.icon, color: updates.color ?? t.color }
          : t
      ),
    })),
  removeItem: (id) =>
    set((s) => {
      // Collect all descendant IDs
      const toRemove = new Set<string>()
      const collect = (parentId: string) => {
        toRemove.add(parentId)
        s.items.filter((i) => i.parent_id === parentId).forEach((i) => collect(i.id))
      }
      collect(id)

      return {
        items: s.items.filter((i) => !toRemove.has(i.id)),
        tabs: s.tabs.filter((t) => !toRemove.has(t.item_id)),
        activeTabId: s.tabs.find((t) => toRemove.has(t.item_id) && t.id === s.activeTabId)
          ? null
          : s.activeTabId,
      }
    }),

  // Expand/collapse
  toggleExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { expandedIds: next }
    }),
  setExpanded: (id, expanded) =>
    set((s) => {
      const next = new Set(s.expandedIds)
      if (expanded) next.add(id)
      else next.delete(id)
      return { expandedIds: next }
    }),
  expandAll: (id) =>
    set((s) => {
      const next = new Set(s.expandedIds)
      const expand = (parentId: string) => {
        next.add(parentId)
        s.items.filter((i) => i.parent_id === parentId && i.type === 'folder').forEach((i) => expand(i.id))
      }
      expand(id)
      return { expandedIds: next }
    }),

  setSelectedId: (id) => set({ selectedId: id }),

  // Tabs
  openTab: (item) =>
    set((s) => {
      const existing = s.tabs.find((t) => t.item_id === item.id)
      if (existing) {
        return { activeTabId: existing.id, currentView: 'editor' }
      }
      const newTab: Tab = {
        id: `tab-${item.id}`,
        item_id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        is_dirty: false,
      }
      return {
        tabs: [...s.tabs, newTab],
        activeTabId: newTab.id,
        currentView: 'editor',
      }
    }),
  closeTab: (tabId) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === tabId)
      const newTabs = s.tabs.filter((t) => t.id !== tabId)
      let newActive = s.activeTabId
      if (s.activeTabId === tabId) {
        if (newTabs.length === 0) {
          newActive = null
        } else if (idx >= newTabs.length) {
          newActive = newTabs[newTabs.length - 1].id
        } else {
          newActive = newTabs[idx].id
        }
      }
      return {
        tabs: newTabs,
        activeTabId: newActive,
        currentView: newTabs.length === 0 ? 'dashboard' : 'editor',
      }
    }),
  setActiveTab: (tabId) => set({ activeTabId: tabId, currentView: 'editor' }),
  updateTabName: (itemId, name) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.item_id === itemId ? { ...t, name } : t)),
    })),
  markTabDirty: (itemId, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.item_id === itemId ? { ...t, is_dirty: dirty } : t)),
    })),

  setCurrentView: (view) => set({ currentView: view }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (v) => set({ isSearching: v }),

  setTags: (tags) => set({ tags }),
  setTemplates: (templates) => set({ templates }),

  setExplorerWidth: (w) => set({ explorerWidth: Math.max(200, Math.min(500, w)) }),
  toggleExplorer: () => set((s) => ({ isExplorerCollapsed: !s.isExplorerCollapsed })),
  setShowRightPanel: (v) => set({ showRightPanel: v }),
  setIsLoading: (v) => set({ isLoading: v }),

  addPendingSave: (itemId) =>
    set((s) => {
      const next = new Set(s.pendingSaves)
      next.add(itemId)
      return { pendingSaves: next }
    }),
  removePendingSave: (itemId) =>
    set((s) => {
      const next = new Set(s.pendingSaves)
      next.delete(itemId)
      return { pendingSaves: next }
    }),
}))
