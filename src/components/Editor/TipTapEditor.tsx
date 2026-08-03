import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import CharacterCount from '@tiptap/extension-character-count'
import Youtube from '@tiptap/extension-youtube'

import { useAppStore } from '@/store/appStore'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Minus, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Highlighter,
  Undo, Redo, Save, History, Tag, Type
} from 'lucide-react'

interface TipTapEditorProps {
  pageId: string
  isActive: boolean
}

const ToolbarButton: React.FC<{
  onClick: () => void
  isActive?: boolean
  tooltip?: string
  children: React.ReactNode
  disabled?: boolean
}> = ({ onClick, isActive, tooltip, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    data-tooltip={tooltip}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: 4,
      background: isActive ? 'var(--accent-dim)' : 'transparent',
      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
      border: isActive ? '1px solid rgba(220,20,60,0.3)' : '1px solid transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all var(--transition-fast)',
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      if (!disabled) {
        const btn = e.currentTarget as HTMLButtonElement
        if (!isActive) btn.style.background = 'var(--bg-hover)'
        btn.style.color = 'var(--text-primary)'
      }
    }}
    onMouseLeave={e => {
      const btn = e.currentTarget as HTMLButtonElement
      btn.style.background = isActive ? 'var(--accent-dim)' : 'transparent'
      btn.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)'
    }}
  >
    {children}
  </button>
)

const Separator = () => (
  <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 3px' }} />
)

const TipTapEditor: React.FC<TipTapEditorProps> = ({ pageId, isActive }) => {
  const page = useAppStore(s => s.items[pageId])
  const updatePageContent = useAppStore(s => s.updatePageContent)
  const updatePageTags = useAppStore(s => s.updatePageTags)
  const saveVersion = useAppStore(s => s.saveVersion)
  const renameItem = useAppStore(s => s.renameItem)

  const [tagInput, setTagInput] = useState('')
  const [showTagPanel, setShowTagPanel] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [titleValue, setTitleValue] = useState(page?.name || '')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const versionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' }
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      CharacterCount,
      Youtube.configure({ controls: true }),
    ],
    content: (() => {
      if (!page?.content) return ''
      try {
        return JSON.parse(page.content)
      } catch {
        return page.content
      }
    })(),
    editorProps: {
      attributes: {
        class: 'tiptap-editor editor-content',
        'data-placeholder': 'Start writing...',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      const wordCount = editor.storage.characterCount?.words() ?? 0

      // Debounced auto-save (500ms)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        updatePageContent(pageId, json, wordCount)
      }, 500)

      // Auto-save version every 5 minutes if content changed
      if (versionTimerRef.current) clearTimeout(versionTimerRef.current)
      versionTimerRef.current = setTimeout(() => {
        saveVersion(pageId, 'Auto-save')
      }, 5 * 60 * 1000)
    },
  })

  // Sync content when page changes from outside
  useEffect(() => {
    if (!editor || !page?.content) return
    try {
      const parsed = JSON.parse(page.content)
      const currentJson = JSON.stringify(editor.getJSON())
      if (currentJson !== page.content) {
        editor.commands.setContent(parsed, false)
      }
    } catch {
      // ignore parse error
    }
  }, [pageId]) // eslint-disable-line

  useEffect(() => {
    setTitleValue(page?.name || '')
  }, [page?.name])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (versionTimerRef.current) clearTimeout(versionTimerRef.current)
    }
  }, [])

  // Focus editor when tab becomes active
  useEffect(() => {
    if (isActive && editor) {
      setTimeout(() => editor.commands.focus(), 100)
    }
  }, [isActive, editor])

  const handleInsertImage = async () => {
    try {
      const files = await window.electronAPI.dialog.openImage()
      files.forEach(src => {
        editor?.chain().focus().setImage({ src }).run()
      })
    } catch {
      const url = prompt('Image URL:')
      if (url) editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleInsertLink = () => {
    const url = prompt('URL:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  const handleInsertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTags = [...(page?.tags || []), tagInput.trim()]
      updatePageTags(pageId, [...new Set(newTags)])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    const newTags = (page?.tags || []).filter(t => t !== tag)
    updatePageTags(pageId, newTags)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value)
  }

  const handleTitleBlur = () => {
    if (titleValue.trim() && titleValue !== page?.name) {
      renameItem(pageId, titleValue.trim())
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (titleValue.trim() && titleValue !== page?.name) {
        renameItem(pageId, titleValue.trim())
      }
      editor?.commands.focus()
    }
  }

  const handleManualSave = () => {
    if (!editor) return
    const json = JSON.stringify(editor.getJSON())
    const wordCount = editor.storage.characterCount?.words() ?? 0
    updatePageContent(pageId, json, wordCount)
    saveVersion(pageId, 'Manual save')
  }

  if (!page || !editor) return null

  const words = editor.storage.characterCount?.words() ?? 0
  const chars = editor.storage.characterCount?.characters() ?? 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      {/* Editor Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '4px 8px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        overflowX: 'auto',
        flexWrap: 'nowrap',
      }}>
        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} tooltip="Undo" disabled={!editor.can().undo()}>
          <Undo size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} tooltip="Redo" disabled={!editor.can().redo()}>
          <Redo size={13} />
        </ToolbarButton>

        <Separator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 size={13} />
        </ToolbarButton>

        <Separator />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          tooltip="Strikethrough"
        >
          <Strikethrough size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          tooltip="Inline Code"
        >
          <Code size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          tooltip="Highlight"
        >
          <Highlighter size={13} />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          tooltip="Ordered List"
        >
          <ListOrdered size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          tooltip="Task List"
        >
          <CheckSquare size={13} />
        </ToolbarButton>

        <Separator />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          tooltip="Blockquote"
        >
          <Quote size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="Horizontal Rule"
        >
          <Minus size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={handleInsertTable} tooltip="Insert Table">
          <TableIcon size={13} />
        </ToolbarButton>

        <Separator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
        >
          <AlignLeft size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
        >
          <AlignCenter size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
        >
          <AlignRight size={13} />
        </ToolbarButton>

        <Separator />

        {/* Media */}
        <ToolbarButton onClick={handleInsertLink} isActive={editor.isActive('link')} tooltip="Insert Link">
          <LinkIcon size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={handleInsertImage} tooltip="Insert Image">
          <ImageIcon size={13} />
        </ToolbarButton>

        <Separator />

        {/* Tags & Versions */}
        <ToolbarButton
          onClick={() => setShowTagPanel(s => !s)}
          isActive={showTagPanel}
          tooltip="Tags"
        >
          <Tag size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowVersions(s => !s)}
          isActive={showVersions}
          tooltip="Version History"
        >
          <History size={13} />
        </ToolbarButton>

        <div style={{ flex: 1 }} />

        {/* Word count */}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: 8 }}>
          {words} words · {chars} chars
        </span>

        <ToolbarButton onClick={handleManualSave} tooltip="Save Version">
          <Save size={13} />
        </ToolbarButton>
      </div>

      {/* Tag Panel */}
      {showTagPanel && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          <Tag size={12} color="var(--text-muted)" />
          {(page.tags || []).map(tag => (
            <div key={tag} className="tag-pill">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                style={{ color: 'var(--accent)', marginLeft: 2, lineHeight: 1 }}
              >×</button>
            </div>
          ))}
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tag... (Enter)"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-color)',
              borderRadius: 0,
              padding: '2px 4px',
              fontSize: 12,
              color: 'var(--text-secondary)',
              width: 120,
            }}
          />
        </div>
      )}

      {/* Version History Panel */}
      {showVersions && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '8px 16px',
          maxHeight: 180,
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Version History ({(page.versions || []).length})
          </div>
          {(page.versions || []).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No versions saved yet. Save manually or versions auto-save every 5 minutes.
            </div>
          ) : (
            [...(page.versions || [])].reverse().map(version => (
              <div key={version.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
                borderBottom: '1px solid var(--border-color)',
                fontSize: 12,
              }}>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                  {version.label || 'Saved'} — {new Date(version.savedAt).toLocaleString()}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (window.confirm('Restore this version? Current content will be saved first.')) {
                      const { restoreVersion } = useAppStore.getState()
                      restoreVersion(pageId, version.id)
                    }
                  }}
                  style={{ padding: '2px 8px', fontSize: 11 }}
                >
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Title */}
      <div style={{
        padding: '24px 60px 0',
        maxWidth: 860,
        margin: '0 auto',
        width: '100%',
        flexShrink: 0,
      }}>
        <input
          value={titleValue}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled Page"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid transparent',
            borderRadius: 0,
            padding: '4px 0',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-primary)',
            outline: 'none',
            lineHeight: '1.3',
          }}
          onFocus={e => {
            (e.target as HTMLInputElement).style.borderBottomColor = 'var(--accent)'
          }}
          onBlurCapture={e => {
            (e.target as HTMLInputElement).style.borderBottomColor = 'transparent'
          }}
        />

        {/* Template badge & tags preview */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {page.templateType && page.templateType !== 'blank' && (
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
            }}>
              {page.templateType}
            </span>
          )}
          {(page.tags || []).slice(0, 5).map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
          {(page.tags?.length || 0) > 5 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              +{(page.tags?.length || 0) - 5} more
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
          Last updated {new Date(page.updatedAt).toLocaleString()}
        </div>
      </div>

      {/* Editor */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* Bubble menu for text selection */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bubble-menu"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <Bold size={12} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <Italic size={12} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
          >
            <UnderlineIcon size={12} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
          >
            <Highlighter size={12} />
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            onClick={handleInsertLink}
            isActive={editor.isActive('link')}
          >
            <LinkIcon size={12} />
          </ToolbarButton>
        </BubbleMenu>
      )}
    </div>
  )
}

export default TipTapEditor
