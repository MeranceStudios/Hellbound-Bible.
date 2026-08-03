import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, FileText, Folder, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'
import type { SearchResult } from '../../types'

export function SearchView(): React.ReactElement {
  const { searchQuery, setSearchQuery, openTab, items, setCurrentView } = useAppStore()
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (searchQuery) {
      doSearch(searchQuery)
    }
  }, [])

  const doSearch = useCallback(async (q: string): Promise<void> => {
    if (!q.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const r = await api.search.query(q)
      setResults(r as SearchResult[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleQueryChange = (q: string): void => {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(q), 200)
  }

  const handleOpenResult = (result: SearchResult): void => {
    const item = items.find((i) => i.id === result.item_id)
    if (item && item.type === 'page') {
      openTab(item)
      api.items.recordAccess(item.id).catch(console.error)
      setCurrentView('editor')
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
      }}
    >
      {/* Search header */}
      <div
        style={{
          padding: '20px 24px 12px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--color-surface2)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '10px 14px',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-crimson)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        >
          <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search everything — pages, folders, content, characters..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--color-text)',
              userSelect: 'text',
            }}
          />
          {isSearching && (
            <div
              style={{
                width: 14,
                height: 14,
                border: '2px solid var(--color-crimson)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          )}
        </div>
        {searchQuery && (
          <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 8 }}>
            {isSearching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${searchQuery}"`}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
        {!searchQuery && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: 'var(--color-text-subtle)',
            }}
          >
            <Search size={48} style={{ opacity: 0.2 }} />
            <div style={{ fontSize: 16, fontWeight: 500 }}>Search everything</div>
            <div style={{ fontSize: 13 }}>Find pages, folders, characters, episodes, and more</div>
          </div>
        )}

        {searchQuery && results.length === 0 && !isSearching && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: 'var(--color-text-subtle)',
            }}
          >
            <div style={{ fontSize: 15 }}>No results found</div>
            <div style={{ fontSize: 13 }}>Try different keywords</div>
          </div>
        )}

        {results.map((result) => (
          <SearchResultItem
            key={result.item_id}
            result={result}
            onClick={() => handleOpenResult(result)}
          />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function SearchResultItem({
  result,
  onClick,
}: {
  result: SearchResult
  onClick: () => void
}): React.ReactElement {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 24px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(45,45,45,0.5)',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ marginTop: 2, flexShrink: 0 }}>
        {result.item_type === 'folder' ? (
          <Folder size={16} style={{ color: 'var(--color-crimson)' }} />
        ) : (
          <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#ffffff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.item_name}
        </div>
        {result.parent_path && (
          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 1 }}>
            {result.parent_path}
          </div>
        )}
        {result.snippet && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            dangerouslySetInnerHTML={{ __html: result.snippet }}
          />
        )}
      </div>
      <ArrowRight size={14} style={{ color: 'var(--color-text-subtle)', flexShrink: 0, marginTop: 3 }} />
    </div>
  )
}
