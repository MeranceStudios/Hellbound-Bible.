import React, { useState, useCallback, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  Pin,
  FolderPlus,
  FilePlus,
  Folder,
  FileText,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { ExplorerItem } from './ExplorerItem'
import { NewItemDialog } from './NewItemDialog'
import { api } from '../../utils/api'
import type { FileItem } from '../../types'

export function FileExplorer(): React.ReactElement {
  const { items, expandedIds, selectedId, setSearchQuery, setCurrentView } = useAppStore()
  const [filter, setFilter] = useState('')
  const [showNewItemDialog, setShowNewItemDialog] = useState<{
    parentId: string | null
    type: 'folder' | 'page'
  } | null>(null)
  const [showSection, setShowSection] = useState<Record<string, boolean>>({
    pinned: true,
    favorites: true,
    files: true,
  })

  // Root items (no parent)
  const rootItems = useMemo(
    () => items.filter((i) => i.parent_id === null).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [items]
  )

  const pinnedItems = useMemo(() => items.filter((i) => i.is_pinned), [items])
  const favoritedItems = useMemo(() => items.filter((i) => i.is_favorited), [items])

  const filteredRoots = useMemo(() => {
    if (!filter.trim()) return rootItems
    const q = filter.toLowerCase()
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, rootItems, filter])

  const handleGlobalSearch = (): void => {
    setSearchQuery(filter)
    setCurrentView('search')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Explorer header */}
      <div
        style={{
          padding: '8px 8px 4px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {/* Search filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-surface2)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '5px 8px',
            marginBottom: 4,
          }}
        >
          <Search size={12} style={{ color: 'var(--color-text-subtle)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Filter or search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGlobalSearch()
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              color: 'var(--color-text)',
              userSelect: 'text',
            }}
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={<FolderPlus size={14} />}
            label="New Folder"
            onClick={() => setShowNewItemDialog({ parentId: null, type: 'folder' })}
          />
          <ActionBtn
            icon={<FilePlus size={14} />}
            label="New Page"
            onClick={() => setShowNewItemDialog({ parentId: null, type: 'page' })}
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '4px 0' }}>
        {/* Pinned section */}
        {pinnedItems.length > 0 && (
          <ExplorerSection
            title="PINNED"
            icon={<Pin size={10} />}
            isOpen={showSection.pinned}
            onToggle={() => setShowSection((s) => ({ ...s, pinned: !s.pinned }))}
          >
            {pinnedItems.map((item) => (
              <ExplorerItem
                key={item.id}
                item={item}
                depth={0}
                onNewItem={(parentId, type) => setShowNewItemDialog({ parentId, type })}
              />
            ))}
          </ExplorerSection>
        )}

        {/* Favorites section */}
        {favoritedItems.length > 0 && (
          <ExplorerSection
            title="FAVORITES"
            icon={<Star size={10} />}
            isOpen={showSection.favorites}
            onToggle={() => setShowSection((s) => ({ ...s, favorites: !s.favorites }))}
          >
            {favoritedItems.map((item) => (
              <ExplorerItem
                key={item.id}
                item={item}
                depth={0}
                onNewItem={(parentId, type) => setShowNewItemDialog({ parentId, type })}
              />
            ))}
          </ExplorerSection>
        )}

        {/* Files section */}
        <ExplorerSection
          title="FILES"
          icon={<Folder size={10} />}
          isOpen={showSection.files}
          onToggle={() => setShowSection((s) => ({ ...s, files: !s.files }))}
        >
          {(filter.trim() ? filteredRoots : rootItems).map((item) => (
            <ExplorerItem
              key={item.id}
              item={item}
              depth={0}
              onNewItem={(parentId, type) => setShowNewItemDialog({ parentId, type })}
              showAll={!!filter.trim()}
            />
          ))}
          {rootItems.length === 0 && !filter && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--color-text-subtle)',
                fontSize: 12,
              }}
            >
              <FileText size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div>No files yet</div>
              <div style={{ marginTop: 4 }}>Create a folder or page to get started</div>
            </div>
          )}
        </ExplorerSection>
      </div>

      {/* New item dialog */}
      {showNewItemDialog && (
        <NewItemDialog
          parentId={showNewItemDialog.parentId}
          defaultType={showNewItemDialog.type}
          onClose={() => setShowNewItemDialog(null)}
        />
      )}
    </div>
  )
}

function ExplorerSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 w-full"
        style={{
          padding: '4px 8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-subtle)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-subtle)')}
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {icon}
        <span style={{ marginLeft: 2 }}>{title}</span>
      </button>
      {isOpen && children}
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 4,
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-surface3)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      {icon}
    </button>
  )
}
