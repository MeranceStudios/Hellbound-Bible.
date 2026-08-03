import { IpcMain } from 'electron'
import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerSearchHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('search:query', (_e, query: string) => {
    const db = getDb()
    if (!query.trim()) return []

    try {
      // FTS search
      const ftsResults = db.prepare(`
        SELECT item_id, item_name,
          snippet(pages_fts, 2, '<mark>', '</mark>', '...', 24) as snippet,
          rank
        FROM pages_fts
        WHERE pages_fts MATCH ?
        ORDER BY rank
        LIMIT 50
      `).all(`"${query.replace(/"/g, '')}*"`) as Array<{
        item_id: string
        item_name: string
        snippet: string
        rank: number
      }>

      // Also search item names directly
      const nameResults = db.prepare(`
        SELECT id as item_id, name as item_name, type, parent_id
        FROM items
        WHERE name LIKE ? COLLATE NOCASE
        LIMIT 20
      `).all(`%${query}%`) as Array<{
        item_id: string
        item_name: string
        type: string
        parent_id: string | null
      }>

      const results: Array<{
        item_id: string
        item_name: string
        item_type: string
        parent_path: string
        snippet: string
        score: number
      }> = []

      // Process FTS results
      const seen = new Set<string>()
      for (const r of ftsResults) {
        if (seen.has(r.item_id)) continue
        seen.add(r.item_id)
        const item = db.prepare('SELECT type, parent_id FROM items WHERE id = ?').get(r.item_id) as { type: string; parent_id: string | null } | undefined
        if (!item) continue
        results.push({
          item_id: r.item_id,
          item_name: r.item_name,
          item_type: item.type,
          parent_path: getParentPath(db, item.parent_id),
          snippet: r.snippet,
          score: r.rank
        })
      }

      // Add name results not already included
      for (const r of nameResults) {
        if (seen.has(r.item_id)) continue
        seen.add(r.item_id)
        results.push({
          item_id: r.item_id,
          item_name: r.item_name,
          item_type: r.type,
          parent_path: getParentPath(db, r.parent_id),
          snippet: `Name match: ${r.item_name}`,
          score: -100
        })
      }

      return results
    } catch {
      // Fallback to simple LIKE search
      return db.prepare(`
        SELECT i.id as item_id, i.name as item_name, i.type as item_type, i.parent_id
        FROM items i
        WHERE i.name LIKE ? COLLATE NOCASE
        LIMIT 30
      `).all(`%${query}%`)
    }
  })
}

function getParentPath(db: ReturnType<typeof import('../database').getDb>, parentId: string | null): string {
  if (!parentId) return ''
  const parts: string[] = []
  let current = db.prepare('SELECT name, parent_id FROM items WHERE id = ?').get(parentId) as { name: string; parent_id: string | null } | undefined
  while (current) {
    parts.unshift(current.name)
    if (!current.parent_id) break
    current = db.prepare('SELECT name, parent_id FROM items WHERE id = ?').get(current.parent_id) as { name: string; parent_id: string | null } | undefined
  }
  return parts.join(' / ')
}
