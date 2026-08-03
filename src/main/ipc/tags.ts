import { IpcMain } from 'electron'
import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerTagHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('tags:getAll', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM tags ORDER BY name ASC').all()
  })

  ipcMain.handle('tags:create', (_e, name: string, color: string) => {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuidv4()
    db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)').run(id, name, color, now)
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
  })

  ipcMain.handle('tags:update', (_e, id: string, name: string, color: string) => {
    const db = getDb()
    db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(name, color, id)
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
  })

  ipcMain.handle('tags:delete', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM tags WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('tags:getForItem', (_e, itemId: string) => {
    const db = getDb()
    return db.prepare(`
      SELECT t.* FROM tags t
      JOIN item_tags it ON it.tag_id = t.id
      WHERE it.item_id = ?
    `).all(itemId)
  })

  ipcMain.handle('tags:setForItem', (_e, itemId: string, tagIds: string[]) => {
    const db = getDb()
    db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(itemId)
    const stmt = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)')
    const tx = db.transaction((ids: string[]) => {
      for (const tid of ids) {
        stmt.run(itemId, tid)
      }
    })
    tx(tagIds)
    return { success: true }
  })

  ipcMain.handle('tags:addToItem', (_e, itemId: string, tagId: string) => {
    const db = getDb()
    db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)').run(itemId, tagId)
    return { success: true }
  })

  ipcMain.handle('tags:removeFromItem', (_e, itemId: string, tagId: string) => {
    const db = getDb()
    db.prepare('DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?').run(itemId, tagId)
    return { success: true }
  })
}
