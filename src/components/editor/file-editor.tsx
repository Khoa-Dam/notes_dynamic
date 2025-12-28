'use client'

// import { useRouter } from 'next/navigation'
// import { ChevronLeft, Trash2, MoreVertical } from 'lucide-react'
// import { Button } from '@/components/ui/button'
import { BlockNoteEditor } from '@/components/editor/block-note-editor'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger
// } from '@/components/ui/dropdown-menu'
// import { SidebarMobile } from '@/components/sidebar/sidebar-mobile'
// import { deleteFile } from '@/lib/db/queries'
// import { toast } from 'sonner'
// import { useAppState } from '@/hooks/use-app-state'

interface FileEditorProps {
  editable?: boolean
  workspaceId: string
  fileId: string
  content: string | null
  onContentChange: (content: string) => void
}

export function FileEditor({
  editable = true,
  workspaceId,
  fileId,
  content,
  onContentChange
}: FileEditorProps) {
  return (
    <div className='flex h-full w-full flex-col'>
      <div className='flex-1 overflow-auto'>
        <BlockNoteEditor
          initialContent={content || ''}
          onChange={onContentChange}
          editable={editable}
        />
      </div>
    </div>
  )
}
