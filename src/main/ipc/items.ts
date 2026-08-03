import { IpcMain } from 'electron'
import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerItemHandlers(ipcMain: IpcMain): void {
  // Get all items (for building the tree)
  ipcMain.handle('items:getAll', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM items ORDER BY sort_order ASC, name ASC').all()
  })

  // Get children of a parent
  ipcMain.handle('items:getChildren', (_e, parentId: string | null) => {
    const db = getDb()
    if (parentId === null) {
      return db.prepare("SELECT * FROM items WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC").all()
    }
    return db.prepare("SELECT * FROM items WHERE parent_id = ? ORDER BY sort_order ASC, name ASC").all(parentId)
  })

  // Get a single item
  ipcMain.handle('items:get', (_e, id: string) => {
    const db = getDb()
    return db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  })

  // Create item
  ipcMain.handle('items:create', (_e, item: {
    parent_id: string | null
    type: 'folder' | 'page'
    name: string
    icon?: string
    color?: string
    template_id?: string
  }) => {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuidv4()

    // Get max sort order among siblings
    const maxOrder = db.prepare(
      item.parent_id
        ? 'SELECT MAX(sort_order) as m FROM items WHERE parent_id = ?'
        : 'SELECT MAX(sort_order) as m FROM items WHERE parent_id IS NULL'
    ).get(item.parent_id ? [item.parent_id] : []) as { m: number | null }

    const sortOrder = (maxOrder?.m ?? -1) + 1

    db.prepare(`
      INSERT INTO items (id, parent_id, type, name, icon, color, is_pinned, is_favorited, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
    `).run(id, item.parent_id, item.type, item.name, item.icon ?? null, item.color ?? null, sortOrder, now, now)

    if (item.type === 'page') {
      const pageId = uuidv4()
      let content = '{}'
      if (item.template_id) {
        const tmpl = db.prepare('SELECT content FROM templates WHERE id = ?').get(item.template_id) as { content: string } | undefined
        if (tmpl) content = tmpl.content
      }
      db.prepare(`
        INSERT INTO pages (id, item_id, content, template_id, word_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `).run(pageId, id, content, item.template_id ?? null, now, now)

      // FTS
      db.prepare('INSERT INTO pages_fts (item_id, item_name, content) VALUES (?, ?, ?)').run(id, item.name, '')
    }

    return db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  })

  // Update item
  ipcMain.handle('items:update', (_e, id: string, updates: {
    name?: string
    icon?: string | null
    color?: string | null
    is_pinned?: boolean
    is_favorited?: boolean
    sort_order?: number
    parent_id?: string | null
  }) => {
    const db = getDb()
    const now = new Date().toISOString()
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Record<string, unknown>
    if (!item) return null

    const fields = ['updated_at = ?']
    const values: unknown[] = [now]

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
    if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon) }
    if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color) }
    if (updates.is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(updates.is_pinned ? 1 : 0) }
    if (updates.is_favorited !== undefined) { fields.push('is_favorited = ?'); values.push(updates.is_favorited ? 1 : 0) }
    if (updates.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(updates.sort_order) }
    if (updates.parent_id !== undefined) { fields.push('parent_id = ?'); values.push(updates.parent_id) }

    values.push(id)
    db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    if (updates.name !== undefined) {
      db.prepare('UPDATE pages_fts SET item_name = ? WHERE item_id = ?').run(updates.name, id)
    }

    return db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  })

  // Delete item (cascades to children via FK)
  ipcMain.handle('items:delete', (_e, id: string) => {
    const db = getDb()
    // Collect all descendant IDs for FTS cleanup
    const allIds = getAllDescendantIds(db, id)
    allIds.push(id)

    db.prepare('DELETE FROM items WHERE id = ?').run(id)

    // Clean FTS
    for (const did of allIds) {
      db.prepare('DELETE FROM pages_fts WHERE item_id = ?').run(did)
    }

    return { success: true }
  })

  // Duplicate item (deep copy)
  ipcMain.handle('items:duplicate', (_e, id: string) => {
    const db = getDb()
    return duplicateItem(db, id, null)
  })

  // Move item
  ipcMain.handle('items:move', (_e, id: string, newParentId: string | null) => {
    const db = getDb()
    const now = new Date().toISOString()

    // Get max sort order in target
    const maxOrder = db.prepare(
      newParentId
        ? 'SELECT MAX(sort_order) as m FROM items WHERE parent_id = ?'
        : 'SELECT MAX(sort_order) as m FROM items WHERE parent_id IS NULL'
    ).get(newParentId ? [newParentId] : []) as { m: number | null }
    const sortOrder = (maxOrder?.m ?? -1) + 1

    db.prepare('UPDATE items SET parent_id = ?, sort_order = ?, updated_at = ? WHERE id = ?')
      .run(newParentId, sortOrder, now, id)

    return db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  })

  // Reorder items
  ipcMain.handle('items:reorder', (_e, orders: Array<{ id: string; sort_order: number }>) => {
    const db = getDb()
    const now = new Date().toISOString()
    const stmt = db.prepare('UPDATE items SET sort_order = ?, updated_at = ? WHERE id = ?')
    const tx = db.transaction((orders: Array<{ id: string; sort_order: number }>) => {
      for (const o of orders) {
        stmt.run(o.sort_order, now, o.id)
      }
    })
    tx(orders)
    return { success: true }
  })

  // Get breadcrumb path
  ipcMain.handle('items:getBreadcrumb', (_e, id: string) => {
    const db = getDb()
    const path: unknown[] = []
    let current = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    while (current) {
      path.unshift(current)
      const c = current as { parent_id: string | null }
      if (!c.parent_id) break
      current = db.prepare('SELECT * FROM items WHERE id = ?').get(c.parent_id)
    }
    return path
  })

  // Get item with tags
  ipcMain.handle('items:getWithTags', (_e, id: string) => {
    const db = getDb()
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    if (!item) return null
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN item_tags it ON it.tag_id = t.id
      WHERE it.item_id = ?
    `).all(id)
    return { ...item, tags }
  })

  // Record recent access
  ipcMain.handle('items:recordAccess', (_e, id: string) => {
    const db = getDb()
    const now = new Date().toISOString()
    db.prepare('INSERT OR REPLACE INTO recent_items (item_id, accessed_at) VALUES (?, ?)').run(id, now)
    return { success: true }
  })

  // Get recent items
  ipcMain.handle('items:getRecent', (_e, limit = 10) => {
    const db = getDb()
    return db.prepare(`
      SELECT i.*, r.accessed_at FROM items i
      JOIN recent_items r ON r.item_id = i.id
      ORDER BY r.accessed_at DESC
      LIMIT ?
    `).all(limit)
  })

  // Get favorites
  ipcMain.handle('items:getFavorites', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM items WHERE is_favorited = 1 ORDER BY name ASC').all()
  })

  // Get pinned
  ipcMain.handle('items:getPinned', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM items WHERE is_pinned = 1 ORDER BY name ASC').all()
  })

  // Get stats
  ipcMain.handle('items:getStats', () => {
    const db = getDb()
    const folderCount = (db.prepare("SELECT COUNT(*) as c FROM items WHERE type = 'folder'").get() as { c: number }).c
    const pageCount = (db.prepare("SELECT COUNT(*) as c FROM items WHERE type = 'page'").get() as { c: number }).c
    const wordCount = (db.prepare('SELECT SUM(word_count) as s FROM pages').get() as { s: number | null }).s ?? 0
    return { folder_count: folderCount, page_count: pageCount, word_count: wordCount }
  })
}

function getAllDescendantIds(db: ReturnType<typeof getDb>, id: string): string[] {
  const children = db.prepare('SELECT id FROM items WHERE parent_id = ?').all(id) as { id: string }[]
  const ids: string[] = []
  for (const child of children) {
    ids.push(child.id)
    ids.push(...getAllDescendantIds(db, child.id))
  }
  return ids
}

function duplicateItem(db: ReturnType<typeof getDb>, id: string, newParentId: string | null | undefined): unknown {
  const now = new Date().toISOString()
  const original = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Record<string, unknown>
  if (!original) return null

  const newId = uuidv4()
  const parentId = newParentId !== undefined ? newParentId : original.parent_id as string | null

  // Get max sort order
  const maxOrder = db.prepare(
    parentId
      ? 'SELECT MAX(sort_order) as m FROM items WHERE parent_id = ?'
      : 'SELECT MAX(sort_order) as m FROM items WHERE parent_id IS NULL'
  ).get(parentId ? [parentId] : []) as { m: number | null }
  const sortOrder = (maxOrder?.m ?? -1) + 1

  db.prepare(`
    INSERT INTO items (id, parent_id, type, name, icon, color, is_pinned, is_favorited, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
  `).run(newId, parentId, original.type, `${original.name} (Copy)`, original.icon, original.color, sortOrder, now, now)

  if (original.type === 'page') {
    const origPage = db.prepare('SELECT * FROM pages WHERE item_id = ?').get(id) as Record<string, unknown> | undefined
    const pageId = uuidv4()
    db.prepare(`
      INSERT INTO pages (id, item_id, content, template_id, word_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(pageId, newId, origPage?.content ?? '{}', origPage?.template_id ?? null, origPage?.word_count ?? 0, now, now)
    db.prepare('INSERT INTO pages_fts (item_id, item_name, content) VALUES (?, ?, ?)').run(newId, `${original.name} (Copy)`, '')
  }

  // Duplicate children
  const children = db.prepare('SELECT id FROM items WHERE parent_id = ?').all(id) as { id: string }[]
  for (const child of children) {
    duplicateItem(db, child.id, newId)
  }

  return db.prepare('SELECT * FROM items WHERE id = ?').get(newId)
}
