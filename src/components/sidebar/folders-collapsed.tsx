'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Check,
  Edit2,
  FileIcon,
  FilePlus2,
  FileX,
  FolderIcon,
  Plus,
  Trash,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'

import type { File, Folder } from '@/types/db'

import { useAppState } from '@/hooks/use-app-state'
import {
  createFile,
  createFolder,
  deleteFileFromDb,
  deleteFolderFromDb,
  updateFileInDb,
  updateFolderInDb
} from '@/lib/db/queries'
import { cn, currentlyInDev } from '@/lib/utils'
import { EmojiPicker } from '../emoji-picker'
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger
} from '../ui/navigation-menu'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function FoldersCollapsed() {
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

  const [folderName, setFolderName] = useState('Untitled')
  const [selectedEmoji, setSelectedEmoji] = useState('')

  function createFolderToggle() {
    // No subscription check needed
  }

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
            text: icon,
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
            text: 'New page',
            styles: {}
          }
        ],
        children: []
      }
    ]
    return JSON.stringify(initialBlocks)
  }

  async function createFileToggle(folderId: string) {
    const tempId = uuid()
    const initialContent = createInitialContent()
    const newFile: File = {
      id: tempId,
      title: 'New page',
      bannerUrl: '',
      iconId: '📄',
      folderId,
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
      data: null,
      title: folderName,
      iconId: selectedEmoji || '📁',
      bannerUrl: '',
      createdAt: new Date().toISOString(),
      workspaceId: pathname.split('/')[2]
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
      updateFolderInDb(updatedFolder).then(() => {
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
      toast.success('File deleted permanently.')
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
      toast.success('Folder deleted permanently.')
      router.refresh()
    } catch (error) {
      addFolder(folder)
      toast.error('Something went wrong! Unable to delete folder.')
    }
  }

  return (
    <NavigationMenu orientation='vertical' className='max-w-none items-start'>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger showIndicator={false} className='size-10 p-0'>
            <Plus className='size-5' />
          </NavigationMenuTrigger>

          <NavigationMenuContent className='min-w-80 space-y-4 p-4'>
            <h3 className='text-lg font-semibold leading-none tracking-tight'>
              Create folder
            </h3>

            <form onSubmit={createFolderHandler} className='mt-4 space-y-4'>
              <div className='flex gap-2'>
                <EmojiPicker
                  title='Select an emoji'
                  getValue={setSelectedEmoji}
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  {!selectedEmoji ? (
                    <FolderIcon className='size-5' />
                  ) : (
                    selectedEmoji
                  )}
                </EmojiPicker>

                <Input
                  placeholder='Enter folder name'
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className='h-9'
                />
              </div>

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  size='sm'
                  variant='secondary'
                  onClick={createFolderToggle}
                >
                  Cancel
                </Button>

                <Button size='sm'>Create</Button>
              </div>
            </form>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {folders.map(({ id, iconId, title }) => {
          const folderFiles = files.filter((f) => f.folderId === id)

          return (
            <NavigationMenuItem
              key={id!}
              className='flex items-center justify-center'
            >
              <NavigationMenuTrigger
                showIndicator={false}
                className='size-10 p-0 flex items-center justify-center'
              >
                {!iconId ? (
                  <FolderIcon className='size-5' />
                ) : (
                  <span className='text-lg '>{iconId}</span>
                )}
              </NavigationMenuTrigger>

              <NavigationMenuContent className='min-w-80 space-y-4 p-4'>
                <header className='flex items-center justify-between'>
                  <h3 className='flex text-lg font-semibold leading-none tracking-tight'>
                    {iconId ? (
                      <span className='text-lg'>{iconId}</span>
                    ) : (
                      <FolderIcon className='size-5' />
                    )}
                    <span className='ml-2'>{title}</span>
                  </h3>

                  <div>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          onClick={() => createFileToggle(id!)}
                          className='size-7 p-0 text-muted-foreground'
                        >
                          <FilePlus2 className='size-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create file</TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          onClick={currentlyInDev}
                          className='size-7 p-0 text-muted-foreground'
                        >
                          <Edit2 className='size-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit folder</TooltipContent>
                    </Tooltip>

                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              className='size-7 p-0 text-muted-foreground hover:text-red-500'
                            >
                              <Trash className='size-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete folder</TooltipContent>
                        </Tooltip>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the file.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => moveFolderToTrash(id!)}
                            className='bg-destructive/10 text-destructive hover:bg-destructive/15'
                          >
                            Move to trash
                          </AlertDialogAction>
                          <AlertDialogAction
                            onClick={() => deleteFolderHandler(id!)}
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
                </header>

                <ScrollArea>
                  <div className='max-h-[320px]'>
                    {folderFiles.length > 0 ? (
                      folderFiles.map(({ id, title, iconId, workspaceId }) => (
                        <div
                          key={id}
                          className={cn(
                            'group w-full flex justify-between',
                            buttonVariants({
                              size: 'lg',
                              variant: 'ghost'
                            })
                          )}
                        >
                          <Link
                            href={`/dashboard/${workspaceId}/${id}`}
                            className='flex w-full items-center gap-0.5 flex items-center justify-center'
                          >
                            <span className='mr-2 shrink-0 flex items-center justify-center'>
                              {iconId ? (
                                iconId
                              ) : (
                                <FileIcon className='size-5' />
                              )}
                            </span>
                            {title}
                          </Link>

                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Button
                                size='icon'
                                variant='default'
                                onClick={currentlyInDev}
                                className=' z-10 ml-auto size-7 shrink-0 text-muted-foreground group-hover:visible'
                              >
                                <Edit2 className='size-6' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit file</TooltipContent>
                          </Tooltip>

                          <AlertDialog>
                            <AlertDialogTrigger>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='invisible z-10 size-7 shrink-0 text-muted-foreground hover:text-red-500 group-hover:visible'
                                  >
                                    <Trash className='size-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete file</TooltipContent>
                              </Tooltip>
                            </AlertDialogTrigger>

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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                      ))
                    ) : (
                      <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-muted-foreground'>
                        <FileX size={20} />

                        <p className='text-center text-sm'>
                          You don&apos;t have any file yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <ScrollBar />
                </ScrollArea>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
