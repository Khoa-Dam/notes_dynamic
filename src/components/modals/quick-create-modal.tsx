'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQuickCreate } from '@/hooks/use-quick-create'
import { useCoverImage } from '@/hooks/use-cover-image'
import { Chatbot } from '@/components/chatbot'
import { FileEditor } from '@/components/editor/file-editor'
import { Cover } from '@/components/cover'
import { Toolbar } from '@/components/toolbar'

interface QuickCreateFileData {
  content: string
  title: string
  iconId: string
}

export function QuickCreateModal() {
  const router = useRouter()
  const pathname = usePathname()
  const { isOpen, onClose } = useQuickCreate()
  const coverImage = useCoverImage()
  const [fileData, setFileData] = useState<QuickCreateFileData>({
    content: '',
    title: 'Untitled',
    iconId: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const [fileId, setFileId] = useState<string | null>(null)
  const [folderName, setFolderName] = useState('')

  const updateBanner = (url: string | null) => {
    coverImage.onReplace(url || '', '') // fileId is not needed here
  }

  const handleSave = async () => {
    if (!fileData.content) return
    const workspaceId = pathname.split('/')[2]
    if (!workspaceId) {
      toast.error('Workspace ID not found.')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading('AI đang phân loại...')
    try {
      const res = await fetch('/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          iconId: fileData.iconId,
          title: fileData.title,
          data: fileData.content,
          workspaceId,
          bannerUrl: coverImage.url
        })
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to save note.', { id: toastId })
        throw new Error(data.error || 'Failed to save note.')
      }

      toast.success(`Đã lưu thành công vào thư mục ${data.folderName}`, {
        id: toastId
      })
      setFileId(data.fileId)
      setFolderName(data.folderName)
      setSuccessState(true)
    } catch (error: any) {
      if (toastId) {
        toast.error(error.message, { id: toastId })
      } else {
        toast.error(error.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setFileData({ content: '', title: 'Untitled', iconId: '' })
    setSuccessState(false)
    setFileId(null)
    setFolderName('')
    coverImage.onClose()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='min-w-7xl min-h-screen  bg-black/60 backdrop-blur-md border-0'>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className='h-full flex flex-col p-4'>
            {!successState ? (
              <>
                <div className='flex items-center text-xl mx-9 justify-between mb-4'>
                  <DialogHeader>
                    <DialogTitle>Quick Create</DialogTitle>
                  </DialogHeader>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      'Lưu'
                    )}
                  </Button>
                </div>
                <div
                  id='pdf-content'
                  className='bg-background w-full h-[90vh] overflow-y-scroll'
                >
                  <Cover
                    fileId={fileId || ''}
                    url={coverImage.url}
                    onBannerUrlChange={updateBanner}
                  />
                  <div className='md:max-w-4xl lg:max-w-7xl mx-auto mt-10'>
                    <Toolbar
                      title={fileData.title}
                      iconId={fileData.iconId}
                      onTitleChange={(newTitle) =>
                        setFileData((prev) => ({ ...prev, title: newTitle }))
                      }
                      onIconChange={(newIcon) =>
                        setFileData((prev) => ({ ...prev, iconId: newIcon }))
                      }
                    />
                    <FileEditor
                      workspaceId={pathname.split('/')[2]}
                      fileId={fileId || ''}
                      content={fileData.content}
                      onContentChange={(newContent) =>
                        setFileData((prev) => ({
                          ...prev,
                          content: newContent
                        }))
                      }
                    />
                  </div>
                </div>

                {/* <div className='chatbot-wrapper'>
                  <Chatbot />
                </div> */}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex flex-col items-center justify-center h-full gap-4 text-white'
              >
                <Check className='h-16 w-16 text-green-500' />
                <h2 className='text-2xl font-semibold'>Đã lưu thành công!</h2>
                <p className='text-muted-foreground'>
                  AI đã phân loại ghi chú vào thư mục:{' '}
                  <span className='font-semibold text-white'>{folderName}</span>
                </p>
                <div className='flex gap-4 mt-4'>
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/${pathname.split('/')[2]}/${fileId}`
                      )
                    }
                  >
                    Xem ngay
                  </Button>
                  <Button onClick={handleClose} variant='outline'>
                    Đóng
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
