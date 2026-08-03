import React, { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { api } from '../../utils/api'

export function TitleBar(): React.ReactElement {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    api.window.isMaximized().then(setIsMaximized)
  }, [])

  return (
    <div
      className="flex items-center justify-between select-none"
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        WebkitAppRegion: 'drag',
        flexShrink: 0,
      } as React.CSSProperties}
    >
      {/* App name + icon */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="text-sm" style={{ color: 'var(--color-crimson)' }}>🔥</span>
        <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          HELLBOUND BIBLE
        </span>
      </div>

      {/* Center - drag region */}
      <div className="flex-1" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Window controls */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => api.window.minimize()}
          className="flex items-center justify-center transition-colors"
          style={{ width: 46, height: 32 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Minimize"
        >
          <Minus size={12} color="#9a9a9a" />
        </button>
        <button
          onClick={() => {
            api.window.maximize()
            setIsMaximized(!isMaximized)
          }}
          className="flex items-center justify-center transition-colors"
          style={{ width: 46, height: 32 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square size={11} color="#9a9a9a" />
        </button>
        <button
          onClick={() => api.window.close()}
          className="flex items-center justify-center transition-colors"
          style={{ width: 46, height: 32 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#c42b2b'
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Close"
        >
          <X size={12} color="#9a9a9a" />
        </button>
      </div>
    </div>
  )
}
