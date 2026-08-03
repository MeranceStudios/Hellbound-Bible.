import React, { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import AppLayout from '@/components/Layout/AppLayout'
import SearchModal from '@/components/Search/SearchModal'
import TemplateModal from '@/components/Templates/TemplateModal'

const App: React.FC = () => {
  const loadWorkspace = useAppStore(s => s.loadWorkspace)
  const isSearchOpen = useAppStore(s => s.isSearchOpen)
  const isTemplateModalOpen = useAppStore(s => s.isTemplateModalOpen)
  const setContextMenu = useAppStore(s => s.setContextMenu)
  const setSearchOpen = useAppStore(s => s.setSearchOpen)
  const closeTab = useAppStore(s => s.closeTab)
  const activeTabId = useAppStore(s => s.activeTabId)

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [setContextMenu])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + P = open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      // Ctrl/Cmd + W = close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          closeTab(activeTabId)
        }
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen, closeTab, activeTabId])

  return (
    <div className="app-root">
      <AppLayout />
      {isSearchOpen && <SearchModal />}
      {isTemplateModalOpen && <TemplateModal />}
    </div>
  )
}

export default App

