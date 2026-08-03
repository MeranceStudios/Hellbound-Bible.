# Hellbound Bible

> **Professional anime production & story management desktop application for _Hellbound_.**

A feature-rich desktop workspace built with Electron + React + TipTap, inspired by VS Code, Windows File Explorer, Notion, and Obsidian — purpose-built for creating a complete anime series.

---

## Features

### 🗂️ Unlimited File Explorer
- Nested folders & pages with **no depth limit**
- Drag-and-drop reorganization
- Rename, duplicate, delete, move, pin, favorite
- Per-item color coding and icons
- Context menu with all operations
- Quick filter in the sidebar

### 📝 Rich-Text Editor
- Full formatting: bold, italic, underline, strikethrough, code, highlight
- Headings (H1–H6), blockquotes, horizontal rules
- Bullet lists, ordered lists, task lists (checklists)
- Tables with resizable columns
- Image insertion (drag-and-drop or file picker)
- YouTube video embeds
- Links with auto-linking
- Text alignment (left / center / right)
- Bubble menu for quick formatting on selected text

### 📋 Page Templates
| Template | Purpose |
|---|---|
| Blank | Empty canvas |
| Character | Character profile (appearance, abilities, relationships, arc) |
| Episode | Episode breakdown (synopsis, acts, characters, tasks) |
| Story Arc | Arc overview (conflict, episodes, themes, resolution) |
| Location | Place description (atmosphere, history, features) |
| Power / Ability | Power mechanics & limitations |
| Timeline Event | In-universe event (date, characters, consequences) |
| Organization | Faction/group (goals, leadership, members) |
| Weapon | Weapon profile (abilities, owner, origin) |
| Creature | Creature profile (habitat, abilities, lore) |
| Relationship | Two-character dynamic |

### 🔍 Global Search
- Instant search across **all** pages, folders, content, and tags
- Keyboard navigation (↑↓ arrow keys, Enter to open)
- Breadcrumb path shown for each result
- Content snippets with match context

### 🏠 Dashboard
- Statistics (pages, folders, words, characters, episodes, favorites)
- Recent pages, pinned items, favorites
- Quick-create buttons
- Getting-started guide for new workspaces

### 💾 Autosave & Version History
- Automatic save on every edit (500ms debounce)
- Auto-version every 5 minutes
- Manual version saves from the toolbar
- Restore any previous version (with automatic pre-restore backup)

### 🏷️ Tags
- Unlimited tags per page
- Tag display in editor header
- Tags included in full-text search

### 🎨 Dark Theme
- Black / Dark Gray / Crimson Red / White color palette
- VS Code-inspired interface
- Custom scrollbars, transitions, and context menus

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron 33 |
| Build | electron-vite + Vite 5 |
| UI | React 18 + TypeScript |
| Editor | TipTap v2 |
| State | Zustand |
| Icons | Lucide React |
| Persistence | Node.js `fs` (JSON in userData) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run (Development)
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run dist   # packages for your OS
```

### Project Structure
```
hellbound-bible/
├── electron/
│   ├── main/index.ts       # Electron main process
│   └── preload/index.ts    # Secure IPC bridge
├── src/
│   ├── components/
│   │   ├── Dashboard/      # Dashboard view
│   │   ├── Editor/         # TipTap editor + tabs
│   │   ├── FileExplorer/   # Left panel tree
│   │   ├── Layout/         # App layout, toolbar, status bar
│   │   ├── Search/         # Global search modal
│   │   └── Templates/      # Template chooser modal
│   ├── store/appStore.ts   # Zustand state management
│   ├── types/index.ts      # TypeScript types & template data
│   └── index.css           # Global dark-theme styles
├── index.html              # Renderer entry
├── electron.vite.config.ts # Build configuration
└── package.json
```

---

## Data Storage

All workspace data (folders, pages, content, tags, versions) is stored as JSON in the Electron `userData` directory:

- **Windows:** `%APPDATA%\hellbound-bible\workspace.json`
- **macOS:** `~/Library/Application Support/hellbound-bible/workspace.json`
- **Linux:** `~/.config/hellbound-bible/workspace.json`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+P` | Open global search |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Escape` | Close modal |

---

## Roadmap

- [ ] AI writing assistant integration
- [ ] Story consistency checker
- [ ] Interactive timeline view
- [ ] Character relationship graph
- [ ] Storyboarding canvas
- [ ] Cloud sync & collaboration
- [ ] Voice notes
- [ ] Animation production tracker
- [ ] Export to PDF / Word
