import type { WorkspaceFolder, WorkspaceItem, WorkspacePage, WorkspaceState } from '../types'

export const isFolder = (item: WorkspaceItem): item is WorkspaceFolder =>
  item.kind === 'folder'

export const isPage = (item: WorkspaceItem): item is WorkspacePage => item.kind === 'page'

export const uid = () => crypto.randomUUID()

export const now = () => Date.now()

export const ensureFolderForInsert = (state: WorkspaceState, selectedId: string): WorkspaceFolder => {
  const selected = state.items[selectedId]
  if (selected && isFolder(selected)) {
    return selected
  }

  if (selected?.parentId) {
    const parent = state.items[selected.parentId]
    if (parent && isFolder(parent)) {
      return parent
    }
  }

  return state.items[state.rootId] as WorkspaceFolder
}

export const collectDescendantIds = (
  items: Record<string, WorkspaceItem>,
  id: string,
): string[] => {
  const target = items[id]
  if (!target || target.kind === 'page') {
    return [id]
  }

  const all = [id]
  const stack = [...target.childrenIds]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    all.push(currentId)
    const current = items[currentId]
    if (current?.kind === 'folder') {
      stack.push(...current.childrenIds)
    }
  }

  return all
}

export const canMoveInto = (
  items: Record<string, WorkspaceItem>,
  movingId: string,
  destinationFolderId: string,
): boolean => {
  if (movingId === destinationFolderId) {
    return false
  }
  const descendants = new Set(collectDescendantIds(items, movingId))
  return !descendants.has(destinationFolderId)
}

export const searchWorkspace = (state: WorkspaceState, query: string): string[] => {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }

  return Object.values(state.items)
    .filter((item) => {
      if (item.name.toLowerCase().includes(q)) {
        return true
      }

      if (item.kind === 'page') {
        const haystack = [
          item.content,
          item.tags.join(' '),
          item.tasks.map((task) => task.text).join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      }

      return false
    })
    .map((item) => item.id)
}
