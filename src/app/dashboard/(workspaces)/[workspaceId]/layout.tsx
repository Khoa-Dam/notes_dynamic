import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppStateProvider } from '@/components/app-state-provider'
import { getCurrentUser } from '@/lib/auth'
import { getFiles, getFolders } from '@/lib/db/queries'
import { ResizableLayout } from '../components/resizable-layout'
import Stopwatch from '@/components/stop-watch'
import FloatingYoutubePlayer from '@/components/floating-youtube-player'
import { WorkspaceIdManager } from '@/components/workspace/workspace-id-manager'
import { Chatbot } from '@/components/chatbot'
// import { Chatbot } from '@/components/chatbot'

export const WorkspaceLayout: React.FCC<{
  params: Promise<{ workspaceId: string }>
}> = async ({ params, children }) => {
  const { workspaceId } = await params

  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()

  const layout = cookieStore.get('react-resizable-panels:layout')
  const collapsed = cookieStore.get('react-resizable-panels:collapsed')

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined

  const [files, folders] = await Promise.all([
    getFiles(workspaceId),
    getFolders(workspaceId)
  ])

  return (
    <AppStateProvider
      user={user}
      files={files!}
      folders={folders!}
      workspaceId={workspaceId}
    >
      <WorkspaceIdManager workspaceId={workspaceId} />
      <ResizableLayout
        defaultLayout={defaultLayout as number[]}
        defaultCollapsed={defaultCollapsed as boolean}
      >
        <Stopwatch />
        <FloatingYoutubePlayer />
        <Chatbot />
        {children}
      </ResizableLayout>
    </AppStateProvider>
  )
}

export default WorkspaceLayout
