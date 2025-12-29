'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Check,
  ChevronDown,
  FileIcon,
  FileX,
  FolderIcon,
  FolderOpen,
  FolderX,
  Plus,
  Trash,
  Trash2,
  X,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow
} from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'

import type { File, Folder } from '@/types/db'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { useAppState } from '@/hooks/use-app-state'
import {
  createFile,
  createFolder,
  deleteFileFromDb,
  deleteFolderFromDb,
  updateFileInDb,
  updateFolderInDb
} from '@/lib/db/queries'
import { cn, currentlyInDev, isAppleDevice } from '@/lib/utils'
import { EmojiPicker } from '../emoji-picker'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog'
import { Button, buttonVariants } from '../ui/button'
import { Input } from '../ui/input'
import { Kbd } from '../ui/kbd'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function Folders() {
  const pathname = usePathname()
  const router = useRouter()

  const {
    files: stateFiles,
    folders: stateFolders,
    addFile,
    deleteFile,
    updateFile,
    addFolder,
    deleteFolder,
    updateFolder
  } = useAppState()

  const files = stateFiles.filter((file) => !file.inTrash)
  const folders = stateFolders.filter((folder) => !folder.inTrash)

  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [openedFolders, setOpenedFolders] = useState<string[]>([])
  const [folderName, setFolderName] = useState('Untitled')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [sortBy, setSortBy] = useState<'none' | 'name' | 'createdAt'>('none')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...'
    }
    return text
  }

  const getSortedFolders = (
    folders: Folder[],
    sortBy: 'none' | 'name' | 'createdAt',
    sortOrder: 'desc' | 'asc'
  ) => {
    return [...folders].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.title.toLowerCase()
        const nameB = b.title.toLowerCase()
        if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1
        if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1
        return 0
      } else if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt!).getTime()
        const dateB = new Date(b.createdAt!).getTime()
        if (dateA < dateB) return sortOrder === 'asc' ? -1 : 1
        if (dateA > dateB) return sortOrder === 'asc' ? 1 : -1
        return 0
      }
      return 0
    })
  }

  const sortedFolders = getSortedFolders(folders, sortBy, sortOrder)

  // Helper function to create initial content with icon and header
  function createInitialContent(icon: string = '📄'): string {
    const initialBlocks = [
      {
        id: crypto.randomUUID(),
        type: 'paragraph' as const,
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: '',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: crypto.randomUUID(),
        type: 'heading' as const,
        props: {
          level: 1,
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: '',
            styles: {}
          }
        ],
        children: []
      }
    ]
    return JSON.stringify(initialBlocks)
  }

  function createFolderToggle() {
    setIsCreatingFolder((prev) => !prev)
  }

  async function createFileToggle(folderId: string) {
    const tempId = uuid()
    const initialContent = createInitialContent()
    const newFile: File = {
      id: tempId,
      title: 'Untitled',
      iconId: '📄',
      folderId,
      bannerUrl: null,
      createdAt: new Date().toISOString(),
      workspaceId: pathname.split('/')[2],
      data: initialContent,
      inTrash: false,
      isPublished: false
    }

    // Add file optimistically
    addFile(newFile)

    try {
      const createdFile = await createFile(newFile)
      // Remove temp file and add the real one from server
      deleteFile(tempId)
      addFile(createdFile)
      toast.success('File created.')

      // Navigate to the new file
      router.push(`/dashboard/${pathname.split('/')[2]}/${createdFile.id}`)

      // Delay refresh to allow cache to update
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error) {
      // Remove temp file on error
      deleteFile(tempId)
      toast.error('Something went wrong! Unable to create file.')
    }
  }

  async function createFolderHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (folderName.length < 3) {
      toast.warning('Folder name must be at least 3 characters long.')
      return
    }

    const tempId = uuid()
    const newFolder: Folder = {
      id: tempId,
      title: folderName,
      iconId: selectedEmoji, // null nếu không chọn emoji
      workspaceId: pathname.split('/')[2],
      data: null,
      bannerUrl: null,
      inTrash: false,
      createdAt: new Date().toISOString() // Định dạng chuẩn ISO cho Postgres
    }

    // Add folder optimistically
    addFolder(newFolder)

    try {
      const createdFolder = await createFolder(newFolder)
      // Remove temp folder and add the real one from server
      deleteFolder(tempId)
      addFolder(createdFolder)
      toast.success('Folder created.')
      router.refresh()
    } catch (error) {
      // Remove temp folder on error
      deleteFolder(tempId)
      toast.error('Something went wrong! Unable to create folder.')
    }

    setSelectedEmoji('')
    setFolderName('Untitled')
    setIsCreatingFolder(false)
  }

  function handleCancel() {
    setEditingFolderId(null)
    setFolderName('Untitled')
    setSelectedEmoji('')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        formRef.current &&
        !formRef.current.contains(target) &&
        !target.closest('[role="dialog"]')
      ) {
        handleCancel()
      }
    }

    if (editingFolderId) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingFolderId])

  async function handleChangeFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (folderName.length < 3) {
      toast.warning('Folder name must be at least 3 characters long.')
      return
    }

    if (!editingFolderId) return

    const folder = folders.find((f) => f.id === editingFolderId)
    if (!folder) return

    const updatedFolder: Folder = {
      ...folder,
      title: folderName,
      iconId: selectedEmoji
    }

    updateFolder(updatedFolder)
    setEditingFolderId(null)

    try {
      await updateFolderInDb(updatedFolder)
      toast.success('Folder updated.')
      router.refresh()
    } catch (error) {
      updateFolder(folder)
      toast.error('Something went wrong! Unable to update folder.')
    }
  }

  async function moveFileToTrash(fileId: string) {
    const file = files.find((f) => f.id === fileId)

    if (!file) {
      toast.error('Something went wrong', { description: 'File not found.' })
      return
    }

    const updatedFile: File = { ...file, inTrash: true }
    updateFile(updatedFile)

    toast.promise(
      updateFileInDb(updatedFile).then(() => {
        router.refresh()
      }),
      {
        loading: 'Moving file to trash...',
        success: 'File moved to trash.',
        error: 'Something went wrong! Unable to move file to trash.'
      }
    )
  }

  async function moveFolderToTrash(folderId: string) {
    const folder = folders.find((f) => f.id === folderId)

    if (!folder) {
      toast.error('Something went wrong', { description: 'Folder not found.' })
      return
    }

    const updatedFolder: Folder = { ...folder, inTrash: true }
    updateFolder(updatedFolder)
    toast.promise(
      updateFolderInDb({ ...folder, inTrash: true }).then(() => {
        router.refresh()
      }),
      {
        loading: 'Moving folder to trash...',
        success: 'Folder moved to trash.',
        error: 'Something went wrong! Unable to move folder to trash.'
      }
    )
  }

  async function deleteFileHandler(fileId: string) {
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    deleteFile(fileId)

    try {
      await deleteFileFromDb(fileId)
      toast.success('File deleted.')
      router.refresh()
    } catch (error) {
      addFile(file)
      toast.error('Something went wrong! Unable to delete file.')
    }
  }

  async function deleteFolderHandler(folderId: string) {
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return

    deleteFolder(folderId)

    try {
      await deleteFolderFromDb(folderId)
      toast.success('Folder deleted.')
      router.refresh()
    } catch (error) {
      addFolder(folder)
      toast.error('Something went wrong! Unable to delete folder.')
    }
  }

  return (
    <>
      <div className='flex items-center justify-between px-4'>
        <p className='text-sm font-medium text-muted-foreground'>Folders</p>
        <div className='flex items-center gap-1'>
          <DropdownMenu>
            <Tooltip delayDuration={0}>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7 text-muted-foreground'
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUpWideNarrow className='size-[18px]' />
                    ) : (
                      <ArrowDownWideNarrow className='size-[18px]' />
                    )}
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <TooltipContent>Sort Folders</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side='bottom' align='end'>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy('name')
                  setSortOrder('asc')
                }}
              >
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy('name')
                  setSortOrder('desc')
                }}
              >
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy('createdAt')
                  setSortOrder('desc')
                }}
              >
                Last Updated (Newest First)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy('createdAt')
                  setSortOrder('asc')
                }}
              >
                Last Updated (Oldest First)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy('none')
                  setSortOrder('asc')
                }}
              >
                None
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                onClick={createFolderToggle}
                className='size-7 text-muted-foreground'
              >
                {isCreatingFolder ? (
                  <X className='size-6 duration-300 animate-in spin-in-90' />
                ) : (
                  <Plus className='size-[18px] duration-300 animate-out spin-out-90' />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent>
              {isCreatingFolder ? 'Cancel' : 'Create New folder'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className='-mb-2 flex grow flex-col gap-1 overflow-hidden'>
        {isCreatingFolder || folders.length ? (
          <ScrollArea>
            <Accordion
              type='multiple'
              value={openedFolders}
              onValueChange={setOpenedFolders}
              className='px-4 py-1'
            >
              {isCreatingFolder && (
                <form onSubmit={createFolderHandler} className='relative mb-1'>
                  <EmojiPicker
                    title='Select an emoji'
                    side='right'
                    align='start'
                    getValue={setSelectedEmoji}
                    className='absolute inset-y-0 left-1 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted'
                  >
                    {!selectedEmoji ? (
                      <FolderIcon className='size-6' />
                    ) : (
                      selectedEmoji
                    )}
                  </EmojiPicker>

                  <Input
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className={cn(
                      'h-9 px-9',
                      folderName.length < 3 && 'ring-destructive!'
                    )}
                  />

                  <Button
                    size='icon'
                    variant='ghost'
                    className='absolute inset-y-0 right-1 my-auto size-7 text-muted-foreground'
                  >
                    <Check className='size-6' />
                  </Button>
                </form>
              )}

              {sortedFolders.map(({ id, title, iconId }) => {
                const folderFiles = files.filter((f) => f.folderId === id)

                return (
                  <AccordionItem
                    key={id}
                    value={id!}
                    className='my-3 px-1 border-none'
                  >
                    <ContextMenu>
                      <ContextMenuTrigger>
                        <AccordionTrigger
                          onDoubleClick={() => {
                            setEditingFolderId(id!)
                            setFolderName(title)
                            setSelectedEmoji(iconId || '')
                          }}
                          className={cn(
                            buttonVariants({ size: 'lg', variant: 'ghost' }),
                            'group/trigger justify-start border-none hover:no-underline data-[state=open]:bg-secondary',
                            '[&>svg]:hidden'
                          )}
                        >
                          {editingFolderId === id ? (
                            <form
                              ref={formRef}
                              onSubmit={handleChangeFolder}
                              onClick={(e) => e.stopPropagation()}
                              className='relative mb-1 w-full'
                            >
                              <EmojiPicker
                                title='Select an emoji'
                                side='right'
                                align='start'
                                getValue={setSelectedEmoji}
                                className='absolute inset-y-0 left-1 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted'
                              >
                                {!selectedEmoji ? (
                                  <FolderIcon className='size-6' />
                                ) : (
                                  selectedEmoji
                                )}
                              </EmojiPicker>

                              <Input
                                autoFocus
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                className={cn(
                                  'h-9 pl-9 pr-20',
                                  folderName.length < 3 && 'ring-destructive!'
                                )}
                              />

                              <div className='absolute inset-y-0 right-1 my-auto flex items-center gap-1'>
                                <Button
                                  size='icon'
                                  type='submit'
                                  variant='ghost'
                                  className='size-7 text-muted-foreground'
                                >
                                  <Check className='size-6' />
                                </Button>
                                <Button
                                  size='icon'
                                  type='button'
                                  variant='ghost'
                                  onClick={handleCancel}
                                  className='size-7 text-muted-foreground'
                                >
                                  <X className='size-6' />
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <span className='mr-2 text-2xl'>
                                {iconId ? (
                                  iconId
                                ) : openedFolders.includes(id!) ? (
                                  <FolderOpen className='size-6 shrink-0' />
                                ) : (
                                  <FolderIcon className='size-6 shrink-0' />
                                )}
                              </span>
                              <span className='text-xl'>
                                {truncateText(title, 25)}
                              </span>

                              <div className='ml-auto'>
                                <ChevronDown className=' size-6 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/trigger:visible group-data-[state=open]/trigger:visible group-data-[state=open]/trigger:rotate-180' />
                              </div>
                            </>
                          )}
                        </AccordionTrigger>
                      </ContextMenuTrigger>

                      <ContextMenuContent className='w-56'>
                        <ContextMenuItem
                          onClick={() => createFileToggle(id!)}
                          className='cursor-pointer'
                        >
                          <FileIcon className='mr-2 size-6 shrink-0' />
                          New File
                          <Kbd className='ml-auto'>
                            {isAppleDevice() ? '⌘' : 'Ctrl'}+N
                          </Kbd>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onKeyDown={(e) => {
                            e.preventDefault()

                            if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                              moveFolderToTrash(id!)
                            }
                          }}
                          onClick={() => moveFolderToTrash(id!)}
                          className='cursor-pointer text-red-500!'
                        >
                          <Trash2 className='mr-2 size-6 shrink-0' />
                          Move to Trash
                          <Kbd className='ml-auto'>
                            {isAppleDevice() ? '⌘' : 'Ctrl'}+D
                          </Kbd>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onKeyDown={(e) => {
                            e.preventDefault()

                            if (
                              e.ctrlKey &&
                              e.shiftKey &&
                              e.key.toLowerCase() === 'd'
                            ) {
                              deleteFolderHandler(id!)
                            }
                          }}
                          onClick={() => deleteFolderHandler(id!)}
                          className='cursor-pointer text-red-500!'
                        >
                          <Trash className='mr-2 size-6 shrink-0' />
                          Delete
                          <Kbd className='ml-auto'>
                            {isAppleDevice() ? '⌘' : 'Ctrl'}+Shift+D
                          </Kbd>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>

                    <AccordionContent className='pb-2 pl-2 pt-1'>
                      {folderFiles.length > 0 ? (
                        folderFiles.map(
                          ({ id, title, iconId, workspaceId }) => (
                            <div
                              key={id}
                              className={cn(
                                'group w-full justify-between',
                                buttonVariants({ size: 'lg', variant: 'ghost' })
                              )}
                            >
                              <Link
                                href={`/dashboard/${workspaceId}/${id}`}
                                className='flex text-xl w-full items-center gap-2'
                              >
                                <span className='mr-2 ml-5 size-6 flex items-center text-2xl shrink-0'>
                                  {iconId ? (
                                    iconId
                                  ) : (
                                    <FileIcon className='size-6' />
                                  )}
                                </span>
                                {truncateText(title, 25)}
                              </Link>

                              <AlertDialog>
                                <Tooltip delayDuration={0}>
                                  <AlertDialogTrigger asChild>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        className='size-7 p-0 text-muted-foreground hover:text-red-500'
                                      >
                                        <Trash className='size-6' />
                                      </Button>
                                    </TooltipTrigger>
                                  </AlertDialogTrigger>
                                  <TooltipContent>Delete file</TooltipContent>
                                </Tooltip>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the file.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => moveFileToTrash(id!)}
                                      className='bg-destructive/10 text-destructive hover:bg-destructive/15'
                                    >
                                      Move to trash
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={() => deleteFileHandler(id!)}
                                      className={buttonVariants({
                                        variant: 'destructive'
                                      })}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )
                        )
                      ) : (
                        <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-muted-foreground'>
                          <FileX size={20} />

                          <p className='text-center text-sm'>
                            You don&apos;t have any file yet.
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
            <ScrollBar />
          </ScrollArea>
        ) : (
          <div className='flex h-full flex-col items-center justify-center gap-4 px-4 text-muted-foreground'>
            <FolderX size={32} />
            <p className='text-center text-sm'>
              You don&apos;t have any folders yet.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
