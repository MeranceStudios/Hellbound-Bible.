import { IpcMain } from 'electron'
import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerPageHandlers(ipcMain: IpcMain): void {
  // Get page content
  ipcMain.handle('pages:get', (_e, itemId: string) => {
    const db = getDb()
    return db.prepare('SELECT * FROM pages WHERE item_id = ?').get(itemId)
  })

  // Save page content (autosave)
  ipcMain.handle('pages:save', (_e, itemId: string, content: string) => {
    const db = getDb()
    const now = new Date().toISOString()

    // Count words from text extraction
    let wordCount = 0
    try {
      const parsed = JSON.parse(content)
      wordCount = countWords(parsed)
    } catch { /* ignore */ }

    const existing = db.prepare('SELECT id FROM pages WHERE item_id = ?').get(itemId) as { id: string } | undefined
    if (!existing) {
      const pageId = uuidv4()
      db.prepare(`
        INSERT INTO pages (id, item_id, content, template_id, word_count, created_at, updated_at)
        VALUES (?, ?, ?, NULL, ?, ?, ?)
      `).run(pageId, itemId, content, wordCount, now, now)
    } else {
      // Save version history before overwriting
      const current = db.prepare('SELECT content, word_count FROM pages WHERE item_id = ?').get(itemId) as { content: string; word_count: number } | undefined
      if (current && current.content !== content) {
        const histId = uuidv4()
        db.prepare(`
          INSERT INTO version_history (id, page_id, content, word_count, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(histId, existing.id, current.content, current.word_count, now)

        // Keep only last 50 versions
        db.prepare(`
          DELETE FROM version_history
          WHERE page_id = ? AND id NOT IN (
            SELECT id FROM version_history WHERE page_id = ? ORDER BY created_at DESC LIMIT 50
          )
        `).run(existing.id, existing.id)
      }

      db.prepare('UPDATE pages SET content = ?, word_count = ?, updated_at = ? WHERE item_id = ?')
        .run(content, wordCount, now, itemId)
    }

    // Update item's updated_at
    db.prepare('UPDATE items SET updated_at = ? WHERE id = ?').run(now, itemId)

    // Update FTS - extract plain text from content
    const plainText = extractPlainText(content)
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(itemId) as { name: string } | undefined
    db.prepare('UPDATE pages_fts SET content = ?, item_name = ? WHERE item_id = ?')
      .run(plainText, item?.name ?? '', itemId)

    return { success: true, word_count: wordCount }
  })

  // Get version history
  ipcMain.handle('pages:getHistory', (_e, itemId: string) => {
    const db = getDb()
    const page = db.prepare('SELECT id FROM pages WHERE item_id = ?').get(itemId) as { id: string } | undefined
    if (!page) return []
    return db.prepare(`
      SELECT * FROM version_history
      WHERE page_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(page.id)
  })

  // Restore version
  ipcMain.handle('pages:restoreVersion', (_e, itemId: string, versionId: string) => {
    const db = getDb()
    const now = new Date().toISOString()
    const version = db.prepare('SELECT * FROM version_history WHERE id = ?').get(versionId) as { content: string; word_count: number } | undefined
    if (!version) return { success: false }

    db.prepare('UPDATE pages SET content = ?, word_count = ?, updated_at = ? WHERE item_id = ?')
      .run(version.content, version.word_count, now, itemId)

    return { success: true, content: version.content }
  })
}

function countWords(doc: Record<string, unknown>): number {
  let count = 0
  function traverse(node: Record<string, unknown>): void {
    if (node.type === 'text' && typeof node.text === 'string') {
      count += node.text.trim().split(/\s+/).filter(Boolean).length
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child as Record<string, unknown>)
      }
    }
  }
  traverse(doc)
  return count
}

function extractPlainText(content: string): string {
  try {
    const doc = JSON.parse(content)
    const texts: string[] = []
    function traverse(node: Record<string, unknown>): void {
      if (node.type === 'text' && typeof node.text === 'string') {
        texts.push(node.text)
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          traverse(child as Record<string, unknown>)
        }
      }
    }
    traverse(doc)
    return texts.join(' ')
  } catch {
    return ''
  }
}
