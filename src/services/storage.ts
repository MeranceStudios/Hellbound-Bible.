import { defaultWorkspaceState } from '../data/defaultWorkspace'
import type { WorkspaceState } from '../types'

const STORAGE_KEY = 'hellbound-bible-workspace-v1'

type ElectronStorageApi = {
  loadWorkspace: () => Promise<WorkspaceState | null>
  saveWorkspace: (state: WorkspaceState) => Promise<boolean>
}

declare global {
  interface Window {
    hellboundStorage?: ElectronStorageApi
  }
}

const normalizeWorkspace = (input: unknown): WorkspaceState => {
  if (!input || typeof input !== 'object') {
    return defaultWorkspaceState
  }

  const raw = input as Partial<WorkspaceState>
  const items = raw.items && typeof raw.items === 'object' ? raw.items : defaultWorkspaceState.items
  const rootId = raw.rootId && items[raw.rootId] ? raw.rootId : defaultWorkspaceState.rootId

  const selectedId =
    raw.selectedId && items[raw.selectedId]
      ? raw.selectedId
      : rootId

  const openTabs = Array.isArray(raw.openTabs)
    ? raw.openTabs.filter((id): id is string => typeof id === 'string' && Boolean(items[id]))
    : defaultWorkspaceState.openTabs

  const activeTabId =
    raw.activeTabId && items[raw.activeTabId] && items[raw.activeTabId].kind === 'page'
      ? raw.activeTabId
      : openTabs[0]

  return {
    rootId,
    items,
    selectedId,
    openTabs,
    activeTabId,
    clipboard: raw.clipboard,
    recentPageIds: Array.isArray(raw.recentPageIds)
      ? raw.recentPageIds.filter((id): id is string => typeof id === 'string' && Boolean(items[id]))
      : [],
    activity: Array.isArray(raw.activity) ? raw.activity : [],
    templates: Array.isArray(raw.templates) ? raw.templates : defaultWorkspaceState.templates,
    timeline: Array.isArray(raw.timeline) ? raw.timeline : defaultWorkspaceState.timeline,
    currentArc: raw.currentArc,
    currentEpisode: raw.currentEpisode,
  }
}

export const loadWorkspace = async (): Promise<WorkspaceState> => {
  if (window.hellboundStorage) {
    const state = await window.hellboundStorage.loadWorkspace()
    return normalizeWorkspace(state)
  }

  const fromLocal = localStorage.getItem(STORAGE_KEY)
  if (!fromLocal) {
    return defaultWorkspaceState
  }

  try {
    return normalizeWorkspace(JSON.parse(fromLocal))
  } catch {
    return defaultWorkspaceState
  }
}

export const saveWorkspace = async (state: WorkspaceState): Promise<void> => {
  if (window.hellboundStorage) {
    await window.hellboundStorage.saveWorkspace(state)
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
