import React, { useEffect, useState } from 'react'
import {
  FileText,
  Folder,
  Star,
  Clock,
  Pin,
  BarChart2,
  BookOpen,
  Users,
  Activity,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'
import type { FileItem } from '../../types'

interface Stats {
  folder_count: number
  page_count: number
  word_count: number
}

export function Dashboard(): React.ReactElement {
  const { items, openTab } = useAppStore()
  const [recentItems, setRecentItems] = useState<FileItem[]>([])
  const [stats, setStats] = useState<Stats>({ folder_count: 0, page_count: 0, word_count: 0 })

  const pinnedItems = items.filter((i) => i.is_pinned)
  const favoritedItems = items.filter((i) => i.is_favorited)
  const pageCount = items.filter((i) => i.type === 'page').length
  const folderCount = items.filter((i) => i.type === 'folder').length

  useEffect(() => {
    loadData()
  }, [items.length])

  const loadData = async (): Promise<void> => {
    const [recent, s] = await Promise.all([
      api.items.getRecent(8),
      api.items.getStats(),
    ])
    setRecentItems(recent as FileItem[])
    setStats(s as Stats)
  }

  const handleOpenItem = (item: FileItem): void => {
    if (item.type === 'page') {
      openTab(item)
      api.items.recordAccess(item.id).catch(console.error)
    }
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: 'var(--color-surface)', padding: '2rem 3rem' }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span style={{ fontSize: 32 }}>🔥</span>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              Hellbound Bible
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Your anime production workspace
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}
      >
        <StatCard icon={<Folder size={18} />} label="Folders" value={folderCount} color="var(--color-crimson)" />
        <StatCard icon={<FileText size={18} />} label="Pages" value={pageCount} color="#6b8cff" />
        <StatCard icon={<BookOpen size={18} />} label="Words" value={stats.word_count.toLocaleString()} color="#4caf50" />
        <StatCard icon={<Star size={18} />} label="Favorites" value={favoritedItems.length} color="#ffa500" />
      </div>

      {/* Grid of sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {/* Recent Pages */}
        <DashSection title="Recent Pages" icon={<Clock size={14} />}>
          {recentItems.length === 0 ? (
            <Empty text="No recent pages" />
          ) : (
            recentItems.map((item) => (
              <ItemRow key={item.id} item={item} onClick={() => handleOpenItem(item)} />
            ))
          )}
        </DashSection>

        {/* Pinned */}
        <DashSection title="Pinned" icon={<Pin size={14} />}>
          {pinnedItems.length === 0 ? (
            <Empty text="No pinned items. Right-click any item to pin it." />
          ) : (
            pinnedItems.map((item) => (
              <ItemRow key={item.id} item={item} onClick={() => handleOpenItem(item)} />
            ))
          )}
        </DashSection>

        {/* Favorites */}
        <DashSection title="Favorites" icon={<Star size={14} />}>
          {favoritedItems.length === 0 ? (
            <Empty text="No favorites yet. Right-click any item to favorite it." />
          ) : (
            favoritedItems.map((item) => (
              <ItemRow key={item.id} item={item} onClick={() => handleOpenItem(item)} />
            ))
          )}
        </DashSection>

        {/* Quick Start */}
        <DashSection title="Quick Start" icon={<Activity size={14} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '👤', label: 'New Character', type: 'page' as const },
              { icon: '🎬', label: 'New Episode', type: 'page' as const },
              { icon: '⚔️', label: 'New Arc', type: 'page' as const },
              { icon: '🗺️', label: 'New Location', type: 'page' as const },
              { icon: '⚡', label: 'New Power', type: 'page' as const },
              { icon: '📁', label: 'New Folder', type: 'folder' as const },
            ].map((q) => (
              <button
                key={q.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface3)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-border-hover)'
                  e.currentTarget.style.borderColor = 'var(--color-crimson)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface3)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }}
              >
                <span>{q.icon}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </DashSection>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  )
}

function DashSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px 8px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#ffffff',
        }}
      >
        <span style={{ color: 'var(--color-crimson)' }}>{icon}</span>
        {title}
      </div>
      <div style={{ padding: '8px 0' }}>{children}</div>
    </div>
  )
}

function ItemRow({ item, onClick }: { item: FileItem; onClick: () => void }): React.ReactElement {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        cursor: item.type === 'page' ? 'pointer' : 'default',
        fontSize: 13,
        color: 'var(--color-text)',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={(e) => {
        if (item.type === 'page') e.currentTarget.style.background = 'var(--color-surface3)'
      }}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize: 14 }}>
        {item.icon ?? (item.type === 'folder' ? '📁' : '📄')}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {item.name}
      </span>
      {item.type === 'folder' && (
        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Folder</span>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }): React.ReactElement {
  return (
    <div
      style={{
        padding: '16px',
        textAlign: 'center',
        color: 'var(--color-text-subtle)',
        fontSize: 12,
      }}
    >
      {text}
    </div>
  )
}
