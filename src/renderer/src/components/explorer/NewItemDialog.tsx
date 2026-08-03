import React, { useState, useEffect } from 'react'
import { X, Folder, FileText } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'
import type { Template } from '../../types'

interface NewItemDialogProps {
  parentId: string | null
  defaultType: 'folder' | 'page'
  onClose: () => void
}

export function NewItemDialog({ parentId, defaultType, onClose }: NewItemDialogProps): React.ReactElement {
  const { addItem, setExpanded, templates } = useAppStore()
  const [type, setType] = useState<'folder' | 'page'>(defaultType)
  const [name, setName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [icon, setIcon] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setName(type === 'folder' ? 'New Folder' : 'Untitled Page')
    setIcon(type === 'folder' ? '📁' : '📄')
    setSelectedTemplate(null)
  }, [type])

  const handleCreate = async (): Promise<void> => {
    if (!name.trim() || isCreating) return
    setIsCreating(true)
    try {
      const result = await api.items.create({
        parent_id: parentId,
        type,
        name: name.trim(),
        icon: icon || undefined,
        template_id: selectedTemplate ?? undefined,
      })
      if (result) {
        addItem(result as never)
        if (parentId) setExpanded(parentId, true)
      }
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--color-surface2)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
          width: 420,
          boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
            Create New Item
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-4">
          <TypeBtn
            active={type === 'folder'}
            icon={<Folder size={15} />}
            label="Folder"
            onClick={() => setType('folder')}
          />
          <TypeBtn
            active={type === 'page'}
            icon={<FileText size={15} />}
            label="Page"
            onClick={() => setType('page')}
          />
        </div>

        {/* Icon + Name */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📁"
            maxLength={4}
            style={{
              width: 44,
              textAlign: 'center',
              background: 'var(--color-surface3)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text)',
              fontSize: 20,
              padding: '4px',
              outline: 'none',
            }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            placeholder="Name..."
            autoFocus
            style={{
              flex: 1,
              background: 'var(--color-surface3)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--color-text)',
              fontSize: 14,
              outline: 'none',
              userSelect: 'text',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-crimson)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Templates (for pages) */}
        {type === 'page' && templates.length > 0 && (
          <div className="mb-4">
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Template (optional)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 6,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              <TemplateOption
                selected={selectedTemplate === null}
                label="Blank Page"
                icon="📄"
                onClick={() => setSelectedTemplate(null)}
              />
              {templates.map((t) => (
                <TemplateOption
                  key={t.id}
                  selected={selectedTemplate === t.id}
                  label={t.name}
                  icon={t.icon}
                  onClick={() => setSelectedTemplate(t.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--color-crimson)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              opacity: (!name.trim() || isCreating) ? 0.5 : 1,
            }}
          >
            {isCreating ? 'Creating...' : `Create ${type === 'folder' ? 'Folder' : 'Page'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function TypeBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px',
        borderRadius: 6,
        border: `1px solid ${active ? 'var(--color-crimson)' : 'var(--color-border)'}`,
        background: active ? 'rgba(220,20,60,0.12)' : 'transparent',
        color: active ? 'var(--color-crimson)' : 'var(--color-text-muted)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function TemplateOption({
  selected,
  label,
  icon,
  onClick,
}: {
  selected: boolean
  label: string
  icon: string
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${selected ? 'var(--color-crimson)' : 'var(--color-border)'}`,
        background: selected ? 'rgba(220,20,60,0.1)' : 'var(--color-surface3)',
        color: selected ? 'var(--color-crimson)' : 'var(--color-text)',
        cursor: 'pointer',
        fontSize: 12,
        textAlign: 'left',
      }}
    >
      <span>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}
