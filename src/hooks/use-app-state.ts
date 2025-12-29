import React from 'react'
import { proxy, useSnapshot } from 'valtio'

import type { User } from 'next-auth'
import type { File, Folder } from '@/types/db'

export type AppState = {
  user: User | null
  workspaceId: string | null
  files: File[]
  folders: Folder[]
}

export type AppAction = {
  addFile: (file: File) => void
  updateFile: (file: File) => void
  updateFileBanner: (fileId: string, bannerUrl: string | null) => void
  deleteFile: (fileId: string) => void

  addFolder: (folder: Folder) => void
  updateFolder: (folder: Folder) => void
  deleteFolder: (folderId: string) => void
}

export const store = proxy<AppState & AppAction>({
  user: null,
  workspaceId: null,
  files: [],
  folders: [],

  addFile(file) {
    store.files.push(file)
  },
  updateFile(file) {
    store.files = store.files.map((f) => (f.id === file.id ? file : f))
  },
  updateFileBanner(fileId, bannerUrl) {
    store.files = store.files.map((f) =>
      f.id === fileId ? { ...f, bannerUrl } : f
    )
  },
  deleteFile(id) {
    store.files = store.files.filter((f) => f.id !== id)
  },

  addFolder(folder) {
    store.folders.push(folder)
  },
  updateFolder(folder: Folder) {
    store.folders = store.folders.map((f) => (f.id === folder.id ? folder : f))
  },
  deleteFolder(id) {
    store.folders = store.folders.filter((f) => f.id !== id)
  }
})

export function setStore(newState: AppState) {
  store.user = newState.user
  store.workspaceId = newState.workspaceId

  // Merge files instead of replacing to preserve optimistic updates
  if (newState.files) {
    const existingFileIds = new Set(store.files.map((f) => f.id))
    const newFiles = newState.files.filter(
      (f) => f.id && !existingFileIds.has(f.id)
    )
    // Keep existing files that are not in newState (optimistic updates) and merge with server data
    const existingFiles = store.files.filter(
      (f) => !newState.files?.some((nf) => nf.id === f.id)
    )
    // Update existing files with server data if they exist in newState
    const updatedFiles = store.files
      .filter((f) => newState.files?.some((nf) => nf.id === f.id))
      .map((f) => {
        const serverFile = newState.files?.find((nf) => nf.id === f.id)
        return serverFile || f
      })
    store.files = [...existingFiles, ...updatedFiles, ...newFiles]
  }

  // Merge folders instead of replacing to preserve optimistic updates
  if (newState.folders) {
    const existingFolderIds = new Set(store.folders.map((f) => f.id))
    const newFolders = newState.folders.filter(
      (f) => f.id && !existingFolderIds.has(f.id)
    )
    // Keep existing folders that are not in newState (optimistic updates) and merge with server data
    const existingFolders = store.folders.filter(
      (f) => !newState.folders?.some((nf) => nf.id === f.id)
    )
    // Update existing folders with server data if they exist in newState
    const updatedFolders = store.folders
      .filter((f) => newState.folders?.some((nf) => nf.id === f.id))
      .map((f) => {
        const serverFolder = newState.folders?.find((nf) => nf.id === f.id)
        return serverFolder || f
      })
    store.folders = [...existingFolders, ...updatedFolders, ...newFolders]
  }
}

export type Store = typeof store

export const AppStateContext = React.createContext<Store | null>(null)

export function useAppState() {
  if (!AppStateContext)
    throw new Error('Cannot use `useAppState` outside of a `StoreProvider`')

  return useSnapshot(React.useContext(AppStateContext)!)
}
