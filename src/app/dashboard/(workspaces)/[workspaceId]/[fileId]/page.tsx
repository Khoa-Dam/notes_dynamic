'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react'

import type { File } from '@/types/db'

import {
  deleteFile,
  getFileById,
  updateFile,
  updateFileBanner
} from '@/lib/db/queries'
import { store, useAppState } from '@/hooks/use-app-state'
import { useDebounceEffect } from '@/hooks/use-debounce-effect'
import { FileEditor } from '@/components/editor/file-editor'
import { Cover } from '@/components/cover'
import { Toolbar } from '@/components/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarMobile } from '@/components/sidebar/sidebar-mobile'
import { Button } from '@/components/ui/button'
import { Publish } from '@/components/publish'
import { Chatbot } from '@/components/chatbot'

interface PageProps {
  params: Promise<{
    workspaceId: string
    fileId: string
  }>
}

export default function FilePage({ params }: PageProps) {
  const { workspaceId, fileId } = use(params)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { files, deleteFile: removeFileFromState } = useAppState()
  const fileFromState = files.find((f) => f.id === fileId)

  const [title, setTitle] = useState('Untitled')
  const [content, setContent] = useState('')
  const [iconId, setIconId] = useState('💗')
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  useEffect(() => {
    if (fileFromState) {
      setBannerUrl(fileFromState.bannerUrl ?? null)
    }
  }, [fileFromState, fileFromState?.bannerUrl])

  useEffect(() => {
    getFileById(fileId)
      .then((data) => {
        if (!data) {
          return notFound()
        }
        setFile(data)
        setTitle(data.title)
        setContent(data.data ?? '')
        setIconId(data.iconId)
        setBannerUrl(data.bannerUrl)
      })
      .catch(() => notFound())
      .finally(() => setIsLoading(false))
  }, [fileId])

  const fileToUpdate = useMemo(
    () => ({
      id: fileId,
      title,
      data: content,
      iconId,
      bannerUrl
    }),
    [fileId, title, content, iconId, bannerUrl]
  )

  useDebounceEffect(
    () => {
      updateFile(fileToUpdate)
    },
    [fileToUpdate],
    750
  )

  const onTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
  }, [])

  const onContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  const onIconChange = useCallback((newIconId: string) => {
    setIconId(newIconId)
  }, [])

  const onBannerUrlChange = useCallback(
    (newBannerUrl: string | null) => {
      setBannerUrl(newBannerUrl)
      updateFileBanner(fileId, newBannerUrl).then(() => {
        store.updateFileBanner(fileId, newBannerUrl)
      })
    },
    [fileId]
  )

  const handleDelete = async () => {
    try {
      await deleteFile(fileId)
      removeFileFromState(fileId)
      toast.success('File deleted successfully')
      router.push(`/dashboard/${workspaceId}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${workspaceId}`)
  }

  if (isLoading) {
    return (
      <div>
        <Cover />
        <div className='md:max-w-3xl lg:max-w-4xl mx-auto mt-10'>
          <div className='space-y-4 pl-8 pt-4'>
            <Skeleton className='h-14 w-[50%]' />
            <Skeleton className='h-4 w-[80%]' />
            <Skeleton className='h-4 w-[40%]' />
            <Skeleton className='h-4 w-[60%]' />
          </div>
        </div>
      </div>
    )
  }

  // if (!file) {
  //   return notFound()
  // }

  return (
    <div className='pb-40'>
      <div className='flex relative items-center justify-between border-b p-4'>
        <div className='flex items-center gap-4 flex-1'>
          <div className='lg:hidden'>
            <SidebarMobile />
          </div>
          <Button
            variant='ghost'
            size='lg'
            className='text-xl'
            onClick={handleBack}
          >
            <ChevronLeft className='h-4 w-4 mr-2 text-xl' />
            Back
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Publish initialData={file!} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='lg'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={handleDelete}
                className='text-destructive cursor-pointer'
              >
                <Trash2 className='h-4 w-4 mr-2 bg-destructive/10 text-destructive' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Cover
        url={bannerUrl}
        fileId={fileId}
        onBannerUrlChange={onBannerUrlChange}
      />
      <div className='md:max-w-5xl lg:max-w-7xl mx-auto'>
        <Toolbar
          initialData={{ ...file, title, iconId }}
          onTitleChange={onTitleChange}
          onIconChange={onIconChange}
        />
        <FileEditor
          workspaceId={workspaceId}
          fileId={fileId}
          content={content}
          onContentChange={onContentChange}
        />

        <Chatbot />
      </div>
    </div>
  )
}
