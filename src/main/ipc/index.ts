import { IpcMain } from 'electron'
import { registerItemHandlers } from './items'
import { registerPageHandlers } from './pages'
import { registerTagHandlers } from './tags'
import { registerTemplateHandlers } from './templates'
import { registerSearchHandlers } from './search'
import { registerTimelineHandlers } from './timeline'
import { registerSettingsHandlers } from './settings'

export function registerIpcHandlers(ipcMain: IpcMain): void {
  registerItemHandlers(ipcMain)
  registerPageHandlers(ipcMain)
  registerTagHandlers(ipcMain)
  registerTemplateHandlers(ipcMain)
  registerSearchHandlers(ipcMain)
  registerTimelineHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
}
