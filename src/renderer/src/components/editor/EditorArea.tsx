import React from 'react'
import { useAppStore } from '../../stores/appStore'
import { PageEditor } from './PageEditor'
import { FileText } from 'lucide-react'

export function EditorArea(): React.ReactElement {
  const { tabs, activeTabId } = useAppStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  if (!activeTab) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface)',
          flexDirection: 'column',
          gap: 12,
          color: 'var(--color-text-subtle)',
        }}
      >
        <FileText size={48} style={{ opacity: 0.2 }} />
        <div style={{ fontSize: 16, fontWeight: 500 }}>No page open</div>
        <div style={{ fontSize: 13 }}>Open a page from the explorer to start editing</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: 'var(--color-surface)' }}>
      {/* Render all tabs but only show the active one */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            height: '100%',
            display: tab.id === activeTabId ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <PageEditor itemId={tab.item_id} isActive={tab.id === activeTabId} />
        </div>
      ))}
    </div>
  )
}
