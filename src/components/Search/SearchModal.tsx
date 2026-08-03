import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { Search, FileText, Folder, X, ArrowRight, Hash, ChevronRight } from 'lucide-react'
import { SearchResult } from '@/types'

const SearchModal: React.FC = () => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const setSearchOpen = useAppStore(s => s.setSearchOpen)
  const openTab = useAppStore(s => s.openTab)
  const items = useAppStore(s => s.items)
  const getItemPath = useAppStore(s => s.getItemPath)

  useEffect(() => {
    inputRef.current?.focus()

    // Keyboard shortcut to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen])

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const found: SearchResult[] = []

    for (const item of Object.values(items)) {
      if (item.id === 'root') continue

      const nameMatch = item.name.toLowerCase().includes(q)
      const tagMatch = item.tags?.some(t => t.toLowerCase().includes(q))

      let contentMatch = false
      let matchText = ''
      if (item.type === 'page' && item.content) {
        try {
          const parsed = JSON.parse(item.content)
          const extractText = (node: Record<string, unknown>): string => {
            if (node.type === 'text') return (node.text as string) || ''
            if (node.content) return (node.content as Record<string, unknown>[]).map(extractText).join(' ')
            return ''
          }
          const text = extractText(parsed)
          if (text.toLowerCase().includes(q)) {
            contentMatch = true
            const idx = text.toLowerCase().indexOf(q)
            matchText = '...' + text.slice(Math.max(0, idx - 40), idx + 80) + '...'
          }
        } catch {
          // ignore
        }
      }

      if (nameMatch || tagMatch || contentMatch) {
        found.push({
          itemId: item.id,
          title: item.name,
          type: item.type,
          matchText: matchText || undefined,
          tags: item.tags,
          path: getItemPath(item.id),
        })
      }
    }

    // Sort: name matches first, then folders, then pages
    found.sort((a, b) => {
      const aNameMatch = a.title.toLowerCase().includes(q) ? 0 : 1
      const bNameMatch = b.title.toLowerCase().includes(q) ? 0 : 1
      if (aNameMatch !== bNameMatch) return aNameMatch - bNameMatch
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.title.localeCompare(b.title)
    })

    return found.slice(0, 50)
  }, [query, items, getItemPath])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = results[selectedIndex]
      if (result) handleSelect(result)
    }
  }

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'page') {
      openTab(result.itemId)
    }
    setSearchOpen(false)
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="modal"
        style={{ maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          borderBottom: query ? '1px solid var(--border-color)' : 'none',
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, folders, content, tags..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: 15,
              color: 'var(--text-primary)',
              outline: 'none',
              borderRadius: 0,
              padding: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid var(--border-color)',
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        {query && (
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {results.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}>
                No results for "<strong style={{ color: 'var(--text-secondary)' }}>{query}</strong>"
              </div>
            ) : (
              results.map((result, i) => (
                <div
                  key={result.itemId}
                  onClick={() => handleSelect(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 18px',
                    cursor: 'pointer',
                    background: i === selectedIndex ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: i === selectedIndex ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div style={{ marginTop: 2 }}>
                    {result.type === 'folder'
                      ? <Folder size={14} color="#e0a030" />
                      : <FileText size={14} color="var(--text-muted)" />
                    }
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {result.title}
                    </div>
                    {/* Breadcrumb path */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      marginTop: 2,
                      flexWrap: 'wrap',
                    }}>
                      {result.path.slice(0, -1).map((p, pi) => (
                        <React.Fragment key={pi}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p}</span>
                          {pi < result.path.length - 2 && (
                            <ChevronRight size={9} color="var(--text-muted)" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Content snippet */}
                    {result.matchText && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {result.matchText}
                      </div>
                    )}
                    {/* Tags */}
                    {result.tags && result.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {result.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="tag-pill" style={{ fontSize: 10 }}>
                            <Hash size={9} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer hints */}
        {!query && (
          <div style={{ padding: '20px 18px', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-color)' }}>↑↓</kbd> Navigate</span>
              <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-color)' }}>Enter</kbd> Open</span>
              <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-color)' }}>Esc</kbd> Close</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div style={{
            padding: '6px 18px',
            borderTop: '1px solid var(--border-color)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchModal
