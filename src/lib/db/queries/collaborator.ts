"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collaborators, users } from "@/lib/db/schema";

export async function getCollaborators(workspaceId: string) {
  try {
    const result = await db
      .select({
        id: collaborators.id,
        workspaceId: collaborators.workspaceId,
        userId: collaborators.userId,
        createdAt: collaborators.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(collaborators)
      .innerJoin(users, eq(collaborators.userId, users.id))
      .where(eq(collaborators.workspaceId, workspaceId));

    return result;
  } catch (error) {
    console.error("Error getting collaborators:", error);
    return [];
  }
}

export async function addCollaborator(workspaceId: string, userId: string) {
  try {
    // Check if already a collaborator
    const existing = await db
      .select()
      .from(collaborators)
      .where(
        and(
          eq(collaborators.workspaceId, workspaceId),
          eq(collaborators.userId, userId)
        )
      );

    if (existing.length > 0) {
      return { success: false, error: "User is already a collaborator" };
    }

    await db.insert(collaborators).values({
      workspaceId,
      userId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return { success: false, error: "Failed to add collaborator" };
  }
}

export async function removeCollaborator(workspaceId: string, userId: string) {
  try {
    await db
      .delete(collaborators)
      .where(
        and(
          eq(collaborators.workspaceId, workspaceId),
          eq(collaborators.userId, userId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return { success: false, error: "Failed to remove collaborator" };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(eq(users.email, email));

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}
