import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function setupDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'hellbound-bible.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables()
  seedDefaultData()
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('folder', 'page')),
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_favorited INTEGER NOT NULL DEFAULT 0,
      sort_order REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL DEFAULT '{}',
      template_id TEXT,
      word_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_pages_item ON pages(item_id);

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#dc143c',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (item_id, tag_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '📄',
      content TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS version_history (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_version_page ON version_history(page_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      item_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      date_label TEXT NOT NULL DEFAULT '',
      arc TEXT,
      character_ids TEXT NOT NULL DEFAULT '[]',
      color TEXT NOT NULL DEFAULT '#dc143c',
      sort_order REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS recent_items (
      item_id TEXT NOT NULL,
      accessed_at TEXT NOT NULL,
      PRIMARY KEY (item_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
      item_id UNINDEXED,
      item_name,
      content,
      tokenize = 'porter unicode61'
    );
  `)
}

function seedDefaultData(): void {
  const now = new Date().toISOString()

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM items').get() as { cnt: number }
  if (existing.cnt > 0) return

  // Create root folder
  const rootId = uuidv4()
  db.prepare(`
    INSERT INTO items (id, parent_id, type, name, icon, color, is_pinned, is_favorited, sort_order, created_at, updated_at)
    VALUES (?, NULL, 'folder', 'Hellbound', '🔥', '#dc143c', 0, 0, 0, ?, ?)
  `).run(rootId, now, now)

  // Create top-level folders
  const folders = [
    { name: 'Story', icon: '📖', color: '#dc143c' },
    { name: 'Characters', icon: '👤', color: '#8f0824' },
    { name: 'World', icon: '🌍', color: '#2d2d2d' },
    { name: 'Production', icon: '🎬', color: '#2d2d2d' },
  ]

  folders.forEach((f, i) => {
    const folderId = uuidv4()
    db.prepare(`
      INSERT INTO items (id, parent_id, type, name, icon, color, is_pinned, is_favorited, sort_order, created_at, updated_at)
      VALUES (?, ?, 'folder', ?, ?, ?, 0, 0, ?, ?, ?)
    `).run(folderId, rootId, f.name, f.icon, f.color, i, now, now)
  })

  // Seed default templates
  const templates = [
    {
      id: uuidv4(),
      name: 'Character Page',
      description: 'Complete character profile',
      icon: '👤',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Character Name' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Basic Info' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Age: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Gender: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Role: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Affiliation: ' }, { type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🧠 Personality' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Describe personality here...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📜 Background' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Character history and backstory...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚡ Abilities & Powers' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'List abilities...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🔗 Relationships' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'List key relationships...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📝 Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]
      })
    },
    {
      id: uuidv4(),
      name: 'Episode Page',
      description: 'Episode breakdown',
      icon: '🎬',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Episode Title' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Episode: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Arc: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Status: ' }, { type: 'text', text: 'Draft' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Summary' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Episode summary...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎭 Characters Featured' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📍 Locations' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚡ Key Events' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📝 Script Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]
      })
    },
    {
      id: uuidv4(),
      name: 'Arc Page',
      description: 'Story arc planning',
      icon: '⚔️',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Arc Name' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Episodes: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Status: ' }, { type: 'text', text: 'Planning' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📖 Overview' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Arc overview...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎯 Central Conflict' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📈 Character Development' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '💀 Villain Agenda' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🔚 Resolution' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]
      })
    },
    {
      id: uuidv4(),
      name: 'Location Page',
      description: 'World location details',
      icon: '🗺️',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Location Name' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Type: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Region: ' }, { type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Description' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Describe the location...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🏛️ History' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '👥 Notable Residents' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📝 Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]
      })
    },
    {
      id: uuidv4(),
      name: 'Power/Ability Page',
      description: 'Power system documentation',
      icon: '⚡',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Power Name' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'User: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Type: ' }, { type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Description' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚡ Abilities' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚠️ Weaknesses/Limits' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]
      })
    },
    {
      id: uuidv4(),
      name: 'Timeline Event',
      description: 'A single timeline event',
      icon: '📅',
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Event Title' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Date/Time: ' }, { type: 'text', text: '' }] },
          { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Arc: ' }, { type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Description' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎭 Characters Involved' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '💥 Consequences' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]
      })
    },
  ]

  const insertTemplate = db.prepare(`
    INSERT INTO templates (id, name, description, icon, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  for (const t of templates) {
    insertTemplate.run(t.id, t.name, t.description, t.icon, t.content, now)
  }

  // Seed default settings
  const settings = [
    { key: 'theme', value: 'dark' },
    { key: 'font_size', value: '14' },
    { key: 'explorer_width', value: '280' },
    { key: 'show_right_panel', value: 'false' },
    { key: 'autosave_interval', value: '3000' },
  ]
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  for (const s of settings) {
    insertSetting.run(s.key, s.value)
  }

  // Seed default tags
  const tags = [
    { id: uuidv4(), name: 'Character', color: '#dc143c' },
    { id: uuidv4(), name: 'Episode', color: '#b50d2e' },
    { id: uuidv4(), name: 'Draft', color: '#6b6b6b' },
    { id: uuidv4(), name: 'Important', color: '#dc143c' },
    { id: uuidv4(), name: 'Needs Rewrite', color: '#ff8a8a' },
    { id: uuidv4(), name: 'Canon', color: '#dc143c' },
    { id: uuidv4(), name: 'Season 1', color: '#8f0824' },
    { id: uuidv4(), name: 'Flashback', color: '#4a4a4a' },
  ]
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)')
  for (const t of tags) {
    insertTag.run(t.id, t.name, t.color, now)
  }
}
