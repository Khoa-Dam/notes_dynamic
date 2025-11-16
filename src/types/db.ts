import type {
  collaborators,
  files,
  folders,
  users,
  workspaces,
} from "@/lib/db/schema";

export type User = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferInsert;
export type Folder = typeof folders.$inferInsert;
export type File = typeof files.$inferInsert;
export type Collaborator = typeof collaborators.$inferInsert;
