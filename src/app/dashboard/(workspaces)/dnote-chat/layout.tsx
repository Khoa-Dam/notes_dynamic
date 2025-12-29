import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppStateProvider } from '@/components/app-state-provider'
import { getCurrentUser } from '@/lib/auth'
import { getFiles, getFolders } from '@/lib/db/queries'
import { ResizableLayout } from '../components/resizable-layout'

export const DnoteChatLayout: React.FCC = async ({ children }) => {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()

  const layout = cookieStore.get('react-resizable-panels:layout')
  const collapsed = cookieStore.get('react-resizable-panels:collapsed')

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined

  const workspaceId = cookieStore.get('last-visited-workspace-id')?.value

  let files = []
  let folders = []

  if (workspaceId) {
    ;[files, folders] = await Promise.all([
      getFiles(workspaceId).then((res) => res || []),
      getFolders(workspaceId).then((res) => res || [])
    ])
  }

  return (
    <AppStateProvider
      user={user}
      files={files}
      folders={folders}
      workspaceId={workspaceId || null}
    >
      <ResizableLayout
        defaultLayout={defaultLayout as number[]}
        defaultCollapsed={defaultCollapsed as boolean}
      >
        {children}
      </ResizableLayout>
    </AppStateProvider>
  )
}

export default DnoteChatLayout
