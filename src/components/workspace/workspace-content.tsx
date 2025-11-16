"use client";

import React from "react";
import { File as FileIcon, Folder, Clock, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppState } from "@/hooks/use-app-state";
import { deleteFile, deleteFolder } from "@/lib/db/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WorkspaceContentProps {
  workspaceId: string;
}

export function WorkspaceContent({ workspaceId }: WorkspaceContentProps) {
  const {
    folders,
    files,
    deleteFile: removeFile,
    deleteFolder: removeFolder,
  } = useAppState();
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      removeFile(fileId);
      toast.success("File deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete file");
      console.error(error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      removeFolder(folderId);
      toast.success("Folder deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete folder");
      console.error(error);
    }
  };

  const nonTrashedFolders = folders.filter((folder) => !folder.inTrash);

  // Filter files based on selected folder
  const nonTrashedFiles = files.filter((file) => {
    if (file.inTrash) return false;
    if (selectedFolderId) {
      return file.folderId === selectedFolderId;
    }
    return !file.folderId; // Show root files when no folder selected
  });

  // Get files in selected folder
  const selectedFolderFiles = selectedFolderId
    ? files.filter((file) => !file.inTrash && file.folderId === selectedFolderId)
    : [];

  // Show empty state only when no folders and no files at all (not when folder is selected)
  const hasAnyFiles = files.some((file) => !file.inTrash);
  const hasAnyFolders = nonTrashedFolders.length > 0;

  if (!hasAnyFolders && !hasAnyFiles && !selectedFolderId) {
    return (
      <div className="flex h-full min-h-[calc(100vh-200px)] w-full items-center justify-center">
        <div className="text-center">
          <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No files yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating a new file or folder
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {nonTrashedFolders.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Folders
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {nonTrashedFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id!)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg border p-4 hover:bg-accent hover:shadow-md transition-all cursor-pointer",
                    selectedFolderId === folder.id && "bg-accent border-primary"
                  )}
                >
                  <Folder className="h-5 w-5 shrink-0 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-medium">{folder.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {folder.createdAt &&
                        !isNaN(new Date(folder.createdAt).getTime())
                        ? formatDistanceToNow(new Date(folder.createdAt), {
                          addSuffix: true,
                        })
                        : "Recently"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id!);
                        }}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        {(selectedFolderId || nonTrashedFiles.length > 0) && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {selectedFolderId
                  ? `Files in ${nonTrashedFolders.find(f => f.id === selectedFolderId)?.title || "Folder"}`
                  : "Files"}
              </h2>
              {selectedFolderId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFolderId(null)}
                  className="h-8"
                >
                  View All
                </Button>
              )}
            </div>
            {nonTrashedFiles.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {nonTrashedFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() =>
                      router.push(`/dashboard/${workspaceId}/${file.id}`)
                    }
                    className="group relative flex items-center gap-3 rounded-lg border p-4 hover:bg-accent hover:shadow-md transition-all cursor-pointer"
                  >
                    <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-medium">{file.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {file.createdAt &&
                          !isNaN(new Date(file.createdAt).getTime())
                          ? formatDistanceToNow(new Date(file.createdAt), {
                            addSuffix: true,
                          })
                          : "Recently"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id!);
                          }}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : selectedFolderId ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
                <FileIcon className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No files in this folder</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This folder is empty
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
