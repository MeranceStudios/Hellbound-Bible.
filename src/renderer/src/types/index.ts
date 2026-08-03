export type ItemType = 'folder' | 'page'

export interface FileItem {
  id: string
  parent_id: string | null
  type: ItemType
  name: string
  icon: string | null
  color: string | null
  is_pinned: boolean
  is_favorited: boolean
  sort_order: number
  created_at: string
  updated_at: string
  tags?: string[]
}

export interface Page {
  id: string
  item_id: string
  content: string // JSON string (TipTap JSON)
  template_id: string | null
  word_count: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface ItemTag {
  item_id: string
  tag_id: string
}

export interface Template {
  id: string
  name: string
  description: string
  icon: string
  content: string // JSON string (TipTap JSON)
  created_at: string
}

export interface VersionHistory {
  id: string
  page_id: string
  content: string
  word_count: number
  created_at: string
}

export interface TimelineEvent {
  id: string
  item_id: string | null
  title: string
  description: string
  date_label: string
  arc: string | null
  character_ids: string // JSON array
  color: string
  sort_order: number
  created_at: string
}

export interface AppSettings {
  key: string
  value: string
}

// UI state types
export interface Tab {
  id: string
  item_id: string
  name: string
  icon: string | null
  color: string | null
  is_dirty: boolean
}

export interface SearchResult {
  item_id: string
  item_name: string
  item_type: ItemType
  parent_path: string
  snippet: string
  score: number
}

export interface TreeNode extends FileItem {
  children: TreeNode[]
  depth: number
  is_expanded: boolean
}

export interface DashboardStats {
  character_count: number
  episode_count: number
  word_count: number
  folder_count: number
  page_count: number
}

export interface RecentItem {
  item_id: string
  name: string
  type: ItemType
  icon: string | null
  color: string | null
  accessed_at: string
}

export interface DragItem {
  id: string
  type: 'FILE_ITEM'
  item: FileItem
}
