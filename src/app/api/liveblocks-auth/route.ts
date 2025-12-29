// File: src/app/api/liveblocks-auth/route.ts
import { auth } from '@/lib/auth' // Hoặc bất cứ cách nào bạn lấy session
import { db } from '@/lib/db'
import { files, workspaces, collaborators } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { Liveblocks } from '@liveblocks/node'

const secret = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY

let liveblocks: Liveblocks | undefined = undefined

if (secret) {
  liveblocks = new Liveblocks({ secret })
} else {
  console.error(
    '❌ AUTH: LIVEBLOCKS_SECRET_KEY is not set. Authentication will fail on every request.'
  )
}

export async function POST(request: Request) {
  if (!liveblocks) {
    console.error(
      '❌ AUTH: liveblocks client is not initialized because LIVEBLOCKS_SECRET_KEY is missing.'
    )
    return new Response('Server not configured for authentication', {
      status: 500
    })
  }

  // 1. Lấy thông tin người dùng đang đăng nhập
  const session = await auth()
  if (!session?.user?.id) {
    console.log('❌ AUTH: Không có session người dùng.')
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = session.user.id
  console.log('✅ AUTH: Người dùng ID:', userId)

  // 2. Lấy room ID từ request
  const { room } = await request.json()
  console.log('✅ AUTH: Yêu cầu truy cập vào room:', room)

  const fileId = room.replace('file-', '')

  try {
    // 3. Tìm không gian làm việc (workspace) của tệp
    const file = (await db.select().from(files).where(eq(files.id, fileId)))[0]
    if (!file) {
      console.log('❌ AUTH: Không tìm thấy tệp với ID:', fileId)
      return new Response('File not found', { status: 404 })
    }
    const workspaceId = file.workspaceId
    console.log('✅ AUTH: Tệp thuộc workspace ID:', workspaceId)

    // 4. Lấy thông tin workspace và kiểm tra quyền sở hữu
    const workspace = (
      await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))
    )[0]
    if (!workspace) {
      console.log('❌ AUTH: Không tìm thấy workspace với ID:', workspaceId)
      return new Response('Workspace not found', { status: 404 })
    }
    console.log('✅ AUTH: Chủ sở hữu workspace là:', workspace.workspaceOwnerId)

    // 5. Kiểm tra xem người dùng có phải là chủ sở hữu không
    const isOwner = workspace.workspaceOwnerId === userId
    console.log('✅ AUTH: Người dùng có phải là chủ sở hữu không?', isOwner)

    // 6. Kiểm tra xem người dùng có phải là cộng tác viên không
    const collaborator = (
      await db
        .select()
        .from(collaborators)
        .where(
          and(
            eq(collaborators.workspaceId, workspaceId),
            eq(collaborators.userId, userId)
          )
        )
    )[0]
    const isCollaborator = !!collaborator
    console.log(
      '✅ AUTH: Người dùng có phải là cộng tác viên không?',
      isCollaborator
    )

    // 7. Quyết định cấp quyền
    if (!isOwner && !isCollaborator) {
      console.log(
        '❌ AUTH: Từ chối truy cập. Không phải chủ sở hữu cũng không phải cộng tác viên.'
      )
      return new Response('You have no access', { status: 403 })
    }

    console.log('✅ AUTH: Cấp quyền truy cập thành công!')
    // Cấp quyền và trả về token cho Liveblocks
    const { status, body } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [] // Bạn có thể dùng groupIds cho các quyền phức tạp hơn
      },
      {
        userInfo: {
          name: session.user.name || 'Anonymous',
          picture: session.user.image || undefined
        }
      }
    )

    return new Response(body, { status })
  } catch (error) {
    console.error('❌ AUTH: Đã xảy ra lỗi nghiêm trọng:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
