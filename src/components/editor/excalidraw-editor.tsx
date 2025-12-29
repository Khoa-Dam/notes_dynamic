'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type {
  ExcalidrawElement,
  ExcalidrawImperativeAPIRef
} from '@excalidraw/excalidraw/types/element/types'
import { Button } from '../ui/button'

// Dynamically import Excalidraw with SSR turned off
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  {
    ssr: false,
    loading: () => <div className='h-full w-full flex items-center justify-center'>Loading Excalidraw...</div>
  }
)

interface ExcalidrawEditorProps {
  initialData: string | null // JSON string for elements
  onSave: (data: string) => void
  isReadOnly?: boolean
}

export function ExcalidrawEditor({
  initialData,
  onSave,
  isReadOnly = false
}: ExcalidrawEditorProps) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPIRef | null>(null)

  const parsedInitialData = useMemo(() => {
    if (!initialData) return null
    try {
      // Only take elements, discard appState for consistency
      return JSON.parse(initialData).elements
    } catch (e) {
      console.error('Could not parse initial excalidraw data', e)
      return null
    }
  }, [initialData])

  const handleSave = () => {
    if (!excalidrawAPI) return
    const elements = excalidrawAPI.getSceneElements()
    // We only save the elements, not the full app state
    const data = JSON.stringify({ elements })
    onSave(data)
  }

  return (
    <div className='h-full w-full relative'>
      <Excalidraw
        ref={(api: ExcalidrawImperativeAPIRef) => setExcalidrawAPI(api)}
        initialData={{
          elements: parsedInitialData,
          appState: { viewModeEnabled: isReadOnly }
        }}
        isCollaborating={false}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: false,
            toggleTheme: true,
            clearCanvas: !isReadOnly
          }
        }}
      />
      {!isReadOnly && (
        <div className='absolute bottom-4 right-4 z-10'>
          <Button onClick={handleSave}>Save</Button>
        </div>
      )}
    </div>
  )
}
