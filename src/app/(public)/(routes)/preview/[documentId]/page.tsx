'use client'

import { use, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'

import type { File } from '@/types/db'
import { getFileById, updateFile } from '@/lib/db/queries'

import { Cover } from '@/components/cover'
import { Skeleton } from '@/components/ui/skeleton'
import { Toolbar } from '@/components/toolbar'
import { CollaborativeFileEditor, Collaborators } from '@/components/editor/collaborative-file-editor'
import { RoomProvider, useEventListener } from '@/lib/liveblocks'
import { useDebounceEffect } from '@/hooks/use-debounce-effect'

interface PageProps {
  params: Promise<{
    documentId: string
  }>
}

function PreviewContent({ file: initialFile, fileId }: { file: File; fileId: string }) {
  const [file, setFile] = useState(initialFile)
  const [content, setContent] = useState(initialFile.data ?? '')

  useEventListener(({ event }) => {
    if (event.type === 'TITLE_UPDATE') {
      setFile(prev => ({ ...prev, title: event.value }))
    } else if (event.type === 'ICON_UPDATE') {
      setFile(prev => ({ ...prev, iconId: event.value }))
    }
  })

  useDebounceEffect(
    () => {
      updateFile({ id: fileId, data: content })
    },
    [content, fileId],
    750
  )

  const onContentChange = (newContent: string) => {
    setContent(newContent)
  }

  return (
    <>
      <div className='flex items-center justify-end border-b p-4'>
        <Collaborators />
      </div>
      <Cover preview url={file.bannerUrl || null} />
      <div className='mx-auto md:max-w-5xl lg:max-w-7xl'>
        <Toolbar
          preview
          initialData={file}
          onTitleChange={() => {}}
          onIconChange={() => {}}
        />
        <CollaborativeFileEditor
          fileId={file.id!}
          content={content}
          onContentChange={onContentChange}
          editable={true}
          userName="Guest"
        />
      </div>
    </>
  )
}

const DocumentIdPage = ({ params }: PageProps) => {
  const { documentId: fileId } = use(params)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFileById(fileId)
      .then((data) => {
        if (!data || !data.isPublished) {
          return notFound()
        }
        setFile(data)
      })
      .catch(() => notFound())
      .finally(() => setIsLoading(false))
  }, [fileId])

  if (isLoading) {
    return (
      <div>
        <Cover />
        <div className='mx-auto mt-10 md:max-w-3xl lg:max-w-4xl'>
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

  if (file === null) {
    return notFound()
  }

  return (
    <div className='pb-40'>
      <RoomProvider
        id={`file-${fileId}`}
        initialPresence={{ cursor: null, user: { name: 'Guest', avatar: '', color: '#81C784' } }}
      >
        <PreviewContent file={file} fileId={fileId} />
      </RoomProvider>
    </div>
  )
}

export default DocumentIdPage
