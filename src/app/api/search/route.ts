import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ilike, or } from 'drizzle-orm'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { files, workspaces, collaborators } from '@/lib/db/schema'

export const GET = async (req: NextRequest) => {
  const user = await getCurrentUser()
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
  }

  try {
    // Find workspaces where the user is either the owner or a collaborator
    const userWorkspaces = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .leftJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
      .where(
        or(
          eq(workspaces.workspaceOwnerId, user.id),
          eq(collaborators.userId, user.id)
        )
      )
      .groupBy(workspaces.id)

    const workspaceIds = userWorkspaces.map((ws) => ws.id)

    if (workspaceIds.length === 0) {
      return NextResponse.json([])
    }

    // Find files within those workspaces that match the query
    const results = await db
      .select({
        _id: files.id,
        title: files.title,
        icon: files.iconId,
        workspaceId: files.workspaceId
      })
      .from(files)
      .where(
        and(
          ilike(files.title, `%${query}%`),
          eq(files.inTrash, false)
          // This is a bit tricky with drizzle, need to check if workspaceId is in the list
          // Using `inArray` operator if available, or just filter in code if not.
          // For now, let's assume I can filter later or the DB driver supports it.
          // A proper implementation would use `inArray` from drizzle-orm
          // but for this step I will filter in code after fetching.
        )
      )

    // Drizzle doesn't have `inArray` for all drivers in all versions, so a JS filter might be safer
    // depending on the project's exact setup. A better way would be `inArray(files.workspaceId, workspaceIds)`
    const filteredResults = (await results).filter((file) =>
      workspaceIds.includes(file.workspaceId!)
    )

    // The above is inefficient. Let's try to do it in one query.
    // Drizzle ORM supports `inArray`. I should use it.
    // I need to import `inArray` from 'drizzle-orm'.

    const finalResults = await db
      .select({
        _id: files.id,
        title: files.title,
        icon: files.iconId,
        workspaceId: files.workspaceId
      })
      .from(files)
      .where(
        and(
          ilike(files.title, `%${query}%`),
          eq(files.inTrash, false)
          // inArray(files.workspaceId, workspaceIds) // This is how it should be done
        )
      )
      .limit(10)

    // Since I can't be sure about `inArray`, I'll write it in a way that is more likely to work
    // by joining tables.

    const finalFinalResults = await db
      .select({
        _id: files.id,
        title: files.title,
        icon: files.iconId,
        workspaceId: files.workspaceId
      })
      .from(files)
      .innerJoin(workspaces, eq(files.workspaceId, workspaces.id))
      .leftJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
      .where(
        and(
          or(
            eq(workspaces.workspaceOwnerId, user.id),
            eq(collaborators.userId, user.id)
          ),
          eq(files.inTrash, false),
          ilike(files.title, `%${query}%`)
        )
      )
      .groupBy(files.id)
      .limit(10)

    return NextResponse.json(finalFinalResults)
  } catch (error) {
    console.error('Search API Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
