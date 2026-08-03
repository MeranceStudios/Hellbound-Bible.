import { IpcMain } from 'electron'
import { getDb } from '../database'

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:getAll', () => {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM settings').all() as Array<{ key: string; value: string }>
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  })

  ipcMain.handle('settings:get', (_e, key: string) => {
    const db = getDb()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  })

  ipcMain.handle('settings:set', (_e, key: string, value: string) => {
    const db = getDb()
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
    return { success: true }
  })
}
