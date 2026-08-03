import React, { useCallback, useRef, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import TopToolbar from './TopToolbar'
import StatusBar from './StatusBar'
import FileExplorer from '@/components/FileExplorer/FileExplorer'
import EditorPane from '@/components/Editor/EditorPane'
import Dashboard from '@/components/Dashboard/Dashboard'
import ContextMenuComponent from '@/components/FileExplorer/ContextMenu'

const AppLayout: React.FC = () => {
  const leftPanelWidth = useAppStore(s => s.leftPanelWidth)
  const setLeftPanelWidth = useAppStore(s => s.setLeftPanelWidth)
  const isDashboardVisible = useAppStore(s => s.isDashboardVisible)
  const setDashboardVisible = useAppStore(s => s.setDashboardVisible)
  const activeTabId = useAppStore(s => s.activeTabId)
  const contextMenu = useAppStore(s => s.contextMenu)

  const isDragging = useRef(false)
  const [isResizing, setIsResizing] = useState(false)

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = leftPanelWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const diff = ev.clientX - startX
      const newWidth = Math.max(180, Math.min(500, startWidth + diff))
      setLeftPanelWidth(newWidth)
    }

    const onMouseUp = () => {
      isDragging.current = false
      setIsResizing(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [leftPanelWidth, setLeftPanelWidth])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      <TopToolbar />

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Left File Explorer */}
        <div style={{
          width: leftPanelWidth,
          minWidth: 180,
          maxWidth: 500,
          flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <FileExplorer />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            width: 4,
            cursor: 'col-resize',
            background: isResizing ? 'var(--accent)' : 'transparent',
            flexShrink: 0,
            transition: 'background var(--transition-fast)',
            zIndex: 10,
          }}
          onMouseEnter={e => { if (!isResizing) (e.target as HTMLDivElement).style.background = 'var(--border-light)' }}
          onMouseLeave={e => { if (!isResizing) (e.target as HTMLDivElement).style.background = 'transparent' }}
        />

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
        }}>
          {isDashboardVisible && !activeTabId ? (
            <Dashboard />
          ) : (
            <EditorPane />
          )}
        </div>
      </div>

      <StatusBar />

      {/* Context Menu */}
      {contextMenu && <ContextMenuComponent />}
    </div>
  )
}

export default AppLayout
