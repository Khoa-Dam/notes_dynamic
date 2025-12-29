'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { File } from '@/types/db'

import { updateFile } from '@/lib/db/queries'
import { useDebounceEffect } from '@/hooks/use-debounce-effect'
import { BlockNoteEditor } from '@/components/editor/block-note-editor'
import { ExcalidrawEditor } from '@/components/editor/excalidraw-editor'

interface FileRendererProps {
  file: File
  isReadOnly?: boolean
}

export function FileRenderer({ file, isReadOnly }: FileRendererProps) {
  const [content, setContent] = useState(file.data)

  // When the file prop changes from the outside, update the internal content state
  useEffect(() => {
    setContent(file.data)
  }, [file.data])

  // Debounced save for BlockNote
  useDebounceEffect(
    () => {
      if (file.type === 'note' && content !== null && content !== file.data) {
        updateFile({ id: file.id, data: content })
      }
    },
    [content],
    1000
  )

  const handleNoteContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  // Manual save for Excalidraw
  const handleExcalidrawSave = useCallback(
    (newContent: string) => {
      setContent(newContent)
      toast.promise(updateFile({ id: file.id, data: newContent }), {
        loading: 'Saving drawing...',
        success: 'Drawing saved!',
        error: 'Failed to save drawing.'
      })
    },
    [file.id]
  )

  switch (file.type) {
    case 'note':
      return (
        <BlockNoteEditor
          initialContent={content || ''}
          onChange={handleNoteContentChange}
          editable={!isReadOnly}
        />
      )
    case 'excalidraw':
      return (
        <ExcalidrawEditor
          initialData={content || null}
          isReadOnly={isReadOnly}
          onSave={handleExcalidrawSave}
        />
      )
    default:
      return (
        <div className='p-8'>
          File type '<strong>{file.type}</strong>' is not supported for
          editing.
        </div>
      )
  }
}
