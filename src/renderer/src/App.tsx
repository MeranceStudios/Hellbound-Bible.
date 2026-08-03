import React, { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TitleBar } from './components/common/TitleBar'
import { TopToolbar } from './components/common/TopToolbar'
import { FileExplorer } from './components/explorer/FileExplorer'
import { TabBar } from './components/editor/TabBar'
import { EditorArea } from './components/editor/EditorArea'
import { Dashboard } from './components/dashboard/Dashboard'
import { SearchView } from './components/search/SearchView'
import { TimelineView } from './components/timeline/TimelineView'
import { SettingsView } from './components/common/SettingsView'
import { StatusBar } from './components/common/StatusBar'
import { ResizeHandle } from './components/common/ResizeHandle'
import { useAppStore } from './stores/appStore'
import { api } from './utils/api'

export default function App(): React.ReactElement {
  const {
    currentView,
    explorerWidth,
    isExplorerCollapsed,
    setItems,
    setTags,
    setTemplates,
    setIsLoading,
  } = useAppStore()

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData(): Promise<void> {
    setIsLoading(true)
    try {
      const [items, tags, templates] = await Promise.all([
        api.items.getAll(),
        api.tags.getAll(),
        api.templates.getAll(),
      ])
      setItems(items as never[])
      setTags(tags as never[])
      setTemplates(templates as never[])
    } catch (err) {
      console.error('Failed to load initial data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const explorerActualWidth = isExplorerCollapsed ? 0 : explorerWidth

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="flex flex-col"
        style={{ height: '100vh', background: 'var(--color-bg)' }}
      >
        {/* Title bar */}
        <TitleBar />

        {/* Top toolbar */}
        <TopToolbar />

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left explorer */}
          {!isExplorerCollapsed && (
            <>
              <div
                style={{
                  width: explorerWidth,
                  minWidth: explorerWidth,
                  background: 'var(--color-surface)',
                  borderRight: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <FileExplorer />
              </div>
              <ResizeHandle />
            </>
          )}

          {/* Content area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tab bar (shown only in editor view or when tabs exist) */}
            <TabBar />

            {/* Main content */}
            <div className="flex-1 overflow-hidden" style={{ background: 'var(--color-surface)' }}>
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'editor' && <EditorArea />}
              {currentView === 'search' && <SearchView />}
              {currentView === 'timeline' && <TimelineView />}
              {currentView === 'settings' && <SettingsView />}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <StatusBar />
      </div>
    </DndProvider>
  )
}
