import { WorkspaceContent } from '@/components/workspace/workspace-content'
import { WorkspaceHeader } from '@/components/workspace/workspace-header'
import { getWorkspaceById } from '@/lib/db/queries'

export default async function WorkspacePage({
  params
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const workspace = await getWorkspaceById(workspaceId)

  if (!workspace) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold'>Workspace not found</h3>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-auto'>
        <WorkspaceHeader workspace={workspace} />
        <div className='space-y-6 p-6'>
          <WorkspaceContent workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  )
}
