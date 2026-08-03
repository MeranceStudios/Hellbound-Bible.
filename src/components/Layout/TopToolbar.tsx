import React from 'react'
import { useAppStore } from '@/store/appStore'
import {
  Search, LayoutDashboard, Plus, FolderPlus, FilePlus,
  ChevronDown, Flame, Settings
} from 'lucide-react'

const TopToolbar: React.FC = () => {
  const setSearchOpen = useAppStore(s => s.setSearchOpen)
  const setDashboardVisible = useAppStore(s => s.setDashboardVisible)
  const setTemplateModalOpen = useAppStore(s => s.setTemplateModalOpen)
  const setNewItemParentId = useAppStore(s => s.setNewItemParentId)
  const createItem = useAppStore(s => s.createItem)
  const selectedItemId = useAppStore(s => s.selectedItemId)
  const items = useAppStore(s => s.items)

  const handleNewPage = () => {
    const parentId = getParentId()
    setNewItemParentId(parentId)
    setTemplateModalOpen(true)
  }

  const handleNewFolder = () => {
    const parentId = getParentId()
    const folderName = 'New Folder'
    createItem(parentId, folderName, 'folder')
  }

  const getParentId = () => {
    if (!selectedItemId) return 'root'
    const item = items[selectedItemId]
    if (!item) return 'root'
    if (item.type === 'folder') return selectedItemId
    return item.parentId || 'root'
  }

  return (
    <div style={{
      height: 'var(--toolbar-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 12,
      gap: 4,
      flexShrink: 0,
    } as React.CSSProperties}>
      {/* App Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginRight: 8,
      }}>
        <Flame size={18} color="var(--accent)" />
        <span style={{
          fontWeight: 700,
          fontSize: 14,
          color: 'var(--text-primary)',
          letterSpacing: '0.5px',
        }}>
          HELLBOUND BIBLE
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        {/* Search */}
        <button
          className="btn btn-ghost"
          onClick={() => setSearchOpen(true)}
          data-tooltip="Search Everything (Ctrl+P)"
          style={{ padding: '4px 10px', fontSize: 12, gap: 5 }}
        >
          <Search size={13} />
          <span style={{ color: 'var(--text-muted)' }}>Search...</span>
          <span style={{
            marginLeft: 6,
            fontSize: 10,
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '1px 5px',
            borderRadius: 3,
            border: '1px solid var(--border-color)',
          }}>Ctrl+P</span>
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 4px' }} />

        {/* Dashboard */}
        <button
          className="btn btn-ghost"
          onClick={() => setDashboardVisible(true)}
          data-tooltip="Dashboard"
          style={{ padding: '4px 8px' }}
        >
          <LayoutDashboard size={14} />
        </button>

        {/* New Folder */}
        <button
          className="btn btn-ghost"
          onClick={handleNewFolder}
          data-tooltip="New Folder"
          style={{ padding: '4px 8px' }}
        >
          <FolderPlus size={14} />
        </button>

        {/* New Page */}
        <button
          className="btn btn-primary"
          onClick={handleNewPage}
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <FilePlus size={13} />
          New Page
        </button>
      </div>
    </div>
  )
}

export default TopToolbar
