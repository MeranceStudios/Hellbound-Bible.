import React, { useState, useRef, useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Star,
  Pin,
  MoreHorizontal,
} from 'lucide-react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'
import type { FileItem } from '../../types'

interface ExplorerItemProps {
  item: FileItem
  depth: number
  onNewItem: (parentId: string, type: 'folder' | 'page') => void
  showAll?: boolean
}

const ITEM_HEIGHT = 28
const INDENT = 16

export function ExplorerItem({
  item,
  depth,
  onNewItem,
  showAll,
}: ExplorerItemProps): React.ReactElement {
  const {
    items,
    expandedIds,
    selectedId,
    setSelectedId,
    toggleExpanded,
    openTab,
    updateItem,
    removeItem,
    addItem,
    setExpanded,
  } = useAppStore()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(item.name)
  const renameRef = useRef<HTMLInputElement>(null)

  const isExpanded = expandedIds.has(item.id)
  const isSelected = selectedId === item.id
  const children = items
    .filter((i) => i.parent_id === item.id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

  // Drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'FILE_ITEM',
    item: () => ({ id: item.id, type: 'FILE_ITEM', item }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })

  // Drop target (for folders)
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'FILE_ITEM',
    canDrop: (dragged: { id: string }) => {
      // Can't drop on itself or its descendants
      if (dragged.id === item.id) return false
      if (item.type !== 'folder') return false
      // Check if target is descendant of dragged
      let current = item
      while (current.parent_id) {
        if (current.parent_id === dragged.id) return false
        const parent = items.find((i) => i.id === current.parent_id)
        if (!parent) break
        current = parent
      }
      return true
    },
    drop: async (dragged: { id: string }) => {
      const result = await api.items.move(dragged.id, item.id)
      if (result) {
        updateItem(dragged.id, { parent_id: item.id })
        setExpanded(item.id, true)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  const handleClick = useCallback((): void => {
    setSelectedId(item.id)
    if (item.type === 'folder') {
      toggleExpanded(item.id)
    } else {
      openTab(item)
      api.items.recordAccess(item.id).catch(console.error)
    }
  }, [item, setSelectedId, toggleExpanded, openTab])

  const handleRename = useCallback(async (): Promise<void> => {
    const newName = renameValue.trim()
    if (!newName || newName === item.name) {
      setIsRenaming(false)
      setRenameValue(item.name)
      return
    }
    const result = await api.items.update(item.id, { name: newName })
    if (result) {
      updateItem(item.id, { name: newName })
    }
    setIsRenaming(false)
  }, [renameValue, item, updateItem])

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    await api.items.delete(item.id)
    removeItem(item.id)
  }, [item, removeItem])

  const handleDuplicate = useCallback(async (): Promise<void> => {
    const result = await api.items.duplicate(item.id)
    if (result) {
      addItem(result as FileItem)
    }
  }, [item, addItem])

  const handleTogglePin = useCallback(async (): Promise<void> => {
    const result = await api.items.update(item.id, { is_pinned: !item.is_pinned })
    if (result) updateItem(item.id, { is_pinned: !item.is_pinned })
  }, [item, updateItem])

  const handleToggleFavorite = useCallback(async (): Promise<void> => {
    const result = await api.items.update(item.id, { is_favorited: !item.is_favorited })
    if (result) updateItem(item.id, { is_favorited: !item.is_favorited })
  }, [item, updateItem])

  const getItemIcon = (): React.ReactNode => {
    if (item.icon) {
      return <span style={{ fontSize: 13, lineHeight: 1 }}>{item.icon}</span>
    }
    if (item.type === 'folder') {
      return isExpanded ? (
        <FolderOpen size={14} style={{ color: item.color ?? 'var(--color-crimson)' }} />
      ) : (
        <Folder size={14} style={{ color: item.color ?? 'var(--color-crimson)' }} />
      )
    }
    return <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    paddingLeft: depth * INDENT + 8,
    paddingRight: 4,
    cursor: 'pointer',
    userSelect: 'none',
    borderRadius: 4,
    margin: '1px 4px',
    opacity: isDragging ? 0.4 : 1,
    background: isSelected
      ? 'rgba(220, 20, 60, 0.15)'
      : isOver && canDrop
      ? 'rgba(220, 20, 60, 0.08)'
      : 'transparent',
    border: isOver && canDrop ? '1px dashed rgba(220,20,60,0.4)' : '1px solid transparent',
  }

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div
            ref={(node) => {
              drag(node)
              drop(node)
            }}
            style={itemStyle}
            onClick={handleClick}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'var(--color-surface3)'
            }}
            onMouseLeave={(e) => {
              if (!isSelected)
                e.currentTarget.style.background =
                  isOver && canDrop ? 'rgba(220, 20, 60, 0.08)' : 'transparent'
            }}
          >
            {/* Expand/collapse chevron for folders */}
            {item.type === 'folder' ? (
              <span
                style={{ width: 14, flexShrink: 0 }}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpanded(item.id)
                }}
              >
                {children.length > 0 || true ? (
                  isExpanded ? (
                    <ChevronDown size={12} style={{ color: 'var(--color-text-subtle)' }} />
                  ) : (
                    <ChevronRight size={12} style={{ color: 'var(--color-text-subtle)' }} />
                  )
                ) : null}
              </span>
            ) : (
              <span style={{ width: 14, flexShrink: 0 }} />
            )}

            {/* Icon */}
            <span style={{ marginRight: 6, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {getItemIcon()}
            </span>

            {/* Name */}
            {isRenaming ? (
              <input
                ref={renameRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') {
                    setIsRenaming(false)
                    setRenameValue(item.name)
                  }
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  flex: 1,
                  background: 'var(--color-surface3)',
                  border: '1px solid var(--color-crimson)',
                  borderRadius: 3,
                  padding: '1px 4px',
                  color: 'var(--color-text)',
                  fontSize: 13,
                  outline: 'none',
                  userSelect: 'text',
                }}
              />
            ) : (
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? '#ffffff' : 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </span>
            )}

            {/* Badges */}
            <div className="flex items-center gap-1 ml-1">
              {item.is_pinned && (
                <Pin size={10} style={{ color: 'var(--color-crimson)', opacity: 0.8 }} />
              )}
              {item.is_favorited && (
                <Star size={10} style={{ color: '#ffa500', opacity: 0.8 }} />
              )}
            </div>
          </div>
        </ContextMenu.Trigger>

        {/* Context Menu */}
        <ContextMenu.Portal>
          <ContextMenu.Content
            style={{
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '4px',
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 9999,
              fontSize: 13,
            }}
          >
            <CtxItem
              label="Open"
              onClick={handleClick}
            />
            <ContextMenu.Separator style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
            {item.type === 'folder' && (
              <>
                <CtxItem label="New Folder Inside" onClick={() => onNewItem(item.id, 'folder')} />
                <CtxItem label="New Page Inside" onClick={() => onNewItem(item.id, 'page')} />
                <ContextMenu.Separator style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
              </>
            )}
            <CtxItem
              label="Rename"
              onClick={() => {
                setIsRenaming(true)
                setRenameValue(item.name)
                setTimeout(() => renameRef.current?.select(), 50)
              }}
              shortcut="F2"
            />
            <CtxItem label="Duplicate" onClick={handleDuplicate} />
            <ContextMenu.Separator style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
            <CtxItem
              label={item.is_pinned ? 'Unpin' : 'Pin to Sidebar'}
              onClick={handleTogglePin}
            />
            <CtxItem
              label={item.is_favorited ? 'Remove from Favorites' : 'Add to Favorites'}
              onClick={handleToggleFavorite}
            />
            <ContextMenu.Separator style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
            <CtxItem
              label="Delete"
              onClick={handleDelete}
              danger
            />
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>

      {/* Children */}
      {item.type === 'folder' && (isExpanded || showAll) && (
        <div>
          {children.map((child) => (
            <ExplorerItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onNewItem={onNewItem}
              showAll={showAll}
            />
          ))}
        </div>
      )}
    </>
  )
}

function CtxItem({
  label,
  onClick,
  shortcut,
  danger,
}: {
  label: string
  onClick: () => void
  shortcut?: string
  danger?: boolean
}): React.ReactElement {
  return (
    <ContextMenu.Item
      onSelect={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderRadius: 5,
        cursor: 'pointer',
        color: danger ? '#ff6b6b' : 'var(--color-text)',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'rgba(255,107,107,0.1)' : 'var(--color-surface3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginLeft: 16 }}>
          {shortcut}
        </span>
      )}
    </ContextMenu.Item>
  )
}
