'use client'

// import { useMutation, useQuery } from "convex/react";
import { use, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'

// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
import type { File } from '@/types/db'
import { getFileById } from '@/lib/db/queries'

import { Cover } from '@/components/cover'
import { Skeleton } from '@/components/ui/skeleton'
import { Toolbar } from '@/components/toolbar'
import { FileEditor } from '@/components/editor/file-editor'

interface PageProps {
  params: Promise<{
    documentId: string
  }>
}

const DocumentIdPage = ({ params }: PageProps) => {
  const Editor = useMemo(
    () =>
      dynamic(
        () =>
          import('@/components/editor/file-editor').then(
            (mod) => mod.FileEditor
          ),
        { ssr: false }
      ),
    []
  )

  const { documentId: fileId } = use(params)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const onContentChange = (content: string) => {
    // Preview mode, do nothing.
  }

  const onTitleChange = (title: string) => {
    // Preview mode, do nothing.
  }

  const onIconChange = (icon: string) => {
    // Preview mode, do nothing.
  }
  const onBannerUrlChange = () => {
    return null
  }

  if (isLoading) {
    return (
      <div>
        <Cover fileId={''} onBannerUrlChange={onBannerUrlChange} />
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
      <Cover
        fileId={''}
        onBannerUrlChange={() => null}
        preview
        url={file.bannerUrl || null}
      />
      <div className='mx-auto md:max-w-5xl lg:max-w-7xl'>
        <Toolbar
          preview
          title={''}
          iconId={''}
          initialData={file}
          onTitleChange={onTitleChange}
          onIconChange={onIconChange}
        />
        <FileEditor
          editable={false}
          workspaceId={file.workspaceId!}
          fileId={file.id!}
          content={file.data}
          onContentChange={onContentChange}
        />
      </div>
    </div>
  )
}

export default DocumentIdPage
