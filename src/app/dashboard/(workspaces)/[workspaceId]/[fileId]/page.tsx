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
import { ChevronLeft, MoreVertical, Trash2, FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import { toPng } from 'html-to-image' // Thư viện mới thay thế html2canvas

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
        if (!data) return notFound()
        setFile(data)
        setTitle(data.title)
        setContent(data.data ?? '')
        setIconId(data.iconId)
        setBannerUrl(data.bannerUrl)
      })
      .catch(() => notFound())
      .finally(() => setIsLoading(false))
  }, [fileId])

  useDebounceEffect(
    () => {
      if (!file) return

      updateFile({
        ...file,
        title,
        data: content,
        iconId,
        bannerUrl
      })
    },
    [file, title, content, iconId, bannerUrl],
    750
  )

  const onTitleChange = useCallback(
    (newTitle: string) => setTitle(newTitle),
    []
  )
  const onContentChange = useCallback(
    (newContent: string) => setContent(newContent),
    []
  )
  const onIconChange = useCallback(
    (newIconId: string) => setIconId(newIconId),
    []
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
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const handleBack = () => router.push(`/dashboard/${workspaceId}`)

  // --- HÀM XUẤT PDF MỚI ---
  const handleExportPdf = async () => {
    const element = document.getElementById('pdf-content')
    if (!element) return toast.error('Không tìm thấy nội dung')

    const loadingToast = toast.loading('Đang xử lý PDF chất lượng cao...')

    try {
      // 1. Lấy kích thước thực tế của nội dung (bao gồm cả phần bị khuất)
      const width = element.scrollWidth
      const height = element.scrollHeight

      // 2. Chụp ảnh với cấu hình ép kiểu layout
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        // backgroundColor: '#ffffff', // Ép màu nền trắng (hoặc lấy màu từ CSS)
        width: width,
        height: height,
        style: {
          // QUAN TRỌNG: Loại bỏ các giới hạn chiều rộng và căn giữa khi chụp
          maxWidth: 'none',
          width: `${width}px`,
          height: `${height}px`,
          margin: '',
          padding: '40px', // Thêm lề cho đẹp khi vào PDF
          transform: 'none'
        },
        filter: (node: HTMLElement) => {
          const exclusionClasses = [
            'chatbot-wrapper',
            'bn-side-menu',
            'bn-slash-menu'
          ]
          return !exclusionClasses.some((cls) =>
            node.classList?.contains?.(cls)
          )
        }
      })

      // 3. Khởi tạo PDF
      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p', // Tự động xoay trang nếu nội dung ngang
        unit: 'px',
        format: [width + 80, height + 80] // Khớp kích thước ảnh + padding
      })

      pdf.addImage(dataUrl, 'PNG', 0, 0, width + 80, height + 80)
      pdf.save(`${title || 'document'}.pdf`)

      toast.dismiss(loadingToast)
      toast.success('Xuất PDF thành công!')
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast.dismiss(loadingToast)
      toast.error('Lỗi: Thử lại hoặc giảm bớt ảnh dung lượng lớn')
    }
  }

  if (isLoading) {
    return (
      <div>
        <Cover fileId={fileId} onBannerUrlChange={onBannerUrlChange} />
        <div className='md:max-w-3xl lg:max-w-4xl mx-auto mt-10'>
          <div className='space-y-4 pl-8 pt-4'>
            <Skeleton className='h-14 w-[50%]' />
            <Skeleton className='h-4 w-[80%]' />
            <Skeleton className='h-4 w-[40%]' />
          </div>
        </div>
      </div>
    )
  }

  if (!file) {
    return null
  }

  return (
    <div className='pb-40'>
      <div className='flex sticky top-0 z-1000 items-center justify-between border-b p-4'>
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
          <Button
            variant='outline'
            size='sm'
            onClick={handleExportPdf}
            className='flex items-center gap-2'
          >
            <FileDown className='h-4 w-4' />
            Export PDF
          </Button>
          <Publish initialData={file} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={handleDelete}
                className='text-destructive cursor-pointer'
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div id='pdf-content' className='bg-background w-full h-full'>
        <Cover
          url={bannerUrl}
          fileId={fileId}
          onBannerUrlChange={onBannerUrlChange}
        />
        <div className='md:max-w-4xl lg:max-w-7xl mx-auto mt-10'>
          <Toolbar
            initialData={file}
            onTitleChange={onTitleChange}
            onIconChange={onIconChange}
          />
          <FileEditor
            workspaceId={workspaceId}
            fileId={fileId}
            content={content}
            onContentChange={onContentChange}
          />
        </div>
      </div>

      <div className='chatbot-wrapper'>
        <Chatbot />
      </div>
    </div>
  )
}

// 'use client'

// import { use, useCallback, useEffect, useMemo, useState } from 'react'

// import { notFound, useRouter } from 'next/navigation'
// import { toast } from 'sonner'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger
// } from '@radix-ui/react-dropdown-menu'
// import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react'
// import { useSession } from 'next-auth/react'

// import type { File } from '@/types/db'

// import {
//   deleteFile,
//   getFileById,
//   updateFile,
//   updateFileBanner
// } from '@/lib/db/queries'
// import { store, useAppState } from '@/hooks/use-app-state'
// import { useDebounceEffect } from '@/hooks/use-debounce-effect'
// import {
//   CollaborativeFileEditor,
//   Collaborators
// } from '@/components/editor/collaborative-file-editor'
// import {
//   RoomProvider,
//   useBroadcastEvent,
//   useEventListener
// } from '@/lib/liveblocks'
// import { Cover } from '@/components/cover'
// import { Toolbar } from '@/components/toolbar'
// import { Skeleton } from '@/components/ui/skeleton'
// import { SidebarMobile } from '@/components/sidebar/sidebar-mobile'
// import { Button } from '@/components/ui/button'
// import { Publish } from '@/components/publish'
// import { Chatbot } from '@/components/chatbot'
// import { ShareModal } from '@/components/modals/share-modal'

// interface PageProps {
//   params: Promise<{
//     workspaceId: string
//     fileId: string
//   }>
// }

// function FileContent({
//   file: initialFile,
//   fileId,
//   workspaceId
// }: {
//   file: File
//   fileId: string
//   workspaceId: string
// }) {
//   const router = useRouter()
//   const { deleteFile: removeFileFromState } = useAppState()
//   const broadcast = useBroadcastEvent()

//   const [title, setTitle] = useState(initialFile.title)
//   const [content, setContent] = useState(initialFile.data ?? '')
//   const [iconId, setIconId] = useState(initialFile.iconId)
//   const [bannerUrl, setBannerUrl] = useState<string | null>(
//     initialFile.bannerUrl ?? null
//   )

//   // Listen for title/icon updates from other users
//   useEventListener(({ event }) => {
//     if (event.type === 'TITLE_UPDATE') {
//       setTitle(event.value)
//     } else if (event.type === 'ICON_UPDATE') {
//       setIconId(event.value)
//     }
//   })

//   const fileToUpdate = useMemo(
//     () => ({
//       id: fileId,
//       title,
//       data: content,
//       iconId,
//       bannerUrl
//     }),
//     [fileId, title, content, iconId, bannerUrl]
//   )

//   useDebounceEffect(
//     () => {
//       updateFile(fileToUpdate)
//     },
//     [fileToUpdate],
//     750
//   )

//   const onTitleChange = useCallback(
//     (newTitle: string) => {
//       setTitle(newTitle)
//       broadcast({ type: 'TITLE_UPDATE', value: newTitle })
//     },
//     [broadcast]
//   )

//   const onContentChange = useCallback((newContent: string) => {
//     setContent(newContent)
//   }, [])

//   const onIconChange = useCallback(
//     (newIconId: string) => {
//       setIconId(newIconId)
//       broadcast({ type: 'ICON_UPDATE', value: newIconId })
//     },
//     [broadcast]
//   )

//   const onBannerUrlChange = useCallback(
//     (newBannerUrl: string | null) => {
//       setBannerUrl(newBannerUrl)
//       updateFileBanner(fileId, newBannerUrl).then(() => {
//         store.updateFileBanner(fileId, newBannerUrl)
//       })
//     },
//     [fileId]
//   )

//   const handleDelete = async () => {
//     try {
//       await deleteFile(fileId)
//       removeFileFromState(fileId)
//       toast.success('File deleted successfully')
//       router.push(`/dashboard/${workspaceId}`)
//       router.refresh()
//     } catch {
//       toast.error('Failed to delete file')
//     }
//   }

//   const handleBack = () => {
//     router.push(`/dashboard/${workspaceId}`)
//   }

//   return (
//     <>
//       <div className='flex relative items-center justify-between border-b p-4'>
//         <div className='flex items-center gap-4 flex-1'>
//           <div className='lg:hidden'>
//             <SidebarMobile />
//           </div>
//           <Button variant='ghost' size='sm' onClick={handleBack}>
//             <ChevronLeft className='h-4 w-4 mr-2' />
//             Back
//           </Button>
//         </div>

//         <div className='flex items-center gap-2'>
//           <Collaborators />
//           <ShareModal workspaceId={workspaceId} fileId={fileId} />
//           <Publish
//             initialData={{
//               id: initialFile.id!,
//               isPublished: initialFile.isPublished ?? false
//             }}
//           />
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant='ghost' size='sm'>
//                 <MoreVertical className='h-4 w-4' />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align='end'>
//               <DropdownMenuItem
//                 onClick={handleDelete}
//                 className='text-destructive'
//               >
//                 <Trash2 className='h-4 w-4 mr-2' />
//                 Delete
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>

//       <Cover
//         url={bannerUrl}
//         fileId={fileId}
//         onBannerUrlChange={onBannerUrlChange}
//       />
//       <div className='md:max-w-5xl lg:max-w-7xl mx-auto'>
//         <Toolbar
//           initialData={initialFile}
//           onTitleChange={onTitleChange}
//           onIconChange={onIconChange}
//         />
//         {/* <CollaborativeFileEditor
//           fileId={fileId}
//           editable={true}
//           content={content}
//           onContentChange={onContentChange}
//         /> */}

//         <Chatbot />
//       </div>
//     </>
//   )
// }

// export default function FilePage({ params }: PageProps) {
//   const { workspaceId, fileId } = use(params)
//   const { data: session } = useSession()
//   const user = session?.user
//   const [file, setFile] = useState<File | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const { files } = useAppState()
//   const fileFromState = files.find((f) => f.id === fileId)

//   useEffect(() => {
//     getFileById(fileId)
//       .then((data) => {
//         if (!data) {
//           return notFound()
//         }
//         setFile(data)
//       })
//       .catch(() => notFound())
//       .finally(() => setIsLoading(false))
//   }, [fileId])

//   useEffect(() => {
//     if (fileFromState && file) {
//       setFile((prev) =>
//         prev ? { ...prev, bannerUrl: fileFromState.bannerUrl ?? null } : null
//       )
//     }
//   }, [fileFromState?.bannerUrl])

//   if (isLoading) {
//     return (
//       <div>
//         <div className='relative w-full h-[12vh]' />
//         <div className='md:max-w-3xl lg:max-w-4xl mx-auto mt-10'>
//           <div className='space-y-4 pl-8 pt-4'>
//             <Skeleton className='h-14 w-[50%]' />
//             <Skeleton className='h-4 w-[80%]' />
//             <Skeleton className='h-4 w-[40%]' />
//             <Skeleton className='h-4 w-[60%]' />
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!file) {
//     return notFound()
//   }

//   return (
//     <div className='pb-40'>
//       <RoomProvider
//         id={`file-${fileId}`}
//         initialPresence={{
//           cursor: null,
//           user: {
//             name: user?.name ?? 'Anonymous',
//             avatar: user?.image ?? '',
//             color: '#64B5F6'
//           }
//         }}
//       >
//         <FileContent file={file} fileId={fileId} workspaceId={workspaceId} />
//       </RoomProvider>
//     </div>
//   )
// }
