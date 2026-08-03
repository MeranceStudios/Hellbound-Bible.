import React from 'react'
import { useAppStore } from '../../stores/appStore'

export function StatusBar(): React.ReactElement {
  const { items, pendingSaves } = useAppStore()

  const pageCount = items.filter((i) => i.type === 'page').length
  const folderCount = items.filter((i) => i.type === 'folder').length

  return (
    <div
      className="flex items-center justify-between px-3"
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        flexShrink: 0,
        fontSize: 11,
        color: 'var(--color-text-subtle)',
      }}
    >
      <div className="flex items-center gap-4">
        <span>🔥 Hellbound Bible</span>
        <span>{folderCount} folders</span>
        <span>{pageCount} pages</span>
      </div>
      <div className="flex items-center gap-3">
        {pendingSaves.size > 0 && (
          <span style={{ color: 'var(--color-crimson)' }}>
            ● Saving...
          </span>
        )}
        {pendingSaves.size === 0 && (
          <span style={{ color: '#4caf50' }}>
            ● All changes saved
          </span>
        )}
      </div>
    </div>
  )
}
