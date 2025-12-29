'use client'

import { useAppState } from '@/hooks/use-app-state'
import { cn } from '@/lib/utils'
import { FileRenderer } from './file-renderer'
import { MousePointerClick } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'

interface PanelProps {
  fileId: string | null
  isFocused: boolean
  className?: string
}

export function Panel({ fileId, isFocused, className }: PanelProps) {
  const { files } = useAppState()
  const file = files.find((f) => f.id === fileId)

  return (
    <div
      className={cn(
        'h-full w-full relative overflow-hidden',
        'ring-2 ring-transparent transition-all rounded-lg',
        isFocused && 'ring-primary/50',
        className
      )}
    >
      <div className='h-full w-full'>
        {fileId ? (
          file ? (
            <FileRenderer file={file} />
          ) : (
            <div className='h-full w-full p-8'>
              <Skeleton className='h-14 w-[50%]' />
              <Skeleton className='h-4 w-[80%] mt-4' />
              <Skeleton className='h-4 w-[40%] mt-2' />
              <Skeleton className='h-4 w-[60%] mt-2' />
            </div>
          )
        ) : (
          <div className='h-full w-full flex items-center justify-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer'>
            <div className='text-center text-muted-foreground'>
              <MousePointerClick className='h-10 w-10 mx-auto mb-4' />
              <p className='text-lg font-semibold'>Click to select this panel</p>
              <p className='text-sm mt-1'>
                Then, choose a file from the sidebar to open it here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
