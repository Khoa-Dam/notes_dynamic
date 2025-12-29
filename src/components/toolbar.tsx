'use client'

import { ElementRef, memo, useRef, useState } from 'react'
import { ImageIcon, Smile, X } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import type { File } from '@/types/db'

import { useCoverImage } from '@/hooks/use-cover-image'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from './emoji-picker'

interface ToolbarProps {
  initialData: Partial<File> & { title: string; iconId: string }
  onTitleChange: (title: string) => void
  onIconChange: (icon: string) => void
  preview?: boolean
}

export const Toolbar = memo(
  ({ initialData, onTitleChange, onIconChange, preview }: ToolbarProps) => {
    const inputRef = useRef<ElementRef<'textarea'>>(null)
    const [isEditing, setIsEditing] = useState(false)
    const coverImage = useCoverImage()
    const [selectedEmoji, setSelectedEmoji] = useState(initialData.iconId)
    const enableInput = () => {
      if (preview) return

      setIsEditing(true)
      setTimeout(() => {
        inputRef.current?.focus()
        // Set selection to the end of the text
        inputRef.current?.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        )
      }, 0)
    }

    const disableInput = () => setIsEditing(false)

    const onInput = (value: string) => {
      console.log('value', value)
      onTitleChange(value)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        disableInput()
      }
    }

    const onIconSelect = (icon: string) => {
      // setSelectedEmoji(icon)
      onIconChange(icon)
    }

    const onRemoveIcon = () => {
      // Default icon when removed, as iconId is not nullable
      onIconChange('📄')
    }

    return (
      <div className='pl-[54px] group relative'>
        {!!initialData.iconId && !preview && (
          <div className='flex items-center gap-x-2 group/icon pt-6'>
            <EmojiPicker getValue={onIconSelect}>
              <p className='text-6xl hover:opacity-75 transition'>
                {initialData?.iconId}
              </p>
            </EmojiPicker>
            <Button
              onClick={onRemoveIcon}
              className='rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs'
              variant='outline'
              size='icon'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        )}
        {!!initialData.iconId && preview && (
          <p className='text-6xl pt-6'>{initialData.iconId}</p>
        )}
        <div className='opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4'>
          {!initialData.iconId && !preview && (
            <EmojiPicker getValue={onIconSelect}>
              <Button
                className='text-muted-foreground text-xs'
                variant='outline'
                size='sm'
              >
                <Smile className='h-4 w-4 mr-2' />
                Add icon
              </Button>
            </EmojiPicker>
          )}
          {!initialData.bannerUrl && !preview && (
            <Button
              onClick={() => coverImage.onOpen(initialData.id!)}
              className='text-muted-foreground text-xs'
              variant='outline'
              size='sm'
            >
              <ImageIcon className='h-4 w-4 mr-2' />
              Add cover
            </Button>
          )}
        </div>
        {isEditing && !preview ? (
          <TextareaAutosize
            ref={inputRef}
            onBlur={disableInput}
            onKeyDown={onKeyDown}
            value={initialData.title}
            onChange={(e) => onInput(e.target.value)}
            className='text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] resize-none'
          />
        ) : (
          <div
            onClick={enableInput}
            className='pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]'
          >
            {initialData.title || 'Untitled'}
          </div>
        )}
      </div>
    )
  }
)

Toolbar.displayName = 'Toolbar'
