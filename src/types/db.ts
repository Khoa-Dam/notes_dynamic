import type {
  collaborators,
  files,
  folders,
  users,
  workspaces,
} from "@/lib/db/schema";

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type File = typeof files.$inferSelect;
export type Collaborator = typeof collaborators.$inferSelect;
