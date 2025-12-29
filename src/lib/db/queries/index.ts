export type DBResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

// NOTE:
// avoid star export, causing warning
// ```The requested module '...' contains conflicting star exports for the name '$$ACTION_0' with the previous requested module '...'```

export {
  createWorkspace,
  getCollaboratingWorkspaces,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getWorkspaceById,
  updateWorkspace,
} from "./workspace";
export {
  createFolder,
  createFolderInDb,
  deleteFolder,
  deleteFolderFromDb,
  getFolders,
  getFoldersFromDb,
  updateFolder,
  updateFolderInDb,
} from "./folder";
export {
  createFile,
  deleteFile,
  deleteFileFromDb,
  getFileById,
  getFiles,
  getFilesFromDb,
  updateFile,
  updateFileBanner,
  updateFileInDb,
} from "./file";
export {
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  getUserByEmail,
} from "./collaborator";
