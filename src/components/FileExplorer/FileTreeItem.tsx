import React, { useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  FileText, Star, Pin, GripVertical
} from 'lucide-react'

interface FileTreeItemProps {
  itemId: string
  depth: number
  filterText?: string
  overrideIndent?: boolean
}

const INDENT = 16
const FOLDER_COLORS: Record<string, string> = {
  '#dc143c': '#dc143c',
  default: 'var(--text-muted)',
}

function getIconColor(item: { color?: string; type: string }): string {
  if (item.color) return item.color
  if (item.type === 'folder') return '#e0a030'
  return 'var(--text-muted)'
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ itemId, depth, filterText = '', overrideIndent = false }) => {
  const item = useAppStore(s => s.items[itemId])
  const items = useAppStore(s => s.items)
  const openTab = useAppStore(s => s.openTab)
  const toggleExpand = useAppStore(s => s.toggleExpand)
  const setContextMenu = useAppStore(s => s.setContextMenu)
  const setSelectedItem = useAppStore(s => s.setSelectedItem)
  const selectedItemId = useAppStore(s => s.selectedItemId)
  const activeTabId = useAppStore(s => s.activeTabId)
  const openTabs = useAppStore(s => s.openTabs)
  const moveItem = useAppStore(s => s.moveItem)
  const dragState = useAppStore(s => s.dragState)
  const setDragState = useAppStore(s => s.setDragState)
  const createItem = useAppStore(s => s.createItem)
  const setTemplateModalOpen = useAppStore(s => s.setTemplateModalOpen)
  const setNewItemParentId = useAppStore(s => s.setNewItemParentId)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)
  const renameItem = useAppStore(s => s.renameItem)

  if (!item) return null

  const isSelected = selectedItemId === itemId
  const isActiveTab = openTabs.find(t => t.id === activeTabId)?.pageId === itemId

  // Check if this item or its children match the filter
  const matchesFilter = (id: string): boolean => {
    const it = items[id]
    if (!it) return false
    if (!filterText) return true
    if (it.name.toLowerCase().includes(filterText.toLowerCase())) return true
    if (it.type === 'folder') {
      return it.children.some(childId => matchesFilter(childId))
    }
    return false
  }

  if (!matchesFilter(itemId)) return null

  const indent = overrideIndent ? 8 : depth * INDENT + 8

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedItem(itemId)
    if (item.type === 'folder') {
      toggleExpand(itemId)
    } else {
      openTab(itemId)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (itemId === 'root') return
    startRename()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedItem(itemId)
    setContextMenu({ x: e.clientX, y: e.clientY, itemId })
  }

  const startRename = () => {
    setRenameValue(item.name)
    setIsRenaming(true)
    setTimeout(() => {
      renameRef.current?.select()
    }, 0)
  }

  const commitRename = () => {
    if (renameValue.trim()) {
      renameItem(itemId, renameValue.trim())
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setIsRenaming(false)
  }

  // Drag & drop
  const handleDragStart = (e: React.DragEvent) => {
    if (itemId === 'root') { e.preventDefault(); return }
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
    setDragState({ draggedId: itemId, dragOverId: null })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.type === 'folder' && dragState.draggedId !== itemId) {
      e.dataTransfer.dropEffect = 'move'
      setDragState({ ...dragState, dragOverId: itemId })
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDragState({ ...dragState, dragOverId: null })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && item.type === 'folder' && draggedId !== itemId) {
      moveItem(draggedId, itemId)
    }
    setDragState({ draggedId: null, dragOverId: null })
  }

  const handleDragEnd = () => {
    setDragState({ draggedId: null, dragOverId: null })
  }

  const isDragOver = dragState.dragOverId === itemId

  const iconColor = getIconColor(item)
  const isExpanded = item.isExpanded !== false

  const renderIcon = () => {
    if (item.type === 'folder') {
      return isExpanded
        ? <FolderOpen size={14} color={iconColor} />
        : <Folder size={14} color={iconColor} />
    }
    return <FileText size={14} color="var(--text-muted)" />
  }

  const renderChevron = () => {
    if (item.type !== 'folder') return <span style={{ width: 14, flexShrink: 0 }} />
    if (item.children.length === 0) return <span style={{ width: 14, flexShrink: 0 }} />
    return isExpanded
      ? <ChevronDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      : <ChevronRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
  }

  return (
    <div>
      <div
        draggable={itemId !== 'root'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={isDragOver ? 'drag-over' : ''}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingLeft: indent,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          cursor: 'pointer',
          borderRadius: 4,
          margin: '1px 4px',
          background: isActiveTab
            ? 'var(--bg-selected)'
            : isSelected
            ? 'var(--bg-active)'
            : 'transparent',
          borderLeft: isActiveTab ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'background var(--transition-fast)',
          minHeight: 26,
          position: 'relative',
        }}
        onMouseEnter={e => {
          if (!isSelected && !isActiveTab) {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'
          }
        }}
        onMouseLeave={e => {
          if (!isSelected && !isActiveTab) {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          }
        }}
      >
        {renderChevron()}
        {renderIcon()}

        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1,
              background: 'var(--bg-active)',
              border: '1px solid var(--accent)',
              borderRadius: 3,
              padding: '1px 4px',
              fontSize: 12,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            autoFocus
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: 12,
            color: isActiveTab ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: isActiveTab ? 500 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1.4',
          }}>
            {item.name}
          </span>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {item.isPinned && <Pin size={10} color="var(--accent)" />}
          {item.isFavorite && <Star size={10} color="#f59e0b" />}
        </div>
      </div>

      {/* Children */}
      {item.type === 'folder' && isExpanded && item.children.length > 0 && (
        <div>
          {item.children.map(childId => (
            <FileTreeItem
              key={childId}
              itemId={childId}
              depth={depth + 1}
              filterText={filterText}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FileTreeItem
