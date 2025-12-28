'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { ImageIcon, X } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCoverImage } from '@/hooks/use-cover-image'

interface CoverImageProps {
  fileId: string
  onBannerUrlChange: (bannerUrl: string | null) => void
  url?: string | null
  preview?: boolean
}

export const Cover = memo(
  ({ fileId, onBannerUrlChange, url, preview }: CoverImageProps) => {
    const coverImage = useCoverImage()
    const [isLoading, setIsLoading] = useState(true)
    console.log('url', url)
    console.log('preview', preview)
    const onRemove = async () => {
      onBannerUrlChange(null)
    }

    return (
      <div
        className={cn(
          'relative w-full group',
          url ? 'h-[35vh] bg-muted' : 'h-[12vh]'
        )}
      >
        {/* Skeleton */}
        {url && isLoading && (
          <Skeleton className='absolute inset-0 h-full w-full' />
        )}

        {/* Image */}
        {!!url && (
          <Image
            src={url}
            fill
            alt='Cover'
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoadingComplete={() => setIsLoading(false)}
            priority
          />
        )}

        {/* Actions */}
        {url && !preview && !isLoading && (
          <div className='opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2'>
            <Button
              onClick={() => coverImage.onReplace(url, fileId)}
              className='text-muted-foreground text-xs'
              variant='outline'
              size='sm'
            >
              <ImageIcon className='h-4 w-4 mr-2' />
              Change cover
            </Button>
            <Button
              onClick={onRemove}
              className='text-muted-foreground text-xs'
              variant='outline'
              size='sm'
            >
              <X className='h-4 w-4 mr-2' />
              Remove
            </Button>
          </div>
        )}
      </div>
    )
  }
)

Cover.displayName = 'Cover'
