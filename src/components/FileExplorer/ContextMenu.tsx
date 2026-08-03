import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import {
  Pencil, Trash2, Copy, Scissors, Pin, Star,
  FolderPlus, FilePlus, ChevronRight, Palette, Move,
  FileText, Folder
} from 'lucide-react'

const COLORS = [
  '#dc143c', '#e0a030', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#a3a3a3', '#ffffff'
]

const ContextMenuComponent: React.FC = () => {
  const contextMenu = useAppStore(s => s.contextMenu)
  const items = useAppStore(s => s.items)
  const setContextMenu = useAppStore(s => s.setContextMenu)
  const renameItem = useAppStore(s => s.renameItem)
  const deleteItem = useAppStore(s => s.deleteItem)
  const duplicateItem = useAppStore(s => s.duplicateItem)
  const toggleFavorite = useAppStore(s => s.toggleFavorite)
  const togglePin = useAppStore(s => s.togglePin)
  const setItemColor = useAppStore(s => s.setItemColor)
  const createItem = useAppStore(s => s.createItem)
  const setTemplateModalOpen = useAppStore(s => s.setTemplateModalOpen)
  const setNewItemParentId = useAppStore(s => s.setNewItemParentId)
  const openTab = useAppStore(s => s.openTab)

  const [showColorPicker, setShowColorPicker] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && contextMenu) {
      const rect = ref.current.getBoundingClientRect()
      const viewportH = window.innerHeight
      const viewportW = window.innerWidth
      if (rect.bottom > viewportH) {
        ref.current.style.top = `${contextMenu.y - rect.height}px`
      }
      if (rect.right > viewportW) {
        ref.current.style.left = `${contextMenu.x - rect.width}px`
      }
    }
  }, [contextMenu])

  if (!contextMenu) return null

  const item = items[contextMenu.itemId]
  if (!item) return null

  const close = () => {
    setContextMenu(null)
    setShowColorPicker(false)
  }

  const isRoot = contextMenu.itemId === 'root'

  const menuItems = [
    // Open (pages only)
    ...(item.type === 'page' ? [{
      label: 'Open',
      icon: <FileText size={13} />,
      action: () => { openTab(contextMenu.itemId); close() }
    }] : []),

    // New items (folders only)
    ...(item.type === 'folder' ? [
      {
        label: 'New Page',
        icon: <FilePlus size={13} />,
        action: () => {
          setNewItemParentId(contextMenu.itemId)
          setTemplateModalOpen(true)
          close()
        }
      },
      {
        label: 'New Folder',
        icon: <FolderPlus size={13} />,
        action: () => {
          createItem(contextMenu.itemId, 'New Folder', 'folder')
          close()
        }
      },
    ] : []),

    { divider: true },

    // Rename
    ...(!isRoot ? [{
      label: 'Rename',
      icon: <Pencil size={13} />,
      action: () => {
        const newName = window.prompt('Rename:', item.name)
        if (newName && newName.trim()) {
          renameItem(contextMenu.itemId, newName.trim())
        }
        close()
      }
    }] : []),

    // Duplicate
    ...(!isRoot ? [{
      label: 'Duplicate',
      icon: <Copy size={13} />,
      action: () => { duplicateItem(contextMenu.itemId); close() }
    }] : []),

    { divider: true },

    // Favorite
    {
      label: item.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: <Star size={13} color={item.isFavorite ? '#f59e0b' : undefined} />,
      action: () => { toggleFavorite(contextMenu.itemId); close() }
    },

    // Pin
    {
      label: item.isPinned ? 'Unpin' : 'Pin',
      icon: <Pin size={13} color={item.isPinned ? 'var(--accent)' : undefined} />,
      action: () => { togglePin(contextMenu.itemId); close() }
    },

    { divider: true },

    // Color
    {
      label: 'Change Color',
      icon: <Palette size={13} />,
      action: () => setShowColorPicker(s => !s),
      hasSubmenu: true
    },

    { divider: true },

    // Delete
    ...(!isRoot ? [{
      label: 'Delete',
      icon: <Trash2 size={13} />,
      action: () => {
        if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
          deleteItem(contextMenu.itemId)
        }
        close()
      },
      danger: true
    }] : []),
  ]

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 9999,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Item info header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px 4px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: 4,
      }}>
        {item.type === 'folder'
          ? <Folder size={13} color={item.color || '#e0a030'} />
          : <FileText size={13} color="var(--text-muted)" />
        }
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-primary)',
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.name}
        </span>
      </div>

      {menuItems.map((menuItem, i) => {
        if ('divider' in menuItem && menuItem.divider) {
          return <div key={i} className="context-menu-divider" />
        }
        const mi = menuItem as {
          label: string
          icon: React.ReactNode
          action: () => void
          danger?: boolean
          hasSubmenu?: boolean
        }
        return (
          <div key={i}>
            <button
              className={`context-menu-item ${mi.danger ? 'danger' : ''}`}
              onClick={mi.action}
              style={{ width: '100%' }}
            >
              {mi.icon}
              <span style={{ flex: 1 }}>{mi.label}</span>
              {mi.hasSubmenu && <ChevronRight size={11} />}
            </button>

            {/* Inline color picker */}
            {mi.label === 'Change Color' && showColorPicker && (
              <div style={{ padding: '6px 10px' }}>
                <div className="color-options">
                  {COLORS.map(color => (
                    <div
                      key={color}
                      className={`color-swatch ${item.color === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setItemColor(contextMenu.itemId, color)
                        close()
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ContextMenuComponent
