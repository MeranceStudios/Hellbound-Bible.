import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CharacterCount from '@tiptap/extension-character-count'
import { EditorToolbar } from './EditorToolbar'
import { EditorBreadcrumb } from './EditorBreadcrumb'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../utils/api'

interface PageEditorProps {
  itemId: string
  isActive: boolean
}

const AUTOSAVE_DELAY = 2000

export function PageEditor({ itemId, isActive }: PageEditorProps): React.ReactElement {
  const { markTabDirty, addPendingSave, removePendingSave, items } = useAppStore()
  const [wordCount, setWordCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent = useRef<string>('')
  const isLoadingRef = useRef(false)

  const item = items.find((i) => i.id === itemId)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading...'
          return 'Start writing... (type / for commands)'
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
    ],
    content: '',
    autofocus: false,
    onUpdate: ({ editor }) => {
      if (isLoadingRef.current) return
      const json = JSON.stringify(editor.getJSON())
      latestContent.current = json
      const wc = editor.storage.characterCount?.words() ?? 0
      setWordCount(wc)
      markTabDirty(itemId, true)
      addPendingSave(itemId)

      // Debounced autosave
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveContent(json)
      }, AUTOSAVE_DELAY)
    },
  })

  const saveContent = useCallback(
    async (content: string): Promise<void> => {
      try {
        await api.pages.save(itemId, content)
        markTabDirty(itemId, false)
        removePendingSave(itemId)
      } catch (err) {
        console.error('Failed to save:', err)
      }
    },
    [itemId, markTabDirty, removePendingSave]
  )

  // Load content when editor mounts
  useEffect(() => {
    if (!editor) return
    setIsLoaded(false)
    isLoadingRef.current = true

    api.pages.get(itemId).then((page: unknown) => {
      const p = page as { content?: string } | null
      if (p?.content && p.content !== '{}') {
        try {
          const parsed = JSON.parse(p.content)
          editor.commands.setContent(parsed, false)
          latestContent.current = p.content
        } catch {
          editor.commands.setContent('', false)
        }
      } else {
        editor.commands.setContent('', false)
      }
      isLoadingRef.current = false
      setIsLoaded(true)
    })

    return () => {
      // Save on unmount
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (latestContent.current) {
        saveContent(latestContent.current)
      }
    }
  }, [itemId, editor])

  // Handle image drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
      for (const file of files) {
        const reader = new FileReader()
        reader.onload = () => {
          editor?.commands.setImage({ src: reader.result as string })
        }
        reader.readAsDataURL(file)
      }
    },
    [editor]
  )

  if (!editor) return <div />

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
      {/* Breadcrumb */}
      <EditorBreadcrumb itemId={itemId} />

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div
        className="flex-1 overflow-y-auto editor-content"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ background: 'var(--color-surface)' }}
      >
        <EditorContent editor={editor} style={{ minHeight: '100%' }} />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '4px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--color-text-subtle)',
          flexShrink: 0,
        }}
      >
        <div>{wordCount} words</div>
        <div>{editor.storage.characterCount?.characters() ?? 0} characters</div>
      </div>
    </div>
  )
}
