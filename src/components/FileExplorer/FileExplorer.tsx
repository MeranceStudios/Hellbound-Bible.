import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import {
  Search, Star, Pin, FolderPlus, FilePlus, ChevronRight, ChevronDown
} from 'lucide-react'
import FileTreeItem from './FileTreeItem'

const FileExplorer: React.FC = () => {
  const items = useAppStore(s => s.items)
  const createItem = useAppStore(s => s.createItem)
  const setTemplateModalOpen = useAppStore(s => s.setTemplateModalOpen)
  const setNewItemParentId = useAppStore(s => s.setNewItemParentId)
  const setSearchOpen = useAppStore(s => s.setSearchOpen)
  const getFavorites = useAppStore(s => s.getFavorites)
  const getPinned = useAppStore(s => s.getPinned)

  const [filterText, setFilterText] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showPinned, setShowPinned] = useState(false)

  const favorites = getFavorites()
  const pinned = getPinned()

  const handleNewFolder = (e: React.MouseEvent) => {
    e.stopPropagation()
    createItem('root', 'New Folder', 'folder')
  }

  const handleNewPage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNewItemParentId('root')
    setTemplateModalOpen(true)
  }

  const rootChildren = items['root']?.children || []

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        gap: 4,
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          flex: 1,
        }}>
          Explorer
        </span>
        <button
          className="btn-ghost"
          onClick={() => setSearchOpen(true)}
          style={{ padding: 4, borderRadius: 4, color: 'var(--text-muted)' }}
          data-tooltip="Search"
        >
          <Search size={13} />
        </button>
        <button
          className="btn-ghost"
          onClick={handleNewFolder}
          style={{ padding: 4, borderRadius: 4, color: 'var(--text-muted)' }}
          data-tooltip="New Folder"
        >
          <FolderPlus size={13} />
        </button>
        <button
          className="btn-ghost"
          onClick={handleNewPage}
          style={{ padding: 4, borderRadius: 4, color: 'var(--text-muted)' }}
          data-tooltip="New Page"
        >
          <FilePlus size={13} />
        </button>
      </div>

      {/* Filter */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)' }}>
        <input
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter..."
          style={{
            width: '100%',
            padding: '4px 8px',
            fontSize: 12,
            background: 'var(--bg-tertiary)',
            borderRadius: 4,
            border: '1px solid var(--border-color)',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Pinned */}
        {pinned.length > 0 && (
          <div>
            <button
              onClick={() => setShowPinned(p => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                padding: '5px 10px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showPinned ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <Pin size={10} />
              Pinned ({pinned.length})
            </button>
            {showPinned && pinned.map(item => (
              <FileTreeItem
                key={item.id}
                itemId={item.id}
                depth={0}
                filterText={filterText}
                overrideIndent
              />
            ))}
          </div>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <button
              onClick={() => setShowFavorites(f => !f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                padding: '5px 10px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showFavorites ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <Star size={10} />
              Favorites ({favorites.length})
            </button>
            {showFavorites && favorites.map(item => (
              <FileTreeItem
                key={item.id}
                itemId={item.id}
                depth={0}
                filterText={filterText}
                overrideIndent
              />
            ))}
          </div>
        )}

        {/* Divider if we have pinned/favorites */}
        {(pinned.length > 0 || favorites.length > 0) && (
          <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
        )}

        {/* Root level items */}
        {items['root'] && (
          <FileTreeItem
            itemId="root"
            depth={0}
            filterText={filterText}
          />
        )}
      </div>
    </div>
  )
}

export default FileExplorer
