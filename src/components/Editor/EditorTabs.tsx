import React from 'react'
import { useAppStore } from '@/store/appStore'
import { X, LayoutDashboard } from 'lucide-react'

const EditorTabs: React.FC = () => {
  const openTabs = useAppStore(s => s.openTabs)
  const activeTabId = useAppStore(s => s.activeTabId)
  const closeTab = useAppStore(s => s.closeTab)
  const setActiveTab = useAppStore(s => s.setActiveTab)
  const setDashboardVisible = useAppStore(s => s.setDashboardVisible)
  const isDashboardVisible = useAppStore(s => s.isDashboardVisible)
  const items = useAppStore(s => s.items)

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    setDashboardVisible(false)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const handleDashboardClick = () => {
    setDashboardVisible(true)
  }

  return (
    <div style={{
      height: 'var(--tab-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'stretch',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Dashboard tab */}
      <button
        onClick={handleDashboardClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 12px',
          fontSize: 12,
          color: isDashboardVisible ? 'var(--text-primary)' : 'var(--text-muted)',
          background: isDashboardVisible ? 'var(--bg-primary)' : 'transparent',
          borderBottom: isDashboardVisible ? '2px solid var(--accent)' : '2px solid transparent',
          borderRight: '1px solid var(--border-color)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all var(--transition-fast)',
        }}
      >
        <LayoutDashboard size={12} />
        <span>Dashboard</span>
      </button>

      {/* Page tabs */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
      }}>
        {openTabs.map(tab => {
          const isActive = tab.id === activeTabId && !isDashboardVisible
          const page = items[tab.pageId]
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px 0 12px',
                fontSize: 12,
                cursor: 'pointer',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg-primary)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                borderRight: '1px solid var(--border-color)',
                flexShrink: 0,
                maxWidth: 200,
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'
                  ;(e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)'
                }
              }}
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 140,
              }}>
                {tab.isDirty ? '● ' : ''}{tab.title}
              </span>
              <button
                onClick={e => handleCloseTab(e, tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-active)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                }}
              >
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EditorTabs
