import React from 'react'
import { Settings, Palette } from 'lucide-react'

export function SettingsView(): React.ReactElement {
  return (
    <div
      className="flex flex-col h-full overflow-auto"
      style={{ padding: '2rem 3rem', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} style={{ color: 'var(--color-crimson)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Settings</h1>
      </div>

      <div
        style={{
          background: 'var(--color-surface2)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '1.5rem',
          marginBottom: '1rem',
        }}
      >
        <h2
          className="flex items-center gap-2 mb-4"
          style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}
        >
          <Palette size={16} style={{ color: 'var(--color-crimson)' }} />
          Appearance
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--color-text-muted)' }}>Theme</span>
            <span
              style={{
                background: 'var(--color-surface3)',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--color-text)',
              }}
            >
              Dark (Default)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--color-text-muted)' }}>Accent Color</span>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: 'var(--color-crimson)',
                border: '2px solid var(--color-border)',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--color-surface2)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '1.5rem',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginBottom: '1rem' }}
        >
          About
        </h2>
        <div className="flex flex-col gap-2" style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          <span>Hellbound Bible v1.0.0</span>
          <span>A professional production and story management application for Hellbound anime.</span>
          <span style={{ color: 'var(--color-text-subtle)' }}>© 2025 MeranceStudios. All rights reserved.</span>
        </div>
      </div>
    </div>
  )
}
