export type FileItemType = 'folder' | 'page'

export interface Version {
  id: string
  content: string
  savedAt: string
  label?: string
}

export interface FileItem {
  id: string
  name: string
  type: FileItemType
  parentId: string | null
  children: string[]
  color?: string
  icon?: string
  isPinned: boolean
  isFavorite: boolean
  isExpanded?: boolean
  createdAt: string
  updatedAt: string
  // Page-specific
  content?: string // TipTap JSON string
  tags?: string[]
  templateType?: TemplateType
  versions?: Version[]
  wordCount?: number
}

export type TemplateType =
  | 'blank'
  | 'character'
  | 'episode'
  | 'arc'
  | 'location'
  | 'power'
  | 'timeline-event'
  | 'organization'
  | 'weapon'
  | 'creature'
  | 'relationship'

export interface Tab {
  id: string
  pageId: string
  title: string
  isDirty: boolean
}

export interface WorkspaceState {
  items: Record<string, FileItem>
  openTabs: Tab[]
  activeTabId: string | null
  recentPages: string[] // page IDs
  settings: AppSettings
}

export interface AppSettings {
  theme?: 'dark'
  fontSize?: number
  fontFamily?: string
  accentColor?: string
  leftPanelWidth?: number
  rightPanelVisible?: boolean
  rightPanelWidth?: number
}

export interface SearchResult {
  itemId: string
  title: string
  type: FileItemType
  matchText?: string
  tags?: string[]
  path: string[]
}

export interface ContextMenuOption {
  label: string
  icon?: string
  action: () => void
  danger?: boolean
  divider?: boolean
  disabled?: boolean
}

export interface DragState {
  draggedId: string | null
  dragOverId: string | null
}

export const TEMPLATE_DEFINITIONS: Record<TemplateType, { label: string; icon: string; content: string }> = {
  blank: {
    label: 'Blank Page',
    icon: 'file',
    content: ''
  },
  character: {
    label: 'Character',
    icon: 'user',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Character Name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Brief description of this character.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Appearance' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe their physical appearance.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Personality' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe their personality traits.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Abilities & Powers' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ability 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Background' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Character backstory and history.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Relationships' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Relationship' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Goals & Motivations' }] },
        { type: 'paragraph', content: [{ type: 'text', text: "What drives this character?" }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Arc Development' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How does this character grow throughout the story?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  episode: {
    label: 'Episode',
    icon: 'tv',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Episode Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Episode number: ' }, { type: 'text', marks: [{ type: 'bold' }], text: 'E01' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Synopsis' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Brief episode overview.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Opening Scene' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe the opening.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Act 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Setup.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Act 2' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Confrontation / Rising action.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Act 3' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Resolution.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Characters' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Character name' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Locations' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Location name' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Production Notes' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tasks' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write script' }] }] }, { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create storyboard' }] }] }] }
      ]
    })
  },
  arc: {
    label: 'Story Arc',
    icon: 'layers',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Arc Title' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What is this arc about?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Central Conflict' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Main conflict of the arc.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Episodes' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Episode 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Character Development' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How do characters grow in this arc?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Themes' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Theme 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Resolution' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How does the arc resolve?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  location: {
    label: 'Location',
    icon: 'map-pin',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Location Name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Description' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe this location.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Atmosphere' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What does it feel like to be here?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'History' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Background of this place.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notable Features' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Connected Locations' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nearby location' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  power: {
    label: 'Power / Ability',
    icon: 'zap',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Power Name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Description' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What does this power do?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Users' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Character name' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Mechanics' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How does it work?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Limitations' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Limitation 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Weaknesses' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Weakness 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  'timeline-event': {
    label: 'Timeline Event',
    icon: 'calendar',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Event Name' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Date/Time: ' }, { type: 'text', text: 'In-universe date' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Description' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What happened?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Involved Characters' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Character name' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Consequences' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What changed after this event?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  organization: {
    label: 'Organization',
    icon: 'users',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Organization Name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What is this organization?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Purpose / Goals' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What do they want?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Leadership' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leader name – role' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Members' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Member name' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Resources & Influence' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What resources do they control?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'History' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Origin and history.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  weapon: {
    label: 'Weapon',
    icon: 'sword',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Weapon Name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Description' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe this weapon.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Type' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'e.g. sword, gun, mystical artifact' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Owner / Wielder' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Character name' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Abilities' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ability 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'History / Origin' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Where does this weapon come from?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  creature: {
    label: 'Creature',
    icon: 'bug',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Creature Name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Description' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe this creature.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Habitat' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Where does it live?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Abilities' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ability 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Weaknesses' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Weakness 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Lore' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Cultural significance and lore.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  },
  relationship: {
    label: 'Relationship',
    icon: 'heart',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Relationship' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Between: ' }, { type: 'text', text: 'Character A & Character B' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Nature of Relationship' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'e.g. rivals, allies, family, romantic' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: "Character A's Perspective" }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How do they see the other?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: "Character B's Perspective" }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How do they see the other?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'History' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'How did this relationship form?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Moments' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Moment 1' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph' }
      ]
    })
  }
}
