'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  FormattingToolbarController,
  FormattingToolbar,
  useBlockNoteEditor,
  useEditorContentOrSelectionChange,
  BlockTypeSelect,
  CreateLinkButton,
  NestBlockButton,
  UnnestBlockButton,
  TextAlignButton,
  ColorStyleButton,
  BasicTextStyleButton
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import {
  filterSuggestionItems,
  BlockNoteEditor,
  PartialBlock
} from '@blocknote/core'
import { Sparkles, Shrink, SpellCheck } from 'lucide-react'
import '@blocknote/mantine/style.css'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface BlockNoteViewWrapperProps {
  initialContentString?: string
  onChange: (content: string) => void
  editable: boolean
  theme: 'light' | 'dark'
  onContentChange?: (content: string) => void
}

const AiButtons = () => {
  const editor = useBlockNoteEditor()
  const [show, setShow] = useState(true)

  useEditorContentOrSelectionChange(() => {
    const selection = editor.getSelection()
    setShow(!!selection)
  }, editor)

  const handleAiAction = async (command: 'shorten' | 'fix-spelling') => {
    const selectedText = editor.getSelectedText()
    if (!selectedText) return

    const loadingId = toast.loading(`AI is ${command}ing...`)

    try {
      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedText, command })
      })

      if (!response.ok) {
        throw new Error('AI action failed')
      }

      const data = await response.json()
      const originalBlocks = editor.getSelection()?.blocks || []
      editor.replaceBlocks(originalBlocks, [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: data.text, styles: {} }]
        }
      ])
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      toast.dismiss(loadingId)
    }
  }

  if (!show) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='p-1 cursor-pointer'
            onClick={() => handleAiAction('shorten')}
          >
            <Shrink className='h-5 w-5' />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shorten</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='p-1 cursor-pointer'
            onClick={() => handleAiAction('fix-spelling')}
          >
            <SpellCheck className='h-5 w-5' />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fix spelling</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function BlockNoteViewWrapper({
  initialContentString,
  onChange,
  editable,
  theme
}: BlockNoteViewWrapperProps) {
  const parseInitialContent = (): PartialBlock[] | undefined => {
    if (!initialContentString || initialContentString === '') return undefined
    try {
      const parsed = JSON.parse(initialContentString)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined
    } catch {
      return undefined
    }
  }

  // Custom upload function using API route
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  const editor = useCreateBlockNote({
    initialContent: parseInitialContent(),
    uploadFile
  })

  const handleChange = useCallback(() => {
    if (!editor) return
    const blocks = editor.document
    onChange(JSON.stringify(blocks))
  }, [editor, onChange])

  useEffect(() => {
    if (editor) {
      editor.onChange(handleChange)
    }
  }, [editor, handleChange])

  const getCustomSlashMenuItems = (editor: BlockNoteEditor<any, any, any>) => [
    {
      title: 'Continue writing',
      onItemClick: async () => {
        const currentBlock = editor.getTextCursorPosition().block
        const currentText = (currentBlock.content as any[])?.[0]?.text || ''

        // Loading state: Hiển thị spinner qua toast thay vì chèn text vào editor
        const loadingId = toast.loading('AI is writing...')

        try {
          const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: currentText })
          })

          if (!response.ok) {
            toast.dismiss(loadingId)
            const errorData = await response.json().catch(() => ({}))
            toast.error(
              errorData.error || 'Failed to generate text. Please try again.'
            )
            return
          }

          if (response.body) {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let newContent = currentText

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunkText = decoder.decode(value, { stream: true })
              for (const char of chunkText) {
                newContent += char
                editor.updateBlock(currentBlock, {
                  content: newContent
                })
                await new Promise((resolve) => setTimeout(resolve, 10))
              }
            }
            toast.dismiss(loadingId)
          }
        } catch (error) {
          console.error(error)
          toast.error('Something went wrong. Please try again.', {
            id: loadingId
          })
        }
      },
      aliases: ['ai', 'continue'],
      group: 'AI',
      icon: <Sparkles size={18} />,
      subtext: 'Use AI to expand your thoughts'
    },
    ...getDefaultReactSlashMenuItems(editor)
  ]

  return (
    <div className='h-full w-full'>
      <BlockNoteView
        editor={editor}
        theme={theme}
        editable={editable}
        slashMenu={false}
        formattingToolbar={false}
      >
        <SuggestionMenuController
          triggerCharacter={'/'}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                itemsAlign: 'center',
                justifyContent: 'center'
              }}
            >
              <BlockTypeSelect key='blockTypeSelect' />

              <BasicTextStyleButton basicTextStyle={'bold'} key='boldButton' />
              <BasicTextStyleButton
                basicTextStyle={'italic'}
                key='italicButton'
              />
              <BasicTextStyleButton
                basicTextStyle={'underline'}
                key='underlineButton'
              />
              <BasicTextStyleButton
                basicTextStyle={'strike'}
                key='strikeButton'
              />
              <BasicTextStyleButton basicTextStyle={'code'} key='codeButton' />
              <TextAlignButton
                textAlignment={'left'}
                key='textAlignLeftButton'
              />
              <TextAlignButton
                textAlignment={'center'}
                key='textAlignCenterButton'
              />
              <TextAlignButton
                textAlignment={'right'}
                key='textAlignRightButton'
              />

              <ColorStyleButton key='colorButton' />

              <NestBlockButton key='nestButton' />
              <UnnestBlockButton key='unnestButton' />

              <CreateLinkButton key='linkButton' />
              <AiButtons />
            </FormattingToolbar>
          )}
        />
      </BlockNoteView>
    </div>
  )
}
