import React from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  Link,
  Highlighter,
  Table,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps): React.ReactElement {
  const handleImageInsert = (): void => {
    const url = prompt('Enter image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const handleLinkInsert = (): void => {
    const url = prompt('Enter URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const handleTableInsert = (): void => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div
      className="flex items-center flex-wrap gap-0.5 px-2"
      style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '4px 8px',
        background: 'var(--color-surface)',
        flexShrink: 0,
        minHeight: 36,
      }}
    >
      {/* Undo/Redo */}
      <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo size={14} />
      </ToolBtn>
      <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo size={14} />
      </ToolBtn>

      <Sep />

      {/* Headings */}
      <ToolBtn
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 size={14} />
      </ToolBtn>
      <ToolBtn
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 size={14} />
      </ToolBtn>
      <ToolBtn
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
      >
        <Heading3 size={14} />
      </ToolBtn>

      <Sep />

      {/* Text formatting */}
      <ToolBtn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
        <Bold size={14} />
      </ToolBtn>
      <ToolBtn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
        <Italic size={14} />
      </ToolBtn>
      <ToolBtn title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
        <Underline size={14} />
      </ToolBtn>
      <ToolBtn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
        <Strikethrough size={14} />
      </ToolBtn>
      <ToolBtn title="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
        <Code size={14} />
      </ToolBtn>
      <ToolBtn
        title="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(220,20,60,0.25)' }).run()}
        active={editor.isActive('highlight')}
      >
        <Highlighter size={14} />
      </ToolBtn>

      <Sep />

      {/* Alignment */}
      <ToolBtn title="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
        <AlignLeft size={14} />
      </ToolBtn>
      <ToolBtn title="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
        <AlignCenter size={14} />
      </ToolBtn>
      <ToolBtn title="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
        <AlignRight size={14} />
      </ToolBtn>

      <Sep />

      {/* Lists */}
      <ToolBtn title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
        <List size={14} />
      </ToolBtn>
      <ToolBtn title="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
        <ListOrdered size={14} />
      </ToolBtn>
      <ToolBtn title="Task List" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')}>
        <CheckSquare size={14} />
      </ToolBtn>
      <ToolBtn title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
        <Quote size={14} />
      </ToolBtn>

      <Sep />

      {/* Media & others */}
      <ToolBtn title="Insert Image" onClick={handleImageInsert}>
        <Image size={14} />
      </ToolBtn>
      <ToolBtn title="Insert Link" onClick={handleLinkInsert} active={editor.isActive('link')}>
        <Link size={14} />
      </ToolBtn>
      <ToolBtn title="Insert Table" onClick={handleTableInsert}>
        <Table size={14} />
      </ToolBtn>
      <ToolBtn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={14} />
      </ToolBtn>
    </div>
  )
}

function Sep(): React.ReactElement {
  return <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 2px' }} />
}

function ToolBtn({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 4,
        border: 'none',
        background: active ? 'rgba(220,20,60,0.15)' : 'transparent',
        color: active ? 'var(--color-crimson)' : disabled ? 'var(--color-text-subtle)' : 'var(--color-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.1s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) e.currentTarget.style.background = 'var(--color-surface3)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
