import React, { useCallback, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'

export function ResizeHandle(): React.ReactElement {
  const { setExplorerWidth, explorerWidth } = useAppStore()
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      startX.current = e.clientX
      startWidth.current = explorerWidth

      const handleMouseMove = (e: MouseEvent): void => {
        if (!isDragging.current) return
        const delta = e.clientX - startX.current
        setExplorerWidth(startWidth.current + delta)
      }

      const handleMouseUp = (): void => {
        isDragging.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [explorerWidth, setExplorerWidth]
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      className="resize-handle"
      style={{
        width: 4,
        background: 'transparent',
        cursor: 'col-resize',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-crimson)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    />
  )
}
