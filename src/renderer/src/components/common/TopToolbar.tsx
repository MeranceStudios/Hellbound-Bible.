import React from 'react'
import {
  LayoutDashboard,
  Search,
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  FolderPlus,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'

export function TopToolbar(): React.ReactElement {
  const {
    currentView,
    setCurrentView,
    isExplorerCollapsed,
    toggleExplorer,
    setSearchQuery,
    addItem,
    items,
    expandedIds,
    setExpanded,
  } = useAppStore()

  const handleNewPage = async (): Promise<void> => {
    const result = await api.items.create({
      parent_id: null,
      type: 'page',
      name: 'Untitled Page',
      icon: '📄',
    })
    if (result) {
      addItem(result as never)
    }
  }

  const handleNewFolder = async (): Promise<void> => {
    const result = await api.items.create({
      parent_id: null,
      type: 'folder',
      name: 'New Folder',
      icon: '📁',
    })
    if (result) {
      addItem(result as never)
    }
  }

  const handleSearchClick = (): void => {
    setCurrentView('search')
    setSearchQuery('')
  }

  const navItems = [
    {
      icon: <LayoutDashboard size={16} />,
      label: 'Dashboard',
      view: 'dashboard' as const,
      action: () => setCurrentView('dashboard'),
    },
    {
      icon: <Search size={16} />,
      label: 'Search',
      view: 'search' as const,
      action: handleSearchClick,
    },
    {
      icon: <Clock size={16} />,
      label: 'Timeline',
      view: 'timeline' as const,
      action: () => setCurrentView('timeline'),
    },
    {
      icon: <Settings size={16} />,
      label: 'Settings',
      view: 'settings' as const,
      action: () => setCurrentView('settings'),
    },
  ]

  return (
    <div
      className="flex items-center gap-1 px-2"
      style={{
        height: 'var(--toolbar-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      {/* Explorer toggle */}
      <button
        onClick={toggleExplorer}
        className="toolbar-btn"
        title={isExplorerCollapsed ? 'Show Explorer' : 'Hide Explorer'}
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {isExplorerCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

      {/* Nav items */}
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={item.action}
          title={item.label}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            background: currentView === item.view ? 'var(--color-surface3)' : 'transparent',
            color: currentView === item.view ? 'var(--color-crimson)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: currentView === item.view ? 600 : 400,
          }}
          onMouseEnter={(e) => {
            if (currentView !== item.view) e.currentTarget.style.background = 'var(--color-surface3)'
          }}
          onMouseLeave={(e) => {
            if (currentView !== item.view) e.currentTarget.style.background = 'transparent'
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      <div className="flex-1" />

      {/* Quick create */}
      <button
        onClick={handleNewFolder}
        title="New Folder"
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <FolderPlus size={16} />
      </button>

      <button
        onClick={handleNewPage}
        title="New Page"
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--color-crimson)',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-crimson-dark)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-crimson)')}
      >
        <Plus size={15} />
        <span>New Page</span>
      </button>
    </div>
  )
}
