'use client'

import { useState } from 'react'
// import { useMutation } from "convex/react";
import { useParams } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useCoverImage } from '@/hooks/use-cover-image'

// import { useEdgeStore } from "@/lib/edgestore";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
import { SingleImageDropzone } from '../single-age-dropzone'

export const CoverImageModal = () => {
  const params = useParams()
  // const update = useMutation(api.documents.update);
  const coverImage = useCoverImage()
  // const { edgestore } = useEdgeStore();

  const [file, setFile] = useState<File>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onClose = () => {
    setFile(undefined)
    setIsSubmitting(false)
    coverImage.onClose()
  }

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

  const onChange = async (file?: File) => {
    if (file) {
      setIsSubmitting(true)
      setFile(file)
      // console.log('file', file)
      const bannerUrlNew = await uploadFile(file)
      console.log('bannerUrlNew', bannerUrlNew)
      coverImage.onReplace(bannerUrlNew)
      // const res = await edgestore.publicFiles.upload({
      //   file,
      //   options: {
      //     replaceTargetUrl: coverImage.url
      //   }
      // });

      // await update({
      //   id: params.documentId as Id<"documents">,
      //   coverImage: res.url
      // });

      onClose()
    }
  }

  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-center text-lg font-semibold'>
            Cover Image
          </DialogTitle>
        </DialogHeader>
        <SingleImageDropzone
          className='w-full outline-none'
          disabled={isSubmitting}
          value={file}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  )
}
