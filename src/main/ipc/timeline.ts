import { IpcMain } from 'electron'
import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerTimelineHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('timeline:getAll', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM timeline_events ORDER BY sort_order ASC, created_at ASC').all()
  })

  ipcMain.handle('timeline:create', (_e, event: {
    item_id?: string | null
    title: string
    description?: string
    date_label?: string
    arc?: string | null
    character_ids?: string[]
    color?: string
  }) => {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuidv4()
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM timeline_events').get() as { m: number | null }
    const sortOrder = (maxOrder?.m ?? -1) + 1

    db.prepare(`
      INSERT INTO timeline_events (id, item_id, title, description, date_label, arc, character_ids, color, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      event.item_id ?? null,
      event.title,
      event.description ?? '',
      event.date_label ?? '',
      event.arc ?? null,
      JSON.stringify(event.character_ids ?? []),
      event.color ?? '#dc143c',
      sortOrder,
      now
    )
    return db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id)
  })

  ipcMain.handle('timeline:update', (_e, id: string, updates: {
    title?: string
    description?: string
    date_label?: string
    arc?: string | null
    character_ids?: string[]
    color?: string
    sort_order?: number
    item_id?: string | null
  }) => {
    const db = getDb()
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
    if (updates.date_label !== undefined) { fields.push('date_label = ?'); values.push(updates.date_label) }
    if (updates.arc !== undefined) { fields.push('arc = ?'); values.push(updates.arc) }
    if (updates.character_ids !== undefined) { fields.push('character_ids = ?'); values.push(JSON.stringify(updates.character_ids)) }
    if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color) }
    if (updates.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(updates.sort_order) }
    if (updates.item_id !== undefined) { fields.push('item_id = ?'); values.push(updates.item_id) }

    if (fields.length > 0) {
      values.push(id)
      db.prepare(`UPDATE timeline_events SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    return db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id)
  })

  ipcMain.handle('timeline:delete', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM timeline_events WHERE id = ?').run(id)
    return { success: true }
  })
}
