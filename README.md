# Hellbound Bible

Hellbound Bible is a desktop production operating system for building and managing the anime universe of Hellbound from first concept to final release planning.

The core architecture is explorer-first:

- Unlimited nested folders and pages
- Explorer tree as the primary navigation model
- Page tabs similar to VS Code
- Autosave with local persistence
- Dashboard for production overview
- Timeline view with page-linked events
- Per-item properties, color, icon, favorites, pinning
- Context menu operations for folder/page management

## Tech Stack

- Electron (desktop shell)
- React + TypeScript (application UI)
- Vite (frontend tooling)

## Run

Install dependencies:

```bash
npm install
```

Run web UI only:

```bash
npm run dev
```

Run desktop app in development (Vite + Electron):

```bash
npm run dev:desktop
```

Build production web assets:

```bash
npm run build
```

Build desktop package (AppImage on Linux):

```bash
npm run build:desktop
```

## Data Storage

Workspace data is autosaved.

- In Electron: saved to the app user data directory as `hellbound-workspace.json`
- In browser fallback mode: saved in `localStorage`

## Current Feature Coverage

Implemented now:

- Explorer with unlimited folder depth and recursive rendering
- Folder/page creation, rename, delete, duplicate
- Drag and drop move into folders
- Copy/cut/paste within workspace tree
- Favorite, pin, collapse/expand, color, icon controls
- Right-click context menu on explorer items
- Multi-tab page editing
- Rich HTML editing surface (`contentEditable`)
- Tags, tasks, due dates, progress calculation
- Page links to other pages by name
- Manual version snapshots and restore
- Global search across folder names and page content
- Dashboard: recent pages, pinned, favorites, activity, stats
- Timeline with filter and page linking

Planned next iterations:

- Full block editor (tables, callouts, divider blocks, embeds)
- Media upload pipeline (images/videos/GIF/PDF previews)
- Keyboard shortcut customization
- Cloud sync and collaboration
- Story consistency and timeline conflict engines
