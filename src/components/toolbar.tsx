'use client'

import { ElementRef, memo, useRef, useState } from 'react'
import { ImageIcon, Smile, X } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import type { File } from '@/types/db'

import { useCoverImage } from '@/hooks/use-cover-image'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from './emoji-picker'

interface ToolbarProps {
  initialData?: File
  title?: string
  iconId?: string
  onTitleChange: (title: string) => void
  onIconChange: (icon: string) => void
  preview?: boolean
}

export const Toolbar = memo(
  ({
    initialData,
    title,
    iconId,
    onTitleChange,
    onIconChange,
    preview
  }: ToolbarProps) => {
    const inputRef = useRef<ElementRef<'textarea'>>(null)
    const [isEditing, setIsEditing] = useState(false)
    const coverImage = useCoverImage()

    const enableInput = () => {
      if (preview) return

      setIsEditing(true)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        )
      }, 0)
    }

    const disableInput = () => setIsEditing(false)

    const onInput = (value: string) => {
      onTitleChange(value)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        disableInput()
      }
    }

    const onIconSelect = (icon: string) => {
      onIconChange(icon)
    }

    const onRemoveIcon = () => {
      onIconChange('📄')
    }

    return (
      <div className='pl-[54px] group relative'>
        {!!iconId && !preview && (
          <div className='flex items-center gap-x-2 group/icon pt-6'>
            <EmojiPicker getValue={onIconSelect}>
              <p className='text-6xl hover:opacity-75 transition'>{iconId}</p>
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
        {!!iconId && preview && <p className='text-6xl pt-6'>{iconId}</p>}
        <div className='opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4'>
          {!iconId && !preview && (
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
          {initialData && !initialData.bannerUrl && !preview && (
            <Button
              onClick={() => coverImage.onOpen(initialData?.id || '')}
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
            value={title}
            onChange={(e) => onInput(e.target.value)}
            className='text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] resize-none'
          />
        ) : (
          <div
            onClick={enableInput}
            className='pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]'
          >
            {title || 'Untitled'}
          </div>
        )}
      </div>
    )
  }
)

Toolbar.displayName = 'Toolbar'
