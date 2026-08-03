export type ItemKind = 'folder' | 'page'

export interface WorkspaceItemBase {
  id: string
  name: string
  kind: ItemKind
  parentId: string | null
  color?: string
  icon?: string
  favorite?: boolean
  pinned?: boolean
  createdAt: number
  updatedAt: number
}

export interface WorkspaceFolder extends WorkspaceItemBase {
  kind: 'folder'
  childrenIds: string[]
  collapsed?: boolean
}

export interface PageTask {
  id: string
  text: string
  done: boolean
  dueDate?: string
}

export interface PageVersion {
  id: string
  savedAt: number
  content: string
  title: string
  tags: string[]
}

export interface PageTimelineRef {
  eventId: string
}

export interface WorkspacePage extends WorkspaceItemBase {
  kind: 'page'
  content: string
  tags: string[]
  links: string[]
  tasks: PageTask[]
  templateId?: string
  versions: PageVersion[]
  media: string[]
  timelineRefs: PageTimelineRef[]
}

export type WorkspaceItem = WorkspaceFolder | WorkspacePage

export interface TimelineEvent {
  id: string
  title: string
  date: string
  character?: string
  arc?: string
  country?: string
  linkedPageIds: string[]
}

export interface ActivityItem {
  id: string
  at: number
  message: string
}

export interface PageTemplate {
  id: string
  name: string
  prefillHtml: string
  prefillTags: string[]
}

export interface WorkspaceState {
  rootId: string
  items: Record<string, WorkspaceItem>
  selectedId: string
  openTabs: string[]
  activeTabId?: string
  clipboard?: {
    sourceId: string
    cut: boolean
  }
  recentPageIds: string[]
  activity: ActivityItem[]
  templates: PageTemplate[]
  timeline: TimelineEvent[]
  currentArc?: string
  currentEpisode?: string
}
