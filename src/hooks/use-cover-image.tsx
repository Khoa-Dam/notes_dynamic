import { create } from 'zustand'

type CoverImageStore = {
  url?: string
  isOpen: boolean
  fileId?: string
  onOpen: (fileId: string) => void
  onClose: () => void
  onReplace: (url: string, fileId: string) => void
}

export const useCoverImage = create<CoverImageStore>((set) => ({
  url: undefined,
  isOpen: false,
  fileId: undefined,
  onOpen: (fileId) => set({ isOpen: true, url: undefined, fileId }),
  onClose: () => set({ isOpen: false, url: undefined, fileId: undefined }),
  onReplace: (url, fileId) => set({ isOpen: true, url, fileId })
}))
// const fileToUpdate = useMemo(
//   () => ({
//     id: fileId,
//     title,
//     data: content,
//     iconId,
//     bannerUrl
//   }),
//   [fileId, title, content, iconId, bannerUrl]
// )
