'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'

const BlockNoteViewWrapper = dynamic(
  () => import('./block-note-view-wrapper'),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground'>Loading editor...</p>
      </div>
    )
  }
)

interface BlockNoteEditorProps {
  onChange: (content: string) => void
  initialContent?: string
  editable?: boolean
}

export function BlockNoteEditor({
  onChange,
  initialContent,
  editable = true
}: BlockNoteEditorProps) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <BlockNoteViewWrapper
      initialContentString={initialContent}
      onChange={onChange}
      editable={editable}
      theme={theme}
    />
  )
}
