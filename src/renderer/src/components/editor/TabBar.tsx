import React from 'react'
import { X, FileText, Folder } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

export function TabBar(): React.ReactElement {
  const { tabs, activeTabId, closeTab, setActiveTab } = useAppStore()

  if (tabs.length === 0) return <div style={{ height: 0 }} />

  return (
    <div
      className="flex items-center overflow-x-auto"
      style={{
        height: 'var(--tab-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              height: '100%',
              cursor: 'pointer',
              borderRight: '1px solid var(--color-border)',
              background: isActive ? 'var(--color-surface2)' : 'transparent',
              borderBottom: isActive ? '2px solid var(--color-crimson)' : '2px solid transparent',
              color: isActive ? '#ffffff' : 'var(--color-text-muted)',
              fontSize: 13,
              userSelect: 'none',
              whiteSpace: 'nowrap',
              minWidth: 0,
              maxWidth: 200,
              flexShrink: 0,
              transition: 'all 0.1s ease',
              position: 'relative',
              top: isActive ? -1 : 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--color-surface3)'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: 12, flexShrink: 0 }}>
              {tab.icon ?? (tab.icon === null ? <FileText size={12} /> : '📄')}
            </span>

            {/* Name */}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {tab.is_dirty ? `${tab.name} •` : tab.name}
            </span>

            {/* Close */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: 3,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface3)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-muted)'
              }}
            >
              <X size={11} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
