# Hellbound Bible

A professional production and story management desktop application for the **Hellbound** original anime series.

## Overview

Hellbound Bible is a full-featured desktop application built for anime creators. It combines the best of VS Code's file explorer, Notion's rich text editing, and Obsidian's linking system — purpose-built for managing a complete anime production from first idea to final episode.

## Features

- **Unlimited File Explorer** — Folders and pages, nested infinitely, with no depth limit
- **Rich Text Editor** — Full-featured TipTap editor with headings, bold/italic/underline, tables, lists, task lists, images, links, code blocks, and more
- **Multi-Tab Interface** — Open multiple pages simultaneously, VS Code-style
- **Dashboard** — Recent pages, pinned items, favorites, quick stats
- **Global Search** — Instantly search all content across every page and folder
- **Timeline** — Visual event timeline with arc filtering
- **Templates** — Character, Episode, Arc, Location, Power, and Timeline Event templates
- **Tags** — Unlimited tagging system for every page and folder
- **Autosave** — Every change is saved automatically with debounced writes
- **Version History** — Last 50 versions of every page, restorable at any time
- **Drag and Drop** — Move items between folders by dragging
- **Context Menus** — Right-click any item for Rename, Delete, Duplicate, Pin, Favorite, and more
- **Dark Theme** — Professional dark UI with crimson red accent

## Tech Stack

- **Electron** — Desktop runtime
- **React + TypeScript** — UI
- **electron-vite** — Build tooling
- **TipTap** — Rich text editor
- **better-sqlite3** — Local database
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **Radix UI** — Accessible UI primitives
- **React DnD** — Drag and drop

## Development

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Package (creates installer)

```bash
npm run package
```

## Architecture

```
src/
├── main/           # Electron main process
│   ├── index.ts    # Window creation & app lifecycle
│   ├── database.ts # SQLite schema & seeding
│   └── ipc/        # IPC handlers (items, pages, tags, search, timeline, settings)
├── preload/        # Context bridge (exposes API to renderer)
└── renderer/       # React UI
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── common/     # TitleBar, TopToolbar, StatusBar, SettingsView
        │   ├── explorer/   # FileExplorer, ExplorerItem, NewItemDialog
        │   ├── editor/     # TabBar, EditorArea, PageEditor, EditorToolbar
        │   ├── dashboard/  # Dashboard
        │   ├── search/     # SearchView
        │   └── timeline/   # TimelineView
        ├── stores/         # Zustand state management
        ├── types/          # TypeScript types
        └── utils/          # API utility
```

## Database

All data is stored in a SQLite database at the user's app data directory:
- **items** — Folders and pages (unlimited nesting via parent_id)
- **pages** — Page content (TipTap JSON)
- **tags** — Tag definitions
- **item_tags** — Page/folder tag assignments
- **templates** — Page templates
- **version_history** — Last 50 versions per page
- **timeline_events** — Timeline entries
- **recent_items** — Access log for recent pages
- **settings** — App preferences
- **pages_fts** — Full-text search index (FTS5)
