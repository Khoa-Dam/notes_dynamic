'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'

import { notFound, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@radix-ui/react-dropdown-menu'
import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

import type { File } from '@/types/db'

import {
  deleteFile,
  getFileById,
  updateFile,
  updateFileBanner
} from '@/lib/db/queries'
import { store, useAppState } from '@/hooks/use-app-state'
import { useDebounceEffect } from '@/hooks/use-debounce-effect'
import {
  CollaborativeFileEditor,
  Collaborators
} from '@/components/editor/collaborative-file-editor'
import {
  RoomProvider,
  useBroadcastEvent,
  useEventListener
} from '@/lib/liveblocks'
import { Cover } from '@/components/cover'
import { Toolbar } from '@/components/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarMobile } from '@/components/sidebar/sidebar-mobile'
import { Button } from '@/components/ui/button'
import { Publish } from '@/components/publish'
import { Chatbot } from '@/components/chatbot'
import { ShareModal } from '@/components/modals/share-modal'

interface PageProps {
  params: Promise<{
    workspaceId: string
    fileId: string
  }>
}

function FileContent({
  file: initialFile,
  fileId,
  workspaceId
}: {
  file: File
  fileId: string
  workspaceId: string
}) {
  const router = useRouter()
  const { deleteFile: removeFileFromState } = useAppState()
  const broadcast = useBroadcastEvent()

  const [title, setTitle] = useState(initialFile.title)
  const [content, setContent] = useState(initialFile.data ?? '')
  const [iconId, setIconId] = useState(initialFile.iconId)
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    initialFile.bannerUrl ?? null
  )

  // Listen for title/icon updates from other users
  useEventListener(({ event }) => {
    if (event.type === 'TITLE_UPDATE') {
      setTitle(event.value)
    } else if (event.type === 'ICON_UPDATE') {
      setIconId(event.value)
    }
  })

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

  const onTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      broadcast({ type: 'TITLE_UPDATE', value: newTitle })
    },
    [broadcast]
  )

  const onContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  const onIconChange = useCallback(
    (newIconId: string) => {
      setIconId(newIconId)
      broadcast({ type: 'ICON_UPDATE', value: newIconId })
    },
    [broadcast]
  )

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
    } catch {
      toast.error('Failed to delete file')
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${workspaceId}`)
  }

  return (
    <>
      <div className='flex relative items-center justify-between border-b p-4'>
        <div className='flex items-center gap-4 flex-1'>
          <div className='lg:hidden'>
            <SidebarMobile />
          </div>
          <Button variant='ghost' size='sm' onClick={handleBack}>
            <ChevronLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Collaborators />
          <ShareModal workspaceId={workspaceId} fileId={fileId} />
          <Publish
            initialData={{
              id: initialFile.id!,
              isPublished: initialFile.isPublished ?? false
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={handleDelete}
                className='text-destructive'
              >
                <Trash2 className='h-4 w-4 mr-2' />
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
          initialData={initialFile}
          onTitleChange={onTitleChange}
          onIconChange={onIconChange}
        />
        <CollaborativeFileEditor
          fileId={fileId}
          editable={true}
          content={content}
          onContentChange={onContentChange}
        />

        <Chatbot />
      </div>
    </>
  )
}

export default function FilePage({ params }: PageProps) {
  const { workspaceId, fileId } = use(params)
  const { data: session } = useSession()
  const user = session?.user
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { files } = useAppState()
  const fileFromState = files.find((f) => f.id === fileId)

  useEffect(() => {
    getFileById(fileId)
      .then((data) => {
        if (!data) {
          return notFound()
        }
        setFile(data)
      })
      .catch(() => notFound())
      .finally(() => setIsLoading(false))
  }, [fileId])

  useEffect(() => {
    if (fileFromState && file) {
      setFile((prev) =>
        prev ? { ...prev, bannerUrl: fileFromState.bannerUrl ?? null } : null
      )
    }
  }, [fileFromState?.bannerUrl])

  if (isLoading) {
    return (
      <div>
        <div className='relative w-full h-[12vh]' />
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

  if (!file) {
    return notFound()
  }

  return (
    <div className='pb-40'>
      <RoomProvider
        id={`file-${fileId}`}
        initialPresence={{
          cursor: null,
          user: {
            name: user?.name ?? 'Anonymous',
            avatar: user?.image ?? '',
            color: '#64B5F6'
          }
        }}
      >
        <FileContent file={file} fileId={fileId} workspaceId={workspaceId} />
      </RoomProvider>
    </div>
  )
}
