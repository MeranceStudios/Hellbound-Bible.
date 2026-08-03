import React, { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { TEMPLATE_DEFINITIONS, TemplateType } from '@/types'
import {
  FileText, User, Tv, Layers, MapPin, Zap, Calendar,
  Users, Sword, Bug, Heart, X, Plus
} from 'lucide-react'

const TEMPLATE_ICONS: Record<TemplateType, React.ReactNode> = {
  blank: <FileText size={20} />,
  character: <User size={20} />,
  episode: <Tv size={20} />,
  arc: <Layers size={20} />,
  location: <MapPin size={20} />,
  power: <Zap size={20} />,
  'timeline-event': <Calendar size={20} />,
  organization: <Users size={20} />,
  weapon: <Sword size={20} />,
  creature: <Bug size={20} />,
  relationship: <Heart size={20} />,
}

const TEMPLATE_COLORS: Record<TemplateType, string> = {
  blank: 'var(--text-muted)',
  character: '#8b5cf6',
  episode: '#22c55e',
  arc: '#dc143c',
  location: '#3b82f6',
  power: '#f59e0b',
  'timeline-event': '#ec4899',
  organization: '#06b6d4',
  weapon: '#e0a030',
  creature: '#f97316',
  relationship: '#ec4899',
}

const TemplateModal: React.FC = () => {
  const setTemplateModalOpen = useAppStore(s => s.setTemplateModalOpen)
  const createItem = useAppStore(s => s.createItem)
  const isNewItemParentId = useAppStore(s => s.isNewItemParentId)
  const items = useAppStore(s => s.items)

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('blank')
  const [pageName, setPageName] = useState('')
  const [nameError, setNameError] = useState('')

  const parentId = isNewItemParentId || 'root'
  const parent = items[parentId]

  const handleCreate = () => {
    const name = pageName.trim() || TEMPLATE_DEFINITIONS[selectedTemplate].label
    if (!name) {
      setNameError('Please enter a page name')
      return
    }
    createItem(parentId, name, 'page', selectedTemplate)
    setTemplateModalOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') setTemplateModalOpen(false)
  }

  const templates = Object.entries(TEMPLATE_DEFINITIONS) as [TemplateType, typeof TEMPLATE_DEFINITIONS[TemplateType]][]

  return (
    <div className="modal-overlay" onClick={() => setTemplateModalOpen(false)}>
      <div
        className="modal"
        style={{ maxWidth: 560, maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Create New Page</h2>
            {parent && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                in <strong style={{ color: 'var(--text-secondary)' }}>{parent.name}</strong>
              </p>
            )}
          </div>
          <button
            onClick={() => setTemplateModalOpen(false)}
            style={{ color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Page name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}>
              Page Name
            </label>
            <input
              value={pageName}
              onChange={e => { setPageName(e.target.value); setNameError('') }}
              onKeyDown={handleKeyDown}
              placeholder={TEMPLATE_DEFINITIONS[selectedTemplate].label}
              style={{ width: '100%' }}
              autoFocus
            />
            {nameError && (
              <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{nameError}</p>
            )}
          </div>

          {/* Template grid */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}>
              Choose Template
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8,
            }}>
              {templates.map(([type, def]) => {
                const isSelected = selectedTemplate === type
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedTemplate(type)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 8px',
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                      border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-light)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'
                      }
                    }}
                  >
                    <div style={{ color: isSelected ? 'var(--accent)' : TEMPLATE_COLORS[type] }}>
                      {TEMPLATE_ICONS[type]}
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}>
                      {def.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setTemplateModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
          >
            <Plus size={13} />
            Create Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateModal
