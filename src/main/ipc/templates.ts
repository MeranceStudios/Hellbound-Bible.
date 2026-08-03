import { IpcMain } from 'electron'
import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerTemplateHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('templates:getAll', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM templates ORDER BY name ASC').all()
  })

  ipcMain.handle('templates:get', (_e, id: string) => {
    const db = getDb()
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id)
  })

  ipcMain.handle('templates:create', (_e, tmpl: {
    name: string
    description: string
    icon: string
    content: string
  }) => {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuidv4()
    db.prepare('INSERT INTO templates (id, name, description, icon, content, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, tmpl.name, tmpl.description, tmpl.icon, tmpl.content, now)
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id)
  })

  ipcMain.handle('templates:update', (_e, id: string, updates: {
    name?: string
    description?: string
    icon?: string
    content?: string
  }) => {
    const db = getDb()
    const fields: string[] = []
    const values: unknown[] = []
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
    if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon) }
    if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content) }
    if (fields.length === 0) return db.prepare('SELECT * FROM templates WHERE id = ?').get(id)
    values.push(id)
    db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id)
  })

  ipcMain.handle('templates:delete', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM templates WHERE id = ?').run(id)
    return { success: true }
  })
}
