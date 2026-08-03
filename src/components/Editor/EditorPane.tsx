import React from 'react'
import { useAppStore } from '@/store/appStore'
import EditorTabs from './EditorTabs'
import TipTapEditor from './TipTapEditor'
import Dashboard from '@/components/Dashboard/Dashboard'

const EditorPane: React.FC = () => {
  const openTabs = useAppStore(s => s.openTabs)
  const activeTabId = useAppStore(s => s.activeTabId)
  const items = useAppStore(s => s.items)
  const isDashboardVisible = useAppStore(s => s.isDashboardVisible)

  const activeTab = openTabs.find(t => t.id === activeTabId)
  const activePage = activeTab ? items[activeTab.pageId] : null

  if (openTabs.length === 0) {
    return <Dashboard />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      <EditorTabs />

      {/* Editor Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {isDashboardVisible || !activePage ? (
          <Dashboard />
        ) : (
          openTabs.map(tab => {
            const page = items[tab.pageId]
            if (!page) return null
            return (
              <div
                key={tab.id}
                style={{
                  display: tab.id === activeTabId ? 'flex' : 'none',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <TipTapEditor pageId={tab.pageId} isActive={tab.id === activeTabId} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default EditorPane
