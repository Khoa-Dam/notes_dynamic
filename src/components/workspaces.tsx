"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Plus } from "lucide-react";
import { toast } from "sonner";

import type { Workspace } from "@/types/db";
import { useAppState } from "@/hooks/use-app-state";
import {
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getCollaboratingWorkspaces,
} from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { WorkspaceForm } from "@/app/dashboard/new-workspace/workspace-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function Workspaces() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppState();
  const [privateWorkspaces, setPrivateWorkspaces] = React.useState<Workspace[]>([]);
  const [sharedWorkspaces, setSharedWorkspaces] = React.useState<Workspace[]>([]);
  const [collaboratingWorkspaces, setCollaboratingWorkspaces] = React.useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const currentWorkspaceId = pathname.split("/")[2];

  const loadWorkspaces = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const [privateWs, sharedWs, collaboratingWs] = await Promise.all([
        getPrivateWorkspaces(user.id),
        getSharedWorkspaces(user.id),
        getCollaboratingWorkspaces(user.id),
      ]);

      setPrivateWorkspaces(privateWs || []);
      setSharedWorkspaces(sharedWs || []);
      setCollaboratingWorkspaces(collaboratingWs || []);
    } catch (error) {
      toast.error("Failed to load workspaces");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const allWorkspaces = [
    ...privateWorkspaces,
    ...sharedWorkspaces,
    ...collaboratingWorkspaces,
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold">Workspaces</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="mr-2 size-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace to organize your pages and files.
              </DialogDescription>
            </DialogHeader>
            {user && (
              <WorkspaceForm
                user={user}
                onSubmit={() => {
                  setIsCreateDialogOpen(false);
                  router.refresh();
                  // Reload workspaces after a short delay to allow cache to update
                  setTimeout(() => {
                    loadWorkspaces();
                  }, 500);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {allWorkspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <LayoutGrid className="size-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No workspaces yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first workspace to get started
                </p>
              </div>
            </div>
          ) : (
            <>
              {privateWorkspaces.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                    Private
                  </h4>
                  <div className="space-y-1">
                    {privateWorkspaces.map((workspace) => (
                      <WorkspaceItem
                        key={workspace.id}
                        workspace={workspace}
                        isActive={currentWorkspaceId === workspace.id}
                        onClick={() => router.push(`/dashboard/${workspace.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sharedWorkspaces.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                    Shared
                  </h4>
                  <div className="space-y-1">
                    {sharedWorkspaces.map((workspace) => (
                      <WorkspaceItem
                        key={workspace.id}
                        workspace={workspace}
                        isActive={currentWorkspaceId === workspace.id}
                        onClick={() => router.push(`/dashboard/${workspace.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {collaboratingWorkspaces.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                    Collaborating
                  </h4>
                  <div className="space-y-1">
                    {collaboratingWorkspaces.map((workspace) => (
                      <WorkspaceItem
                        key={workspace.id}
                        workspace={workspace}
                        isActive={currentWorkspaceId === workspace.id}
                        onClick={() => router.push(`/dashboard/${workspace.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <ScrollBar />
      </ScrollArea>
    </div>
  );
}

function WorkspaceItem({
  workspace,
  isActive,
  onClick,
}: {
  workspace: any;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <span className="text-xl shrink-0">{workspace.iconId || "💼"}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{workspace.title}</p>
      </div>
    </button>
  );
}
