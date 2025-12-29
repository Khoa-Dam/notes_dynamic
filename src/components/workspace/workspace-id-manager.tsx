'use client'

import { useEffect } from 'react'

export function WorkspaceIdManager({ workspaceId }: { workspaceId: string }) {
  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem('last-visited-workspace-id', workspaceId)
    }
  }, [workspaceId])

  return null // This component does not render anything
}
