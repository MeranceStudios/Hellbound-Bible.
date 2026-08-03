import React from 'react'
import { useAppStore } from '@/store/appStore'
import { FileText, Folder, Hash, BookOpen } from 'lucide-react'

const StatusBar: React.FC = () => {
  const getPageCount = useAppStore(s => s.getPageCount)
  const getFolderCount = useAppStore(s => s.getFolderCount)
  const getTotalWordCount = useAppStore(s => s.getTotalWordCount)
  const openTabs = useAppStore(s => s.openTabs)
  const activeTabId = useAppStore(s => s.activeTabId)
  const items = useAppStore(s => s.items)

  const activeTab = openTabs.find(t => t.id === activeTabId)
  const activePage = activeTab ? items[activeTab.pageId] : null

  return (
    <div style={{
      height: 'var(--statusbar-height)',
      background: 'var(--accent)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 12,
      gap: 16,
      flexShrink: 0,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    }}>
      {/* Left: active file info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <BookOpen size={11} />
        <span style={{ fontWeight: 600 }}>HELLBOUND BIBLE</span>
      </div>

      {activePage && (
        <>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.3)' }} />
          <span>{activePage.name}</span>
          {activePage.wordCount !== undefined && (
            <span style={{ opacity: 0.8 }}>{activePage.wordCount} words</span>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Right: stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={11} />
          <span>{getPageCount()} pages</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Folder size={11} />
          <span>{getFolderCount()} folders</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Hash size={11} />
          <span>{getTotalWordCount().toLocaleString()} words</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{openTabs.length} open</span>
        </div>
      </div>
    </div>
  )
}

export default StatusBar
