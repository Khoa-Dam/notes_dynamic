import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'
import { folders, files } from '@/lib/db/schema/app'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { uuidSchema } from '@/lib/validations' // Import uuidSchema

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(req: Request) {
  try {
    const { iconId, title, data, workspaceId, bannerUrl } = await req.json()

    if (!data || !workspaceId) {
      return new NextResponse('Missing content or workspaceId', { status: 400 })
    }

    // Validate workspaceId using uuidSchema
    const validatedWorkspaceId = uuidSchema.safeParse(workspaceId)
    if (!validatedWorkspaceId.success) {
      return new NextResponse('Invalid workspaceId format', { status: 400 })
    }
    const validatedId = validatedWorkspaceId.data

    const userFolders = await db.query.folders.findMany({
      where: eq(folders.workspaceId, validatedId)
    })

    const folderNames = userFolders.map((folder) => folder.title)

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Đây là danh sách Folder hiện có: [${folderNames.join(
      ', '
    )}]. Hãy phân loại ghi chú sau thành 1 Category và 3 Tags. Nếu Category khớp với danh sách Folder, hãy dùng chính xác tên đó. Nếu không, hãy tạo Category mới phù hợp nhất. Trả về JSON: { "category": "string", "tags": "string[]" }
    
    Note content:
    ${data}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = await response.text()

    // Clean the response to ensure it's valid JSON
    text = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const { category, tags } = JSON.parse(text)

    let folder = await db.query.folders.findFirst({
      where: and(
        eq(folders.workspaceId, validatedId),
        eq(folders.title, category)
      )
    })

    if (!folder) {
      const [newFolder] = await db
        .insert(folders)
        .values({
          id: uuidv4(),
          title: category,
          workspaceId: validatedId,
          iconId: '📄'
        })
        .returning()
      folder = newFolder
    }

    const [newFile] = await db
      .insert(files)
      .values({
        id: uuidv4(),
        title: title || 'Untitled Note',
        // content: content || '',
        folderId: folder.id,
        workspaceId: validatedId,
        iconId: iconId || '📝',
        data,
        bannerUrl,
        inTrash: false,
        isPublished: false
      })
      .returning()

    return NextResponse.json({
      success: true,
      fileId: newFile.id,
      fileName: newFile.title,
      folderName: folder.title
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
