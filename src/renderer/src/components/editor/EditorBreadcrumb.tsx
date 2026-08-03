import React, { useEffect, useState } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'
import type { FileItem } from '../../types'

interface EditorBreadcrumbProps {
  itemId: string
}

export function EditorBreadcrumb({ itemId }: EditorBreadcrumbProps): React.ReactElement {
  const { openTab } = useAppStore()
  const [breadcrumb, setBreadcrumb] = useState<FileItem[]>([])

  useEffect(() => {
    api.items.getBreadcrumb(itemId).then((path) => {
      setBreadcrumb(path as FileItem[])
    })
  }, [itemId])

  return (
    <div
      className="flex items-center gap-1 px-4"
      style={{
        height: 32,
        borderBottom: '1px solid var(--color-border)',
        fontSize: 12,
        color: 'var(--color-text-subtle)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <Home size={11} style={{ flexShrink: 0 }} />
      {breadcrumb.map((item, i) => (
        <React.Fragment key={item.id}>
          <ChevronRight size={11} style={{ flexShrink: 0 }} />
          <button
            onClick={() => {
              if (item.type === 'page') openTab(item)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: i === breadcrumb.length - 1 ? 'var(--color-text)' : 'var(--color-text-subtle)',
              cursor: item.type === 'page' ? 'pointer' : 'default',
              fontSize: 12,
              padding: '0 2px',
              fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 150,
            }}
          >
            {item.icon && <span style={{ marginRight: 3 }}>{item.icon}</span>}
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}
