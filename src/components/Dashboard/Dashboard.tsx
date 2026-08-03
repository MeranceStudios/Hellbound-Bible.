import React from 'react'
import { useAppStore } from '@/store/appStore'
import {
  Flame, FileText, Folder, Hash, User, Tv, Star, Pin,
  Clock, ArrowRight, TrendingUp, BookOpen
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const openTab = useAppStore(s => s.openTab)
  const getPageCount = useAppStore(s => s.getPageCount)
  const getFolderCount = useAppStore(s => s.getFolderCount)
  const getTotalWordCount = useAppStore(s => s.getTotalWordCount)
  const getCharacterCount = useAppStore(s => s.getCharacterCount)
  const getEpisodeCount = useAppStore(s => s.getEpisodeCount)
  const getFavorites = useAppStore(s => s.getFavorites)
  const getPinned = useAppStore(s => s.getPinned)
  const getRecentPages = useAppStore(s => s.getRecentPages)
  const setTemplateModalOpen = useAppStore(s => s.setTemplateModalOpen)
  const setNewItemParentId = useAppStore(s => s.setNewItemParentId)
  const createItem = useAppStore(s => s.createItem)

  const favorites = getFavorites()
  const pinned = getPinned()
  const recentPages = getRecentPages()

  const stats = [
    { label: 'Pages', value: getPageCount(), icon: <FileText size={16} color="var(--accent)" /> },
    { label: 'Folders', value: getFolderCount(), icon: <Folder size={16} color="#e0a030" /> },
    { label: 'Words', value: getTotalWordCount().toLocaleString(), icon: <Hash size={16} color="#3b82f6" /> },
    { label: 'Characters', value: getCharacterCount(), icon: <User size={16} color="#8b5cf6" /> },
    { label: 'Episodes', value: getEpisodeCount(), icon: <Tv size={16} color="#22c55e" /> },
    { label: 'Favorites', value: favorites.length, icon: <Star size={16} color="#f59e0b" /> },
  ]

  const handleQuickCreate = (templateType: string) => {
    setNewItemParentId('root')
    setTemplateModalOpen(true)
  }

  const quickCreateItems = [
    { label: 'New Page', icon: <FileText size={14} />, action: () => handleQuickCreate('blank') },
    { label: 'New Folder', icon: <Folder size={14} />, action: () => createItem('root', 'New Folder', 'folder') },
    { label: 'New Character', icon: <User size={14} />, action: () => {
      const id = createItem('root', 'New Character', 'page', 'character')
    }},
    { label: 'New Episode', icon: <Tv size={14} />, action: () => {
      const id = createItem('root', 'New Episode', 'page', 'episode')
    }},
  ]

  const ItemCard: React.FC<{ item: { id: string; name: string; type: string; templateType?: string; updatedAt: string }; onClick: () => void }> = ({ item, onClick }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        borderRadius: 6,
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background = 'var(--bg-hover)'
        el.style.borderColor = 'var(--border-light)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background = 'var(--bg-tertiary)'
        el.style.borderColor = 'var(--border-color)'
      }}
    >
      <FileText size={14} color="var(--text-muted)" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        {item.templateType && item.templateType !== 'blank' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {item.templateType}
          </div>
        )}
      </div>
      <ArrowRight size={12} color="var(--text-muted)" />
    </div>
  )

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 40px 80px',
      }}>
        {/* Hero */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 40,
        }}>
          <div style={{
            width: 56,
            height: 56,
            background: 'var(--accent-dim)',
            borderRadius: 12,
            border: '1px solid var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Flame size={28} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}>
              Hellbound Bible
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
              Your anime production operating system
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 40,
        }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: '14px 16px',
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Create */}
        <div style={{ marginBottom: 36 }}>
          <SectionTitle icon={<TrendingUp size={14} />} title="Quick Create" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickCreateItems.map(item => (
              <button
                key={item.label}
                className="btn btn-secondary"
                onClick={item.action}
                style={{ fontSize: 12 }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Recent Pages */}
          <div>
            <SectionTitle icon={<Clock size={14} />} title={`Recent Pages (${recentPages.length})`} />
            {recentPages.length === 0 ? (
              <EmptyState message="No pages opened yet. Create your first page to get started." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentPages.slice(0, 8).map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => openTab(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pinned */}
          <div>
            <SectionTitle icon={<Pin size={14} />} title={`Pinned (${pinned.length})`} />
            {pinned.length === 0 ? (
              <EmptyState message="Pin important pages and folders for quick access." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pinned.slice(0, 8).map(item => (
                  <ItemCard
                    key={item.id}
                    item={item as any}
                    onClick={() => item.type === 'page' ? openTab(item.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <SectionTitle icon={<Star size={14} />} title={`Favorites (${favorites.length})`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {favorites.map(item => (
                <ItemCard
                  key={item.id}
                  item={item as any}
                  onClick={() => item.type === 'page' ? openTab(item.id) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Getting started */}
        {getPageCount() === 0 && (
          <div style={{
            marginTop: 40,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-glow)',
            borderRadius: 12,
            padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={16} color="var(--accent)" />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                Getting Started
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Welcome to Hellbound Bible — your professional anime production operating system. Start by creating your first folder and page, or use a template to jump right in.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => { setNewItemParentId('root'); setTemplateModalOpen(true) }}
              >
                <FileText size={13} />
                Create First Page
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => createItem('root', 'Story', 'folder')}
              >
                <Folder size={13} />
                Create Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }}>
    {icon}
    {title}
  </div>
)

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    padding: '20px',
    background: 'var(--bg-secondary)',
    borderRadius: 6,
    border: '1px dashed var(--border-color)',
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  }}>
    {message}
  </div>
)

export default Dashboard
