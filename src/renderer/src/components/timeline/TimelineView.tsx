import React, { useEffect, useState } from 'react'
import { Plus, Clock, Trash2, Edit2, X, Check } from 'lucide-react'
import { api } from '../../utils/api'

interface TimelineEvent {
  id: string
  item_id: string | null
  title: string
  description: string
  date_label: string
  arc: string | null
  character_ids: string
  color: string
  sort_order: number
  created_at: string
}

export function TimelineView(): React.ReactElement {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterArc, setFilterArc] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    date_label: '',
    arc: '',
    color: '#dc143c',
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async (): Promise<void> => {
    const data = await api.timeline.getAll()
    setEvents(data as TimelineEvent[])
  }

  const handleCreate = async (): Promise<void> => {
    if (!form.title.trim()) return
    await api.timeline.create({
      title: form.title.trim(),
      description: form.description,
      date_label: form.date_label,
      arc: form.arc || null,
      color: form.color,
      character_ids: [],
    })
    setForm({ title: '', description: '', date_label: '', arc: '', color: '#dc143c' })
    setShowCreate(false)
    loadEvents()
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this timeline event?')) return
    await api.timeline.delete(id)
    loadEvents()
  }

  const handleUpdate = async (id: string, updates: Partial<TimelineEvent>): Promise<void> => {
    await api.timeline.update(id, updates as Record<string, unknown>)
    loadEvents()
    setEditingId(null)
  }

  const arcs = [...new Set(events.map((e) => e.arc).filter(Boolean))] as string[]
  const filtered = filterArc ? events.filter((e) => e.arc === filterArc) : events

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-3">
          <Clock size={20} style={{ color: 'var(--color-crimson)' }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>Timeline</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Arc filter */}
          {arcs.length > 0 && (
            <select
              value={filterArc}
              onChange={(e) => setFilterArc(e.target.value)}
              style={{
                background: 'var(--color-surface2)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '5px 10px',
                color: 'var(--color-text)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <option value="">All Arcs</option>
              {arcs.map((arc) => (
                <option key={arc} value={arc}>{arc}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--color-crimson)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Add Event
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px' }}>
        {filtered.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '80px',
              gap: 12,
              color: 'var(--color-text-subtle)',
            }}
          >
            <Clock size={48} style={{ opacity: 0.2 }} />
            <div style={{ fontSize: 16 }}>No timeline events yet</div>
            <div style={{ fontSize: 13 }}>Click "Add Event" to create your first timeline event</div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 40 }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 16,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'linear-gradient(to bottom, var(--color-crimson), transparent)',
            }}
          />

          {filtered.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              isEditing={editingId === event.id}
              onEdit={() => setEditingId(event.id)}
              onDelete={() => handleDelete(event.id)}
              onUpdate={(updates) => handleUpdate(event.id, updates)}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      </div>

      {/* Create dialog */}
      {showCreate && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <div
            style={{
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 24,
              width: 480,
              boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>New Timeline Event</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {[
              { label: 'Title *', key: 'title', placeholder: 'Event title' },
              { label: 'Date/Time', key: 'date_label', placeholder: 'e.g. Year 1 / Episode 3' },
              { label: 'Arc', key: 'arc', placeholder: 'e.g. Arc 1: The Descent' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: 'var(--color-text)',
                    fontSize: 13,
                    outline: 'none',
                    userSelect: 'text',
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Event description..."
                style={{
                  width: '100%',
                  background: 'var(--color-surface3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: 'var(--color-text)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                  userSelect: 'text',
                }}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: 'var(--color-crimson)', color: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EventCard({
  event,
  isEditing,
  onEdit,
  onDelete,
  onUpdate,
  onCancelEdit,
}: {
  event: TimelineEvent
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<TimelineEvent>) => void
  onCancelEdit: () => void
}): React.ReactElement {
  const [editTitle, setEditTitle] = useState(event.title)
  const [editDate, setEditDate] = useState(event.date_label)
  const [editDesc, setEditDesc] = useState(event.description)

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 20,
        paddingLeft: 24,
      }}
    >
      {/* Dot */}
      <div
        style={{
          position: 'absolute',
          left: -28,
          top: 12,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: event.color,
          border: '2px solid var(--color-surface)',
          boxShadow: `0 0 8px ${event.color}80`,
        }}
      />

      {/* Card */}
      <div
        style={{
          background: 'var(--color-surface2)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: 16,
          transition: 'border-color 0.1s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
      >
        {isEditing ? (
          <div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: '100%', background: 'var(--color-surface3)', border: '1px solid var(--color-crimson)', borderRadius: 5, padding: '4px 8px', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8, outline: 'none', userSelect: 'text' }}
            />
            <input
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              placeholder="Date/time..."
              style={{ width: '100%', background: 'var(--color-surface3)', border: '1px solid var(--color-border)', borderRadius: 5, padding: '4px 8px', color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 8, outline: 'none', userSelect: 'text' }}
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              style={{ width: '100%', background: 'var(--color-surface3)', border: '1px solid var(--color-border)', borderRadius: 5, padding: '4px 8px', color: 'var(--color-text)', fontSize: 13, resize: 'vertical', outline: 'none', userSelect: 'text' }}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => onUpdate({ title: editTitle, date_label: editDate, description: editDesc })} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: 'none', background: 'var(--color-crimson)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                <Check size={12} /> Save
              </button>
              <button onClick={onCancelEdit} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12 }}>
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{event.title}</div>
                {event.date_label && (
                  <div style={{ fontSize: 12, color: 'var(--color-crimson)', marginTop: 2 }}>
                    📅 {event.date_label}
                  </div>
                )}
                {event.arc && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 1 }}>
                    {event.arc}
                  </div>
                )}
                {event.description && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>
                    {event.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onEdit}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={onDelete}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--color-text-subtle)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.color = '#ff6b6b' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-subtle)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
