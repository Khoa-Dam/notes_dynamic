"use client";

import React from "react";
import { File, Folder, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createFile, createFolder } from "@/lib/db/queries";
import { useAppState } from "@/hooks/use-app-state";

interface WorkspaceHeaderProps {
  workspaceId: string;
}

export function WorkspaceHeader({ workspaceId }: WorkspaceHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const router = useRouter();
  const { folders, files, addFile, addFolder } = useAppState();

  const handleCreateFile = async () => {
    setIsCreating(true);
    try {
      const newFile = await createFile({
        title: "Untitled",
        iconId: "📄",
        data: null,
        workspaceId,
        folderId: null,
        inTrash: false,
      });

      // Update store with server data
      addFile(newFile);
      toast.success("File created successfully");
      router.push(`/dashboard/${workspaceId}/${newFile.id}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to create file");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFolder = async () => {
    setIsCreating(true);
    try {
      const newFolder = await createFolder({
        title: "New Folder",
        iconId: "📁",
        data: null,
        workspaceId,
        inTrash: false,
      });

      // Update store with server data
      addFolder(newFolder);
      toast.success("Folder created successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create folder");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery) return files;
    return files.filter((file) =>
      file.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCreateFile}>
              <File className="h-4 w-4 mr-2" />
              New File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateFolder}>
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
