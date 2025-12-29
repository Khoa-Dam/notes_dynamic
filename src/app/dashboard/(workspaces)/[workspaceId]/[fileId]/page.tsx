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
import { ChevronLeft, MoreVertical, Trash2, PanelRightOpen } from 'lucide-react'

import { updateFile, deleteFile } from '@/lib/db/queries'
import { store, useAppState } from '@/hooks/use-app-state'
import { SplitLayout } from '@/components/workspace/split-layout'
import { Cover } from '@/components/cover'
import { Toolbar } from '@/components/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarMobile } from '@/components/sidebar/sidebar-mobile'
import { Button } from '@/components/ui/button'
import { Publish } from '@/components/publish'

interface PageProps {
  params: Promise<{
    workspaceId: string
    fileId: string
  }>
}

export default function FilePage({ params }: PageProps) {
  const { workspaceId, fileId: fileIdFromUrl } = use(params)
  const router = useRouter()

  const {
    files,
    focusedPanel,
    leftPanelFileId,
    rightPanelFileId,
    isSplitView,
    setPanelFile,
    deleteFile: removeFileFromState,
    setSplitView
  } = useAppState()

  // On mount, set the current file from the URL into the left panel.
  useEffect(() => {
    if (
      fileIdFromUrl !== leftPanelFileId &&
      fileIdFromUrl !== rightPanelFileId
    ) {
      setPanelFile('left', fileIdFromUrl)
    }
  }, [fileIdFromUrl, leftPanelFileId, rightPanelFileId, setPanelFile])

  const focusedFileId =
    (isSplitView && focusedPanel === 'right'
      ? rightPanelFileId
      : leftPanelFileId) || fileIdFromUrl

  const file = useMemo(
    () => files.find((f) => f.id === focusedFileId),
    [files, focusedFileId]
  )

  const onTitleChange = useCallback(
    (newTitle: string) => {
      if (!file) return
      store.updateFile({ ...file, title: newTitle })
      updateFile({ id: file.id, title: newTitle })
    },
    [file]
  )

  const onIconChange = useCallback(
    (newIconId: string) => {
      if (!file) return
      store.updateFile({ ...file, iconId: newIconId })
      updateFile({ id: file.id, iconId: newIconId })
    },
    [file]
  )

  const handleDelete = async () => {
    if (!file) return
    try {
      await deleteFile(file.id)
      removeFileFromState(file.id)
      toast.success('File deleted successfully')

      // Navigate away if the deleted file was the only one open
      if (leftPanelFileId === file.id && !rightPanelFileId) {
        router.push(`/dashboard/${workspaceId}`)
      } else {
        router.refresh() // Refresh to update URL if needed
      }
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${workspaceId}`)
  }

  const handleToggleSplit = () => {
    setSplitView(!isSplitView)
  }

  if (!file) {
    return (
      <div>
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

  return (
    <>
      <div className='pb-40 h-full flex flex-col '>
        <div className='flex shrink-0 relative items-center justify-between border-b p-4'>
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
            <Button onClick={handleToggleSplit} variant='ghost' size='sm'>
              <PanelRightOpen className='h-4 w-4 mr-2' />
              {isSplitView ? 'Single View' : 'Split View'}
            </Button>
            <Publish initialData={file} />
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
        <div>
          <Cover url={file.bannerUrl} fileId={file.id} />
          <div className='md:max-w-5xl lg:max-w-7xl mx-auto flex-1 w-full'>
            <Toolbar
              initialData={file}
              onTitleChange={onTitleChange}
              onIconChange={onIconChange}
            />
          </div>
        </div>
        <div className='h-[calc(100vh-320px)] mt-4'>
          <SplitLayout />
        </div>
      </div>
    </>
  )
}
