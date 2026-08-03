import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadWorkspace, saveWorkspace } from './services/storage'
import {
  canMoveInto,
  collectDescendantIds,
  ensureFolderForInsert,
  now,
  searchWorkspace,
  uid,
} from './services/workspaceOps'
import type {
  PageTask,
  PageVersion,
  TimelineEvent,
  WorkspaceFolder,
  WorkspaceItem,
  WorkspacePage,
  WorkspaceState,
} from './types'

type ViewMode = 'dashboard' | 'editor' | 'timeline'

type ContextMenuState = {
  x: number
  y: number
  targetId: string
} | null

const iconChoices = ['folder', 'book', 'users', 'clapper', 'sword', 'map', 'camera']
const colorChoices = ['#1c1c1f', '#2b2b31', '#52151e', '#8b1e2d', '#aa2438']
const iconMap: Record<string, string> = {
  folder: '📁',
  book: '📚',
  users: '👥',
  clapper: '🎬',
  sword: '⚔️',
  map: '🗺️',
  camera: '📷',
}

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null)
  const [query, setQuery] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [linkDraft, setLinkDraft] = useState('')
  const [taskDraft, setTaskDraft] = useState('')
  const [timelineFilter, setTimelineFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const autosaveRef = useRef<number | null>(null)

  useEffect(() => {
    loadWorkspace().then(setWorkspace)
  }, [])

  useEffect(() => {
    if (!workspace) {
      return
    }

    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current)
    }

    autosaveRef.current = window.setTimeout(() => {
      saveWorkspace(workspace)
    }, 300)
  }, [workspace])

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const stats = useMemo(() => {
    if (!workspace) {
      return {
        pages: 0,
        folders: 0,
        words: 0,
        characters: 0,
        episodes: 0,
      }
    }

    const all = Object.values(workspace.items)
    const pages = all.filter((it) => it.kind === 'page').length
    const folders = all.filter((it) => it.kind === 'folder').length
    const words = all
      .filter((it): it is WorkspacePage => it.kind === 'page')
      .map((p) => p.content.replace(/<[^>]+>/g, ' '))
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length
    return {
      pages,
      folders,
      words,
      characters: all.filter((it) => it.kind === 'page' && it.tags.includes('Character')).length,
      episodes: all.filter((it) => it.kind === 'page' && it.tags.includes('Episode')).length,
    }
  }, [workspace])

  if (!workspace) {
    return <div className="loading">Loading Hellbound Bible...</div>
  }

  const selected = workspace.items[workspace.selectedId]
  const activePage = workspace.activeTabId ? workspace.items[workspace.activeTabId] : undefined
  const contextTarget = contextMenu ? workspace.items[contextMenu.targetId] : undefined
  const filteredIds = searchWorkspace(workspace, query)
  const selectedFolder = ensureFolderForInsert(workspace, workspace.selectedId)

  const getItemIcon = (item: WorkspaceItem): string => {
    if (item.icon) {
      return iconMap[item.icon] ?? item.icon
    }
    return item.kind === 'folder' ? '📁' : '📄'
  }

  const updateWorkspace = (updater: (current: WorkspaceState) => WorkspaceState) => {
    setWorkspace((current) => (current ? updater(current) : current))
  }

  const updateItem = (itemId: string, updater: (item: WorkspaceItem) => WorkspaceItem) => {
    updateWorkspace((current) => ({
      ...current,
      items: {
        ...current.items,
        [itemId]: updater(current.items[itemId]),
      },
    }))
  }

  const openPage = (pageId: string) => {
    updateWorkspace((current) => {
      if (!current.items[pageId] || current.items[pageId].kind !== 'page') {
        return current
      }

      const nextTabs = current.openTabs.includes(pageId)
        ? current.openTabs
        : [...current.openTabs, pageId]
      const recent = [pageId, ...current.recentPageIds.filter((id) => id !== pageId)].slice(0, 14)

      return {
        ...current,
        selectedId: pageId,
        activeTabId: pageId,
        openTabs: nextTabs,
        recentPageIds: recent,
      }
    })
    setViewMode('editor')
  }

  const selectItem = (itemId: string) => {
    updateWorkspace((current) => ({ ...current, selectedId: itemId }))
    const item = workspace.items[itemId]
    if (item?.kind === 'page') {
      openPage(itemId)
    }
  }

  const createFolder = () => {
    const newId = uid()
    updateWorkspace((current) => {
      const parent = ensureFolderForInsert(current, current.selectedId)
      const newFolder: WorkspaceFolder = {
        id: newId,
        name: 'New Folder',
        kind: 'folder',
        parentId: parent.id,
        createdAt: now(),
        updatedAt: now(),
        childrenIds: [],
      }
      return {
        ...current,
        items: {
          ...current.items,
          [parent.id]: { ...parent, childrenIds: [...parent.childrenIds, newId], updatedAt: now() },
          [newId]: newFolder,
        },
        selectedId: newId,
        activity: [{ id: uid(), at: now(), message: `Created folder ${newFolder.name}` }, ...current.activity].slice(0, 100),
      }
    })
  }

  const createPage = (templateId?: string) => {
    const tpl = workspace.templates.find((t) => t.id === templateId)
    const newId = uid()
    updateWorkspace((current) => {
      const parent = ensureFolderForInsert(current, current.selectedId)
      const newPage: WorkspacePage = {
        id: newId,
        name: tpl ? tpl.name : 'Untitled Page',
        kind: 'page',
        parentId: parent.id,
        createdAt: now(),
        updatedAt: now(),
        content: tpl?.prefillHtml ?? '<h2>Page</h2><p>Start writing...</p>',
        tags: tpl?.prefillTags ?? [],
        links: [],
        tasks: [],
        templateId,
        versions: [],
        media: [],
        timelineRefs: [],
      }
      return {
        ...current,
        items: {
          ...current.items,
          [parent.id]: { ...parent, childrenIds: [...parent.childrenIds, newId], updatedAt: now() },
          [newId]: newPage,
        },
        selectedId: newId,
        openTabs: [...current.openTabs, newId],
        activeTabId: newId,
        recentPageIds: [newId, ...current.recentPageIds.filter((id) => id !== newId)].slice(0, 14),
        activity: [{ id: uid(), at: now(), message: `Created page ${newPage.name}` }, ...current.activity].slice(0, 100),
      }
    })
    setViewMode('editor')
  }

  const renameItem = (itemId: string) => {
    const currentName = workspace.items[itemId]?.name
    const next = window.prompt('Rename item', currentName)
    if (!next || !next.trim()) {
      return
    }
    updateItem(itemId, (item) => ({ ...item, name: next.trim(), updatedAt: now() }))
  }

  const deleteItem = (itemId: string) => {
    if (itemId === workspace.rootId) {
      return
    }

    setContextMenu(null)

    if (!window.confirm('Delete selected item and all nested content?')) {
      return
    }

    updateWorkspace((current) => {
      const target = current.items[itemId]
      if (!target) {
        return current
      }
      const toDelete = new Set(collectDescendantIds(current.items, itemId))
      const nextItems = { ...current.items }
      toDelete.forEach((id) => delete nextItems[id])

      if (target.parentId) {
        const parent = nextItems[target.parentId] as WorkspaceFolder
        if (parent?.kind === 'folder') {
          nextItems[target.parentId] = {
            ...parent,
            childrenIds: parent.childrenIds.filter((id) => id !== itemId),
            updatedAt: now(),
          }
        }
      }

      const nextTabs = current.openTabs.filter((id) => !toDelete.has(id))
      const activeStillValid = current.activeTabId && !toDelete.has(current.activeTabId)

      return {
        ...current,
        items: nextItems,
        openTabs: nextTabs,
        activeTabId: activeStillValid ? current.activeTabId : nextTabs[0],
        selectedId: current.rootId,
        recentPageIds: current.recentPageIds.filter((id) => !toDelete.has(id)),
        activity: [{ id: uid(), at: now(), message: `Deleted ${target.name}` }, ...current.activity].slice(0, 100),
      }
    })
  }

  const duplicateItem = (itemId: string) => {
    updateWorkspace((current) => {
      const source = current.items[itemId]
      if (!source || !source.parentId) {
        return current
      }
      const parent = current.items[source.parentId]
      if (!parent || parent.kind !== 'folder') {
        return current
      }

      const nextItems = { ...current.items }

      const cloneRecursive = (sourceId: string, parentId: string): string => {
        const src = current.items[sourceId]
        const newId = uid()
        if (src.kind === 'folder') {
          nextItems[newId] = {
            ...src,
            id: newId,
            name: `${src.name} Copy`,
            parentId,
            childrenIds: [],
            favorite: false,
            pinned: false,
            createdAt: now(),
            updatedAt: now(),
          }
          const childIds = src.childrenIds.map((childId) => cloneRecursive(childId, newId))
          ;(nextItems[newId] as WorkspaceFolder).childrenIds = childIds
        } else {
          nextItems[newId] = {
            ...src,
            id: newId,
            name: `${src.name} Copy`,
            parentId,
            tasks: src.tasks.map((t) => ({ ...t, id: uid() })),
            versions: [],
            favorite: false,
            pinned: false,
            createdAt: now(),
            updatedAt: now(),
          }
        }
        return newId
      }

      const clonedRootId = cloneRecursive(itemId, parent.id)

      nextItems[parent.id] = {
        ...parent,
        childrenIds: [...parent.childrenIds, clonedRootId],
        updatedAt: now(),
      }

      return {
        ...current,
        items: nextItems,
        selectedId: clonedRootId,
        activity: [{ id: uid(), at: now(), message: `Duplicated ${source.name}` }, ...current.activity].slice(0, 100),
      }
    })
  }

  const setFavorite = (itemId: string, next: boolean) => {
    updateItem(itemId, (item) => ({ ...item, favorite: next, updatedAt: now() }))
  }

  const setPinned = (itemId: string, next: boolean) => {
    updateItem(itemId, (item) => ({ ...item, pinned: next, updatedAt: now() }))
  }

  const setColor = (itemId: string, color: string) => {
    updateItem(itemId, (item) => ({ ...item, color, updatedAt: now() }))
  }

  const setIcon = (itemId: string, icon: string) => {
    updateItem(itemId, (item) => ({ ...item, icon, updatedAt: now() }))
  }

  const toggleCollapse = (folderId: string) => {
    updateItem(folderId, (item) => {
      if (item.kind !== 'folder') {
        return item
      }
      return { ...item, collapsed: !item.collapsed, updatedAt: now() }
    })
  }

  const moveItem = (itemId: string, destinationFolderId: string) => {
    updateWorkspace((current) => {
      if (!canMoveInto(current.items, itemId, destinationFolderId)) {
        return current
      }
      const moving = current.items[itemId]
      const destination = current.items[destinationFolderId]
      if (!moving || !destination || destination.kind !== 'folder') {
        return current
      }

      const nextItems = { ...current.items }

      if (moving.parentId) {
        const oldParent = nextItems[moving.parentId] as WorkspaceFolder
        if (oldParent?.kind === 'folder') {
          nextItems[moving.parentId] = {
            ...oldParent,
            childrenIds: oldParent.childrenIds.filter((id) => id !== moving.id),
          }
        }
      }

      nextItems[destinationFolderId] = {
        ...destination,
        childrenIds: [...destination.childrenIds, moving.id],
        collapsed: false,
        updatedAt: now(),
      }

      nextItems[itemId] = {
        ...moving,
        parentId: destinationFolderId,
        updatedAt: now(),
      }

      return {
        ...current,
        items: nextItems,
        activity: [{ id: uid(), at: now(), message: `Moved ${moving.name} to ${destination.name}` }, ...current.activity].slice(0, 100),
      }
    })
  }

  const setClipboard = (sourceId: string, cut: boolean) => {
    updateWorkspace((current) => ({ ...current, clipboard: { sourceId, cut } }))
  }

  const pasteInto = (destinationFolderId: string) => {
    updateWorkspace((current) => {
      if (!current.clipboard) {
        return current
      }
      const { sourceId, cut } = current.clipboard
      if (!current.items[sourceId]) {
        return { ...current, clipboard: undefined }
      }
      if (!canMoveInto(current.items, sourceId, destinationFolderId)) {
        return current
      }

      if (cut) {
        const source = current.items[sourceId]
        if (!source) {
          return current
        }

        const nextItems = { ...current.items }
        if (source.parentId) {
          const oldParent = nextItems[source.parentId] as WorkspaceFolder
          if (oldParent?.kind === 'folder') {
            nextItems[source.parentId] = {
              ...oldParent,
              childrenIds: oldParent.childrenIds.filter((id) => id !== sourceId),
            }
          }
        }

        const destination = nextItems[destinationFolderId] as WorkspaceFolder
        nextItems[destinationFolderId] = {
          ...destination,
          childrenIds: [...destination.childrenIds, sourceId],
          collapsed: false,
        }
        nextItems[sourceId] = { ...source, parentId: destinationFolderId }

        return {
          ...current,
          items: nextItems,
          clipboard: undefined,
        }
      }

      const nextItems = { ...current.items }

      const cloneRecursive = (sourceItemId: string, parentId: string): string => {
        const src = current.items[sourceItemId]
        const newId = uid()

        if (src.kind === 'folder') {
          const newFolder: WorkspaceFolder = {
            ...src,
            id: newId,
            name: `${src.name} Copy`,
            parentId,
            childrenIds: [],
            favorite: false,
            pinned: false,
            createdAt: now(),
            updatedAt: now(),
          }
          nextItems[newId] = newFolder
          newFolder.childrenIds = src.childrenIds.map((child) => cloneRecursive(child, newId))
        } else {
          nextItems[newId] = {
            ...src,
            id: newId,
            name: `${src.name} Copy`,
            parentId,
            tasks: src.tasks.map((t) => ({ ...t, id: uid() })),
            versions: [],
            favorite: false,
            pinned: false,
            createdAt: now(),
            updatedAt: now(),
          }
        }

        return newId
      }

      const clonedId = cloneRecursive(sourceId, destinationFolderId)
      const destination = nextItems[destinationFolderId] as WorkspaceFolder

      nextItems[destinationFolderId] = {
        ...destination,
        childrenIds: [...destination.childrenIds, clonedId],
        collapsed: false,
      }

      return {
        ...current,
        items: nextItems,
        selectedId: clonedId,
      }
    })
  }

  const closeTab = (pageId: string) => {
    updateWorkspace((current) => {
      const nextTabs = current.openTabs.filter((id) => id !== pageId)
      return {
        ...current,
        openTabs: nextTabs,
        activeTabId: current.activeTabId === pageId ? nextTabs[nextTabs.length - 1] : current.activeTabId,
      }
    })
  }

  const updateActivePage = (updater: (page: WorkspacePage) => WorkspacePage) => {
    if (!workspace.activeTabId) {
      return
    }
    updateItem(workspace.activeTabId, (item) => {
      if (item.kind !== 'page') {
        return item
      }
      return updater(item)
    })
  }

  const addTag = () => {
    const next = tagDraft.trim()
    if (!next) {
      return
    }
    updateActivePage((page) => {
      if (page.tags.includes(next)) {
        return page
      }
      return { ...page, tags: [...page.tags, next], updatedAt: now() }
    })
    setTagDraft('')
  }

  const addTask = () => {
    const next = taskDraft.trim()
    if (!next) {
      return
    }
    updateActivePage((page) => ({
      ...page,
      tasks: [...page.tasks, { id: uid(), text: next, done: false }],
      updatedAt: now(),
    }))
    setTaskDraft('')
  }

  const addLink = () => {
    const next = linkDraft.trim()
    if (!next) {
      return
    }

    const target = Object.values(workspace.items).find(
      (item) => item.kind === 'page' && item.name.toLowerCase() === next.toLowerCase(),
    )

    if (!target || target.kind !== 'page') {
      window.alert('No page found with that exact name.')
      return
    }

    updateActivePage((page) => ({
      ...page,
      links: page.links.includes(target.id) ? page.links : [...page.links, target.id],
      updatedAt: now(),
    }))

    setLinkDraft('')
  }

  const snapshotVersion = () => {
    updateActivePage((page) => {
      const version: PageVersion = {
        id: uid(),
        savedAt: now(),
        content: page.content,
        title: page.name,
        tags: [...page.tags],
      }
      return {
        ...page,
        versions: [version, ...page.versions].slice(0, 80),
      }
    })
  }

  const restoreVersion = (versionId: string) => {
    updateActivePage((page) => {
      const version = page.versions.find((v) => v.id === versionId)
      if (!version) {
        return page
      }
      return {
        ...page,
        content: version.content,
        tags: [...version.tags],
        updatedAt: now(),
      }
    })
  }

  const addTimelineEvent = () => {
    const title = window.prompt('Event title')
    if (!title) {
      return
    }
    const date = window.prompt('Date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10))
    if (!date) {
      return
    }

    updateWorkspace((current) => {
      const event: TimelineEvent = {
        id: uid(),
        title,
        date,
        arc: current.currentArc,
        linkedPageIds: current.activeTabId ? [current.activeTabId] : [],
      }
      return { ...current, timeline: [...current.timeline, event] }
    })
  }

  const timelineItems = workspace.timeline.filter((event) => {
    if (!timelineFilter.trim()) {
      return true
    }
    const haystack = [event.title, event.character, event.arc, event.country].join(' ').toLowerCase()
    return haystack.includes(timelineFilter.toLowerCase())
  })

  const renderTree = (folderId: string, depth = 0) => {
    const folder = workspace.items[folderId]
    if (!folder || folder.kind !== 'folder') {
      return <></>
    }

    const children = folder.childrenIds
      .map((id) => workspace.items[id])
      .filter((item): item is WorkspaceItem => Boolean(item))

    return (
      <div className="tree-group">
        {children.map((item) => {
          const selectedClass = workspace.selectedId === item.id ? 'selected' : ''
          const hit = filteredIds.includes(item.id) ? 'hit' : ''

          return (
            <div key={item.id}>
              <button
                className={`tree-row ${selectedClass} ${hit}`.trim()}
                style={{ paddingLeft: `${12 + depth * 16}px`, borderLeftColor: item.color ?? 'transparent' }}
                onClick={() => selectItem(item.id)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setContextMenu({ x: event.clientX, y: event.clientY, targetId: item.id })
                }}
                draggable={item.id !== workspace.rootId}
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(event) => {
                  if (item.kind === 'folder') {
                    event.preventDefault()
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (draggedId && item.kind === 'folder') {
                    moveItem(draggedId, item.id)
                  }
                  setDraggedId(null)
                }}
              >
                {item.kind === 'folder' && (
                  <span
                    className="tree-caret"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleCollapse(item.id)
                    }}
                  >
                    {item.collapsed ? '▸' : '▾'}
                  </span>
                )}
                {item.kind === 'page' && <span className="tree-caret">•</span>}
                <span className="tree-icon">{getItemIcon(item)}</span>
                <span className="tree-label">{item.name}</span>
                {item.favorite && <span className="marker">★</span>}
                {item.pinned && <span className="marker">📌</span>}
              </button>

              {item.kind === 'folder' && !item.collapsed && renderTree(item.id, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  const favorites = Object.values(workspace.items).filter((item) => item.favorite)
  const pinnedPages = Object.values(workspace.items).filter((item) => item.kind === 'page' && item.pinned)
  const recentPages = workspace.recentPageIds
    .map((id) => workspace.items[id])
    .filter((item): item is WorkspacePage => Boolean(item) && item.kind === 'page')

  const pageTaskProgress =
    activePage && activePage.kind === 'page' && activePage.tasks.length > 0
      ? Math.round((activePage.tasks.filter((task) => task.done).length / activePage.tasks.length) * 100)
      : 0

  return (
    <div className="app-shell">
      <header className="top-toolbar">
        <div className="top-chrome">
          <div className="brand-block">
            <p className="brand-kanji">地獄界制作局</p>
            <h1 className="brand-main">HELLBOUND BIBLE</h1>
            <p className="brand-sub">Anime Production Operating System</p>
          </div>

          <div className="toolbar-actions">
            <div className="view-switch">
              <button className={viewMode === 'dashboard' ? 'is-active' : ''} onClick={() => setViewMode('dashboard')}>
                Dashboard
              </button>
              <button className={viewMode === 'editor' ? 'is-active' : ''} onClick={() => setViewMode('editor')}>
                Editor
              </button>
              <button className={viewMode === 'timeline' ? 'is-active' : ''} onClick={() => setViewMode('timeline')}>
                Timeline
              </button>
            </div>

            <div className="quick-create">
              <button onClick={createFolder}>+ Folder</button>
              <button onClick={() => createPage()}>+ Page</button>
            </div>
          </div>

          <div className="top-search-wrap">
            <input
              placeholder="Search everything..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="global-search"
            />
            <div className="quick-stats">
              <span>Pages {stats.pages}</span>
              <span>Folders {stats.folders}</span>
              <span>Words {stats.words}</span>
            </div>
          </div>
        </div>

        <div className="template-menu">
          <span>Forge from template:</span>
          {workspace.templates.map((tpl) => (
            <button key={tpl.id} onClick={() => createPage(tpl.id)}>
              {tpl.name}
            </button>
          ))}
        </div>
      </header>

      <div className="main-grid">
        <aside className="left-explorer">
          <div className="panel-title">Explorer</div>
          <div className="tree-root">{renderTree(workspace.rootId)}</div>
        </aside>

        <main className="center-workspace">
          <div className="tabs">
            {workspace.openTabs.map((tabId) => {
              const tab = workspace.items[tabId]
              if (!tab || tab.kind !== 'page') {
                return null
              }
              return (
                <button
                  key={tab.id}
                  className={`tab ${workspace.activeTabId === tab.id ? 'active' : ''}`}
                  onClick={() => openPage(tab.id)}
                >
                  {tab.name}
                  <span
                    className="close"
                    onClick={(event) => {
                      event.stopPropagation()
                      closeTab(tab.id)
                    }}
                  >
                    ×
                  </span>
                </button>
              )
            })}
          </div>

          {viewMode === 'dashboard' && (
            <section className="dashboard">
              <h2>Production Dashboard</h2>
              <div className="cards">
                <article>
                  <h3>Recent Pages</h3>
                  {recentPages.map((page) => (
                    <button key={page.id} className="list-btn" onClick={() => openPage(page.id)}>
                      {page.name}
                    </button>
                  ))}
                </article>
                <article>
                  <h3>Pinned Pages</h3>
                  {pinnedPages.map((page) => (
                    <button key={page.id} className="list-btn" onClick={() => openPage(page.id)}>
                      {page.name}
                    </button>
                  ))}
                </article>
                <article>
                  <h3>Favorites</h3>
                  {favorites.map((item) => (
                    <button key={item.id} className="list-btn" onClick={() => selectItem(item.id)}>
                      {item.name}
                    </button>
                  ))}
                </article>
                <article>
                  <h3>Current Arc / Episode</h3>
                  <p>{workspace.currentArc ?? 'No arc selected'}</p>
                  <p>{workspace.currentEpisode ?? 'No episode selected'}</p>
                </article>
                <article>
                  <h3>Recent Activity</h3>
                  {workspace.activity.slice(0, 8).map((entry) => (
                    <p key={entry.id}>{entry.message}</p>
                  ))}
                </article>
                <article>
                  <h3>Statistics</h3>
                  <p>Character Count: {stats.characters}</p>
                  <p>Episode Count: {stats.episodes}</p>
                  <p>Word Count: {stats.words}</p>
                  <p>Folder Count: {stats.folders}</p>
                  <p>Page Count: {stats.pages}</p>
                </article>
              </div>
            </section>
          )}

          {viewMode === 'timeline' && (
            <section className="timeline-view">
              <div className="timeline-head">
                <h2>Interactive Timeline</h2>
                <div>
                  <input
                    value={timelineFilter}
                    onChange={(event) => setTimelineFilter(event.target.value)}
                    placeholder="Filter by character, arc, country"
                  />
                  <button onClick={addTimelineEvent}>+ Event</button>
                </div>
              </div>
              <div className="timeline-lane">
                {timelineItems
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((event) => (
                    <div key={event.id} className="timeline-event">
                      <strong>{event.date}</strong>
                      <h4>{event.title}</h4>
                      <p>{event.arc ?? 'Unassigned arc'}</p>
                      <div className="timeline-links">
                        {event.linkedPageIds.map((pageId) => {
                          const page = workspace.items[pageId]
                          if (!page || page.kind !== 'page') {
                            return null
                          }
                          return (
                            <button key={page.id} className="chip" onClick={() => openPage(page.id)}>
                              {page.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {viewMode === 'editor' && activePage?.kind === 'page' && (
            <section className="editor-view">
              <div className="editor-head">
                <input
                  className="page-title"
                  value={activePage.name}
                  onChange={(event) => updateActivePage((page) => ({ ...page, name: event.target.value, updatedAt: now() }))}
                />
                <button onClick={snapshotVersion}>Snapshot Version</button>
              </div>

              <div
                className="rich-editor"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: activePage.content }}
                onInput={(event) => {
                  const html = (event.currentTarget as HTMLDivElement).innerHTML
                  updateActivePage((page) => ({ ...page, content: html, updatedAt: now() }))
                }}
              />

              <div className="editor-extras">
                <section>
                  <h3>Tags</h3>
                  <div className="inline-row">
                    <input
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      placeholder="Add tag"
                    />
                    <button onClick={addTag}>Add</button>
                  </div>
                  <div className="chips">
                    {activePage.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3>Tasks</h3>
                  <div className="inline-row">
                    <input
                      value={taskDraft}
                      onChange={(event) => setTaskDraft(event.target.value)}
                      placeholder="New task"
                    />
                    <button onClick={addTask}>Add</button>
                  </div>
                  <div className="progress">Progress: {pageTaskProgress}%</div>
                  {activePage.tasks.map((task: PageTask) => (
                    <label key={task.id} className="task-row">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => {
                          updateActivePage((page) => ({
                            ...page,
                            tasks: page.tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
                            updatedAt: now(),
                          }))
                        }}
                      />
                      <input
                        value={task.text}
                        onChange={(event) => {
                          const nextText = event.target.value
                          updateActivePage((page) => ({
                            ...page,
                            tasks: page.tasks.map((t) => (t.id === task.id ? { ...t, text: nextText } : t)),
                          }))
                        }}
                      />
                      <input
                        type="date"
                        value={task.dueDate ?? ''}
                        onChange={(event) => {
                          const dueDate = event.target.value
                          updateActivePage((page) => ({
                            ...page,
                            tasks: page.tasks.map((t) => (t.id === task.id ? { ...t, dueDate } : t)),
                          }))
                        }}
                      />
                    </label>
                  ))}
                </section>

                <section>
                  <h3>Links To Other Pages</h3>
                  <div className="inline-row">
                    <input
                      value={linkDraft}
                      onChange={(event) => setLinkDraft(event.target.value)}
                      placeholder="Exact page name"
                    />
                    <button onClick={addLink}>Link</button>
                  </div>
                  <div className="chips">
                    {activePage.links.map((linkedId) => {
                      const linked = workspace.items[linkedId]
                      if (!linked || linked.kind !== 'page') {
                        return null
                      }
                      return (
                        <button key={linked.id} className="chip" onClick={() => openPage(linked.id)}>
                          {linked.name}
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <h3>Version History</h3>
                  {activePage.versions.length === 0 && <p>No snapshots yet.</p>}
                  {activePage.versions.map((version) => (
                    <button key={version.id} className="list-btn" onClick={() => restoreVersion(version.id)}>
                      {new Date(version.savedAt).toLocaleString()}
                    </button>
                  ))}
                </section>
              </div>
            </section>
          )}

          {viewMode === 'editor' && (!activePage || activePage.kind !== 'page') && (
            <section className="placeholder">Open a page tab to start editing.</section>
          )}
        </main>

        <aside className="right-panel">
          <div className="panel-title">Properties</div>
          {selected ? (
            <div className="properties-block">
              <p>Name: {selected.name}</p>
              <p>Type: {selected.kind}</p>
              <p>Updated: {new Date(selected.updatedAt).toLocaleString()}</p>
              <div className="inline-wrap">
                <button onClick={() => renameItem(selected.id)}>Rename</button>
                <button onClick={() => deleteItem(selected.id)}>Delete</button>
                <button onClick={() => duplicateItem(selected.id)}>Duplicate</button>
                <button onClick={() => setFavorite(selected.id, !selected.favorite)}>
                  {selected.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button onClick={() => setPinned(selected.id, !selected.pinned)}>
                  {selected.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => setClipboard(selected.id, false)}>Copy</button>
                <button onClick={() => setClipboard(selected.id, true)}>Cut</button>
                <button onClick={() => pasteInto(selectedFolder.id)}>Paste</button>
              </div>

              <div className="property-line">
                <span>Icon:</span>
                <div className="chips">
                  {iconChoices.map((icon) => (
                    <button key={icon} className="chip" onClick={() => setIcon(selected.id, icon)}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="property-line">
                <span>Color:</span>
                <div className="chips">
                  {colorChoices.map((color) => (
                    <button
                      key={color}
                      className="color-chip"
                      style={{ background: color }}
                      onClick={() => setColor(selected.id, color)}
                    />
                  ))}
                </div>
              </div>

              {selected.kind === 'folder' && (
                <button onClick={() => toggleCollapse(selected.id)}>
                  {selected.collapsed ? 'Expand' : 'Collapse'}
                </button>
              )}
            </div>
          ) : (
            <p className="muted">Select an item to inspect details.</p>
          )}
        </aside>
      </div>

      <footer className="status-bar">
        <span>Selected: {selected?.name ?? 'none'}</span>
        <span>Open Tabs: {workspace.openTabs.length}</span>
        <span>Autosave: active</span>
        <span>Pages: {stats.pages}</span>
        <span>Folders: {stats.folders}</span>
      </footer>

      {contextMenu && contextTarget && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => renameItem(contextMenu.targetId)}>Rename</button>
          <button onClick={() => deleteItem(contextMenu.targetId)}>Delete</button>
          <button onClick={() => duplicateItem(contextMenu.targetId)}>Duplicate</button>
          <button onClick={() => setClipboard(contextMenu.targetId, false)}>Copy</button>
          <button onClick={() => setClipboard(contextMenu.targetId, true)}>Cut</button>
          <button onClick={() => pasteInto(selectedFolder.id)}>Paste Into Selected Folder</button>
          <button onClick={() => setFavorite(contextMenu.targetId, !contextTarget.favorite)}>
            {contextTarget.favorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button onClick={() => setPinned(contextMenu.targetId, !contextTarget.pinned)}>
            {contextTarget.pinned ? 'Unpin' : 'Pin'}
          </button>
          {contextTarget.kind === 'folder' && (
            <button onClick={() => toggleCollapse(contextMenu.targetId)}>
              {(contextTarget as WorkspaceFolder).collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default App
